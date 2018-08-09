import { Component, Input } from '@angular/core';

/**
 * Generated class for the LoginSpinnerComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'login-spinner',
  templateUrl: 'login-spinner.html'
})
export class LoginSpinnerComponent {
  @Input() keyFlag: string;
  @Input() serverUrl: string;
  @Input() applicationTitle: string;
  @Input() keyApplicationIntro: string;
  @Input() keyApplicationFooter: string;
  @Input() keyApplicationNotification: string;

  constructor() {}
}
