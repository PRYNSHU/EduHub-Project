import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppConstants } from '../AppConstants';
import { CoreService } from '../service/core.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent implements OnInit {

  constructor(private routes: ActivatedRoute, private coreService: CoreService, private router: Router) {

    this.routes.params.subscribe((role: any) => {
      localStorage.clear()

      let redirectTo = ""

      if (role.role == "users") {
        redirectTo = "/users-login"
      } else {
        redirectTo = "/"
      }

      this.router.navigate([redirectTo])

    })

  }

  ngOnInit(): void {
  }

}
