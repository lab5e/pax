import { Component } from '@angular/core';
import { PaxServiceService } from './api/pax';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'PAX';

    constructor(
        private paxService: PaxServiceService,
    ) {
        this.paxService.configuration.basePath = environment.apiHost;
    }
}
