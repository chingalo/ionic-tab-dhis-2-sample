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
 */
import { AppTranslationProvider } from '../providers/app-translation/app-translation';
import { AppProvider } from './app/app';
import { NetworkAvailabilityProvider } from './network-availability/network-availability';
import { EncryptionProvider } from './encryption/encryption';
import { HttpClientProvider } from './http-client/http-client';
import { LocalInstanceProvider } from './local-instance/local-instance';
import { UserProvider } from './user/user';
import { OrganisationUnitsProvider } from './organisation-units/organisation-units';
import { BarcodeReaderProvider } from './barcode-reader/barcode-reader';
import { DataSetsProvider } from './data-sets/data-sets';
import { GeolocationProvider } from './geolocation/geolocation';
import { ProgramsProvider } from './programs/programs';
import { SettingsProvider } from './settings/settings';

export const appProviders = [
  AppTranslationProvider,
  AppProvider,
  NetworkAvailabilityProvider,
  EncryptionProvider,
  HttpClientProvider,
  LocalInstanceProvider,
  UserProvider,
  BarcodeReaderProvider,
  OrganisationUnitsProvider,
  DataSetsProvider,
  GeolocationProvider,
  ProgramsProvider,
  SettingsProvider
];
