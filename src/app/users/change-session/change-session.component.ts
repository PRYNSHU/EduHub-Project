import { Component, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'change-session',
  templateUrl: './change-session.component.html',
  styleUrls: ['./change-session.component.css']
})
export class ChangeSessionComponent implements OnInit {

  loading: boolean = true
  sessionYears = []
  sessionId

  constructor(private coreService: CoreService, private dialog: DialogService) { }

  ngOnInit(): void {
    this.getUserSessionId()
    this.getSessionYears()
  }

  getUserSessionId() {
    this.coreService.getRequest(AppConstants.API_URL + "users/session").subscribe((data: any) => {
      this.sessionId = data.sessionId
    })
  }

  getSessionYears() {
    this.loading = true
    this.coreService.getRequest(AppConstants.API_URL + "utilities/session-years").subscribe((data: any) => {
      this.sessionYears = data
      this.loading = false
    })
  }

  changeSession() {
    this.loading = true
    this.coreService.putRequest(AppConstants.API_URL + "users/session", { sessionId: this.sessionId }).subscribe((result: any) => {
      this.dialog.showDialog({ content: result.message })
      this.loading = false
    })
  }

}
