import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

import type RouterService from '@ember/routing/router-service';
import { service } from '@ember/service';

export default class HomeController extends Controller {
  @service declare router: RouterService;
  @tracked governmentList = {
    selected: [] as string[],
  };
  @action handleSelectLocalGovernmentsChange(
    selectedLocalGovernments: string[],
  ) {
    this.governmentList.selected = selectedLocalGovernments;
  }
}
