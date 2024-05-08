import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';

@Component({
  selector: 'app-offline-reports',
  templateUrl: './offline-reports.component.html',
  styleUrls: ['../../detailed-report/detailed-report.component.css', '../../detailed-report/subject-report/subject-report.component.css', './offline-reports.component.css']
})
export class OfflineReportsComponent implements OnInit {

  details = { pageName: "Offline Test Reports" }
  subjectsData = []

  options = {
    pieHole: 0,
    legend: {
      position: 'bottom'
    },
    colors: ['#28a745', '#f44336'],
    sliceVisibilityThreshold: 0
  };


  constructor(private coreService: CoreService, private routes: ActivatedRoute) {

  }

  ngOnInit(): void {
    this.routes.params.subscribe((data: any) => {
      this.getOfflineReport(data.examId)
    })
  }

  getOfflineReport(examId) {
    this.coreService.getRequest(AppConstants.API_URL + "candidate/offline-test-report/" + examId).
    subscribe((data: any) => {
      this.subjectsData = data
    })
  }


  fixedDecimal(number) {
    return parseFloat(number).toFixed(2);
  }

}
