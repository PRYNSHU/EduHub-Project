import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ManageCoursesService {

  subject
  chapter
  topic

  setSubject(subject) {
    this.subject = subject
  }

  getSubject() {
    return this.subject
  }

  setChapter(chapter) {
    this.chapter = chapter
  }

  getChapter() {
    return this.chapter
  }

  setTopic(topic){
    this.topic = topic
  }

  getTopic(){
    return this.topic
  }

  constructor() { }
}
