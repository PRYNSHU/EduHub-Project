import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { NavigationService } from '../service/navigation.service';

@Injectable({
  providedIn: 'root'
})
export class TestGuard implements CanActivate {

  constructor(private navigation: NavigationService, private router: Router) {

  }

  canActivate(): boolean {
    const rightPathClicked = localStorage.getItem("rightPathClicked")

    if (this.navigation.getRightPathClicked() || rightPathClicked == 'true') {
      this.navigation.setRightPathClicked(false);
      return true;
    } else {
      this.router.navigate(["/candidate"]);
    }

  }
}
