import { Action } from '@ngrx/store';
import { CurrentUser } from '../../models/currentUser';

export const UPDATE_CURRENT_USER = '[Current user] updating current user';

export class UpdateCurrentUser implements Action {
  readonly type = UPDATE_CURRENT_USER;
  constructor(public payload: CurrentUser) {}
}

export type CurrentUserActions = UpdateCurrentUser;
