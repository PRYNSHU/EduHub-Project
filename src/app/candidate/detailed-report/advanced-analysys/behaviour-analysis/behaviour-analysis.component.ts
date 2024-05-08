import { Component, Input, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';

@Component({
  selector: 'behaviour-analysis',
  templateUrl: './behaviour-analysis.component.html',
  styleUrls: ['./behaviour-analysis.component.css']
})
export class BehaviourAnalysisComponent implements OnInit {

  @Input() testInfo: {
    id: null,
    attempt_no: 0
  }

  analysis = {
    agility: 0,
    precision:0,
    determind:0,
    preseverance:0
  }

  constructor(private coreService: CoreService) { }

  ngOnInit(): void {
    this.getData(this.testInfo.id, this.testInfo.attempt_no)
  }

  // Get Behaviour Data
  getData(testId, attemptNo) {
    const url = AppConstants.API_URL + "reports/behaviour-analysis/" + testId + "/" + attemptNo
    this.coreService.getRequest(url).subscribe((result: any) => {
      this.analysis = result
    })
  }

}
