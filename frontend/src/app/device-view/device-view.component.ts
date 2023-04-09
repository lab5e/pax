import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, Renderer2, SimpleChanges, ViewChild } from '@angular/core';
import { PaxServiceService, V1Data, V1Device, V1ListDataResponse, V1Sample } from '../api/pax';
import { HttpErrorResponse } from '@angular/common/http';
import * as d3 from 'd3';
import * as Plot from '@observablehq/plot';

// use a dedicated data struct for the samples since it's PITA to convert from strings to dates in 
// the chart library
interface Sample {
    time: Date;
    ble: number;
    wifi: number;
}

interface Metric {
    bigText: string;
    smallText: string;
}

@Component({
    selector: 'app-device-view',
    templateUrl: './device-view.component.html',
    styleUrls: ['./device-view.component.css']
})
export class DeviceViewComponent implements OnInit, AfterViewInit, OnChanges {

    @Input("device") device: V1Device = {};
    @ViewChild("chart") chartRef?: ElementRef;

    metrics: Metric[] = [];
    data: Sample[] = [];
    errorMessage: string = "";
    lastPoll: Date = new Date();

    chartIntervalHours: number = 24;

    constructor(
        protected paxService: PaxServiceService,
        private renderer: Renderer2,
    ) { }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.loadData();
    }
    loadData(): void {
        let dayAgo: string = "" + (new Date().getTime() - (this.chartIntervalHours * 3600 * 1000));
        let now: string = "" + (new Date().getTime());
        this.paxService.paxServiceListData(dayAgo, now, 19000000).subscribe({
            next: (value: V1ListDataResponse) => {
                if (value.data) {
                    value.data.forEach((v, i) => {
                        if (v.deviceId == this.device.id) {
                            this.data = v.samples?.map(d => {
                                return {
                                    time: new Date(parseInt(d.timestamp!)),
                                    ble: d.bluetoothCount || 0,
                                    wifi: d.wifiCount || 0,
                                };
                            }) || [];
                        }
                    });
                }
            },
            error: (e: HttpErrorResponse) => {
                this.errorMessage = e.message;
            },
            complete: () => {
                this.buildMetrics();
                this.lastPoll = new Date();
                this.showChart();
            },
        });
    }

    chart?: (SVGElement | HTMLElement);

    showChart(): void {
        if (this.chart) {
            // Remove the old one if it already exists
            this.renderer.removeChild(this.chartRef?.nativeElement, this.chart, false);
        }
        let width = this.chartRef?.nativeElement.offsetWidth;
        let height = this.chartRef?.nativeElement.height;
        let startDate = d3.min(this.data, (d: Sample) => d.time);
        let endDate = d3.max(this.data, (d: Sample) => d.time)

        /**
         * Plot the actual samples as dots and moving window with averages as a solid line
         */
        this.chart = Plot.plot({
            width: width,
            height: height,
            margin: 50,
            inset: 5,
            y: {
                grid: true,
                label: "Antall"
            },
            x: {
                label: "Klokkeslett",
                grid: true,
                tickFormat: d3.utcFormat("%H:%M"),
                domain: [startDate, endDate]
            },
            marks: [
                Plot.dot(this.data, {
                    x: d => d.time,
                    y: "ble",
                    stroke: "blue",
                    opacity: 0.2,
                }),
                Plot.line(
                    this.data,
                    Plot.windowY(
                        { reduce: "mean", k: 7, anchor: "middle" },
                        {
                            x: "time",
                            y: "ble",
                            stroke: "blue",
                            strokeWidth: 2,
                            opacity: 0.8,
                        }
                    )
                ),
                Plot.dot(this.data, {
                    x: "time",
                    y: "wifi",
                    stroke: "red",
                    opacity: 0.3,
                }),
                Plot.line(
                    this.data,
                    Plot.windowY(
                        { reduce: "mean", k: 7, anchor: "middle" },
                        {
                            x: "time",
                            y: "wifi",
                            stroke: "red",
                            strokeWidth: 2,
                            opacity: 0.9,
                        }
                    )
                ),
            ],
            color: {
                legend: true,
                domain: ["wifi", "ble"],
                range: ["red", "blue"]
            },
            style: {
                fontFamily: 'sans-serif',
                fontSize: '10pt',
                background: '#eeeeee',
                fill: '#808080',
                border: 'solid 1px silver',
            }
        })
        this.renderer.appendChild(this.chartRef?.nativeElement, this.chart)
    }

    buildMetrics(): void {
        let maxBle: number = d3.max(this.data, d => d.ble) || 0;
        let maxWifi: number = d3.max(this.data, d => d.wifi) || 0;
        let busyIndicator: string = "Rolig";
        let i = this.data.length - 1;
        let current = this.data[i].ble + this.data[i].wifi;
        let percent: number = Math.round(current * 100 / (maxBle + maxWifi));

        if (percent >= 80) {
            busyIndicator = "Svært høy"
        }
        if (percent >= 60 && percent < 80) {
            busyIndicator = "Høy";
        }
        if (percent >= 40 && percent < 60) {
            busyIndicator = "Normal";
        }
        if (percent >= 25 && percent < 40) {
            busyIndicator = "Lav";
        }
        if (percent < 25) {
            busyIndicator = "Svært Lav";
        }
        this.metrics = [
            { bigText: String(maxBle), smallText: "Maks antall BLE" },
            { bigText: String(maxWifi), smallText: "Maks antall WiFi" },
            { bigText: String(this.data.length), smallText: "Målinger i perioden" },
            { bigText: busyIndicator, smallText: "Folketetthet (" + percent + "% av maks)" }
        ];
    }
}
