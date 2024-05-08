import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import {  Router } from '@angular/router';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';
import { ManageCoursesService } from '../manage-courses.service';

@Component({
  selector: 'app-add-chapter',
  templateUrl: './add-chapter.component.html',
  styleUrls: ['./add-chapter.component.css']
})
export class AddChapterComponent implements OnInit {
  @ViewChild("form") chapterForm: NgForm

  loading: boolean = true
  subject
  chapters = []

  constructor(
    private mc: ManageCoursesService,
    private coreService: CoreService,
    private dialog: DialogService,
    private router: Router,
  ) { }

  ngOnInit() {
    this.subject = this.mc.getSubject()
    if (!this.subject) {
      return this.router.navigate(["/users/manage-courses/add-subjects"])
    }
    this.getChapters()
  }

  getChapters() {
    let url = AppConstants.API_URL + "full-courses/subject/" + this.subject.subjectId + "/chapters"
    this.coreService.getRequest(url).subscribe((result: any) => {
      this.loading = false
      this.chapters = result
    })
  }

  goToAddTopic(chapter) {
    this.mc.setChapter(chapter);
    this.router.navigate(["/users/manage-courses/add-topic"])
  }

  editChapter(chapter) {
    this.mc.setChapter(chapter)
    this.router.navigate(["/users/manage-courses/edit-chapter/" + chapter.chapterId])
  }

  deleteChapter(chapter, index) {
    this.dialog.showDialog({
      content: `Are you sure to delete the chapter "${chapter.chapter}"?`,
      callBack: () => {
        this.loading = true
        this.coreService.deleteRequest(AppConstants.API_URL + "full-courses/chapter/" + chapter.chapterId).subscribe((result: any) => {
          this.loading = false
          if (result.success) {
            this.chapters.splice(index, 1)
          }
        })
      }
    })
  }

  submit(data) {
    this.loading = true
    let url = AppConstants.API_URL + "full-courses/subject/" + this.subject.subjectId + "/chapter"
    this.coreService.postRequest(url, data).subscribe((data: any) => {
      this.loading = false

      this.dialog.showDialog({
        content: data.message
      })

      if (data.success) {
        this.chapterForm.resetForm()
      }

      this.getChapters()

    })

  }
}
