import ENV from 'frontend-decide-policy-impact-report/config/environment';

const SDG_CONCEPT_SCHEME_UUID = '785cfa4d-6d74-46ad-a99c-1acc176db89e';

const impactUuid = {
  positive: '0e432b1b-87ad-4c32-9fc5-b151dd49f60d',
  negative: '1e122909-a685-4c0f-8b61-d639173b0a58',
} as const;

export type ImpactKey = keyof typeof impactUuid;

export function buildHvtUrl({
  concepts,
  impact,
  year,
}: {
  concepts?: string;
  impact?: ImpactKey;
  year?: string | number;
}): string {
  if (!concepts && year === undefined) return '#';

  const params: Record<string, string> = {
    conceptScheme: SDG_CONCEPT_SCHEME_UUID,
    hideVoted: 'false',
    showCs: 'false',
    showImpact: 'true',
  };

  if (concepts) params['concepts'] = concepts;
  if (year !== undefined) params['year'] = String(year);
  if (impact) params['impact'] = impactUuid[impact];

  return `${ENV.hvtBaseUrl}/validate-expression-labels?${new URLSearchParams(params).toString()}`;
}
