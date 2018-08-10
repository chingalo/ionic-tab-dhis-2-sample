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
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  IonicPage,
  NavController,
  ModalOptions,
  ModalController
} from 'ionic-angular';
import { TabsPage } from '../tabs/tabs';
import { UserProvider } from '../../providers/user/user';
import { CurrentUser } from '../../models/currentUser';

import * as _ from 'lodash';
import { AppTranslationProvider } from '../../providers/app-translation/app-translation';
import { AppProvider } from '../../providers/app/app';

/**
 * Generated class for the LoginPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage implements OnInit, OnDestroy {
  logoUrl: string;
  isLoginFormValid: boolean;
  isLoginProcessActive: boolean;
  isOnLogin: boolean;
  overAllLoginMessage: string;
  offlineIcon: string;
  currentUser: CurrentUser;
  topThreeTranslationCodes: string[];
  localInstances: string[];
  processes: string[];

  constructor(
    private navCtrl: NavController,
    private userProvider: UserProvider,
    private appTranslationProvider: AppTranslationProvider,
    private appProvider: AppProvider,
    private modalCtrl: ModalController
  ) {
    this.logoUrl = 'assets/img/logo.png';
    this.offlineIcon = 'assets/icon/offline.png';
    this.isLoginFormValid = false;
    this.isLoginProcessActive = false;
    this.isOnLogin = true;
    this.topThreeTranslationCodes = this.appTranslationProvider.getTopThreeSupportedTranslationCodes();
    this.localInstances = [];
    this.processes = [
      'organisationUnits',
      'sections',
      'dataElements',
      'smsCommand',
      'programs',
      'programStageSections',
      'programRules',
      'indicators',
      'programRuleActions',
      'programRuleVariables',
      'dataSets',
      'reports',
      'constants'
    ];
  }

  ngOnInit() {
    const defaultCurrentUser: CurrentUser = {
      serverUrl: 'play.dhis2.org/2.28',
      username: 'admin',
      password: 'district',
      currentLanguage: 'en'
    };
    this.userProvider.getCurrentUser().subscribe(
      (currentUser: CurrentUser) => {
        if (currentUser && currentUser.username) {
          this.currentUser = currentUser;
        } else {
          this.currentUser = defaultCurrentUser;
        }
      },
      () => {
        this.currentUser = defaultCurrentUser;
      }
    );
  }

  openLocalInstancesSelection() {
    const options: ModalOptions = {
      cssClass: 'inset-modal',
      enableBackdropDismiss: true
    };
    const data = {};
    const modal = this.modalCtrl.create(
      'LocalInstancesSelectionPage',
      { data: data },
      options
    );
    modal.onDidDismiss((code: string) => {
      if (code) {
        console.log('code : ', code);
      }
    });
    modal.present();
  }

  openTranslationCodeSelection() {
    const options: ModalOptions = {
      cssClass: 'inset-modal',
      enableBackdropDismiss: true
    };
    const data = { currentLanguage: this.currentUser.currentLanguage };
    const modal = this.modalCtrl.create(
      'TransalationSelectionPage',
      { data: data },
      options
    );
    modal.onDidDismiss((code: string) => {
      if (code) {
        this.updateTranslationLanguage(code);
      }
    });
    modal.present();
  }

  updateTranslationLanguage(code) {
    this.appTranslationProvider.setAppTranslation(code);
    this.currentUser.currentLanguage = code;
  }

  onFormFieldChange(data) {
    const { status } = data;
    const { currentUser } = data;
    this.isLoginFormValid = status;
    if (status) {
      this.currentUser = _.assign({}, this.currentUser, currentUser);
    } else {
      this.isLoginProcessActive = false;
    }
  }

  onCancelLoginProcess() {
    this.isLoginProcessActive = false;
  }

  onFailLogin(errorReponse) {
    const { error } = errorReponse;
    this.appProvider.setNormalNotification(error);
    this.onCancelLoginProcess();
  }

  onSuccessLogin(data) {
    this.currentUser = data
  }

  startLoginProcess() {
    this.overAllLoginMessage = this.currentUser.serverUrl;
    this.isLoginProcessActive = true;
  }

  ngOnDestroy() {
    this.logoUrl = null;
    this.isLoginFormValid = null;
    this.isLoginProcessActive = null;
    this.offlineIcon = null;
    this.currentUser = null;
    this.topThreeTranslationCodes = null;
    this.localInstances = null;
    this.processes = null;
  }
}
