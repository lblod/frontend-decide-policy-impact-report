import Route from '@ember/routing/route';

import type RouterService from '@ember/routing/router-service';
import type Transition from '@ember/routing/transition';
import { service } from '@ember/service';
import type ChartDataService from 'frontend-decide-policy-impact-report/services/chart-data';
import type LocalAuthorityDataService from 'frontend-decide-policy-impact-report/services/local-authority-data';
import type { LocalGovernmentOption } from 'frontend-decide-policy-impact-report/services/local-authority-data';

export default class ReportRoute extends Route {
  @service declare router: RouterService;
  @service declare localAuthorityData: LocalAuthorityDataService;
  @service declare chartData: ChartDataService;

  queryParams = {
    localAuthority: { refreshModel: true },
    sdg: { refreshModel: false },
  };

  async beforeModel(transition: Transition): Promise<void> {
    await this.localAuthorityData.loadLocalAuthoritiesTask.perform();

    const localAuthorityId = transition.to?.queryParams?.['localAuthority'];
    const sdgs = transition.to?.queryParams?.['sdg'];

    const selected = localAuthorityId
      ? this.localAuthorityData.localAuthorityOptions.find(
          (option: LocalGovernmentOption) => option.id === localAuthorityId,
        )
      : undefined;

    // Redirect if missing or invalid
    if (!selected) {
      this.router.transitionTo('index');
      return;
    }

    this.localAuthorityData.selectedLocalAuthority = selected;
    this.chartData.governingBodyUri = selected.uri ?? null;
    this.chartData.resetStats();

    await this.chartData.loadSdgDataTask.perform();
    await this.chartData.fetchTotalDecisionsCountTask.perform();
    await this.chartData.fetchImpactDataTask.perform();

    if (sdgs) {
      this.chartData.setSDGFilter(sdgs.split(','));
    } else {
      await this.chartData.refreshImpactStatsTask.perform();
      await this.chartData.fetchImpactOverTimeTask.perform();
    }
  }
}
