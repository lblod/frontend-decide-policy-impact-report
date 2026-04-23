import Model, { attr, belongsTo, type AsyncBelongsTo } from '@ember-data/model';
import type ConceptScheme from './sdg-concept-scheme.ts';

export default class Concept extends Model {
  @attr('string') uuid!: string;
  @attr('string') prefLabel!: string;
  @attr('string') definition!: string;
  @attr('string') altLabel!: string;
  @attr('string') notation!: string;

  @belongsTo('concept-scheme', { inverse: 'SdgConcepts', async: true })
  declare SdgConceptScheme: AsyncBelongsTo<ConceptScheme>;
}

declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    concept: Concept;
  }
}
