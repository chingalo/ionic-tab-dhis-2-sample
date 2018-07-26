/*
 *
 * Copyright 2015 HISP Tanzania
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
 * MA 02110-1301, USA.
 *
 * @since 2015
 * @author Joseph Chingalo <profschingalo@gmail.com>
 *
 */
import { Component, OnInit, Input } from '@angular/core';
import { BarcodeSettings } from '../../../../models/barcodeSettings';
import { CurrentUser } from '../../../../models/currentUser';

/**
 * Generated class for the LoginFormComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'login-form',
  templateUrl: 'login-form.html'
})
export class LoginFormComponent implements OnInit {
  @Input() currentUser: CurrentUser;

  loginFormFields: any;
  barcodeSettings: BarcodeSettings;

  // valueType == 'TEXT'
  // data { id : "", value : ""}
  constructor() {
    this.loginFormFields = this.getLoginForm();
  }

  ngOnInit() {}

  updateValue(data) {
    console.log(data);
  }

  trackByFn(index, item) {
    return item && item.id ? item.id : index;
  }

  getLoginForm() {
    return [
      {
        id: 'serverUrl',
        placehoder: 'Enter server address',
        type: 'TEXT',
        barcodeSettings: {
          allowBarcodeReaderOnText: true,
          allowBarcodeReaderOnNumerical: false,
          activateMultiline: false,
          keyPairSeparator: ':',
          multilineSeparator: ';'
        }
      },
      {
        id: 'username',
        placehoder: 'Enter username',
        type: 'TEXT',
        barcodeSettings: {
          allowBarcodeReaderOnText: false,
          allowBarcodeReaderOnNumerical: false,
          activateMultiline: false,
          keyPairSeparator: ':',
          multilineSeparator: ';'
        }
      },
      {
        id: 'password',
        placehoder: 'Enter password',
        type: 'PASSWORD',
        barcodeSettings: {
          allowBarcodeReaderOnText: false,
          allowBarcodeReaderOnNumerical: false,
          activateMultiline: false,
          keyPairSeparator: ':',
          multilineSeparator: ';'
        }
      }
    ];
  }
}
