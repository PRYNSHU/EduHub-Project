import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppConstants } from 'src/app/AppConstants';
import { CommunicationService } from 'src/app/service/communication.service';
import { CoreService } from 'src/app/service/core.service';

@Component({
  selector: 'candidate-sidebar',
  templateUrl: './candidate-sidebar.component.html',
  styleUrls: ['./candidate-sidebar.component.css', '../candidate-common.css']
})
export class CandidateSidebarComponent implements OnInit {

  @Input() minimize
  candidate_name = "";
  candidate_image;
  course = ""

  activeLink = "";
  constructor(
    private router: Router,
    private comm: CommunicationService,
    private coreService: CoreService
  ) {
    this.activeLink = router.url
  }

  minimized: boolean = false

  ngOnInit(): void {
    this.minimized = sessionStorage.getItem("minimized") == "true" ? true : false
    this.getCandidateData()
  }

  minimizeSidebar() {
    this.minimized = !this.minimized
    sessionStorage.setItem("minimized", this.minimized + "")

    if (this.minimize != undefined) {
      this.minimize.minimized = this.minimized
    }

    if (this.minimized) {
      document.body.classList.add("minimized")
      document.body.classList.remove("maximized")
    } else {
      document.body.classList.add("maximized")
      document.body.classList.remove("minimized")
    }

    this.comm.header.next(this.minimized)
  }

  getCandidateData() {
    this.coreService.getRequest(AppConstants.API_URL + "candidate").subscribe((data: any) => {
      this.candidate_name = data.name
      this.course = data.course
      data.gender = data.gender ? data.gender : 'Male'
      this.candidate_image = !data.image ? "assets/images/" + data.gender + ".png" :
        AppConstants.WEBSITE_URL + data.image
    })
  }


}
