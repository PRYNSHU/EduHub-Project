import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';

@Component({
  selector: 'time-statistics',
  templateUrl: './time-statistics.component.html',
  styleUrls: ['./time-statistics.component.css'],
})
export class TimeStatisticsComponent implements OnInit {

  @Input() testInfo: {
    id: null,
    attempt_no: 0
  }

  data = {
    productiveTime: "",
    nonProductiveTime: "",
    unUsedTime: ""
  }

  constructor(private coreService: CoreService) { }

  ngOnInit(): void {
    this.getTimeStatistics(this.testInfo.id, this.testInfo.attempt_no)
  }

  getTimeStatistics(testId, attemptNo) {
    const url = AppConstants.API_URL + "reports/time-statistics/" + testId + "/" + attemptNo
    this.coreService.getRequest(url).subscribe((data: any) => {
      this.data.productiveTime = this.getTimeFormatted(data.productiveTime)
      this.data.nonProductiveTime = this.getTimeFormatted(data.nonProductiveTime)
      this.data.unUsedTime = this.getTimeFormatted(data.unUsedTime)
    })
  }

  // Get Time in MM:SS format from seconds for eg. 310 will return 5:10
  getTimeFormatted(totalSeconds) {
    let minutes = Math.floor((totalSeconds % (60 * 60)) / (60))
    let seconds = Math.floor((totalSeconds % (60)))
    return `${minutes}:${seconds}`
  }

}
