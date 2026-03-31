import Controller from '@ember/controller';
import { action } from '@ember/object';

import type RouterService from '@ember/routing/router-service';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import type ChartDataService from 'frontend-decide-policy-impact-report/services/chart-data';
import type LocalAuthorityDataService from 'frontend-decide-policy-impact-report/services/local-authority-data';
import type { LocalGovernmentOption } from 'frontend-decide-policy-impact-report/services/local-authority-data';

export default class ReportController extends Controller {
  queryParams = ['sdg', 'localAuthority'];

  @tracked sdg?: string = '';
  @tracked localAuthority?: string = '';
  @service declare router: RouterService;
  @service declare localAuthorityData: LocalAuthorityDataService;
  @service declare chartData: ChartDataService;
  @tracked selectedSdgs: string[] = [];

  @action
  changeSelectLocalAuthority(selected: LocalGovernmentOption) {
    this.localAuthorityData.selectedLocalAuthority = selected;
    this.localAuthority = this.localAuthorityData.selectedLocalAuthority.id;
    this.chartData.setSDGFilter(this.chartData.selectedSDGs, true);
  }

  @action
  changeSdgs(_: string, event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    const isChecked = target.checked;

    const current = this.chartData.selectedSDGs;

    const updated = isChecked
      ? [...current, value]
      : current.filter((sdg: string) => sdg !== value);
    const unique = Array.from(new Set(updated));
    this.chartData.setSDGFilter(unique);

    this.sdg = unique.join(',');
  }

  @action
  deselectSdgs() {
    this.chartData.setSDGFilter([]);
    this.sdg = '';
  }
}
