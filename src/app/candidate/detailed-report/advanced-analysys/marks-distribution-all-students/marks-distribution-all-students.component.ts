import { Component, Input, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';

@Component({
  selector: 'marks-distribution-all-students',
  templateUrl: './marks-distribution-all-students.component.html',
  styleUrls: ['./marks-distribution-all-students.component.css']
})
export class MarksDistributionAllStudentsComponent implements OnInit {

  @Input() testInfo: {
    id: null,
    attempt_no: 0
  }

  marks = {
    avgMarks: 0,
    lowestMarks: 0,
    highestMarks: 0,
    yourMarks: 0,
    totalMarks: 0
  }


  constructor(private coreService: CoreService) { }

  ngOnInit(): void {
    this.getMarks(this.testInfo.id, this.testInfo.attempt_no)
  }

  // Get Marks Distribution Data
  getMarks(testId, attemptNo) {
    const url = AppConstants.API_URL + "reports/marks-distribution-all/" + testId + "/" + attemptNo
    this.coreService.getRequest(url).subscribe((result: any) => {
      this.marks = result
    })
  }

}
