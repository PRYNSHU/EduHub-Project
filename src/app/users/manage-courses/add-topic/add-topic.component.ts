import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';
import { ManageCoursesService } from '../manage-courses.service';

@Component({
  selector: 'app-add-topic',
  templateUrl: './add-topic.component.html',
  styleUrls: ['./add-topic.component.css']
})
export class AddTopicComponent implements OnInit {
  loading1: boolean = true
  loading2: boolean = true 
  loading3: boolean = true 
  
  topicImage
  chapter
  topics = []
  testTypes = []
  tests = []
  WEBSITE_URL = AppConstants.WEBSITE_URL

  modals = {
    showEditTestModal: false
  }

  activeTest

  constructor(
    private coreService: CoreService,
    private dialog: DialogService,
    private mc: ManageCoursesService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.chapter = this.mc.getChapter()

    if (!this.chapter) {
      this.router.navigate(["/users/manage-courses/add-subjects"])
    }

    this.getTopics()
    this.getTestTypes()
    this.getTests()
  }

  getTestTypes() {
    this.coreService.getRequest(AppConstants.API_URL + "full-courses/test-types").subscribe((types: any) => {
      this.testTypes = types
      this.loading1 = false
    })
  }

  getTopics() {
    this.coreService.getRequest(AppConstants.API_URL + "full-courses/chapter/" + this.chapter.chapterId + "/topics").subscribe((result: any) => {
      this.topics = result
      this.loading2 = false
    })
  }

  getTests() {
    this.coreService.getRequest(AppConstants.API_URL + "full-courses/chapter/" + this.chapter.chapterId + "/tests").subscribe((result: any) => {
      this.tests = result
      this.loading3 = false
    })
  }

  // Go to edit topic page
  editTopic(topic) {
    this.mc.setTopic(topic)
    this.router.navigate(["/users/manage-courses/edit-topic/"])
  }

  deleteTopic(topic, index) {
    this.dialog.showDialog({
      content: `Are you sure to delete the topic "${topic.topic}"?`,
      callBack: () => {
        this.loading1 = true
        this.coreService.deleteRequest(AppConstants.API_URL + "full-courses/topic/" + topic.topicId).subscribe((result: any) => {
          this.loading1 = false
          if (result.success) {
            this.topics.splice(index, 1)
          }
        })
      }
    })
  }

  setTopicImage(event) {
    this.topicImage = event.target.files[0]
  }

  // Show Edit test in popup
  editTest(test) {
    this.activeTest = test
    this.modals.showEditTestModal = true
  }

  deleteTest(test, index) {
    this.dialog.showDialog({
      content: `Are you sure to delete the Test "${test.testName}"?`,
      callBack: () => {
        this.loading1 = true
        this.coreService.deleteRequest(AppConstants.API_URL + "full-courses/test/" + test.testId).subscribe((result: any) => {
          this.loading1 = false
          if (result.success) {
            this.tests.splice(index, 1)
          }
        })
      }
    })
  }

  submit(form: NgForm) {
    let fd = new FormData();

    Object.keys(form.value).forEach((key, index) => {
      fd.append(key, form.value[key])
    })

    fd.append("chapterId", this.chapter.chapterId)
    fd.append("topicImage", this.topicImage)

    this.loading1 = true
    this.coreService.uploadRequest(AppConstants.API_URL + "full-courses/topic/", fd).subscribe((data: any) => {
      this.dialog.showDialog({ content: data.message })
      this.loading1 = false
      this.getTopics()
    })
  }

  addTest(form: NgForm) {
    this.loading1 = true
    const url = AppConstants.API_URL + "full-courses/chapter/" + this.chapter.chapterId + "/test"
    this.coreService.postRequest(url, form.value).subscribe((data: any) => {
      this.loading1 = false
      this.getTests()
      this.dialog.showDialog({
        content: data.message
      })
    })
  }

  setPracticeTest(form: NgForm) {
    this.loading1 = true
    const url = AppConstants.API_URL + "full-courses/chapter/" + this.chapter.chapterId + "/set-practice-test"
    this.coreService.putRequest(url, form.value).subscribe((data: any) => {
      this.loading1 = false
      this.dialog.showDialog({content:data.message})
    })
  }

}
