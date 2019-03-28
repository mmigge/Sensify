import { Component } from '@angular/core';

@Component({
    selector: 'sensify-page-about',
    templateUrl: 'sensify-about.html',
})
export class SensifyAboutPage {

    constructor() {}

    openUrl(){
        window.open('https://github.com/vgorte/sensify', '_system');
    }
}
