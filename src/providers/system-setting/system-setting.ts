import { Injectable } from '@angular/core';
import { HttpClientProvider } from '../http-client/http-client';
import { Observable } from 'rxjs/Observable';
import { CurrentUser } from '../../models/currentUser';

/*
  Generated class for the SystemSettingProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class SystemSettingProvider {
  constructor(private httpClientProvider: HttpClientProvider) {}

  getSystemSettings(currentUser: CurrentUser): Observable<any> {
    return new Observable(observer => {
      const url = '/api/systemSettings';
      this.httpClientProvider.get(url, true, currentUser).subscribe(
        response => {
          observer.next(response);
          observer.complete();
        },
        error => {
          observer.error(error);
        }
      );
    });
  }
}
