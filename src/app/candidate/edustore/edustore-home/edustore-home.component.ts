import { Component, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';

@Component({
  selector: 'app-edustore-home',
  templateUrl: './edustore-home.component.html',
  styleUrls: ['./edustore-home.component.css']
})
export class EdustoreHomeComponent implements OnInit {

  courses = []

  constructor(
    private coreService: CoreService 
  ) { }

  ngOnInit(): void {
    this.getCourses()
  }

  getCourses() {
    this.coreService.getRequest(AppConstants.API_URL + "full-courses/for-eduotics").subscribe((result: any) => {
      this.courses = result
    })
  }

}
