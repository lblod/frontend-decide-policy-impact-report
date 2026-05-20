import Model, { attr, belongsTo, type AsyncBelongsTo } from '@ember-data/model';
import type ConceptScheme from './concept-scheme.js';
import type LanguageStringSetTransform from 'frontend-decide-policy-impact-report/transforms/language-string-set.js';

export default class Concept extends Model {
  @attr('string') uuid!: string;
  @attr('language-string-set') prefLabel!: string;
  @attr('language-string-set') definition!: string;
  @attr('language-string-set') altLabel!: string;
  @attr('string') notation!: string;

  @belongsTo('concept-scheme', { inverse: 'Concepts', async: true })
  declare ConceptScheme: AsyncBelongsTo<ConceptScheme>;
}

declare module 'ember-data/types/registries/transform' {
  export default interface TransformRegistry {
    'language-string-set': LanguageStringSetTransform;
  }
}

declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    concept: Concept;
  }
}
