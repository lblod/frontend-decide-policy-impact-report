import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import type ChartDataService from 'frontend-decide-policy-impact-report/services/chart-data';

export default class Charts extends Component {
  @service declare chartData: ChartDataService;
}
