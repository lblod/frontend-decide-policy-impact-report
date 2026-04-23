import Controller from '@ember/controller';
import { action } from '@ember/object';

import type RouterService from '@ember/routing/router-service';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import type ChartDataService from 'frontend-decide-policy-impact-report/services/chart-data';
import type LocalAuthorityDataService from 'frontend-decide-policy-impact-report/services/local-authority-data';

export interface LocalGovernmentOption {
  id?: string;
  label: string;
}

export default class IndexController extends Controller {
  queryParams = ['sdg', 'localAuthority'];

  @tracked localAuthority?: string = '';
  @service declare router: RouterService;
  @service declare localAuthorityData: LocalAuthorityDataService;
  @service declare chartData: ChartDataService;

  @action
  changeSelectLocalAuthority(selected: LocalGovernmentOption) {
    this.localAuthorityData.selectedLocalAuthority = selected;
    this.localAuthority = this.localAuthorityData.selectedLocalAuthority.id;
    this.chartData.setSDGFilter(this.chartData.selectedSDGs);
  }

  @action submitLocalAuthority() {
    this.localAuthority = this.localAuthorityData.selectedLocalAuthority?.id;
    if (this.localAuthorityData.selectedLocalAuthority) {
      this.router.transitionTo('report', {
        queryParams: {
          localAuthority: this.localAuthorityData.selectedLocalAuthority.id,
        },
      });
    }
  }
}
