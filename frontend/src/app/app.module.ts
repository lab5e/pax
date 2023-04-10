import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MainPageComponent } from './main-page/main-page.component';
import { DeviceViewComponent } from './device-view/device-view.component';
import { DeviceMapViewComponent } from './device-map-view/device-map-view.component';
import { NgxMapLibreGLModule } from '@maplibre/ngx-maplibre-gl';
import { DeviceOverviewComponent } from './device-overview/device-overview.component';

@NgModule({
    declarations: [
        AppComponent,
        MainPageComponent,
        DeviceViewComponent,
        DeviceMapViewComponent,
        DeviceOverviewComponent,
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        NgxMapLibreGLModule,
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
