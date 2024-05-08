import { Component, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DateTimeFormatService } from 'src/app/service/DateTimeFormatService';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'candidate-dashboard',
  templateUrl: './candidate-dashboard.component.html',
  styleUrls: ['../candidate-common.css', './candidate-dashboard.component.css']
})
export class CandidateDashboardComponent implements OnInit {

  loading: boolean = true

  // Overall Statistics Chart Data
  data = {
    physics: 90,
    chemistry: 88,
    mathematics: 86,
    biology: 84,
    mat: 82,
    socialStudies: 80
  }


  subjects = []
  WEBSITE_URL = AppConstants.WEBSITE_URL
  constructor(
    private coreService: CoreService,
  ) { }

  ngOnInit(): void {
    this.getSubjectsList()
    this.getStatisticsChartData()
  }

  getSubjectsList() {
    this.coreService.getRequest(AppConstants.API_URL + "candidate/course-subjects").subscribe((result: any) => {
      this.subjects = result
      this.loading = false
    })
  }

  getStatisticsChartData() {
    this.loading = true;
    const url = AppConstants.API_URL + "full-courses/dashboard-statistics-chart"
    this.coreService.getRequest(url).subscribe((data: any) => {
      this.data = data
    })
  }

}