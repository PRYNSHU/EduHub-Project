import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';

@Component({
  selector: 'app-subject-home',
  templateUrl: './subject-home.component.html',
  styleUrls: ['./subject-home.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SubjectHomeComponent implements OnInit {

  loading1: boolean = true
  loading2: boolean = true
  subject
  chapters = []
  WEBSITE_URL = AppConstants.WEBSITE_URL

  constructor(
    private coreService: CoreService,
    private routes: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.routes.params.subscribe((data: any) => {
      this.getSubjectDetails(data.subjectId)
      this.getChaptersAndTopics(data.subjectId)
    })
  }

  getSubjectDetails(subjectId) {
    this.coreService.getRequest(AppConstants.API_URL + "full-courses/subjects/" + subjectId).subscribe((data: any) => {
      this.subject = data
      this.loading1 = false
    })
  }

  getChaptersAndTopics(subjectId) {
    this.coreService.getRequest(AppConstants.API_URL + "full-courses/subject/" + subjectId + "/chapters-topics").subscribe((result: any) => {
      this.chapters = result
      this.loading2 = false
    })
  }

  goToVideo(subjectId, chapterId, topicId, nextTopic, topics) {

    let navigateNext = {
      subjectId,
      chapterId,
      topicId,
      nextTopicId: 0,
      type: null
    }

    if (nextTopic) {
      navigateNext.type = nextTopic.type == "test" ? "test" : "video"
      navigateNext.nextTopicId = nextTopic.topicId
    }
    // We are storing navigation data in sessionStorage so on clicking next button we can know what is next video your or test url etc. 
    sessionStorage.setItem("navigateNext", JSON.stringify(navigateNext))
    sessionStorage.setItem("topics", JSON.stringify(topics))
  }

  goToInstructions(subjectId, chapterId) {
    this.router.navigate(['/candidate/chapter-test-summary/' + subjectId + '/' + chapterId])
  }

  carouselOptions: OwlOptions = {

    mouseDrag: true,
    touchDrag: true,
    pullDrag: false,
    dots: false,
    navSpeed: 700,
    navText: ['<i class="fa fa-angle-left" aria-hidden="true"></i>', '<i class="fa fa-angle-right" aria-hidden="true"></i>'],
    responsive: {
      0: {
        items: 2
      },
      500: {
        items: 3
      },
      700: {
        items: 4
      },
      840: {
        items: 5
      },
      940: {
        items: 5
      },
      960: {
        items: 6
      }
    },
    nav: true
  }

}
