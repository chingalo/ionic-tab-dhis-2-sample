import { createSelector } from '@ngrx/store';
import { getCurrentUserData } from '../reducers/currentUser.reducers';
import { getCurrentUserState } from '../reducers';
import { CurrentUser } from '../../models/currentUser';

export const getCurrentUser = createSelector(
  getCurrentUserState,
  getCurrentUserData
);

export const getCurrentUserServerUrl = createSelector(
  getCurrentUser,
  (user: CurrentUser) => user.serverUrl
);
