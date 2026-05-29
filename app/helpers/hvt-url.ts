import { helper } from '@ember/component/helper';
import {
  buildHvtUrl,
  type ImpactKey,
} from 'frontend-decide-policy-impact-report/utils/hvt';

export default helper(function hvtUrl(
  [sdgUuid]: [string | undefined],
  { impact }: { impact?: ImpactKey },
): string {
  return buildHvtUrl({ concepts: sdgUuid, impact });
});
