import EmberRouter from '@ember/routing/router';
import config from 'frontend-decide-policy-impact-report/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  // Add route declarations here
});
