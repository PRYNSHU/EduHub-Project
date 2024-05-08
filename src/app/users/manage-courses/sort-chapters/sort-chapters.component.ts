import { Component, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-sort-chapters',
  templateUrl: './sort-chapters.component.html',
  styleUrls: ['./sort-chapters.component.css']
})
export class SortChaptersComponent implements OnInit {
  loading: boolean = true
  courses = []
  courseId = null
  masterSubjects = []
  subjects = []
  subjectId = null
  chapters = []

  noDataMessage = "Please choose Subject and Search"

  constructor(
    private coreService: CoreService,
    private dialog: DialogService
  ) { }

  ngOnInit(): void {
    this.getCourses()
    this.getSubjects()
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.chapters, event.previousIndex, event.currentIndex);
  }

  getCourses() {
    this.coreService.getRequest(AppConstants.API_URL + "courses").subscribe((courses: any) => {
      this.courses = courses
      this.loading = false
    })
  }

  getSubjects() {
    this.coreService.getRequest(AppConstants.API_URL + "full-courses/subjects").subscribe((subjects: any) => {
      this.masterSubjects = subjects
      this.loading = false
    })
  }

  setSubjects() {
    this.subjects = this.masterSubjects.filter(ms => ms.courseId == this.courseId)
  }

  getChapters() {
    const url = AppConstants.API_URL + "full-courses/subject/" + this.subjectId + "/chapters"
    this.coreService.getRequest(url).subscribe((chapters: any) => {
      this.chapters = chapters
      this.loading = false
    })
  }

  submit() {
    this.loading = true
    const url = AppConstants.API_URL + "full-courses/sort-chapters"
    this.coreService.putRequest(url, { chapters: this.chapters }).subscribe((data: any) => {
      this.loading = false
      this.dialog.showDialog({ content: data.message })
    })
  }

}
