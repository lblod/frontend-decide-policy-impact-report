import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import * as echarts from 'echarts/core';
import type { ECharts } from 'echarts/core';

import { SVGRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  ToolboxComponent,
  TitleComponent,
} from 'echarts/components';
import type { EChartsOption } from 'echarts';
import type Owner from '@ember/owner';

echarts.use([
  SVGRenderer,
  BarChart,
  GridComponent,
  TooltipComponent,
  ToolboxComponent,
  TitleComponent,
]);

type SDG = {
  name: string;
  color: string;
  positiveDecisions?: number;
  negativeDecisions?: number;
};

type ChartDataService = {
  filteredSDGData: SDG[];
};

export default class EchartsImpactChart extends Component {
  @service declare chartData: ChartDataService;

  declare chart?: ECharts;
  chartOptions: EChartsOption = {};

  loadChartOptions = () => {
    const sdgs = this.chartData.filteredSDGData;

    const maxAbsValue = sdgs.reduce((max, sdg) => {
      const positive = sdg.positiveDecisions ?? 0;
      const negative = Math.abs(sdg.negativeDecisions ?? 0);

      return Math.max(max, positive, negative);
    }, 0);

    this.chartOptions = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'none' },
        triggerOn: 'mousemove|click',
        enterable: true,
        extraCssText: 'pointer-events: auto!important',
        formatter: (params: any) => {
          const name = params[0]?.name;
          const positiveDecisions = params[0]?.value ?? 0;
          const negativeDecisions = Math.abs(params[1]?.value ?? 0);

          const totalDecisions = positiveDecisions + negativeDecisions;

          const negativePercentage = Math.round(
            (negativeDecisions / totalDecisions) * 100,
          );

          const positivePercentage = Math.round(
            (positiveDecisions / totalDecisions) * 100,
          );

          return `
            <h4 style="margin: 5px 0">${echarts.format.encodeHTML(name)}</h4>
            <a href="#">${echarts.format.encodeHTML(totalDecisions)} decisions</a>
            <div>${echarts.format.encodeHTML(
              negativeDecisions.toString(),
            )} with negative impact (${echarts.format.encodeHTML(
              negativePercentage.toString(),
            )}%)</div>
            <div>${echarts.format.encodeHTML(
              positiveDecisions,
            )} with positive impact (${echarts.format.encodeHTML(
              positivePercentage.toString(),
            )}%)</div>
          `;
        },
        hideDelay: 500,
      },

      grid: {
        bottom: '3%',
        top: '10%',
      },

      xAxis: {
        type: 'value',
        show: false,
        min: -maxAbsValue,
        max: maxAbsValue,
      },

      yAxis: {
        type: 'category',
        inverse: true,
        data: sdgs.map((sdg) => sdg.name),
        name: 'Negative Impact     Positive Impact',
        nameLocation: 'start',
        nameTextStyle: {
          color: '#888',
          fontSize: 16,
          align: 'center',
          padding: [0, 0, 0, -5],
        },
        axisLabel: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },

      series: [
        {
          name: 'Decisions with positive impact',
          type: 'bar',
          stack: 'Decisions',
          colorBy: 'data',
          label: { show: false },
          data: sdgs.map((sdg) => ({
            name: sdg.name,
            value: sdg.positiveDecisions ?? 0,
            itemStyle: {
              color: sdg.color,
              opacity: 0.4,
              borderRadius: [0, 10, 10, 0],
            },
            emphasis: {
              itemStyle: {
                opacity: 1,
              },
            },
          })),
        },
        {
          name: 'Decisions with negative impact',
          type: 'bar',
          stack: 'Decisions',
          colorBy: 'data',
          label: { show: false },
          data: sdgs.map((sdg) => ({
            name: sdg.name,
            value: sdg.negativeDecisions ?? 0,
            itemStyle: {
              color: sdg.color,
              opacity: 0.4,
              borderRadius: [10, 0, 0, 10],
            },
            emphasis: {
              itemStyle: {
                opacity: 1,
              },
            },
          })),
        },
      ],
    };
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
