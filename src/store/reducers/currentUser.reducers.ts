import { CurrentUser } from '../../models/currentUser';
import * as fromCurrentUserActions from '../actions/currentUser.actons';

export interface CurrentUserState {
  data: CurrentUser;
}

export const initialState: CurrentUserState = {
  data: {
    name: '',
    username: 'admin',
    password: '',
    serverUrl: '',
    currentLanguage: 'en'
  }
};

export function currentUserReducer(
  state: CurrentUserState = initialState,
  action: fromCurrentUserActions.CurrentUserActions
) {
  switch (action.type) {
    case fromCurrentUserActions.UPDATE_CURRENT_USER: {
      return {
        data: action.payload
      };
    }
  }

  return state;
}

export const getCurrentUserData = (state: CurrentUserState) => state.data;
