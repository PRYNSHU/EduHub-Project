import { Injectable } from '@angular/core';
import {BehaviorSubject, Subject}  from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class CommunicationService {
  constructor(){}
  saveSubject = new Subject<object>();
  saveChapter = new Subject<object>();
  errorModal  = new Subject<object>();
  loading     = new Subject<boolean>();
  saveQuestion = new Subject<object>();
  addQuestionToTest = new Subject<object>();
  backToTest = new Subject();
  saveTestCategory = new Subject<object>();
  deleteTestCategory = new Subject<object>();
  saveTestInstruction = new Subject<object>();
  deleteTestInstruction = new Subject<object>();
  closeModal = new Subject()
  header = new Subject()
  sidebarToggle = new Subject()
}
