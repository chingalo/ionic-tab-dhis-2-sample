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
import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { IonicStorageModule } from '@ionic/storage';

import { MyApp } from './app.component';
import { TabsPage } from '../pages/tabs/tabs';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

// Multi-language
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { appProviders } from '../providers';

// Native plugins
import { HTTP } from '@ionic-native/http';
import { Network } from '@ionic-native/network';
import { AppVersion } from '@ionic-native/app-version';
import { SQLite } from '@ionic-native/sqlite';
import { Diagnostic } from '@ionic-native/diagnostic';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { DatePicker } from '@ionic-native/date-picker';
import { Geolocation } from '@ionic-native/geolocation';
import { SystemSettingProvider } from '../providers/system-setting/system-setting';

@NgModule({
  declarations: [MyApp, TabsPage],
  imports: [
    BrowserModule,
    IonicStorageModule.forRoot(),
    IonicModule.forRoot(MyApp, { scrollAssist: false, autoFocusAssist: false }),
    HttpClientModule,
    TranslateModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [MyApp, TabsPage],
  providers: [
    StatusBar,
    HTTP,
    Network,
    AppVersion,
    SQLite,
    HttpClient,
    Diagnostic,
    BarcodeScanner,
    DatePicker,
    Geolocation,
    SplashScreen,
    {
      provide: TranslateLoader,
      useFactory: (http: HttpClient) =>
        new TranslateHttpLoader(http, '/assets/i18n/', '.json'),
      deps: [HttpClient]
    },
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    ...appProviders,
    SystemSettingProvider
  ]
})
export class AppModule {}
