import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { registerDestructor } from '@ember/destroyable';

import {
  buildHvtUrl,
  type ImpactKey,
} from 'frontend-decide-policy-impact-report/utils/hvt';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import * as echarts from 'echarts/core';
import type { ECharts } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import type Owner from '@ember/owner';
import type { EChartsOption, SeriesOption } from 'echarts';
import { SVGRenderer } from 'echarts/renderers';
import {
  GridComponent,
  ToolboxComponent,
  TooltipComponent,
} from 'echarts/components';

echarts.use([
  LineChart,
  SVGRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  ToolboxComponent,
]);

enum LineId {
  SHOW_ALL = 'SHOW_ALL',
  ALL_LINKED = 'ALL_LINKED',
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
}

type LineType = {
  id: LineId;
  name: string;
  colors: string[];
};

type ChartPoint = {
  label: string;
  year?: number;
  positiveDecisions: number;
  negativeDecisions: number;
  unknownDecisions: number;
};

export default class EchartsDecisionsImpactOverTimeChart extends Component {
  @service declare chartData: {
    getDecisionImpactOverTime(): ChartPoint[];
    filteredSDGData: Array<{ uuid?: string }>;
    impactOverTime: unknown[];
    governingBodyUri?: string | null;
    hasData: boolean;
  };

  declare chart?: ECharts;
  outsideClickHandler?: (e: MouseEvent) => void;
  clickLockTimer?: ReturnType<typeof setTimeout>;

  lineOptions: LineType[] = [
    {
      id: LineId.SHOW_ALL,
      name: 'Show all',
      colors: ['#0055CCFF', '#407F46FF', '#C7212FFF'],
    },
    {
      id: LineId.ALL_LINKED,
      name: 'All linked decisions',
      colors: ['#0055CCFF'],
    },
    {
      id: LineId.POSITIVE,
      name: 'Positive impact decisions',
      colors: ['#407F46FF'],
    },
    {
      id: LineId.NEGATIVE,
      name: 'Negative impact decisions',
      colors: ['#C7212FFF'],
    },
  ];

  @tracked selectedLine?: LineType = this.lineOptions.find(
    (l) => l.id === LineId.SHOW_ALL,
  );
  @tracked chartOptions: EChartsOption = {};

  resizeHandler = () => this.chart?.resize();

  constructor(owner: Owner, args: object) {
    super(owner, args);

    this.loadChartOptions();

    registerDestructor(this, () => {
      clearTimeout(this.clickLockTimer);
      window.removeEventListener('resize', this.resizeHandler);
      this.chart?.dispose();
      if (this.outsideClickHandler) {
        document.removeEventListener('click', this.outsideClickHandler);
      }
    });
  }

  baseLineOptions = {
    type: 'line',
    symbol: 'circle',
    symbolSize: 12,
    emphasis: { scale: 1.5 },
    endLabel: {
      show: true,
      color: '#888',
      formatter: '{a}',
    },
  } as const;

  private shouldInclude(lineId: LineId) {
    return (
      this.selectedLine?.id === LineId.SHOW_ALL ||
      this.selectedLine?.id === lineId
    );
  }

  private buildSeries(data: ChartPoint[]): SeriesOption[] {
    const series: SeriesOption[] = [];

    const getLine = (id: LineId) => this.lineOptions.find((l) => l.id === id)!;

    if (this.shouldInclude(LineId.ALL_LINKED)) {
      const line = getLine(LineId.ALL_LINKED);
      series.push({
        name: line.name,
        data: data.map(
          (d) =>
            d.positiveDecisions +
            Math.abs(d.negativeDecisions) +
            d.unknownDecisions,
        ),
        lineStyle: { color: line.colors[0] },
        itemStyle: { color: line.colors[0] },
        ...this.baseLineOptions,
      });
    }

    if (this.shouldInclude(LineId.POSITIVE)) {
      const line = getLine(LineId.POSITIVE);
      series.push({
        name: line.name,
        data: data.map((d) => d.positiveDecisions),
        lineStyle: { color: line.colors[0] },
        itemStyle: { color: line.colors[0] },
        ...this.baseLineOptions,
      });
    }

    if (this.shouldInclude(LineId.NEGATIVE)) {
      const line = getLine(LineId.NEGATIVE);
      series.push({
        name: line.name,
        data: data.map((d) => d.negativeDecisions),
        lineStyle: { color: line.colors[0] },
        itemStyle: { color: line.colors[0] },
        ...this.baseLineOptions,
      });
    }

    return series;
  }

  private impactKeyFromSeriesName(seriesName: string): ImpactKey | undefined {
    const lower = seriesName.toLowerCase();
    if (lower.includes('positive')) return 'positive';
    if (lower.includes('negative')) return 'negative';
    return undefined;
  }

  loadChartOptions = () => {
    const data = this.chartData.getDecisionImpactOverTime();
    const selectedConcepts = this.chartData.filteredSDGData
      .map((sdg) => sdg.uuid)
      .filter((uuid): uuid is string => Boolean(uuid))
      .join(',');

    this.chartOptions = {
      tooltip: {
        trigger: 'item',
        position: 'top',
        enterable: true,
        extraCssText: 'pointer-events: auto!important',
        formatter: (params: any) => {
          const { name, value, seriesName } = params;
          const isYear = /^\d{4}$/.test(name);
          const hvtUrl = buildHvtUrl({
            year: isYear ? name : undefined,
            concepts: selectedConcepts || undefined,
            impact: this.impactKeyFromSeriesName(seriesName),
            municipality: this.chartData.governingBodyUri,
          });

          return `
            <h4 style="margin: 5px 0">${echarts.format.encodeHTML(name)}</h4>
            <a href="${hvtUrl}" target="_blank" rel="noopener noreferrer">
              ${echarts.format.encodeHTML(value)} ${echarts.format
                .encodeHTML(seriesName)
                .toLowerCase()
                .replace('all', '')}
            </a>
          `;
        },
      },
      grid: {
        left: '3%',
        right: '18%',
        bottom: '3%',
        top: '3%',
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map((d) => d.label),
      },
      yAxis: {
        type: 'value',
        show: false,
      },
      series: this.buildSeries(data),
    };
  };

  colorStyle(color: string): string {
    return `background-color: ${color};`;
  }

  lockHoverFor(ms: number) {
    clearTimeout(this.clickLockTimer);
    this.chart?.setOption({ tooltip: { triggerOn: 'click' } });
    this.clickLockTimer = setTimeout(() => {
      this.chart?.setOption({ tooltip: { triggerOn: 'mousemove|click' } });
    }, ms);
  }

  renderChart = (element: HTMLElement) => {
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

  @action
  changeLine(line: LineType) {
    this.selectedLine = line;
    this.updateChart();
  }
}
