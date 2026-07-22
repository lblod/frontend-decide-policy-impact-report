import type Store from '@ember-data/store';
import Service, { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import type Concept from 'frontend-decide-policy-impact-report/models/concept';

export type SDG = {
  id: string;
  uuid?: string;
  uri?: string;
  name?: string;
  color: string;
  rgbaColor: string;
  positiveDecisions?: number;
  negativeDecisions?: number;
  unknownDecisions?: number;
};

export type ImpactType =
  | 'http://mu.semte.ch/vocabularies/ext/impact/positive'
  | 'http://mu.semte.ch/vocabularies/ext/impact/negative'
  | 'http://mu.semte.ch/vocabularies/ext/impact/unknown';

export type ImpactApiRow = {
  sdg: string;
  impact: ImpactType;
  count: number;
};

export default class ChartDataService extends Service {
  @tracked sdgs: SDG[] = [
    {
      id: '01',
      color: '#E5243B',
      rgbaColor: 'rgba(229, 36, 59, 0.4)',
    },
    {
      id: '02',
      color: '#DDA63A',
      rgbaColor: 'rgba(221, 166, 58, 0.4)',
    },
    {
      id: '03',
      color: '#4C9F38',
      rgbaColor: 'rgba(76, 159, 56, 0.4)',
    },
    {
      id: '04',
      color: '#C5192D',
      rgbaColor: 'rgba(197, 25, 45, 0.4)',
    },
    {
      id: '05',
      color: '#FF3A21',
      rgbaColor: 'rgba(255, 58, 33, 0.4)',
    },
    {
      id: '06',
      color: '#26BDE2',
      rgbaColor: 'rgba(38, 189, 226, 0.4)',
    },
    {
      id: '07',
      color: '#FCC30B',
      rgbaColor: 'rgba(252, 195, 11, 0.4)',
    },
    {
      id: '08',
      color: '#A21942',
      rgbaColor: 'rgba(162, 25, 66, 0.4)',
    },
    {
      id: '09',
      color: '#FD6925',
      rgbaColor: 'rgba(253, 105, 37, 0.4)',
    },
    {
      id: '10',
      color: '#DD1367',
      rgbaColor: 'rgba(221, 19, 103, 0.4)',
    },
    {
      id: '11',
      color: '#FD9D24',
      rgbaColor: 'rgba(253, 157, 36, 0.4)',
    },
    {
      id: '12',
      color: '#BF8B2E',
      rgbaColor: 'rgba(191, 139, 46, 0.4)',
    },
    {
      id: '13',
      color: '#3F7E44',
      rgbaColor: 'rgba(63, 126, 68, 0.4)',
    },
    {
      id: '14',
      color: '#0A97D9',
      rgbaColor: 'rgba(10, 151, 217, 0.4)',
    },
    {
      id: '15',
      color: '#56C02B',
      rgbaColor: 'rgba(86, 192, 43, 0.4)',
    },
    {
      id: '16',
      color: '#00689D',
      rgbaColor: 'rgba(0, 104, 157, 0.4)',
    },
    {
      id: '17',
      color: '#19486A',
      rgbaColor: 'rgba(25, 72, 106, 0.4)',
    },
  ];

  @tracked selectedSDGs: string[] = [];
  @tracked privateSDGData: SDG[] = [];
  @tracked governingBodyUri?: string | null = null;
  @service declare store: Store;

  withGoverningBody(url: string): string {
    if (!this.governingBodyUri) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}governingBody=${encodeURIComponent(this.governingBodyUri)}`;
  }

  withSelectedSdgs(url: string): string {
    const uris = this.selectedSdgUris;
    if (uris.length === 0) return url;
    const separator = url.includes('?') ? '&' : '?';
    const params = uris
      .map((uri) => `sdg=${encodeURIComponent(uri)}`)
      .join('&');
    return `${url}${separator}${params}`;
  }

  get selectedSdgUris(): string[] {
    return this.privateSDGData
      .filter((sdg) => this.selectedSDGs.includes(sdg.id))
      .map((sdg) => sdg.uri)
      .filter((uri): uri is string => !!uri);
  }

  @tracked stats = {
    totalDecisions: 0,
    totalPositiveDecisions: 0,
    totalNegativeDecisions: 0,
    positiveImpactPercentage: 0,
    negativeImpactPercentage: 0,
    totalSdgLinkedPercentage: 0,
    totalSdgLinked: 0,
    totalSdgDecisions: 0,
  };

  loadSdgDataTask = task(async () => {
    const schemeId = 'http://data.lblod.gift/id/conceptscheme/sdg-simple';

    const sdgsConceptsArray = (await this.store.query('concept', {
      'filter[concept-scheme][:uri:]': schemeId,
      sort: 'notation',
    })) as unknown as Concept[];

    this.sdgs = this.sdgs.map((sdg, index) => ({
      ...sdg,
      name: `${sdgsConceptsArray[index]?.altLabel ?? ''}`,
      notation: sdgsConceptsArray[index]?.notation,
      uuid: sdgsConceptsArray[index]?.id,
      uri: sdgsConceptsArray[index]?.uri,
    }));
  });

  async parseJson<T>(response: Response, fallback: T): Promise<T> {
    if (!response.ok) return fallback;
    try {
      const text = await response.text();
      return text ? (JSON.parse(text) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  fetchImpactDataTask = task(async () => {
    const response = await fetch(
      this.withGoverningBody(`/policy-impact-report/impact-by-sdg`),
    );
    const data = await this.parseJson<ImpactApiRow[]>(response, []);
    this.applyImpactData(data);
  });

  resetStats() {
    this.stats = {
      totalDecisions: 0,
      totalPositiveDecisions: 0,
      totalNegativeDecisions: 0,
      positiveImpactPercentage: 0,
      negativeImpactPercentage: 0,
      totalSdgLinkedPercentage: 0,
      totalSdgLinked: 0,
      totalSdgDecisions: 0,
    };
  }

  fetchTotalDecisionsCountTask = task(async () => {
    const response = await fetch(
      this.withGoverningBody(`/policy-impact-report/total-decisions`),
    );
    const data = await this.parseJson<{ count?: number }>(response, {});
    this.stats = {
      ...this.stats,
      totalSdgDecisions: data.count ?? 0,
    };
  });
  refreshImpactStatsTask = task(async () => {
    let linkedCount = 0;
    let positive = 0;
    let negative = 0;

    const filterActiveButEmpty =
      this.selectedSDGs.length > 0 && this.selectedSdgUris.length === 0;

    if (!filterActiveButEmpty) {
      try {
        const [linkedResponse, impactResponse] = await Promise.all([
          fetch(
            this.withSelectedSdgs(
              this.withGoverningBody(
                `/policy-impact-report/linked-decisions-per-sdg`,
              ),
            ),
          ),
          fetch(
            this.withSelectedSdgs(
              this.withGoverningBody(
                `/policy-impact-report/decisions-by-impact`,
              ),
            ),
          ),
        ]);
        const linked = await this.parseJson<{ count?: number }>(
          linkedResponse,
          {},
        );
        const impact = await this.parseJson<{
          positive?: number;
          negative?: number;
        }>(impactResponse, {});

        linkedCount = linked.count ?? 0;
        positive = impact.positive ?? 0;
        negative = impact.negative ?? 0;
      } catch {
        this.resetStats();
      }
    }

    const safeLinked = linkedCount || 1;

    this.stats = {
      ...this.stats,
      totalSdgLinked: linkedCount,
      totalSdgLinkedPercentage: this.formatPercentage(
        (linkedCount / this.stats.totalSdgDecisions) * 100,
      ),
      totalPositiveDecisions: positive,
      totalNegativeDecisions: negative,
      positiveImpactPercentage: this.formatPercentage(
        (positive / safeLinked) * 100,
      ),
      negativeImpactPercentage: this.formatPercentage(
        (negative / safeLinked) * 100,
      ),
    };
  });

  applyImpactData(data: ImpactApiRow[]) {
    const map = this.transformImpactData(data);

    const uriByUuid = new Map<string, string>();
    for (const row of data) {
      const uuid = this.extractUuid(row.sdg);
      if (uuid && !uriByUuid.has(uuid)) uriByUuid.set(uuid, row.sdg);
    }

    this.privateSDGData = this.sdgs.map((sdg) => {
      const impact = sdg.uuid
        ? (map.get(sdg.uuid) ?? { positive: 0, negative: 0, unknown: 0 })
        : { positive: 0, negative: 0, unknown: 0 };

      return {
        ...sdg,
        uri: sdg.uri ?? (sdg.uuid ? uriByUuid.get(sdg.uuid) : undefined),
        positiveDecisions: impact.positive,
        negativeDecisions: -impact.negative,
        unknownDecisions: impact.unknown,
      };
    });
  }

  transformImpactData(data: ImpactApiRow[]) {
    const map = new Map<
      string,
      { positive: number; negative: number; unknown: number }
    >();

    for (const row of data) {
      const uuid = this.extractUuid(row.sdg);
      if (!uuid) continue;

      const entry = map.get(uuid) ?? { positive: 0, negative: 0, unknown: 0 };

      if (row.impact.endsWith('/positive')) entry.positive += row.count;
      if (row.impact.endsWith('/negative')) entry.negative += row.count;
      if (row.impact.endsWith('/unknown')) entry.unknown += row.count;

      map.set(uuid, entry);
    }

    return map;
  }

  extractUuid(uri: string): string {
    return uri.split('/').pop() ?? '';
  }

  get filteredSDGData() {
    return this.selectedSDGs.length
      ? this.privateSDGData.filter((sdg) => this.selectedSDGs.includes(sdg.id))
      : this.privateSDGData;
  }

  get hasData() {
    return this.filteredSDGData.some(
      (sdg) =>
        (sdg.positiveDecisions ?? 0) > 0 ||
        Math.abs(sdg.negativeDecisions ?? 0) > 0 ||
        (sdg.unknownDecisions ?? 0) > 0,
    );
  }

  setSDGFilter(sdgIds: string[]) {
    this.selectedSDGs = sdgIds;
    this.refreshImpactStatsTask.perform();
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
      unknownDecisions: sdgs.reduce(
        (acc, sdg) => acc + (sdg.unknownDecisions ?? 0),
        0,
      ),
    });

    return Array.from({ length: years }, (_, i) => {
      const year = currentYear - years + i + 1;

      return year === currentYear
        ? { year, ...sumDecisions(this.filteredSDGData) }
        : {
            year,
            positiveDecisions: 0,
            negativeDecisions: 0,
            unknownDecisions: 0,
          };
    });
  }

  get availableSDGs() {
    return this.privateSDGData.filter((sdg) => {
      const hasData =
        (sdg.positiveDecisions ?? 0) > 0 ||
        Math.abs(sdg.negativeDecisions ?? 0) > 0;

      const isSelected = this.selectedSDGs.includes(sdg.id);

      return hasData || isSelected;
    });
  }

  getTopSDGs(selector: (sdg: SDG) => number, limit = 3) {
    return [...this.filteredSDGData]
      .map((sdg) => ({
        sdg,
        score: selector(sdg),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.sdg)
      .filter((sdg) => selector(sdg) > 0);
  }

  get topSDGsOverall() {
    return this.getTopSDGs(
      (sdg) =>
        (sdg.positiveDecisions ?? 0) + Math.abs(sdg.negativeDecisions ?? 0),
    );
  }

  get topSDGsPositive() {
    return this.getTopSDGs((sdg) => sdg.positiveDecisions ?? 0);
  }

  get topSDGsNegative() {
    return this.getTopSDGs((sdg) => Math.abs(sdg.negativeDecisions ?? 0));
  }

  getSdgLabel(sdg: SDG) {
    return sdg.name ?? `SDG ${sdg.id}`;
  }

  formatPercentage(value: number) {
    if (value == null || Number.isNaN(value)) return 0;

    return value < 1
      ? Math.round(value * 100) / 100 // 2 decimals
      : Math.round(value); // 0 decimals
  }
}
