import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';

@Component({
  selector: 'app-course-page',
  templateUrl: './course-page.component.html',
  styleUrls: ['./course-page.component.css']
})
export class CoursePageComponent implements OnInit {

  activePart = {
    active: "Overview"
  }

  course
  constructor(
    private route: ActivatedRoute,
    private coreService: CoreService
  ) {
    this.route.params.subscribe((data: any) => {
      this.getCourseById(data.courseId)
    })
  }

  ngOnInit(): void {

  }

  getCourseById(courseId) {
    this.coreService.getRequest(AppConstants.API_URL + "full-courses/course/" + courseId).subscribe((result: any) => {
      this.course = result
      this.course.courseIncludes = JSON.parse(this.course.courseIncludes)
      this.course.courseHighlights = JSON.parse(this.course.courseHighlights)
    })
  }
}
