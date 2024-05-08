import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CommunicationService } from 'src/app/service/communication.service';
import { CoreService } from 'src/app/service/core.service';

@Component({
  selector: 'candidate-header',
  templateUrl: './candidate-header.component.html',
  styleUrls: ['./candidate-header.component.css', '../candidate-common.css'],
})
export class CandidateHeaderComponent implements OnInit {

  profileMenu = 0;
  candidate_name;
  candidate_image;

  type = "active"

  @Input() links
  @Input() details
  @Input() maximize

  constructor(private coreService: CoreService, private comm: CommunicationService) { }

  ngOnInit(): void {
    this.getCandidateData()

    this.maximize = sessionStorage.getItem("minimized") == "true" ? true : false

    this.comm.header.subscribe((minimized: boolean) => {
      this.maximize = minimized
    })
  }

  toggleSidebar() {
    document.getElementsByClassName("sidebar")[0].classList.toggle("show-sidebar");
  }

  callBackFunction(link) {

    if (link.callBack != undefined) {
      link.callBack()
    }

  }

  hideMenu(menu: any) {
    menu.classList.remove('show-reports-menu')
  }


  getCandidateData() {
    this.coreService.getRequest(AppConstants.API_URL + "candidate").subscribe((data: any) => {
      this.candidate_name = data.name
      this.candidate_image = !data.image ? "assets/images/" + data.gender + ".png" :
        AppConstants.WEBSITE_URL + data.image
    })
  }

  isAdminAvailbale() {
    return localStorage.getItem("userId") != null
  }

}
