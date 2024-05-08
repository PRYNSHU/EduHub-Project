import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CoreService } from 'src/app/service/core.service';
import { AppConstants } from 'src/app/AppConstants';
import { DateTimeFormatService } from 'src/app/service/DateTimeFormatService';

@Component({
  selector: 'compare-yourself',
  templateUrl: './compare-yourself.component.html',
  styleUrls: [
    '../../candidate-common.css',
    '../detailed-report.component.css',
    './compare-yourself.component.css'
  ]
})
export class CompareYourselfComponent implements OnInit {
  loading = true
  yourDetails
  top10Data = []

  @Input() testInfo: {
    id: null,
    attempt_no: 0
  }

  constructor(private coreService: CoreService, public timeService: DateTimeFormatService) {

  }

  ngOnInit(): void {
    this.getCompareDetails(this.testInfo.id, this.testInfo.attempt_no)
  }

  getCompareDetails(testId, attempt_no) {
    this.coreService.getRequest(AppConstants.API_URL + "reports/compare-report/" + testId + "/" + attempt_no).
      subscribe((data: any) => {
        this.yourDetails = data.your
        this.top10Data = data.top10Data
        this.loading = false
      })
  }
}
