import { Component, Input, OnInit } from '@angular/core';
import { StatisticsData } from './statistics-data.modal';

@Component({
  selector: 'statistics-dashboard',
  templateUrl: './statistics-dashboard.component.html',
  styleUrls: ['./statistics-dashboard.component.css']
})
export class StatisticsDashboardComponent implements OnInit {

  @Input() statisticsData: StatisticsData[]

  constructor() { }

  ngOnInit(): void {
  }

}
