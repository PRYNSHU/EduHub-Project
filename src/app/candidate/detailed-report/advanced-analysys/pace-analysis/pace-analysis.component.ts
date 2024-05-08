import { Component, Input, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';

@Component({
  selector: 'pace-analysis',
  templateUrl: './pace-analysis.component.html',
  styleUrls: ['./pace-analysis.component.css']
})
export class PaceAnalysisComponent implements OnInit {

  @Input() testInfo: {
    id: null,
    attempt_no: 0
  }

  paceAnalysis = {
    correctTooFast:0,
    correctTooSlow:0,
    correctPerfect:0,
    wrongTooFast:0,
    wrongTooSlow:0,
    wrongPerfect:0,
    notVisited:0,
    notAnswered:0,
    markedForReview:0
  }

  constructor(private coreService:CoreService) { }

  ngOnInit(): void {
    this.getPaceAnalysis(this.testInfo.id,this.testInfo.attempt_no)
  }

  getPaceAnalysis(testId,attemptNo){
    const url = AppConstants.API_URL + "reports/pace-analysis/"+testId+"/"+attemptNo
    this.coreService.getRequest(url).subscribe((data:any)=>{
      this.paceAnalysis = data
    })
  }

}
