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
import { SqlLiteProvider } from '../../../../providers/sql-lite/sql-lite';
import { SystemSettingProvider } from '../../../../providers/system-setting/system-setting';

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
  @Input()
  showOverallProgressBar: boolean;

  @Output()
  cancelProgress = new EventEmitter();
  @Output()
  successOnLogin = new EventEmitter();
  @Output()
  systemSettingLoaded = new EventEmitter();
  @Output()
  updateCurrentUser = new EventEmitter();
  @Output()
  failOnLogin = new EventEmitter();

  savingingQueueManager: QueueManager;
  downloadingQueueManager: QueueManager;
  subscriptions: Subscription;
  showCancelButton: boolean;
  trackedResourceTypes: string[];
  progressTrackerPacentage: any;
  progressTrackerMessage: any;
  trackedProcessWithLoader: any;

  constructor(
    private networkAvailabilityProvider: NetworkAvailabilityProvider,
    private userProvider: UserProvider,
    private appProvider: AppProvider,
    private sqlLiteProvider: SqlLiteProvider,
    private systemSettingProvider: SystemSettingProvider
  ) {
    this.showCancelButton = true;
    this.subscriptions = new Subscription();
    this.progressTrackerPacentage = {};
    this.progressTrackerMessage = {};
    this.trackedProcessWithLoader = {};
  }

  ngOnInit() {
    if (this.processes) {
      this.resetQueueManager();
    }
    if (this.currentUser) {
      this.authenticateUser(this.currentUser, this.processes);
    } else {
      const error = 'Missing current user data';
      this.onFailToLogin({ error });
    }
  }

  authenticateUser(currentUser: CurrentUser, processes: string[]) {
    currentUser.serverUrl = this.appProvider.getFormattedBaseUrl(
      currentUser.serverUrl
    );
    const networkStatus = this.networkAvailabilityProvider.getNetWorkStatus();
    const { isAvailable } = networkStatus;
    if (!isAvailable && this.isOnLogin) {
      const subscription = this.userProvider
        .offlineUserAuthentication(currentUser)
        .subscribe(
          user => {
            this.successOnLogin.emit({ currentUser: user });
          },
          error => {
            this.onFailToLogin(error);
          }
        );
      this.subscriptions.add(subscription);
    } else if (isAvailable) {
      const currentResouceType = 'communication';
      let processTracker = this.getProgressTracker(currentUser, processes);
      this.trackedResourceTypes = Object.keys(processTracker);
      this.calculateAndSetProgressPercentage(
        this.trackedResourceTypes,
        processTracker
      );
      //authenticate user online
      const subscription = this.userProvider
        .onlineUserAuthentication(currentUser, currentUser.serverUrl)
        .subscribe(
          response => {
            const { serverUrl } = response;
            const { currentUser } = response;
            this.currentUser = _.assign({}, currentUser);
            this.currentUser.serverUrl = serverUrl;
            this.overAllMessage = serverUrl;
            this.currentUser.authorizationKey = btoa(
              this.currentUser.username + ':' + this.currentUser.password
            );
            this.currentUser.currentDatabase = this.appProvider.getDataBaseName(
              this.currentUser.serverUrl,
              this.currentUser.username
            );
            this.updateCurrentUser.emit(this.currentUser);
            //loading system info
            const subscription = this.userProvider
              .getCurrentUserSystemInformationFromServer(this.currentUser)
              .subscribe(
                response => {
                  //saving system information
                  const subscription = this.userProvider
                    .setCurrentUserSystemInformation(response)
                    .subscribe(
                      dhisVersion => {
                        this.currentUser.dhisVersion = dhisVersion;
                        //loading system settings
                        const subscription = this.systemSettingProvider
                          .getSystemSettingsFromServer(this.currentUser)
                          .subscribe(
                            systemSettings => {
                              this.systemSettingLoaded.emit(systemSettings);
                              //loading user authorities
                              const subscription = this.userProvider
                                .getUserAuthorities(this.currentUser)
                                .subscribe(
                                  response => {
                                    this.currentUser.id = response.id;
                                    this.currentUser.name = response.name;
                                    this.currentUser.authorities =
                                      response.authorities;
                                    this.currentUser.dataViewOrganisationUnits =
                                      response.dataViewOrganisationUnits;
                                    //loading user data
                                    const subscription = this.userProvider
                                      .getUserDataOnAuthenticatedServer(
                                        currentUser,
                                        serverUrl
                                      )
                                      .subscribe(
                                        response => {
                                          const { data } = response;
                                          this.currentUser.userOrgUnitIds = _.map(
                                            data.organisationUnits,
                                            (organisationUnit: any) => {
                                              return organisationUnit.id;
                                            }
                                          );
                                          const subscription = this.userProvider
                                            .setUserData(data)
                                            .subscribe(
                                              () => {
                                                if (this.isOnLogin) {
                                                  // preparing local storage
                                                  const {
                                                    currentDatabase
                                                  } = this.currentUser;
                                                  const subscription = this.sqlLiteProvider
                                                    .generateTables(
                                                      currentDatabase
                                                    )
                                                    .subscribe(
                                                      () => {
                                                        this.startSyncMetadataProcesses(
                                                          processes
                                                        );
                                                      },
                                                      error => {
                                                        this.onFailToLogin(
                                                          error
                                                        );
                                                      }
                                                    );
                                                  this.subscriptions.add(
                                                    subscription
                                                  );
                                                } else {
                                                  this.startSyncMetadataProcesses(
                                                    processes
                                                  );
                                                }
                                              },
                                              error => {
                                                this.onFailToLogin(error);
                                              }
                                            );
                                          this.subscriptions.add(subscription);
                                        },
                                        error => {
                                          this.onFailToLogin(error);
                                        }
                                      );
                                    this.subscriptions.add(subscription);
                                  },
                                  error => {
                                    this.onFailToLogin(error);
                                  }
                                );
                              this.subscriptions.add(subscription);
                            },
                            error => {
                              this.onFailToLogin(error);
                            }
                          );
                        this.subscriptions.add(subscription);
                      },
                      error => {
                        this.onFailToLogin(error);
                      }
                    );
                  this.subscriptions.add(subscription);
                },
                error => {
                  this.onFailToLogin(error);
                }
              );
            this.subscriptions.add(subscription);
          },
          error => {
            this.onFailToLogin(error);
          }
        );
      this.subscriptions.add(subscription);
    } else {
      const error = networkStatus.message;
      this.onFailToLogin({ error });
    }
  }

  startSyncMetadataProcesses(processes: string[]) {
    console.log(processes);
  }

  getProgressTracker(currentUser: CurrentUser, processes: string[]) {
    const emptyProgressTracker = this.getEmptyProcessTracker(processes);
    let progressTrackerObject =
      currentUser &&
      currentUser.currentDatabase &&
      currentUser.progressTracker &&
      currentUser.progressTracker[currentUser.currentDatabase]
        ? currentUser.progressTracker[currentUser.currentDatabase]
        : emptyProgressTracker;
    Object.keys(progressTrackerObject).map((key: string) => {
      this.trackedProcessWithLoader[key] = false;
      if (key === 'communication') {
        this.progressTrackerMessage[key] = 'Establishing connection to server';
        this.trackedProcessWithLoader[key] = true;
      } else if (key === 'entryForm') {
        this.progressTrackerMessage[key] = 'Aggregate metadata';
      } else if (key === 'event') {
        this.progressTrackerMessage[key] = 'Event and tracker metadata';
      } else if (key === 'report') {
        this.progressTrackerMessage[key] = 'Reports metadata';
      }
    });
    return progressTrackerObject;
  }

  getEmptyProcessTracker(processes) {
    let progressTracker = {};
    progressTracker['communication'] = {
      expectedProcesses: this.isOnLogin ? 7 : 6,
      totalPassedProcesses: 0,
      passedProcesses: [],
      message: ''
    };
    const dataBaseStructure = this.sqlLiteProvider.getDataBaseStructure();
    processes.map((process: string) => {
      const table = dataBaseStructure[process];
      const { isMetadata } = table;
      const { resourceType } = table;
      if (isMetadata && resourceType && resourceType !== '') {
        if (!progressTracker[resourceType]) {
          progressTracker[resourceType] = {
            expectedProcesses: 0,
            totalPassedProcesses: 0,
            passedProcesses: [],
            message: ''
          };
        }
        progressTracker[resourceType].expectedProcesses++;
      }
    });
    return progressTracker;
  }

  calculateAndSetProgressPercentage(
    trackedResourceTypes: string[],
    processTracker
  ) {
    let totalProcesses = 0;
    let totalExpectedProcesses = 0;
    trackedResourceTypes.map((trackedResourceType: string) => {
      const trackedResource = processTracker[trackedResourceType];
      const { expectedProcesses } = trackedResource;
      const { totalPassedProcesses } = trackedResource;
      totalProcesses += totalPassedProcesses;
      totalExpectedProcesses += expectedProcesses;
      this.progressTrackerPacentage[trackedResourceType] = this.getPercetage(
        totalPassedProcesses,
        expectedProcesses
      );
    });
    this.progressTrackerPacentage['overall'] = this.getPercetage(
      totalProcesses,
      totalExpectedProcesses
    );
  }

  getPercetage(numerator, denominator) {
    let percentage = 0;
    if (numerator && denominator) {
      percentage = Math.round((numerator / denominator) * 100);
    }
    return String(percentage);
  }

  onFailToLogin(error) {
    this.clearAllSubscriptions();
    this.failOnLogin.emit(error);
  }

  onCancelProgess() {
    this.clearAllSubscriptions();
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

  trackByFn(index, item) {
    return item && item.id ? item.id : index;
  }

  ngOnDestroy() {
    this.clearAllSubscriptions();
    this.savingingQueueManager = null;
    this.downloadingQueueManager = null;
    this.showCancelButton = null;
    this.progressTrackerPacentage = null;
    this.progressTrackerMessage = null;
    this.trackedProcessWithLoader = null;
  }
}
