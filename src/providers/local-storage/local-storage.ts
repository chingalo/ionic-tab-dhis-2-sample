import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Observable } from 'rxjs';

/*
  Generated class for the LocalStorageProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class LocalStorageProvider {
  constructor(private storage: Storage) {}

  setDataOnLocalStorage(data, key): Observable<any> {
    return new Observable(observer => {
      this.storage
        .set(key, data)
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  getDataOnLocalStorage(key): Observable<any> {
    return new Observable(observer => {
      this.storage
        .get(key)
        .then(data => {
          data = JSON.parse(data);
          observer.next(data);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }
}
