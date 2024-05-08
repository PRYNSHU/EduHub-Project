import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

import { AppConstants } from '../../AppConstants';
import { CoreService } from '../../service/core.service';
import { DialogService } from '../../service/dialog.service';

@Component({
  selector: 'app-candidate-signup',
  templateUrl: './candidate-signup.component.html',
  styleUrls: ['./candidate-signup.component.css']
})

export class CandidateSignupComponent implements OnInit {



  loading: boolean = false

  showOTPForm = false
  showRegForm = true

  otp1
  otp2
  otp3
  otp4

  boards = []
  indianStates = []

  form = {
    name: null,
    mobile: null,
    address: null,
    course: null,
    board: null,
    batch: null,
    state: null,
    otp: ""
  }

  termsAndConditions

  courses = [
    {
      course: "8th",
      batches: ["School", "School + Olympiads"]
    },
    {
      course: "9th",
      batches: ["School", "School + Olympiads/NTSE"]
    },
    {
      course: "10th",
      batches: ["School", "School + Olympiads/NTSE"]
    },
    {
      course: "11th",
      batches: ["Board", "NEET", "JEE"]
    },
    {
      course: "12th",
      batches: ["Board", "NEET", "JEE"]
    }
  ]

  batches = []

  constructor(
    private coreService: CoreService,
    private dialog: DialogService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getBoards()
    this.getIndianStates()
  }

  // On choosing course set its batches in dropdown
  setBatches() {
    let course = this.courses.find(c => c.course == this.form.course)
    if (course) this.batches = course.batches
  }

  getBoards() {
    this.coreService.getRequest(AppConstants.API_URL + "new-registration/boards").subscribe((result: any) => {
      this.boards = result
    })
  }

  getIndianStates() {
    this.coreService.getRequest(AppConstants.API_URL + "new-registration/indian-states").subscribe((result: any) => {
      this.indianStates = result
    })
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

  // Is OTP synatax is valid in client side
  isOTPValid() {
    let otp = `${this.otp1}${this.otp2}${this.otp3}${this.otp4}`;
    let patt = new RegExp("^[0-9]{4}$")
    return patt.test(otp)
  }

  // if mobile does exits in out db then send OTP 
  verifyMobileAndSendOTP() {
    this.loading = true;
    this.coreService.getRequest(AppConstants.API_URL + "new-registration/verify-mobile-and-send-otp/" + this.form.mobile).subscribe((data: any) => {
      this.loading = false

      if (data.success) {
        this.showOTPForm = true
        this.showRegForm = false
        this.setTimer()
        return
      }

      this.dialog.showDialog({ content: data.message })
    })
  }

  // IF OTP is valid then save the stident and navigate to dashboard 
  verifyOTPAndRegister() {
    let otp = `${this.otp1}${this.otp2}${this.otp3}${this.otp4}`;
    this.loading = true
    this.form.otp = otp
    this.coreService.postRequest(AppConstants.API_URL + "new-registration/verify-otp-and-register/", this.form).subscribe((data: any) => {

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