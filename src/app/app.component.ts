import { Component } from '@angular/core';
import { LocationStrategy } from '@angular/common';
import { NavigationService } from './service/navigation.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(private location: LocationStrategy, private navigationService: NavigationService, private router: Router) {
    this.location.onPopState(() => {
      this.navigationService.setBackClicked(true);
      return false;
    })
  }

  skipBodyClass(): boolean {
    let skippedComponents = ["test-instructions-","advance-test-instructions", "test-pagse", "end-test","show-instructions","preview-test","fees-receipts","sign-up","reset-password"]
    for (let i = 0; i < skippedComponents.length; i++) {
      if (this.router.url.includes(skippedComponents[i])) {
        return true
      }
    }
    return false
  }

  onActivate(ref: any) {

    if (this.skipBodyClass()) {
      return
    }

    window.scroll({top:0,left:0,behavior:'smooth'})

    let minimized = sessionStorage.getItem("minimized") == "true" ? true : false
    if (minimized) {
      document.body.classList.add("minimized")
      document.body.classList.remove("maximized")
    }
    else {
      document.body.classList.add("maximized")
      document.body.classList.remove("minimized")
    }
  }

}
