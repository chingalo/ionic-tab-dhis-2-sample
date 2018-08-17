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
import { OrganisationUnitsProvider } from '../../../../providers/organisation-units/organisation-units';
import { ProgramsProvider } from '../../../../providers/programs/programs';
import { DataSetsProvider } from '../../../../providers/data-sets/data-sets';
import { IndicatorsProvider } from '../../../../providers/indicators/indicators';
import { ProgramRulesProvider } from '../../../../providers/program-rules/program-rules';
import { ProgramStageSectionsProvider } from '../../../../providers/program-stage-sections/program-stage-sections';
import { SectionsProvider } from '../../../../providers/sections/sections';
import { SmsCommandProvider } from '../../../../providers/sms-command/sms-command';
import { StandardReportProvider } from '../../../../providers/standard-report/standard-report';
import { DataElementsProvider } from '../../../../providers/data-elements/data-elements';

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
  successOnLoginAndSyncMetadata = new EventEmitter();
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
  completedTrackedProcess: string[];

  constructor(
    private networkAvailabilityProvider: NetworkAvailabilityProvider,
    private userProvider: UserProvider,
    private appProvider: AppProvider,
    private sqlLiteProvider: SqlLiteProvider,
    private systemSettingProvider: SystemSettingProvider,
    private organisationUnitsProvider: OrganisationUnitsProvider,
    private programsProvider: ProgramsProvider,
    private dataSetsProvider: DataSetsProvider,
    private dataElementsProvider: DataElementsProvider,
    private indicatorsProvider: IndicatorsProvider,
    private programRulesProvider: ProgramRulesProvider,
    private programStageSectionsProvider: ProgramStageSectionsProvider,
    private sectionsProvider: SectionsProvider,
    private smsCommandProvider: SmsCommandProvider,
    private standardReportProvider: StandardReportProvider
  ) {
    this.showCancelButton = true;
    this.subscriptions = new Subscription();
    this.progressTrackerPacentage = {};
    this.progressTrackerMessage = {};
    this.trackedProcessWithLoader = {};
    this.completedTrackedProcess = [];
  }

  ngOnInit() {
    this.processes = this.processes ? this.processes : [];
    if (this.processes) {
      this.resetQueueManager();
    }
    if (this.currentUser) {
      this.resetCUrrentUserOptionalvalues();
    } else {
      const error = 'Missing current user data';
      this.onFailToLogin({ error });
    }
  }

  resetCUrrentUserOptionalvalues() {
    delete this.currentUser.authorities;
    delete this.currentUser.dhisVersion;
    delete this.currentUser.id;
    delete this.currentUser.userOrgUnitIds;
    delete this.currentUser.dataSets;
    delete this.currentUser.programs;
    delete this.currentUser.dataViewOrganisationUnits;
    delete this.currentUser.name;
    delete this.currentUser.authorizationKey;
    delete this.currentUser.currentDatabase;
    this.authenticateUser(this.currentUser, this.processes);
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
            this.successOnLoginAndSyncMetadata.emit({ currentUser: user });
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
            const { currentDatabase } = this.currentUser;
            this.currentUser.progressTracker[currentDatabase] = processTracker;
            this.updateCurrentUser.emit(this.currentUser);
            this.updateProgressTrackerObject(
              'Discovering system info',
              null,
              currentResouceType
            );
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
                        this.updateProgressTrackerObject(
                          'Discovering system settings',
                          null,
                          currentResouceType
                        );
                        //loading system settings
                        const subscription = this.systemSettingProvider
                          .getSystemSettingsFromServer(this.currentUser)
                          .subscribe(
                            systemSettings => {
                              this.systemSettingLoaded.emit(systemSettings);
                              //loading user authorities
                              this.updateProgressTrackerObject(
                                'Discovering user authorities',
                                null,
                                currentResouceType
                              );
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
                                    this.updateProgressTrackerObject(
                                      'Discovering user data',
                                      null,
                                      currentResouceType
                                    );
                                    const subscription = this.userProvider
                                      .getUserDataOnAuthenticatedServer(
                                        this.currentUser,
                                        serverUrl,
                                        true
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
                                              userData => {
                                                const { dataSets } = userData;
                                                const { programs } = userData;
                                                this.currentUser.dataSets = dataSets;
                                                this.currentUser.programs = programs;
                                                const {
                                                  currentDatabase
                                                } = this.currentUser;
                                                this.completedTrackedProcess = this.getCompletedTrackedProcess(
                                                  this.currentUser
                                                    .progressTracker[
                                                    currentDatabase
                                                  ]
                                                );
                                                if (this.isOnLogin) {
                                                  // preparing local storage
                                                  this.updateProgressTrackerObject(
                                                    'Preparing local storage',
                                                    null,
                                                    currentResouceType
                                                  );
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
    processes.map(process => {
      this.addIntoQueue(process, 'dowmloading');
    });
  }

  // @todo checking for upading tracker object
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
      progressTrackerObject[key].totalPassedProcesses = 0;
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

  getEmptyProcessTracker(processes: string[]) {
    let progressTracker = {};
    progressTracker['communication'] = {
      expectedProcesses: this.isOnLogin ? 5 : 4,
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
        progressTracker[resourceType].expectedProcesses += 2;
      }
    });
    return progressTracker;
  }

  updateProgressTrackerObject(
    process: string,
    processMessage?: string,
    currentResouceType?: string
  ) {
    const dataBaseStructure = this.sqlLiteProvider.getDataBaseStructure();
    const typeOfProcess =
      process.split('-').length > 1 ? process.split('-')[1] : 'saving';
    process = process.split('-')[0];
    processMessage = processMessage ? processMessage : process;
    currentResouceType =
      process &&
      dataBaseStructure &&
      dataBaseStructure[process] &&
      dataBaseStructure[process].resourceType
        ? dataBaseStructure[process].resourceType
        : currentResouceType;
    const { currentDatabase } = this.currentUser;
    let progressTracker = this.currentUser.progressTracker[currentDatabase];
    if (progressTracker[currentResouceType]) {
      this.progressTrackerMessage[currentResouceType] = processMessage;
      this.trackedProcessWithLoader[currentResouceType] = true;
      progressTracker[currentResouceType].totalPassedProcesses++;
      if (
        progressTracker[currentResouceType].passedProcesses.indexOf(
          process + '-' + typeOfProcess
        ) === -1
      ) {
        progressTracker[currentResouceType].passedProcesses.push(
          process + '-' + typeOfProcess
        );
      }
    }
    this.calculateAndSetProgressPercentage(
      this.trackedResourceTypes,
      progressTracker
    );
  }

  calculateAndSetProgressPercentage(
    trackedResourceTypes: string[],
    progressTracker
  ) {
    let totalProcesses = 0;
    let totalExpectedProcesses = 0;
    trackedResourceTypes.map((trackedResourceType: string) => {
      const trackedResource = progressTracker[trackedResourceType];
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
    const { currentDatabase } = this.currentUser;
    if (currentDatabase) {
      this.currentUser.progressTracker[currentDatabase] = progressTracker;
      this.updateCurrentUser.emit(this.currentUser);
    }
    if (totalProcesses === totalExpectedProcesses) {
      this.successOnLoginAndSyncMetadata.emit({
        currentUser: this.currentUser
      });
    }
  }

  getCompletedTrackedProcess(progressTracker) {
    let completedTrackedProcess = [];
    Object.keys(progressTracker).map((resourceType: string) => {
      progressTracker[resourceType].passedProcesses.map(
        (passedProcess: any) => {
          if (passedProcess.indexOf('-saving') > -1) {
            passedProcess = passedProcess.split('-')[0];
            if (passedProcess) {
              completedTrackedProcess = _.concat(
                completedTrackedProcess,
                passedProcess
              );
            }
          }
        }
      );
    });
    return completedTrackedProcess;
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
    if (type && type === 'saving') {
      if (data) {
        this.savingingQueueManager.enqueuedProcess = _.concat(
          this.savingingQueueManager.enqueuedProcess,
          process
        );
        this.savingingQueueManager.data[process] = data;
      }
      this.checkingAndStartSavingProcess();
    } else if (type && type === 'dowmloading') {
      this.downloadingQueueManager.enqueuedProcess = _.concat(
        this.downloadingQueueManager.enqueuedProcess,
        process
      );
      this.checkingAndStartDownloadProcess();
    }
  }

  removeFromQueue(process: string, type: string, data?: any) {
    const progressMessage = this.getProgressMessage(process, type);
    this.updateProgressTrackerObject(process + '-' + type, progressMessage);
    if (type && type === 'saving') {
      _.remove(
        this.savingingQueueManager.denqueuedProcess,
        denqueuedProcess => {
          return process === denqueuedProcess;
        }
      );
      const { currentDatabase } = this.currentUser;
      this.completedTrackedProcess = this.getCompletedTrackedProcess(
        this.currentUser.progressTracker[currentDatabase]
      );
      this.checkingAndStartSavingProcess();
    } else if (type && type === 'dowmloading') {
      _.remove(
        this.downloadingQueueManager.denqueuedProcess,
        denqueuedProcess => {
          return process === denqueuedProcess;
        }
      );
      if (data) {
        this.addIntoQueue(process, 'saving', data);
      } else {
        const processType = 'saving';
        const progressMessage = this.getProgressMessage(process, processType);
        this.updateProgressTrackerObject(
          process + '-' + processType,
          progressMessage
        );
      }
      this.checkingAndStartDownloadProcess();
    }
  }

  getProgressMessage(process: string, processType: string) {
    let progressMessage = processType + ' ' + process;
    if (processType === 'dowmloading') {
      if (process === 'organisationUnits') {
        progressMessage = 'Discovering assigned organisation units';
      } else if (process === 'dataSets') {
        progressMessage = 'Discovering entry forms';
      } else if (process === 'sections') {
        progressMessage = 'Discovering entry form sections';
      } else if (process === 'dataElements') {
        progressMessage = 'Discovering entry form fields';
      } else if (process === 'smsCommand') {
        progressMessage = 'Discovering SMS commands';
      } else if (process === 'programs') {
        progressMessage = 'Discovering programs';
      } else if (process === 'programStageSections') {
        progressMessage = 'Discovering program stage section';
      } else if (process === 'programRules') {
        progressMessage = 'Discovering program rules';
      } else if (process === 'programRuleActions') {
        progressMessage = 'Discovering program rules actions';
      } else if (process === 'programRuleVariables') {
        progressMessage = 'Discovering program rules variables';
      } else if (process === 'indicators') {
        progressMessage = 'Discovering indicators';
      } else if (process === 'reports') {
        progressMessage = 'Discovering standard reports';
      } else if (process === 'constants') {
        progressMessage = 'Discovering constants';
      }
    } else if (processType === 'saving') {
      if (process === 'organisationUnits') {
        progressMessage = 'Assigned organisation units have been discovered';
      } else if (process === 'dataSets') {
        progressMessage = 'Entry forms have been discovered';
      } else if (process === 'sections') {
        progressMessage = 'Entry form sections have been discovered';
      } else if (process === 'dataElements') {
        progressMessage = 'Entry form fields have been discovered';
      } else if (process === 'smsCommand') {
        progressMessage = 'SMS commands have been discovered';
      } else if (process === 'programs') {
        progressMessage = 'Programs have been discovered';
      } else if (process === 'programStageSections') {
        progressMessage = 'Program stage section have been discovered';
      } else if (process === 'programRules') {
        progressMessage = 'Program Rules have been discovered';
      } else if (process === 'programRuleActions') {
        progressMessage = 'Program rules actions have been discovered';
      } else if (process === 'programRuleVariables') {
        progressMessage = 'Program rules variables have been discovered';
      } else if (process === 'indicators') {
        progressMessage = 'Indicators have been discovered';
      } else if (process === 'reports') {
        progressMessage = 'Reports have been discovered';
      } else if (process === 'constants') {
        progressMessage = 'Constants have been discovered';
      }
    }
    return progressMessage;
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
            return process === enqueuedProcess;
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
            return process === enqueuedProcess;
          }
        );
        this.startDownloadProcess(process);
      }
    }
  }

  startDownloadProcess(process: string) {
    if (this.completedTrackedProcess.indexOf(process) === -1) {
      if (process === 'organisationUnits') {
        this.subscriptions.add(
          this.organisationUnitsProvider
            .downloadingOrganisationUnitsFromServer(this.currentUser)
            .subscribe(
              response => {
                this.removeFromQueue(process, 'dowmloading', response);
              },
              error => {
                this.onFailToLogin(error);
              }
            )
        );
      } else if (process === 'dataSets') {
        this.subscriptions.add(
          this.dataSetsProvider
            .downloadDataSetsFromServer(this.currentUser)
            .subscribe(
              response => {
                this.removeFromQueue(process, 'dowmloading', response);
              },
              error => {
                this.onFailToLogin(error);
              }
            )
        );
      } else if (process === 'sections') {
        this.subscriptions.add(
          this.sectionsProvider
            .downloadSectionsFromServer(this.currentUser)
            .subscribe(
              response => {
                this.removeFromQueue(process, 'dowmloading', response);
              },
              error => {
                this.onFailToLogin(error);
              }
            )
        );
      } else if (process === 'dataElements') {
        this.subscriptions.add(
          this.dataElementsProvider
            .downloadDataElementsFromServer(this.currentUser)
            .subscribe(
              response => {
                this.removeFromQueue(process, 'dowmloading', response);
              },
              error => {
                this.onFailToLogin(error);
              }
            )
        );
      } else if (process === 'smsCommand') {
        this.subscriptions.add(
          this.smsCommandProvider
            .getSmsCommandFromServer(this.currentUser)
            .subscribe(
              response => {
                this.removeFromQueue(process, 'dowmloading', response);
              },
              error => {
                this.onFailToLogin(error);
              }
            )
        );
      } else if (process === 'programs') {
        this.subscriptions.add(
          this.programsProvider
            .downloadProgramsFromServer(this.currentUser)
            .subscribe(
              response => {
                this.removeFromQueue(process, 'dowmloading', response);
              },
              error => {
                this.onFailToLogin(error);
              }
            )
        );
      } else if (process === 'programStageSections') {
        this.subscriptions.add(
          this.programStageSectionsProvider
            .downloadProgramsStageSectionsFromServer(this.currentUser)
            .subscribe(
              response => {
                this.removeFromQueue(process, 'dowmloading', response);
              },
              error => {
                this.onFailToLogin(error);
              }
            )
        );
      } else if (process === 'programRules') {
        this.subscriptions.add(
          this.programRulesProvider
            .downloadingProgramRules(this.currentUser)
            .subscribe(
              response => {
                this.removeFromQueue(process, 'dowmloading', response);
              },
              error => {
                this.onFailToLogin(error);
              }
            )
        );
      } else if (process === 'programRuleActions') {
        this.subscriptions.add(
          this.programRulesProvider
            .downloadingProgramRuleActions(this.currentUser)
            .subscribe(
              response => {
                this.removeFromQueue(process, 'dowmloading', response);
              },
              error => {
                this.onFailToLogin(error);
              }
            )
        );
      } else if (process === 'programRuleVariables') {
        this.subscriptions.add(
          this.programRulesProvider
            .downloadingProgramRuleVariables(this.currentUser)
            .subscribe(
              response => {
                this.removeFromQueue(process, 'dowmloading', response);
              },
              error => {
                this.onFailToLogin(error);
              }
            )
        );
      } else if (process === 'indicators') {
        this.subscriptions.add(
          this.indicatorsProvider
            .downloadingIndicatorsFromServer(this.currentUser)
            .subscribe(
              response => {
                this.removeFromQueue(process, 'dowmloading', response);
              },
              error => {
                this.onFailToLogin(error);
              }
            )
        );
      } else if (process === 'reports') {
        this.subscriptions.add(
          this.standardReportProvider
            .downloadReportsFromServer(this.currentUser)
            .subscribe(
              response => {
                this.removeFromQueue(process, 'dowmloading', response);
              },
              error => {
                this.onFailToLogin(error);
              }
            )
        );
      } else if (process === 'constants') {
        this.subscriptions.add(
          this.standardReportProvider
            .downloadConstantsFromServer(this.currentUser)
            .subscribe(
              response => {
                this.removeFromQueue(process, 'dowmloading', response);
              },
              error => {
                this.onFailToLogin(error);
              }
            )
        );
      }
    } else {
      this.removeFromQueue(process, 'dowmloading');
    }
  }

  startSavingProcess(process: string, data: any) {
    console.log('On saving : ' + process + ' : ' + JSON.stringify(data));
    if (process === 'organisationUnits') {
    } else if (process === 'dataSets') {
    } else if (process === 'sections') {
    } else if (process === 'dataElements') {
    } else if (process === 'smsCommand') {
    } else if (process === 'programs') {
    } else if (process === 'programStageSections') {
    } else if (process === 'programRules') {
    } else if (process === 'programRuleActions') {
    } else if (process === 'programRuleVariables') {
    } else if (process === 'indicators') {
    } else if (process === 'reports') {
    } else if (process === 'constants') {
    }
    setTimeout(() => {
      this.removeFromQueue(process, 'saving');
    }, 1000);
  }

  clearAllSubscriptions() {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
  }

  trackByFn(index, item) {
    return item && item.id ? item.id : index;
  }

  ngOnDestroy() {
    this.clearAllSubscriptions();
    this.currentUser = null;
    this.processes = null;
    this.isOnLogin = null;
    this.overAllMessage = null;
    this.savingingQueueManager = null;
    this.showOverallProgressBar = null;
    this.downloadingQueueManager = null;
    this.showCancelButton = null;
    this.progressTrackerPacentage = null;
    this.progressTrackerMessage = null;
    this.trackedProcessWithLoader = null;
    this.completedTrackedProcess = null;
  }
}
