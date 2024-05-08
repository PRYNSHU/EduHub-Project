import { Component, OnInit, Input } from '@angular/core';
import { CoreService } from 'src/app/service/core.service';
import { AppConstants } from 'src/app/AppConstants';
import { ActivatedRoute } from '@angular/router';
import { DateTimeFormatService } from 'src/app/service/DateTimeFormatService';

@Component({
  selector: 'subject-report',
  templateUrl: './subject-report.component.html',
  styleUrls: ['../../candidate-common.css', '../detailed-report.component.css', './subject-report.component.css']
})

export class SubjectReportComponent implements OnInit {
  showDetails = false
  loading = true

  options = {
    pieHole: 0,
    legend: {
      position: 'bottom'
    },
    //        Green       Blue        Red
    colors: ['#28a745', '#1a73cc', '#f44336'],
    sliceVisibilityThreshold: 0
  }

  tableData = []
  reportsData = []
  ActiveReports = []
  ActiveReportsSubject
  @Input() testInfo: {
    id: null,
    attempt_no: 0
  };

  constructor(
    private coreService: CoreService,
    public timeService: DateTimeFormatService
  ) { }

  ngOnInit(): void {
    this.getSubjectReport(this.testInfo.id, this.testInfo.attempt_no)
  }

  getSubjectReport(testId, attempt_no) {
    this.coreService.getRequest(
      AppConstants.API_URL + "reports/subject-report/" + testId + "/" + attempt_no
    ).subscribe((data: any) => {
      this.tableData = data.subject_wise_data
      this.reportsData = data.chapter_wise_data
      this.loading = false
    });
  }

  setActiveReports(subject) {
    this.ActiveReportsSubject = subject
    this.ActiveReports = this.reportsData.filter(f => f.subject == subject)
    this.showDetails = true
  }

  fixedDecimal(number) {
    return parseFloat(number).toFixed(2)
  }

}
