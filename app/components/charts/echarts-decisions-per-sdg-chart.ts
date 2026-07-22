import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import Component from '@glimmer/component';

import * as echarts from 'echarts/core';
import type { ECharts } from 'echarts/core';

import { buildHvtUrl } from 'frontend-decide-policy-impact-report/utils/hvt';

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
  uuid?: string;
  name: string;
  color: string;
  positiveDecisions?: number;
  negativeDecisions?: number;
  unknownDecisions?: number;
};

type ChartDataService = {
  filteredSDGData: SDG[];
  formatPercentage: (value: number) => number;
  governingBodyUri?: string | null;
  hasData: boolean;
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
  outsideClickHandler?: (e: MouseEvent) => void;
  clickLockTimer?: ReturnType<typeof setTimeout>;

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
        hideDelay: 1000,
        confine: false,
        enterable: true,
        position: isBar ? 'top' : 'right',
        extraCssText: 'pointer-events: auto!important',
        formatter: (params: any) => {
          const { name, value, data } = params;
          const totalDecisions = value + (data.unknownDecisions ?? 0);
          const allPercentage = this.chartData.formatPercentage(
            (totalDecisions / allDecisions) * 100,
          );
          const linkedPercentage = this.chartData.formatPercentage(
            (totalDecisions / linkedDecisions) * 100,
          );

          const hvtUrl = buildHvtUrl({
            concepts: data.uuid,
            municipality: this.chartData.governingBodyUri,
          });

          return `
            <h4 style="margin: 5px 0">${echarts.format.encodeHTML(name)}</h4>
            <a href="${hvtUrl}" target="_blank" rel="noopener noreferrer">${echarts.format.encodeHTML(totalDecisions.toString())} decisions</a>
            <div>${echarts.format.encodeHTML(linkedPercentage.toString())}% of all linked decisions</div>
            <div>${echarts.format.encodeHTML(allPercentage.toString())}% of all decisions</div>
          `;
        },
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
          // Prevent echarts from drawing equal-sized slices when every SDG
          // value is 0 (empty report). Default is true, which renders a full
          // pie of phantom areas.
          stillShowZeroSum: false,

          data: sdgs.map((sdg) => ({
            name: sdg.name,
            value:
              (sdg.positiveDecisions ?? 0) +
              Math.abs(sdg.negativeDecisions ?? 0),
            uuid: sdg.uuid,
            unknownDecisions: sdg.unknownDecisions ?? 0,
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

  lockHoverFor(ms: number) {
    clearTimeout(this.clickLockTimer);
    this.chart?.setOption({ tooltip: { triggerOn: 'click' } });
    this.clickLockTimer = setTimeout(() => {
      this.chart?.setOption({ tooltip: { triggerOn: 'mousemove|click' } });
    }, ms);
  }

  willDestroy(): void {
    clearTimeout(this.clickLockTimer);
    this.chart?.dispose();
    window.removeEventListener('resize', this.resizeHandler);
    if (this.outsideClickHandler) {
      document.removeEventListener('click', this.outsideClickHandler);
    }
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

    this.chart.on('click', () => this.lockHoverFor(3000));

    this.outsideClickHandler = (e: MouseEvent) => {
      if (!element.contains(e.target as Node)) {
        clearTimeout(this.clickLockTimer);
        this.chart?.dispatchAction({ type: 'hideTip' });
        this.chart?.setOption({ tooltip: { triggerOn: 'mousemove|click' } });
      }
    };
    document.addEventListener('click', this.outsideClickHandler);
  };

  updateChart = () => {
    this.loadChartOptions();
    this.chart?.setOption(this.chartOptions, true);
  };
}
