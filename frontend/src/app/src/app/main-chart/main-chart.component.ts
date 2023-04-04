import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { PaxServiceService, V1Data, V1ListDataResponse } from 'src/app/api/pax';
import 'chartjs-adapter-date-fns';
import { Subscription } from 'rxjs';
import { interval } from 'rxjs';

Chart.register(...registerables);

interface SampleSeries {
    x: number; // Timestamp
    y: number; // Value
}


@Component({
    selector: 'app-main-chart',
    templateUrl: './main-chart.component.html',
    styleUrls: ['./main-chart.component.css']
})
export class MainChartComponent implements OnInit, AfterViewInit {
    @ViewChild("chart") chartRef?: ElementRef;

    dataPoints: V1Data[] = [];
    errorMessage: string = "";
    lastPoll: Date = new Date();
    chart?: Chart<any>;
    visibleInterval: number = 24;

    hasError(): boolean {
        return this.errorMessage != "";
    }

    constructor(
        protected paxService: PaxServiceService,
    ) {
    }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
        this.loadData();
    }

    showInterval(hours: number): void {
        this.visibleInterval = hours;
        this.loadData();
    }

    loadData(): void {
        let dayAgo: string = "" + (new Date().getTime() - (this.visibleInterval * 3600 * 1000));
        let now: string = "" + (new Date().getTime());
        this.paxService.paxServiceListData(dayAgo, now, 19000000).subscribe({
            next: (value: V1ListDataResponse) => {
                if (value.data) {
                    this.dataPoints = value.data;
                }
            },
            error: (e: HttpErrorResponse) => {
                this.errorMessage = e.message;
            },
            complete: () => {
                this.lastPoll = new Date();
                this.createChart();
            },
        });
    }

    createChart(): void {
        let bleSamples = this.dataPoints.map(v => {
            return {
                label: (v.deviceId || "") + " (BLE)",
                data: v.samples?.map(sample => {
                    return {
                        x: new Date(parseInt(sample.timestamp!)),
                        y: sample.bluetoothCount,
                    }
                })
            }
        });

        let wifiSamples = this.dataPoints.map(v => {
            return {
                label: (v.deviceId || "") + " (WiFi)",
                data: v.samples?.map(sample => {
                    return {
                        x: new Date(parseInt(sample.timestamp!)),
                        y: sample.wifiCount,
                    }
                })
            }
        });
        if (!this.chart) {
            this.chart = new Chart(this.chartRef!.nativeElement, {
                type: 'line',
                data: {
                    datasets: [],
                },
                options: {
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                displayFormats: {
                                    minute: 'HH:mm'
                                },
                                tooltipFormat: 'HH:mm'
                            }
                        },

                    },
                    elements: {
                        point: {
                            pointStyle: false,
                        }
                    }
                },
            });
        }
        this.chart.config.data.datasets = bleSamples.concat(wifiSamples);
        this.chart.update();
    }
}
