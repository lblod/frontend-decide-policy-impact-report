import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

import type RouterService from '@ember/routing/router-service';
import { service } from '@ember/service';

export interface LocalGovernmentOption {
  id?: string;
  label: string;
}

export default class IndexController extends Controller {
  @service declare router: RouterService;
  @tracked selectedLocalAuthority: LocalGovernmentOption | null = null;

  localAuthorityOptions: LocalGovernmentOption[] = [
    { label: 'Ghent, Belgium' },
    { label: 'Freiburg, Germany' },
    { label: 'Bamberg, Germany' },
  ];

  @action
  changeSelectLocalAuthority(selected: LocalGovernmentOption) {
    this.selectedLocalAuthority = selected;
  }

  @action submitLocalAuthority() {
    // transition to the dashboard route
  }
}
