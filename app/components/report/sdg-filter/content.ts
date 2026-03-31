import Component from '@glimmer/component';

export default class ReportSdgFilterContent extends Component {
  colorStyle(sdg: any): string {
    return `background-color: ${sdg.color};`;
  }
}
