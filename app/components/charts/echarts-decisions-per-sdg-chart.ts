import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import Component from '@glimmer/component';

import * as echarts from 'echarts/core';
import type { ECharts } from 'echarts/core';

import { BarChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  ToolboxComponent,
} from 'echarts/components';
import type { EChartsOption } from 'echarts';
import type Owner from '@ember/owner';

echarts.use([
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  ToolboxComponent,
]);

type ChartType = 'bar' | 'pie';

type SDG = {
  name: string;
  color: string;
  positiveDecisions?: number;
  negativeDecisions?: number;
};

type ChartDataService = {
  filteredSDGData: SDG[];
  formatPercentage: (value: number) => number;
  stats: {
    totalSdgLinked: number;
    totalSdgDecisions: number;
  };
};

export default class EchartsDecisionsPerSdgChart extends Component {
  @service declare chartData: ChartDataService;

  @tracked loading = true;
  @tracked chartType: ChartType = 'pie';
  @tracked chartOptions: EChartsOption = {};

  chart?: ECharts;

  setChartTypeToBar = () => {
    this.loading = true;
    this.chartType = 'bar';

    setTimeout(() => {
      this.loadChartOptions();
      this.updateChart();
    });
  };

  setChartTypeToDoughnut = () => {
    this.loading = true;
    this.chartType = 'pie';

    setTimeout(() => {
      this.loadChartOptions();
      this.updateChart();
    });
  };

  get barChartButtonClass() {
    return this.chartType === 'bar' ? 'active' : '';
  }

  get doughnutChartButtonClass() {
    return this.chartType === 'pie' ? 'active' : '';
  }

  loadChartOptions = () => {
    const sdgs = this.chartData.filteredSDGData;
    const allDecisions = this.chartData.stats.totalSdgDecisions;
    const linkedDecisions = this.chartData.stats.totalSdgLinked;

    const isBar = this.chartType === 'bar';

    this.chartOptions = {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove|click',
        confine: false,
        enterable: true,
        position: isBar ? 'top' : 'right',
        extraCssText: 'pointer-events: auto!important',
        formatter: (params: any) => {
          const { name, value } = params;

          const allPercentage = this.chartData.formatPercentage(
            (value / allDecisions) * 100,
          );
          const linkedPercentage = this.chartData.formatPercentage(
            (value / linkedDecisions) * 100,
          );

          return `
            <h4 style="margin: 5px 0">${echarts.format.encodeHTML(name)}</h4>
            <a href="#">${echarts.format.encodeHTML(value)} decisions</a>
            <div>${echarts.format.encodeHTML(linkedPercentage.toString())}% of all linked decisions</div>
            <div>${echarts.format.encodeHTML(allPercentage.toString())}% of all decisions</div>
          `;
        },
        hideDelay: 1000,
      },

      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
      },

      xAxis: {
        type: 'category',
        data: sdgs.map((sdg) => sdg.name),
        show: isBar,
        axisTick: { show: false },
        axisLabel: {
          show: true,
          interval: 0,
          formatter: (_value: string, index: number) => `${index + 1}.`,
        },
        axisLine: { show: false },
        splitLine: { show: false },
      },

      yAxis: {
        type: 'value',
        show: isBar,
        axisLine: { show: false },
        splitLine: { show: false },
      },

      series: [
        {
          name: 'Decisions',
          type: this.chartType,
          radius: ['30%', '70%'],
          colorBy: 'data',

          data: sdgs.map((sdg) => ({
            name: sdg.name,
            value:
              (sdg.positiveDecisions ?? 0) +
              Math.abs(sdg.negativeDecisions ?? 0),
            itemStyle: {
              color: sdg.color,
              opacity: 0.4,
              borderWidth: 2,
              borderColor: '#fff',
            },
            emphasis: {
              itemStyle: {
                opacity: 1,
              },
            },
          })),
          label: { show: false },
          labelLine: { show: false },
          barCategoryGap: '15%',
        },
      ],
    };

    this.loading = false;
  };

  constructor(owner: Owner, args: object) {
    super(owner, args);
    this.loadChartOptions();
  }

  willDestroy(): void {
    this.chart?.dispose();
    window.removeEventListener('resize', this.resizeHandler);
  }

  resizeHandler = () => {
    this.chart?.resize();
  };

  renderChart = (element: HTMLElement) => {
    this.chart?.dispose();

    this.chart = echarts.init(element, null, {
      renderer: 'svg',
    });

    this.chart.setOption(this.chartOptions);
    window.addEventListener('resize', this.resizeHandler);
  };

  updateChart = () => {
    this.loadChartOptions();
    this.chart?.setOption(this.chartOptions, true);
  };
}
