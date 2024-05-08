import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'app-login-temp',
  templateUrl: './login-temp.component.html',
  styleUrls: ['./login-temp.component.css']
})
export class LoginTempComponent implements OnInit {

  /**
   * This is temporary form for login of candidates
   * In future we will use candidate-login folder's component for login with OTP etc
   */

  loading:boolean
  
  form = {
    username:null,
    password:null
  }

  constructor(private coreService:CoreService,private dialog:DialogService,private router:Router) { }

  ngOnInit(): void {
    document.body.classList.remove("maximized")
    document.body.classList.remove("minimized")
  }

  // Login with username and password
  login(){
    this.loading = true
    let url = AppConstants.API_URL + "login/candidate-login/"+this.form.username+"/"+this.form.password
    this.coreService.getRequest(url).subscribe((data:any)=>{
      this.loading = false
      localStorage.clear()

      if (data.success) {
        localStorage.setItem("id", data.userId)
        localStorage.setItem("token", data.token)
        this.router.navigate(["/candidate"])
      }
    })
  } 

}
