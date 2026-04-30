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
    await this.chartData.loadSdgDataTask.perform();
    await this.chartData.fetchTotalDecisionsCountTask.perform();
    await this.chartData.fetchLinkedDecisionsCountTask.perform();
    await this.chartData.fetchImpactDataTask.perform();

    const localAuthorityId = transition.to?.queryParams?.['localAuthority'];
    const sdgs = transition.to?.queryParams?.['sdg'];

    if (sdgs) {
      const sdgArray = sdgs.split(',');
      this.chartData.setSDGFilter(sdgArray);
    }
    if (localAuthorityId) {
      const selected = this.localAuthorityData.localAuthorityOptions.find(
        (option: LocalGovernmentOption) => option.id === localAuthorityId,
      );

      if (selected) {
        this.localAuthorityData.selectedLocalAuthority = selected;
        return; // Param valid, no redirect needed
      }
    }

    // Redirect if missing or invalid
    this.router.transitionTo('index');
  }
}
