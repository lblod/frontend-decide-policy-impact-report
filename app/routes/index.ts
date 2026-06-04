import Route from '@ember/routing/route';

import type RouterService from '@ember/routing/router-service';
import type Transition from '@ember/routing/transition';
import { service } from '@ember/service';
import type LocalAuthorityDataService from 'frontend-decide-policy-impact-report/services/local-authority-data';
import type { LocalGovernmentOption } from 'frontend-decide-policy-impact-report/services/local-authority-data';

export default class IndexRoute extends Route {
  @service declare router: RouterService;
  @service declare localAuthorityData: LocalAuthorityDataService;

  queryParams = {
    localAuthority: { refreshModel: true },
  };

  async beforeModel(transition: Transition): Promise<void> {
    await this.localAuthorityData.loadLocalAuthoritiesTask.perform();

    const localAuthorityId = transition.to?.queryParams?.['localAuthority'];
    if (localAuthorityId) {
      const selected = this.localAuthorityData.localAuthorityOptions.find(
        (option: LocalGovernmentOption) => option.id === localAuthorityId,
      );

      if (selected) {
        this.localAuthorityData.selectedLocalAuthority = selected;
        return; // Param valid, no redirect needed
      }
    }
  }
}
