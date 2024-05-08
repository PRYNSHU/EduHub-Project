import { Component, Input, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'course-includes',
  templateUrl: './course-includes.component.html',
  styleUrls: ['./course-includes.component.css']
})
export class CourseIncludesComponent implements OnInit {

  loading: boolean

  @Input() course

  constructor(private coreService: CoreService, private dialog: DialogService) { }

  ngOnInit(): void {
  }

  joinCourse() {
    this.loading = true;
    this.coreService.postRequest(AppConstants.API_URL + "full-courses/join-course", { courseId: this.course.courseId }).subscribe((result: any) => {
      this.loading = false;
      this.dialog.showDialog({ content: result.message })
    })
  }

}
