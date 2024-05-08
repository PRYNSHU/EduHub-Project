import { Component, OnInit, Input, OnChanges, ViewEncapsulation } from '@angular/core';
import { CoreService } from 'src/app/service/core.service';
import { AppConstants } from 'src/app/AppConstants';
import { CommunicationService } from 'src/app/service/communication.service';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'edit-subject',
  templateUrl: './edit-subject.component.html',
  styleUrls: ['../../users-common-css/admin-common.css', './edit-subject.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class EditSubjectComponent implements OnInit, OnChanges {
  masterSubject: string;
  masterChapters = [];
  showAddTopics: boolean[] = [];
  showdelete = false;
  showTopicDeleteModal = false;
  chapter: string;
  addchapter = false;
  topics = [];
  @Input() chapters = [];
  @Input() subjectData: { subjectId: 0, subject: null }

  constructor(
    private coreService: CoreService,
    private comm: CommunicationService,
    private dialog: DialogService
  ) { }

  ngOnChanges(changes: import("@angular/core").SimpleChanges): void {
    this.masterSubject = "" + this.subjectData.subject;
    this.masterChapters = JSON.parse(JSON.stringify(this.chapters));
    this.showAddTopics = new Array(this.masterChapters.length);
    this.addchapter = false;
    this.topics = new Array(this.chapters.length);
  }

  ngOnInit(): void { }

  private showStatus(status: boolean, message) {
    this.dialog.showDialog({
      title: 'Status',
      content: message
    })
  }

  /*Save Chapter */
  saveChapter() {
    const url = AppConstants.API_URL + "subjects/chapters"
    const data = {
      chapter: this.chapter,
      subjectId: this.subjectData.subjectId
    }

    this.coreService.postRequest(url, data).subscribe((res: any) => {
      this.showStatus(res.status, res.message)
      res.data.topics = []
      this.chapters.push(res.data)
      this.masterChapters.push(JSON.parse(JSON.stringify(res.data)))
      this.addchapter = false
      this.chapter = ""
      this.comm.saveChapter.next(res.data)
    })
  }

  /*Save Topic */
  saveTopic(chapterId, index) {
    let data = {
      chapterId: chapterId,
      topic: this.topics[index]
    }
    
    const url = AppConstants.API_URL + "subjects/topics"
    this.coreService.postRequest(url, data).subscribe((res: any) => {
      this.chapters[index].topics.push(res.data)
      this.masterChapters[index].topics.push(JSON.parse(JSON.stringify(res.data)))
      this.showAddTopics[index] = false
      this.showStatus(res.status, res.message)
      this.topics[index] = ""
    });
  }

  /*Update Chapter*/
  updateChapter(i) {
    let data = this.chapters[i];
    const url = AppConstants.API_URL + "subjects/chapters/" + data.chapterId
    this.coreService.putRequest(url, { chapter: data.chapter }).subscribe((res: any) => {
      this.showStatus(res.status, res.message);
      this.masterChapters[i].chapter = "" + data.chapter;
    });
  }

  /**Update Subject */
  updateSubject() {
    const url = AppConstants.API_URL + "subjects/" + this.subjectData.subjectId
    this.coreService.putRequest(url, { subject: this.subjectData.subject }).subscribe((res: any) => {
      this.showStatus(res.status, res.message);
      this.masterSubject = "" + this.subjectData.subject;
    });
  }

  /*Update Topic*/
  updateTopic(topicId, chapter_index, topic_index) {
    let data = this.chapters[chapter_index].topics[topic_index]
    const url = AppConstants.API_URL + "subjects/topics/" + topicId

    this.coreService.putRequest(url, data).subscribe((res: any) => {
      this.showStatus(res.status, res.message);
      this.masterChapters[chapter_index].topics[topic_index] =
        JSON.parse(JSON.stringify(this.chapters[chapter_index].topics[topic_index]));
    })
  }

  /**Confirm Deletion of Chapter */
  showDelete(chapterId, chapter, index) {
    this.dialog.showDialog({
      title: 'Confirm',
      content: ` Are you sure to delete &ldquo;${chapter}&rdquo; ?`,
      width: '350px',
      callBackButtonColor: 'warn',
      callBackButtonText: 'Delete',
      callBack: () => {
        this.deleteChapter(chapterId, index)
      }
    })
  }

  /**Confirm Deletion of Topic */
  showTopicDelete(topicId, topic, chapterIndex, topicIndex) {
    this.dialog.showDialog({
      title: 'Confirm',
      content: ` Are you sure to delete &ldquo;${topic}&rdquo; ?`,
      width: '350px',
      callBackButtonColor: 'warn',
      callBackButtonText: 'Delete',
      callBack: () => {
        this.deleteTopic(topicId, chapterIndex, topicIndex)
      }
    })
  }

  /*Delete Chapter After Confirmation */
  deleteChapter(chapterId, index) {
    const url = AppConstants.API_URL + "subjects/chapters/" + chapterId
    this.coreService.deleteRequest(url).subscribe((res: any) => {

      if (res.success) {
        this.chapters.splice(index, 1)
        this.masterChapters.splice(index, 1)
        this.showdelete = false
      } else {
        this.dialog.showDialog({ content: res.message })
      }

    })
  }

  /*Delete Topic After Confirmation */
  deleteTopic(topicId, chapterIndex, topicIndex) {
    const url = AppConstants.API_URL + "subjects/topics/" + topicId
    this.coreService.deleteRequest(url).subscribe((res: any) => {

      if (res.success) {
        this.chapters[chapterIndex].topics.splice(topicIndex, 1)
        this.masterChapters[chapterIndex].topics.splice(topicIndex, 1)
      } else {
        this.dialog.showDialog({ content: res.message })
      }

    })
  }

}
