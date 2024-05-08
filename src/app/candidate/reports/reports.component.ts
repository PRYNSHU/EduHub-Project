import { Component, OnInit } from '@angular/core';
import { CoreService } from 'src/app/service/core.service';
import { AppConstants } from 'src/app/AppConstants';
import { Router } from '@angular/router';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['../candidate-common.css', './reports.component.css']
})
export class ReportsComponent implements OnInit {
  completedTests = []
  offlineTests = []

  onlineLoading = true
  details = {
    pageName: "Test Reports",
    showSearch: false
  }

  constructor(
    private coreService: CoreService,
    private router: Router,
    private dialog: DialogService
  ) { }

  ngOnInit(): void {
    this.getCompletedTests()
  }

  getCompletedTests() {
    this.completedTests = []
    this.coreService.getRequest(AppConstants.API_URL + "candidate/completed-tests").subscribe((data: any) => {
      this.completedTests = data
      this.onlineLoading = false
    })
  }

  // View Reports If it is allowed as per time etc  
  viewReports(test) {
    let endDateTime = test.publish_end_datetime.replace(/-/ig, " ");
    let isTimePassed = new Date(test.nowtime) > new Date(endDateTime)

    if (test.settings.show_reports &&
      (test.settings.show_reports_condition == 0 ||
        (test.settings.show_reports_condition == 1 && isTimePassed))
    ) {
      this.router.navigate(["/candidate/reports/" + test.test_id + "/" + test.attempt_no]);
    } else {
      this.dialog.showDialog({ content: "Reports will be shown after " + test.publish_end_datetime })
    }

  }

  isAdminAvailbale() {
    return localStorage.getItem("username") != null
  }

}
