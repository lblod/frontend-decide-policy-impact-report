import Helper from '@ember/component/helper';
import { service } from '@ember/service';
import {
  buildHvtUrl,
  type ImpactKey,
} from 'frontend-decide-policy-impact-report/utils/hvt';
import type ChartDataService from 'frontend-decide-policy-impact-report/services/chart-data';

export default class HvtUrlHelper extends Helper {
  @service declare chartData: ChartDataService;

  compute(
    [sdgUuid]: [string | undefined],
    { impact }: { impact?: ImpactKey },
  ): string {
    return buildHvtUrl({
      concepts: sdgUuid,
      impact,
      municipality: this.chartData.governingBodyUri,
    });
  }
}
