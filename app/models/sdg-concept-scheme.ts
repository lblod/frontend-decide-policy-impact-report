import Model, { attr, hasMany } from '@ember-data/model';
import type Concept from './sdg-concept';

export default class ConceptScheme extends Model {
  @attr('string') uuid!: string;
  @attr('string') prefLabel!: string;
  @attr('string') definition!: string;

  @hasMany('concept', { inverse: 'SdgConceptScheme', async: true })
  declare SdgConcepts: Concept[];
}

declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    'concept-scheme': ConceptScheme;
  }
}
