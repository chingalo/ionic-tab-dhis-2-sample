import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { TabsPage } from '../tabs/tabs';

/**
 * Generated class for the LaunchPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-launch',
  templateUrl: 'launch.html'
})
export class LaunchPage implements OnInit {
  constructor(private navCtrl: NavController) {}

  ionViewDidLoad() {
    setTimeout(() => {
      //this.navCtrl.setRoot(TabsPage);
    }, 1000);
  }

  ngOnInit() {
    this.navCtrl.setRoot('LoginPage');
  }
}
