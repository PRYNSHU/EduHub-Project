import { Component, OnInit } from '@angular/core';
import { CoreService } from 'src/app/service/core.service';
import { AppConstants } from 'src/app/AppConstants';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-detailed-report',
  templateUrl: './detailed-report.component.html',
  styleUrls: ['../candidate-common.css', './detailed-report.component.css']
})
export class DetailedReportComponent implements OnInit {
  minimize = { minimized: false }
  ActiveType = "advanced-analysys";

  total_candidates;
  total_marks;
  total_questions;
  total_time;
  test_name;
  linkPath;

  testInfoForComponents: { id: 0, attempt_no: 0 }

  openLink(link) {
    this.ActiveType = link
  }

  constructor(
    private coreService: CoreService,
    private routes: ActivatedRoute,
  ) {
    this.routes.params.subscribe(data => {

      this.linkPath = '/candidate/reports/' + data.id + '/' + data.attempt_no
      this.testInfoForComponents = { id: data.id, attempt_no: data.attempt_no }
      this.getTestDetails(data.id, data.attempt_no)

      if (data.report != undefined) {
        this.ActiveType = data.report;
      }

    })
  }

  ngOnInit(): void {
    this.minimize.minimized = sessionStorage.getItem("minimized") == "true" ? true : false
  }

  getTestDetails(testId, attempt_no) {
    this.coreService.getRequest(AppConstants.API_URL + "reports/test-details/" + testId + "/" + attempt_no).subscribe((data: any) => {
      this.total_candidates = data.total_candidates;
      this.total_marks = data.total_marks;
      this.total_time = data.duration;
      this.total_questions = data.total_questions;
      this.test_name = data.name;
    })
  }
}
