import { Component, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'app-add-course',
  templateUrl: './add-course.component.html',
  styleUrls: ['./add-course.component.css']
})
export class AddCourseComponent implements OnInit {

  loading: boolean = false
  course = {
    title: null,
    price: null,
    lessonsCount: null,
    duration: null,
    studentsEnrolled: null,
    overview: null,
    content: null,
    syllabus: null
  }

  courseImage

  courseIncludes = [
    {
      includeTitle: null,
      includeIcon: null
    }
  ]

  courseHighlights = [
    {
      key: null,
      value: null
    }
  ]

  constructor(
    private coreService: CoreService,
    private dialog: DialogService
  ) { }

  ngOnInit(): void {
  }

  setIncludeIcon(event, index) {
    this.courseIncludes[index].includeIcon = event.target.files[0];
  }

  setCourseImage(event) {
    this.courseImage = event.target.files[0]
  }

  isIncludeNull() {
    return this.courseIncludes.find(c => c.includeIcon == null) != undefined
  }

  // Add More Includes option
  addMoreInclude() {
    this.courseIncludes.push({
      includeTitle: null,
      includeIcon: null
    })
  }

  // Remove Add Includes option
  removeInclude(index) {
    this.courseIncludes.splice(index, 1)
  }


  // Add More Highlights option
  addMoreHighlight() {
    this.courseHighlights.push({
      key: null,
      value: null
    })
  }

  // Remove more highlights option
  removeHighlight(index) {
    this.courseHighlights.splice(index, 1)
  }

  addCourse() {

    // We use FormData because we have to submit image file also 

    let fd = new FormData();

    for (let [key, value] of Object.entries(this.course)) {
      fd.append(key, value)
    }

    fd.append("courseHighlights", JSON.stringify(this.courseHighlights));
    fd.append("courseImage", this.courseImage)

    this.courseIncludes.forEach(c => {
      if (c.includeTitle && c.includeTitle.trim() && c.includeIcon) {
        fd.append("includeTitle[]", c.includeTitle)
        fd.append("includeIcon[]", c.includeIcon)
      }
    })

    this.loading = true
    this.coreService.uploadRequest(AppConstants.API_URL + "full-courses", fd).subscribe((result: any) => {
      this.loading = false
      this.dialog.showDialog({
        content: result.message
      })
    })
  }

}
