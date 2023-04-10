import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { V1Device } from '../api/pax';
import { environment } from 'src/environments/environment';
import { AttributionControl, FullscreenControl, Map, NavigationControl, Marker, MarkerOptions } from 'maplibre-gl';

@Component({
    selector: 'app-device-map-view',
    templateUrl: './device-map-view.component.html',
    styleUrls: ['./device-map-view.component.css']
})
export class DeviceMapViewComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
    @Input("device") device: V1Device = {};

    @ViewChild("map") mapContainer?: ElementRef<HTMLElement>;
    map?: Map;

    constructor() { }

    ngOnInit(): void {
    }

    ngOnChanges() {
        this.addMarkerForDevice(this.device, this.map);
    }
    ngAfterViewInit(): void {
        if (this.map) {
            return
        }

        this.map = new Map({
            container: this.mapContainer!.nativeElement,
            style: environment.apiHost + "/map/styles/basic.json",
            center: [10.14, 63.42], // starting position [lng, lat]
            zoom: 3, // starting zoom
            maxBounds: [[9.78, 63.17], [10.97, 63.56]]
        });
        this.map.addControl(new NavigationControl());
        this.map.addControl(new AttributionControl({
            compact: false, customAttribution:
                "Style © <a href='http://openmaptiles.org/'>MapTiler</a> | " +
                "Data © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap contributors</a>"
        }));

        this.addMarkerForDevice(this.device, this.map);
    }

    ngOnDestroy(): void {
        this.enableRotation = false;
        this.map?.remove();
    }

    cameraBearing: number = 0;
    enableRotation: boolean = false;

    addMarkerForDevice(device?: V1Device, map?: Map): void {
        if (!device || !map) {
            return;
        }
        if (!device.lat || device.lat == 0 || !device.lon || device.lon == 0) {
            this.enableRotation = false;
            this.cameraBearing = 0;
            // Move out to ovewview
            this.map?.flyTo({
                center: [10.14, 63.42], // starting position [lng, lat]
                zoom: 3, // starting zoom
                pitch: 0,
                bearing: 0,
                speed: 2, // make the flying slow
                curve: 2, // change the speed at which it zooms out

                // This can be any easing function: it takes a number between
                // 0 and 1 and returns another number between 0 and 1.
                easing: (t) => t,

                // this animation is considered essential with respect to prefers-reduced-motion
                essential: true
            });
            return
        }
        let d_lat = device.lat
        let d_lon = device.lon
        let marker = new Marker({
            color: '#ff0000',
        });

        marker.setLngLat([d_lat, d_lon]);
        marker.addTo(this.map!);

        if (this.enableRotation) {
            // Already animating something
            this.enableRotation = false;
            this.cameraBearing = 0;
        }

        // Fly to the marker
        this.map?.flyTo({
            // These options control the ending camera position: centered at
            // the target, at zoom level 9, and north up.
            center: [d_lat, d_lon],
            zoom: 16,
            pitch: 45,
            bearing: 0,

            // These options control the flight curve, making it move
            // slowly and zoom out almost completely before starting
            // to pan.
            speed: 1, // make the flying slow
            curve: 1, // change the speed at which it zooms out

            // This can be any easing function: it takes a number between
            // 0 and 1 and returns another number between 0 and 1.
            easing: (t) => t,

            // this animation is considered essential with respect to prefers-reduced-motion
            essential: true
        });


        let rotateCamera = (ts: number) => {
            if (!this.enableRotation) {
                return;
            }
            // clamp the rotation between 0 -360 degrees
            // Divide timestamp by 100 to slow rotation to ~10 degrees / sec
            map.rotateTo(this.cameraBearing, { duration: 0 });
            // Request the next frame of the animation.
            this.cameraBearing += 0.25;
            if (this.cameraBearing >= 360) {
                this.cameraBearing = 0;
            }
            requestAnimationFrame(rotateCamera);
        }

        // Stop rotation when there's a click
        this.map?.on('click', () => {
            this.enableRotation = false;
        });

        this.map?.once('moveend', () => {
            this.enableRotation = true;
            rotateCamera(0);
            //            map.rotateTo(180.0, { duration: 6000 });
        });
    }
}
