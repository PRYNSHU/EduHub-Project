import { Component, OnInit } from '@angular/core';
import { CoreService } from '../service/core.service';
import { AppConstants } from '../AppConstants';
import { Router } from '@angular/router';
import { DialogService } from '../service/dialog.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loading: boolean = false
  showmodal = false
  msg: String
  options = {}

  loginForm = {
    username: '',
    password: ''
  }

  constructor(private coreService: CoreService, private router: Router, private dialog: DialogService) { }

  async ngOnInit() {

    // if user is logged in then navigate to dashboard based on role
    if (await this.isLoggedIn()) {

      let role = localStorage.getItem("userRole")
      if (role != "Question Tagger") {
        this.router.navigate(["/users/dashboard"])
      }
    }

    // Remove padding classes from body tag
    document.body.classList.remove("maximized")
    document.body.classList.remove("minimized")
  }

  // Is user is already logged in
  async isLoggedIn() {
    const isValidToken = await this.isTokenValid()
    return localStorage.getItem("userId") != null && isValidToken
  }

  // Is token is valid on server side
  isTokenValid() {
    return new Promise(resolve => {
      this.coreService.getRequest(AppConstants.API_URL + "verify-token/admin").subscribe((data: any) => {
        resolve(data.status)
      })
    })
  }

  onSubmitLogin() {
    this.loading = true;
    this.coreService.postRequest(AppConstants.API_URL + "login", this.loginForm).subscribe((data: any) => {
      this.loading = false
      localStorage.clear()

      // On successful login save token etc and go to dashboard based on role  
      if (data.success) {
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("token", data.token);
        localStorage.setItem("userRole", data.role);

        if (data.role != 'Question Tagger') {
          this.router.navigate(["/users/dashboard/"])
        }

      } else {
        this.dialog.showDialog({ content: data.message })
      }

    })
  }
}
