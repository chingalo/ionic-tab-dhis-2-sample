import { ActionReducerMap } from '@ngrx/store';
import { currentUserReducer, CurrentUserState } from './currentUser.reducers';

export interface AppState {
  currentUser: CurrentUserState;
}

export const reducers: ActionReducerMap<AppState> = {
  currentUser: currentUserReducer
};

export const getCurrentUserState = (state: AppState) => state.currentUser;
