import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { PaxServiceService, V1Data, V1ListDataResponse } from 'src/app/api/pax';

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
            },
        });
    }
}
