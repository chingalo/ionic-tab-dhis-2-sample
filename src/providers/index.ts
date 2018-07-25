import { AppTranslationProvider } from '../providers/app-translation/app-translation';
import { AppProvider } from './app/app';
import { NetworkAvailabilityProvider } from './network-availability/network-availability';

export const appProviders = [
  AppTranslationProvider,
  AppProvider,
  NetworkAvailabilityProvider
];
