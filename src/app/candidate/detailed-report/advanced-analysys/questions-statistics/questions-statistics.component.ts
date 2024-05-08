import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'questions-statistics',
  templateUrl: './questions-statistics.component.html',
  styleUrls: ['./questions-statistics.component.css']
})
export class QuestionsStatisticsComponent implements OnInit {


  @Input() questionStatistics = {
    correctQuestions: 0,
    incorrectQuestions: 0,
    skippedQuestions: 0
  }

  constructor() { }

  ngOnInit(): void {
  }

}
