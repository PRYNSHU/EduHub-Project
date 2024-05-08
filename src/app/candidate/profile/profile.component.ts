import { Component, OnInit } from '@angular/core';
import { CoreService } from 'src/app/service/core.service';
import { AppConstants } from 'src/app/AppConstants';
import { Router } from '@angular/router';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['../candidate-common.css', './profile.component.css']
})
export class ProfileComponent implements OnInit {

  profileMenu = 0;
  ActiveType = "general";
  candidate_image;
  candidate_name;

  profile = {
    name: null,
    email: null,
    phone: null,
    group: null
  }

  type = {
    type: "profile"
  }

  links = [
    {
      name: "Profile",
      key: "profile",
      type: this.type
    }
  ]

  details = {
    pageName: "Profile",
    showSearch: false
  }

  sessions = []
  sessionId

  constructor(private coreService: CoreService, private dialog: DialogService) { }

  ngOnInit(): void {
    this.getCandidateData()
    this.getCandidateSessions()
  }

  getCandidateSessions() {
    this.coreService.getRequest(AppConstants.API_URL + "candidate/sessions").subscribe((data: any) => {
      this.sessions = data
    })
  }

  toggleSidebar() {
    document.getElementsByClassName("sidebar")[0].classList.toggle("show-sidebar");
  }

  getCandidateData() {
    this.coreService.getRequest(AppConstants.API_URL + "candidate").subscribe((data: any) => {
      this.candidate_name = data.name
      this.candidate_image = !data.image ? "assets/images/" + data.gender + ".png" :
        AppConstants.WEBSITE_URL + data.image
      this.profile.name = data.name
      this.profile.email = data.email
      this.profile.phone = data.phone
      this.profile.group = data.course += " " + data.batch
      this.sessionId = data.sessionId
    })
  }

  changeSession() {
    this.coreService.putRequest(AppConstants.API_URL + "candidate/session", { sessionId: this.sessionId }).subscribe((result: any) => {
      this.dialog.showDialog({ content: result.message })
    })
  }

}
