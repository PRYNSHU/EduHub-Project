import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';

@Component({
  selector: 'app-video-page',
  templateUrl: './video-page.component.html',
  styleUrls: ['./video-page.component.css']
})
export class VideoPageComponent implements OnInit {

  loading: boolean
  subject
  chapter
  topic
  showIframe: boolean = false
  WEBSITE_URL = AppConstants.WEBSITE_URL

  nextTopic = {
    subjectId: null,
    chapterId: null,
    topicId: null,
    type: "video"
  }

  isCurrentTopicTestPassed: boolean
  isCurrentTopicTestCodeValid: boolean

  constructor(
    private coreService: CoreService,
    private routes: ActivatedRoute,
    private router: Router,
  ) {

    // read data from url
    this.routes.queryParams.subscribe((data: any) => {
      this.nextTopic.chapterId = data.chapterId
      this.nextTopic.subjectId = data.subjectId

      this.getSubjectChapterTopic(data.subjectId, data.chapterId, data.topicId)
    })
  }

  ngOnInit(): void {

  }

  // Save next topic details in session storage so we can know the Id of next topic or test 
  setNextTopicId(topicId) {
    let navigateNext = JSON.parse(sessionStorage.getItem("navigateNext"))
    let topics = JSON.parse(sessionStorage.getItem("topics"))
    let nextTopic = topics.find(t => t.topicId > topicId)

    let currentTopic = topics.find(t => t.topicId == topicId)
    this.isCurrentTopicTestPassed = currentTopic.topicResult
    this.isCurrentTopicTestCodeValid = currentTopic.testCode

    // if next topic is available then save its details  
    if (nextTopic) {
      navigateNext.nextTopicId = nextTopic.topicId
      this.nextTopic.topicId = nextTopic.topicId
      this.nextTopic.type = 'video'
      navigateNext.type = 'video'
    }
    else {
      // if next topic is not availabe then set next item to be test   
      navigateNext.nextTopicId = null
      navigateNext.type = "test"
      this.nextTopic.type = "test"
    }

    navigateNext.topicId = this.topic.topicId

    sessionStorage.setItem("navigateNext", JSON.stringify(navigateNext))
  }

  getSubjectChapterTopic(subjectId, chapterId, topicId) {
    this.loading = true
    const url = AppConstants.API_URL + "full-courses/subject/" + subjectId + "/chapter/" + chapterId + "/topic/" + topicId
    this.coreService.getRequest(url).subscribe((data: any) => {
      this.subject = data.subject
      this.chapter = data.chapter
      this.topic = data.topic
      this.showIframe = false
      this.setNextTopicId(data.topic.topicId)
      setTimeout(() => this.showIframe = true, 100)

      this.setTopicImageInSession()
      this.loading = false
    })
  }

  // Save topic image path in session so we can use it on next pages 
  setTopicImageInSession() {
    const topicImage = AppConstants.WEBSITE_URL + this.chapter.folderPath + this.topic.image
    sessionStorage.setItem("topicImage", topicImage)
  }

  // On click on next button, If test is passed then go to next video or chapter test page, if test is failed then go to topic test page     
  goToTest() {
    this.markVideoAsWatched()
    if (this.isCurrentTopicTestPassed && this.nextTopic.type == 'video') {

      const queryParams = {
        subjectId: this.nextTopic.subjectId,
        chapterId: this.nextTopic.chapterId,
        topicId: this.nextTopic.topicId,
      }

      this.router.navigate(["/candidate/video-page"], { queryParams })

    } else if (this.isCurrentTopicTestPassed == false) {

      const queryParams = {
        subjectId: this.subject.subjectId,
        testId: this.topic.testCode
      }

      this.router.navigate(['/candidate/topic-test-page'], { queryParams, relativeTo: this.routes })
    }
    else {
      this.router.navigate(['/candidate/chapter-test-summary', this.subject.subjectId, this.chapter.chapterId])
    }
  }

  // On clicking next button we mark the video as marked 
  markVideoAsWatched(){
    let videoId = this.topic.videoId
    let url = AppConstants.API_URL + "full-courses/mark-video-watched"
    this.coreService.putRequest(url,{videoId}).subscribe((result)=>{})
  }

  // According to platform we craete the url of video
  getVideoLink(topic) {
    if (topic.platform == 'vimeo') {
      return "https://player.vimeo.com/video/" + topic.videoId + "?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"
    }
    else if (topic.platform == "youtube") {
      return "https://www.youtube.com/embed/" + topic.videoId
    }
  }

}
