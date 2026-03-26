import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

export interface LocalGovernmentOption {
  id?: string;
  label: string;
}
const localAuthorityOptions: LocalGovernmentOption[] = [
  { label: 'Ghent, Belgium', id: 'ghent' },
  { label: 'Freiburg, Germany', id: 'freiburg' },
  { label: 'Bamberg, Germany', id: 'bamberg' },
];
export default class LocalAuthorityDataService extends Service {
  @tracked selectedLocalAuthority?: LocalGovernmentOption | null = null;

  get localAuthorityOptions() {
    return localAuthorityOptions;
  }
}
