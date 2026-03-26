import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

type SDG = {
  id: string;
  name: string;
  color: string;
  rgbaColor: string;
  positiveDecisions?: number;
  negativeDecisions?: number;
};

const sdgsData: SDG[] = [
  {
    id: '1',
    name: '1. No Poverty',
    color: '#E5243B',
    rgbaColor: 'rgba(229, 36, 59, 0.4)',
  },
  {
    id: '2',
    name: '2. Zero Hunger',
    color: '#DDA63A',
    rgbaColor: 'rgba(221, 166, 58, 0.4)',
  },
  {
    id: '3',
    name: '3. Good Health and Well-being ',
    color: '#4C9F38',
    rgbaColor: 'rgba(76, 159, 56, 0.4)',
  },
  {
    id: '4',
    name: '4. Quality Education',
    color: '#C5192D',
    rgbaColor: 'rgba(197, 25, 45, 0.4)',
  },
  {
    id: '5',
    name: '5. Gender Equality',
    color: '#FF3A21',
    rgbaColor: 'rgba(255, 58, 33, 0.4)',
  },
  {
    id: '6',
    name: '6. Clean Water and Sanitation',
    color: '#26BDE2',
    rgbaColor: 'rgba(38, 189, 226, 0.4)',
  },
  {
    id: '7',
    name: '7. Affordable and Clean Energy',
    color: '#FCC30B',
    rgbaColor: 'rgba(252, 195, 11, 0.4)',
  },
  {
    id: '8',
    name: '8. Decent Work and Economic Growth',
    color: '#A21942',
    rgbaColor: 'rgba(162, 25, 66, 0.4)',
  },
  {
    id: '9',
    name: '9. Industry, Innovation and Infrastructure',
    color: '#FD6925',
    rgbaColor: 'rgba(253, 105, 37, 0.4)',
  },
  {
    id: '10',
    name: '10. Reduced Inequalities',
    color: '#DD1367',
    rgbaColor: 'rgba(221, 19, 103, 0.4)',
  },
  {
    id: '11',
    name: '11. Sustainable Cities and Communities ',
    color: '#FD9D24',
    rgbaColor: 'rgba(253, 157, 36, 0.4)',
  },
  {
    id: '12',
    name: '12. Responsible Consumption and Production',
    color: '#BF8B2E',
    rgbaColor: 'rgba(191, 139, 46, 0.4)',
  },
  {
    id: '13',
    name: '13. Climate Action',
    color: '#3F7E44',
    rgbaColor: 'rgba(63, 126, 68, 0.4)',
  },
  {
    id: '14',
    name: '14. Life Below Water ',
    color: '#0A97D9',
    rgbaColor: 'rgba(10, 151, 217, 0.4)',
  },
  {
    id: '15',
    name: '15. Life on Land',
    color: '#56C02B',
    rgbaColor: 'rgba(86, 192, 43, 0.4)',
  },
  {
    id: '16',
    name: '16. Peace, Justice and Strong Institutions',
    color: '#00689D',
    rgbaColor: 'rgba(0, 104, 157, 0.4)',
  },
  {
    id: '17',
    name: '17. Partnerships for the Goals',
    color: '#19486A',
    rgbaColor: 'rgba(25, 72, 106, 0.4)',
  },
];

export default class ChartDataService extends Service {
  sdgs: SDG[] = sdgsData;

  @tracked selectedSDGs: string[] = [];
  @tracked privateSDGData: SDG[] = [];
  @tracked positiveImpactDecisions: number[] = [];
  @tracked negativeImpactDecisions: number[] = [];

  @tracked stats = {
    totalDecisions: 0,
    totalPositiveDecisions: 0,
    totalNegativeDecisions: 0,
    positiveImpactPercentage: 0,
    negativeImpactPercentage: 0,
  };

  constructor() {
    super(...arguments);
    this.initialSDGData();
    this.getImpactStats();
  }

  initialSDGData() {
    // Initialize the SDG data
    this.positiveImpactDecisions = this.generateRandomArray(
      this.sdgs.length,
      0,
      100,
    );
    this.negativeImpactDecisions = this.generateRandomArray(
      this.sdgs.length,
      -100,
      0,
    );

    this.privateSDGData = this.sdgs.map((sdg, i) => ({
      ...sdg,
      positiveDecisions: this.positiveImpactDecisions[i],
      negativeDecisions: this.negativeImpactDecisions[i],
    }));
  }

  get filteredSDGData() {
    return this.selectedSDGs.length
      ? this.privateSDGData.filter((sdg) => this.selectedSDGs.includes(sdg.id))
      : this.privateSDGData;
  }

  generateRandomArray(length: number, min: number, max: number) {
    if (length <= 0) return [];
    if (min > max) [min, max] = [max, min];
    const result = [];
    for (let i = 0; i < length; i++) {
      result.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return result;
  }

  setSDGFilter(sdgIds: string[], updateData: boolean = false) {
    this.selectedSDGs = sdgIds;
    this.getImpactStats();
    if (updateData) {
      this.initialSDGData();
    }
  }

  getAllDecisionsCount() {
    return this.privateSDGData.reduce(
      (acc, sdg) =>
        acc +
        (sdg.positiveDecisions ?? 0) +
        Math.abs(sdg.negativeDecisions ?? 0),
      0,
    );
  }

  getLinkedDecisionsCount() {
    return Math.round(0.8 * this.getAllDecisionsCount());
  }

  getDecisionImpactOverTime(years: number = 5) {
    const currentYear = new Date().getFullYear();

    const sumDecisions = (sdgs: SDG[]) => ({
      positiveDecisions: sdgs.reduce(
        (acc, sdg) => acc + (sdg.positiveDecisions ?? 0),
        0,
      ),
      negativeDecisions: sdgs.reduce(
        (acc, sdg) => acc + Math.abs(sdg.negativeDecisions ?? 0),
        0,
      ),
    });

    return Array.from({ length: years }, (_, i) => {
      const year = currentYear - years + i + 1;
      return year === currentYear
        ? { year, ...sumDecisions(this.filteredSDGData) }
        : {
            year,
            positiveDecisions: Math.floor(Math.random() * 1000),
            negativeDecisions: Math.floor(Math.random() * 1000),
          };
    });
  }

  getImpactStats() {
    const { positive, negative, total } = this.filteredSDGData.reduce(
      (acc, sdg) => {
        const positive = sdg.positiveDecisions ?? 0;
        const negative = Math.abs(sdg.negativeDecisions ?? 0);

        acc.positive += positive;
        acc.negative += negative;
        acc.total += positive + negative;

        return acc;
      },
      {
        positive: 0,
        negative: 0,
        total: 0,
      },
    );

    const safeTotal = total || 1;

    this.stats = {
      totalDecisions: total,
      totalPositiveDecisions: positive,
      totalNegativeDecisions: negative,
      positiveImpactPercentage: Math.round((positive / safeTotal) * 100),
      negativeImpactPercentage: Math.round((negative / safeTotal) * 100),
    };
  }
}
