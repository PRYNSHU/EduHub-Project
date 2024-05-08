import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { CoreService } from '../service/core.service';
import { AppConstants } from '../AppConstants'

@Injectable({
  providedIn: 'root'
})
export class CandidateGuard implements CanActivate {
  
  constructor(private router: Router, private coreService: CoreService) { }

  async canActivate() {
    //let isValidToken = await this.isTokenValid()
    if (localStorage.getItem("id") != null) {
      return true
    } else {
      this.router.navigate(["/"])
      return false
    }

  }

  isTokenValid() {
    return new Promise((resolve) => {
      const url = AppConstants.API_URL + "verify-candidate-token"
      this.coreService.getRequest(url).subscribe((data: any) => {
        resolve(data.status)
      })
    })
  }

}
