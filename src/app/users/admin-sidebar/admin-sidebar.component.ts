import { Component, HostListener, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppConstants } from 'src/app/AppConstants';
import { CommunicationService } from 'src/app/service/communication.service';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';
import { ContactInquiriesService } from '../contact-inquiries/contact-inquiries.service';
import { Permissions, permissionsObject } from '../user.modal';
import { UsersService } from '../users.service';

@Component({
  selector: 'admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.css']
})

export class AdminSidebarComponent implements OnInit {
  activeLink = ""
  minimized: boolean = false
  opened
  permissions: Permissions = permissionsObject

  isMobile = innerWidth <= 920

  sessionId
  sessionYears = []

  contactInquiriesCount:number
  leavesCount:number

  constructor(
    private comm: CommunicationService,
    private router: Router,
    private coreService: CoreService,
    private userService: UsersService,
    private dialog: DialogService,
    private contactService:ContactInquiriesService,
  ) {
    this.activeLink = this.router.url
  }

  async ngOnInit() {
    
    if (!this.isMobile) {
      this.minimized = sessionStorage.getItem("minimized") == "true" ? true : false
    }

    this.permissions = await this.userService.getUserPermissions()
    this.comm.sidebarToggle.subscribe(s => this.minimizeSidebar())
    
    if (this.isMobile){
      this.addCloseEvent()
    }

    this.getUserSessionId()
    this.getSessionYears()
    this.getCountsOfSidebarItems()
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.isMobile = event.target.innerWidth <= 920
    if (!this.isMobile) {
      this.removeCloseEvent()
      this.minimized = true
      this.minimizeSidebar()
    }
  }

  // get leaves and contact Inquiry count to show in sidebar link badge
  getCountsOfSidebarItems(){
    this.contactService.getUnSeenContactInquiriesCount().subscribe((data:any)=>{
      this.contactInquiriesCount = data.count
    })
  }

  // if window is greator than 900 then remove the close event so sidebar should not hide
  removeCloseEvent() {
    var eles = document.querySelectorAll("a[routerLink]")
    eles.forEach(el => el.removeEventListener("click", this.minimizeSidebar.bind(this)))
  }

  // Add closed event on all links so that on mobile device on clicking the link sidebar should hide  
  addCloseEvent() {
    var eles = document.querySelectorAll("a[routerLink]")
    eles.forEach(el => el.addEventListener("click", this.minimizeSidebar.bind(this)))
  }

  minimizeSidebar() {
    this.minimized = !this.minimized
    sessionStorage.setItem("minimized", this.minimized + "")
    //document.body.style.paddingLeft = !this.minimized?"250px":"50px" 

    if (this.minimized) {
      document.body.classList.add("minimized")
      document.body.classList.remove("maximized")
    }
    else {
      document.body.classList.add("maximized")
      document.body.classList.remove("minimized")
    }

    this.comm.header.next(this.minimized)
  }


  isTestPlatformAllowed() {
    return this.permissions.see_questions || this.permissions.see_tests || this.permissions.see_subjects
  }

  getUserSessionId() {
    this.coreService.getRequest(AppConstants.API_URL + "users/session").subscribe((data: any) => {
      this.sessionId = data.sessionId
    })
  }

  getSessionYears() {
    this.coreService.getRequest(AppConstants.API_URL + "utilities/session-years").subscribe((data: any) => {
      this.sessionYears = data
    })
  }

  changeSession() {
    this.coreService.putRequest(AppConstants.API_URL + "users/session", { sessionId: this.sessionId }).subscribe((result: any) => {
      //this.dialog.showDialog({ content: result.message })
    })
  }

}
