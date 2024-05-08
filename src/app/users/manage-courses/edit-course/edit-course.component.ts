import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'app-edit-course',
  templateUrl: './edit-course.component.html',
  styleUrls: ['./edit-course.component.css']
})
export class EditCourseComponent implements OnInit {

  loading: boolean = false

  course = {
    courseId: null,
    price:null,
    course: null,
    lessonsCount: null,
    duration: null,
    studentsEnrolled: null,
    overview: null,
    content: null,
    syllabus: null
  }

  dummyIncludes = []
  removedIncludes = []

  courseImage

  courseIncludes = [
    // {
    //   includeTitle: null,
    //   includeIcon: null
    // }
  ]

  courseHighlights = [
    // {
    //   key: null,
    //   value: null
    // }
  ]

  constructor(
    private coreService: CoreService,
    private dialog: DialogService,
    private routes: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.routes.params.subscribe((result: any) => {
      this.course.courseId = result.courseId
      this.getCourseDetails(result.courseId)
    })
  }

  getCourseDetails(courseId) {
    this.coreService.getRequest(AppConstants.API_URL + "full-courses/course/" + courseId).subscribe((result: any) => {
      this.course.course = result.course
      this.course.price = result.price
      this.course.studentsEnrolled = result.studentsEnrolled
      this.course.lessonsCount = result.lessonsCount
      this.course.duration = result.duration
      this.course.overview = result.courseOverview
      this.course.content = result.courseContent
      this.course.syllabus = result.courseSyllabus

      
      let courseHighlights = JSON.parse(result.courseHighlights)
      courseHighlights.forEach(c => {
        this.courseHighlights.push({
          key: c.key,
          value: c.value
        })
      });

      
      let courseIncludes = JSON.parse(result.courseIncludes)
      courseIncludes.forEach(c => {
        this.courseIncludes.push({ includeTitle: c.includeTitle, includeIcon: null })
        this.dummyIncludes.push({ includeIconPath: c.includeIconPath })
      })

    })
  }

  setIncludeIcon(event, index) {
    this.courseIncludes[index].includeIcon = event.target.files[0];
  }

  setCourseImage(event) {
    this.courseImage = event.target.files[0]
  }

  // Add more options for adding course includes
  addMoreInclude() {
    this.courseIncludes.push({
      includeTitle: null,
      includeIcon: null
    })
  }

  // Remove Adding course includes options
  removeInclude(index) {
    this.removedIncludes.push(this.dummyIncludes[index].includeIconPath)
    this.courseIncludes.splice(index, 1)
    this.dummyIncludes.splice(index,1)
  }

  // Add more options for adding highlights 
  addMoreHighlight() {
    this.courseHighlights.push({
      key: null,
      value: null
    })
  }

  // remove  add highlight options
  removeHighlight(index) {
    this.courseHighlights.splice(index, 1)
  }

  // update Course
  updateCourse() {
    let fd = new FormData();

    for (let [key, value] of Object.entries(this.course)) {
      fd.append(key, value)
    }

    fd.append("courseHighlights", JSON.stringify(this.courseHighlights))
    fd.append("courseImage",this.courseImage)

    this.courseIncludes.forEach((c, index) => {

      fd.append("includeTitle[]", c.includeTitle)
      fd.append("includeIcon[]", c.includeIcon)

      if (c.includeIcon != null) {
        fd.append("includeIconIndex", index + "")
      }

    })

    this.removedIncludes.forEach(r => {
      fd.append("removedIncludes", r)
    })

    this.loading = true
    this.coreService.uploadRequest(AppConstants.API_URL + "full-courses/update", fd).subscribe((result: any) => {
      this.loading = false
      this.dialog.showDialog({
        content: result.message
      })
    })
  }

}
