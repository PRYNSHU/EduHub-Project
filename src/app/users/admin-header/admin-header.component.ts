import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppConstants } from 'src/app/AppConstants';
import { CommunicationService } from 'src/app/service/communication.service';
import { CoreService } from 'src/app/service/core.service';
import { permissionsObject, Permissions } from '../user.modal';

@Component({
  selector: 'admin-header',
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.css']
})
export class AdminHeaderComponent implements OnInit {

  activeLink = ""
  activeDashboard = ""
  minimized: boolean = false

  profile
  permissions: Permissions = permissionsObject

  constructor(private router: Router, private comm: CommunicationService, private coreService: CoreService) {
    this.activeLink = this.router.url;
    this.setActiveDashboard()
  }

  ngOnInit(): void {
    var eles = document.querySelectorAll("a[routerLink]");
    eles.forEach(el => {
      el.addEventListener("click", e => {
        this.hideMenu(document.getElementById('menu'));
      });
    });

    this.minimized = sessionStorage.getItem("minimized") == "true" ? true : false

    this.comm.header.subscribe((minimized: boolean) => {
      this.minimized = minimized
    })

    this.getUserDetails()
  }

  // set dashboard link for different components 
  setActiveDashboard() {

    if (this.activeLink.includes("test-platform")) {
      this.activeDashboard = "/users/test-platform"
    } else if (this.activeLink.includes("courses")) {
      this.activeDashboard = "/users/courses/dashboard"
    } else if (this.activeLink.includes("assign-work")) {
      this.activeDashboard = "/users/dashboard"
    } else {
      this.activeDashboard = "/users/dashboard"
    }
  }

  // Get User Profile 
  getUserDetails() {
    this.coreService.getRequest(AppConstants.API_URL + "users/profile").subscribe((user: any) => {
      this.profile = user
      let permissions = JSON.parse(user.permissions)
      permissions.forEach(p => {
        for (let key in p.permissions) {
          this.permissions[key] = p.permissions[key]
        }
      })
    })
  }

  isEditTest() {
    return this.activeLink.includes('/edit-test');
  }

  isReportsPage() {
    return this.activeLink.includes("/reports-by-test") || this.activeLink.includes("/tests-by-candidate");
  }


  toggleSidebar(menu) {
    this.comm.sidebarToggle.next({})
  }

  hideMenu(menu) {
    menu.style.left = '-250px';
  }

  // Go to candidate portal with dummy canndidate Id
  candidatePortal($e) {
    $e.preventDefault()
    this.coreService.getRequest(AppConstants.API_URL + "get-token-for-user-by-admin/1").subscribe((data: any) => {
      localStorage.setItem("id", "temp");
      localStorage.setItem("token", data.token);
      this.router.navigate(["/candidate"])
    })
  }
}
