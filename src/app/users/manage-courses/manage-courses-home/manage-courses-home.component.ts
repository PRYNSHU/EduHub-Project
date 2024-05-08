import { Component, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'app-manage-courses-home',
  templateUrl: './manage-courses-home.component.html',
  styleUrls: ['./manage-courses-home.component.css']
})
export class ManageCoursesHomeComponent implements OnInit {

  courses = []
  loading: boolean = true
  WEBSITE_URL = AppConstants.WEBSITE_URL
  constructor(
    private coreService: CoreService,
    private dialog: DialogService
  ) {

  }

  ngOnInit(): void {
    this.getCourses()
  }

  getCourses() {
    this.coreService.getRequest(AppConstants.API_URL + "full-courses").subscribe((result: any) => {
      this.courses = result
      this.loading = false
    })
  }

  deleteCourse(course, index) {
    this.dialog.showDialog({
      content: `Are you sure to delete the Course "${course.course}"?`,
      callBack: () => {
        this.loading = true
        this.coreService.deleteRequest(AppConstants.API_URL + "full-courses/" + course.courseId).subscribe((result: any) => {
          this.loading = false
          this.courses.splice(index, 1)
        })
      }
    })
  }

}
