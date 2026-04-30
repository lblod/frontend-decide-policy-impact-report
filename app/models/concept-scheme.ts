import Model, { attr, hasMany } from '@ember-data/model';
import type Concept from './concept';

export default class ConceptScheme extends Model {
  @attr('string') uuid!: string;
  @attr('string') prefLabel!: string;
  @attr('string') definition!: string;

  @hasMany('concept', { inverse: 'ConceptScheme', async: true })
  declare Concepts: Concept[];
}

declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    'concept-scheme': ConceptScheme;
  }
}
