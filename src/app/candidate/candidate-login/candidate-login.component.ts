import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'app-candidate-login',
  templateUrl: './candidate-login.component.html',
  styleUrls: ['../../candidate/candidate-common.css', './candidate-login.component.css']
})
export class CandidateLoginComponent implements OnInit {

  mobile

  otp1// OTP Box 1
  otp2// OTP Box 2 
  otp3// OTP Box 3
  otp4// OTP Box 4

  loading: boolean = false

  modals = {
    forgotModal: false,
    verifyEmail: false,
    otpModal: false
  }

  forms = {
    loginForm: true,
    otpForm: false
  }

  name
  email
  emailMessage = "Please verify email so you can login."

  constructor(
    private coreService: CoreService,
    private router: Router,
    private dialog: DialogService
  ) { }

  async ngOnInit() {
    document.body.classList.remove("maximized")
    document.body.classList.remove("minimized")

    if (await this.isLoggedIn()) {
      this.router.navigate(["/candidate"])
    } else {
      localStorage.clear()
    }

  }

  async isLoggedIn() {
    const isValidToken = await this.isTokenValid()
    return localStorage.getItem("id") != null && isValidToken
  }

  timer = null
  count = 0;
  setTimer() {
    this.count = 30
    this.timer = setInterval(() => {
      this.count--
      if (this.count <= 0) {
        clearInterval(this.timer)
      }
    }, 1000)
  }

  //Check If mobile number exits in our database then send  OTP SMS 
  verifyMobileAndSendOTP() {
    this.loading = true;
    this.coreService.getRequest(AppConstants.API_URL + "login/verify-mobile-and-send-otp/" + this.mobile).subscribe((data: any) => {
      this.loading = false

      if (data.success) {
        this.forms.otpForm = true
        this.forms.loginForm = false
        this.name = data.name.split(" ")[0]
        this.setTimer()
        return
      }

      this.dialog.showDialog({ content: data.message })
    })
  }

  // Is student's token is valid
  isTokenValid() {
    return new Promise((resolve) => {
      this.coreService.getRequest(AppConstants.API_URL + "verify-token/candidate").subscribe((data: any) => {
        resolve(data.status)
      })
    })
  }

  // IS OTP's Syntax is valid in client side
  isOTPValid() {
    let otp = `${this.otp1}${this.otp2}${this.otp3}${this.otp4}`;
    let patt = new RegExp("^[0-9]{4}$")
    return patt.test(otp)
  }

  // If OTP is valid in database then login and go to dashboard panel  
  verifyOTPandLogin() {
    let otp = `${this.otp1}${this.otp2}${this.otp3}${this.otp4}`;
    this.loading = true
    this.coreService.getRequest(AppConstants.API_URL + "login/verify-otp-and-login/" + this.mobile + "/" + otp).subscribe((data: any) => {

      this.loading = false

      if (data.success) {
        localStorage.clear();
        localStorage.setItem("id", data.userId);
        localStorage.setItem("token", data.token);
        this.router.navigate(["/candidate"]);
        return;
      }

      this.dialog.showDialog({ content: data.message })
    })

  }

}
