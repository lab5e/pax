import { AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnInit, Renderer2, SimpleChanges, ViewChild } from '@angular/core';
import { V1Device } from '../api/pax';
import * as d3 from 'd3';
import * as Plot from '@observablehq/plot';
import { DeviceSample, SampleService } from '../sample.service';

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

    metricDensityPercent: number = 0;
    metricSampleCount: number = 0;
    metricWifi: number = 0;
    metricBLE: number = 0;

    data: DeviceSample[] = [];
    errorMessage: string = "";

    chart?: (SVGElement | HTMLElement);

    constructor(
        protected samples: SampleService,
        private renderer: Renderer2,
        private cd: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
        this.loadData();
    }

    ngOnChanges(changes: SimpleChanges): void {
        // This might trigger before the view is visible
        if (this.chartRef) {
            this.loadData();
        }
    }

    loadData(): void {
        var elements: DeviceSample[] = [];
        this.samples.allData().subscribe({
            next: (d: DeviceSample) => {
                if (d.id == this.device.id) {
                    elements.push(d);
                }
            },
            complete: () => {
                this.data = elements;
                this.showChart();
                this.buildMetrics();
                // We change the bindings in a change event but it won't cascade. This forces the
                // change detection to run one more time without issuing an error 
                // see: https://angular.io/errors/NG0100
                this.cd.detectChanges();
            },
        });
    }

    showChart(): void {
        if (this.chart) {
            // Remove the old one if it already exists
            this.renderer.removeChild(this.chartRef?.nativeElement, this.chart, false);
        }
        let width = this.chartRef?.nativeElement.offsetWidth;
        let height = this.chartRef?.nativeElement.height;
        let startDate = d3.min(this.data, (d: DeviceSample) => d.time);
        let endDate = d3.max(this.data, (d: DeviceSample) => d.time)

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
                tickFormat: d3.timeFormat("%H:%M"),
                domain: [startDate, endDate]
            },
            marks: [
                Plot.dot(this.data, {
                    x: d => d.time,
                    y: "ble",
                    stroke: "darkblue",
                    opacity: 0.2,
                }),
                Plot.line(
                    this.data,
                    Plot.windowY(
                        { reduce: "mean", k: 20, anchor: "middle" },
                        {
                            x: "time",
                            y: "ble",
                            stroke: "darkblue",
                            strokeWidth: 2,
                            opacity: 0.8,
                        }
                    )
                ),
                Plot.dot(this.data, {
                    x: "time",
                    y: "wifi",
                    stroke: "salmon",
                    opacity: 0.3,
                }),
                Plot.line(
                    this.data,
                    Plot.windowY(
                        { reduce: "mean", k: 20, anchor: "middle" },
                        {
                            x: "time",
                            y: "wifi",
                            stroke: "salmon",
                            strokeWidth: 2,
                            opacity: 0.9,
                        }
                    )
                ),
                Plot.frame(),
            ],
            color: {
                legend: false,
                domain: ["wifi", "salmon"],
                range: ["red", "darkblue"]
            },
            style: {
                fontFamily: 'sans-serif',
                fontSize: '10pt',
                background: '#eeeeee',
                fill: '#808080',
            }
        });
        this.renderer.appendChild(this.chartRef?.nativeElement, this.chart)
    }

    buildMetrics(): void {
        let maxBle: number = d3.max(this.data, d => d.ble) || 0;
        let maxWifi: number = d3.max(this.data, d => d.wifi) || 0;
        let busyIndicator: string = "Rolig";
        let i = this.data.length - 1;
        let current = this.data[i].ble + this.data[i].wifi;
        let percent: number = Math.round(current * 100 / (maxBle + maxWifi));

        this.metricBLE = maxBle;
        this.metricWifi = maxWifi;
        this.metricSampleCount = this.data.length;
        this.metricDensityPercent = percent;
    }
}
