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
import { IonicPage, ViewController } from 'ionic-angular';
import { Subscription } from 'rxjs/Subscription';

/**
 * Generated class for the LocalInstancesSelectionPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-local-instances-selection',
  templateUrl: 'local-instances-selection.html'
})
export class LocalInstancesSelectionPage implements OnInit, OnDestroy {
  cancelIcon: string;
  localInstances: Array<any>;
  subscriptions: Subscription;

  constructor(private viewCtrl: ViewController) {
    this.localInstances = [];
    this.subscriptions = new Subscription();
  }

  ngOnInit() {
    this.cancelIcon = 'assets/icon/cancel.png';
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
  }

  getFilteredList(data) {
    const value = data.target.value;
    if (value && value.trim() != '') {
      console.log('value : ' + value);
    }
  }

  setCurrentUser(currentUser, currentLanguage) {
    currentUser.currentLanguage = currentLanguage;
    this.viewCtrl.dismiss(currentUser);
  }

  trackByFn(index, item) {
    return item && item.id ? item.id : index;
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
}
