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
import {
  Component,
  OnDestroy,
  OnInit,
  Input,
  Output,
  EventEmitter
} from '@angular/core';

import { CurrentUser } from '../../../../models/currentUser';
import { QueueManager } from '../../../../models/queueManager';

import { Subscription } from 'rxjs/Subscription';
import * as _ from 'lodash';

import { NetworkAvailabilityProvider } from '../../../../providers/network-availability/network-availability';
import { UserProvider } from '../../../../providers/user/user';
import { AppProvider } from '../../../../providers/app/app';

/**
 * Generated class for the LoginMetadataSyncComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'login-metadata-sync',
  templateUrl: 'login-metadata-sync.html'
})
export class LoginMetadataSyncComponent implements OnDestroy, OnInit {
  @Input()
  currentUser: CurrentUser;
  @Input()
  processes: string[];
  @Input()
  isOnLogin: boolean;
  @Input()
  overAllMessage: string;

  @Output()
  cancelProgress = new EventEmitter();
  @Output()
  successOnLogin = new EventEmitter();
  @Output()
  failOnLogin = new EventEmitter();

  savingingQueueManager: QueueManager;
  downloadingQueueManager: QueueManager;
  subscriptions: Subscription;

  showCancelButton: boolean;
  showLoader: boolean;
  processMessage: string;
  progressPercentage: string;

  constructor(
    private networkAvailabilityProvider: NetworkAvailabilityProvider,
    private userProvider: UserProvider,
    private appProvider: AppProvider
  ) {
    this.showLoader = true;
    this.showCancelButton = true;
    this.subscriptions = new Subscription();
    this.progressPercentage = '24';
  }

  ngOnInit() {
    if (this.processes) {
      this.processMessage = 'Loading';
      this.resetQueueManager();
    }
    if (this.isOnLogin) {
      const currentUser = _.assign({}, this.currentUser);

      this.authenticateUser(currentUser, this.processes);
    } else {
      this.syncMetadata(this.processes);
    }
  }

  authenticateUser(currentUser: CurrentUser, processes: string[]) {
    currentUser.serverUrl = this.appProvider.getFormattedBaseUrl(
      currentUser.serverUrl
    );
    const networkStatus = this.networkAvailabilityProvider.getNetWorkStatus();
    const { isAvailable } = networkStatus;
    if (!isAvailable) {
      this.userProvider.offlineUserAuthentication(currentUser).subscribe(
        user => {
          this.successOnLogin.emit({ currentUser: user });
        },
        error => {
          this.failOnLogin.emit(error);
        }
      );
    } else {
      this.userProvider
        .onlineUserAuthentication(currentUser, currentUser.serverUrl)
        .subscribe(
          data => {
            console.log(JSON.stringify(data));
          },
          error => {
            console.log('error', error);
          }
        );
    }
  }

  syncMetadata(processes: string[]) {
    console.log(processes);
  }

  onCancelProgess() {
    this.cancelProgress.emit();
  }

  resetQueueManager() {
    this.savingingQueueManager = {
      enqueuedProcess: [],
      dequeuingLimit: 1,
      denqueuedProcess: [],
      data: {}
    };
    this.downloadingQueueManager = {
      totalProcess: this.processes.length,
      enqueuedProcess: [],
      dequeuingLimit: 5,
      denqueuedProcess: []
    };
  }

  addIntoQueue(process: string, type?: string, data?: any) {
    if (type && type == 'saving') {
      if (data) {
        this.savingingQueueManager.enqueuedProcess = _.concat(
          this.savingingQueueManager.enqueuedProcess,
          process
        );
        this.savingingQueueManager.data[process] = data;
      }
      this.checkingAndStartSavingProcess();
    } else if (type && type == 'dowmloading') {
      this.downloadingQueueManager.enqueuedProcess = _.concat(
        this.downloadingQueueManager.enqueuedProcess,
        process
      );
      this.checkingAndStartDownloadProcess();
    }
  }

  removeFromQueue(process: string, type: string, data?: any) {
    if (type && type == 'saving') {
      _.remove(
        this.savingingQueueManager.denqueuedProcess,
        denqueuedProcess => {
          return process == denqueuedProcess;
        }
      );
      this.checkingAndStartSavingProcess();
    } else if (type && type == 'dowmloading') {
      _.remove(
        this.downloadingQueueManager.denqueuedProcess,
        denqueuedProcess => {
          return process == denqueuedProcess;
        }
      );
      if (data) {
        this.addIntoQueue(process, 'saving', data);
      }
      this.checkingAndStartDownloadProcess();
    }
  }

  checkingAndStartSavingProcess() {
    if (
      this.savingingQueueManager.denqueuedProcess.length <
      this.savingingQueueManager.dequeuingLimit
    ) {
      const process = _.head(this.savingingQueueManager.enqueuedProcess);
      if (process) {
        const data = this.savingingQueueManager.data[process];
        delete this.savingingQueueManager.data[process];
        this.savingingQueueManager.denqueuedProcess = _.concat(
          this.savingingQueueManager.denqueuedProcess,
          process
        );
        _.remove(
          this.savingingQueueManager.enqueuedProcess,
          enqueuedProcess => {
            return process == enqueuedProcess;
          }
        );
        this.startSavingProcess(process, data);
      }
    }
  }

  checkingAndStartDownloadProcess() {
    if (
      this.downloadingQueueManager.denqueuedProcess.length <
      this.downloadingQueueManager.dequeuingLimit
    ) {
      const process = _.head(this.downloadingQueueManager.enqueuedProcess);
      if (process) {
        this.downloadingQueueManager.denqueuedProcess = _.concat(
          this.downloadingQueueManager.denqueuedProcess,
          process
        );
        _.remove(
          this.downloadingQueueManager.enqueuedProcess,
          enqueuedProcess => {
            return process == enqueuedProcess;
          }
        );
        this.startDownloadProcess(process);
      }
    }
  }

  startSavingProcess(process: string, data: any) {}

  startDownloadProcess(process: string) {}

  clearAllSubscriptions() {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
  }

  ngOnDestroy() {
    this.savingingQueueManager = null;
    this.downloadingQueueManager = null;
    this.showLoader = null;
    this.showCancelButton = null;
    this.clearAllSubscriptions();
  }
}
