import { Component, OnInit, Input } from '@angular/core';
import { CoreService } from 'src/app/service/core.service';
import { AppConstants } from 'src/app/AppConstants';

@Component({
  selector: 'solution-report',
  templateUrl: './solution-report.component.html',
  styleUrls: ['./solution-report.component.css']
})
export class SolutionReportComponent implements OnInit {

  loading: boolean = true

  // Question Types with IDs in Database
  SINGLE_RESPONSE_TYPE = 1
  MULTI_RESPONSE_TYPE = 2
  TRUE_FALSE_TYPE = 3
  INTEGER_TYPE = 4
  MATCH_MATRIX_TYPE = 5
  ASSERTION_REASON = 6
  CASE_STUDY = 7

  questions = []

  @Input() testInfo: {
    id: null,
    attempt_no: 0
  }

  constructor(private coreService: CoreService) { }

  ngOnInit(): void {
    this.getSolutionReport(this.testInfo.id, this.testInfo.attempt_no);
  }

  getSolutionReport(testId, attempt_no) {
    this.coreService.getRequest(AppConstants.API_URL + "reports/solution-report/" + testId + "/" + attempt_no).
    subscribe((data: any) => {
      this.questions = data;
      this.loading = false
    })
  }

  getAlphabet(index) {
    return String.fromCharCode(index);
  }

}
