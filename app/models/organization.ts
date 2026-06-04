import Model, { attr, belongsTo, type AsyncBelongsTo } from '@ember-data/model';
import type LangStringTransform from 'frontend-decide-policy-impact-report/transforms/language-string';
import type { LangString } from 'frontend-decide-policy-impact-report/transforms/language-string';

export default class Organization extends Model {
  @attr('string') uri!: string;
  @attr('language-string') prefLabel!: LangString | null;
  @attr('string') classification!: string;

  @belongsTo('organization', { inverse: null, async: true })
  declare subOrganizationOf: AsyncBelongsTo<Organization>;
}

declare module 'ember-data/types/registries/transform' {
  export default interface TransformRegistry {
    'language-string': LangStringTransform;
  }
}

declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    organization: Organization;
  }
}
