import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'marks-distribution',
  templateUrl: './marks-distribution.component.html',
  styleUrls: ['./marks-distribution.component.css']
})
export class MarksDistributionComponent implements OnInit {

  @Input() marksDistribution = {
    rightMarks: 0,
    wrongMarks: 0,
    leftQuestionsMarks: 0
  }

  constructor() { }

  ngOnInit(): void {
  }

}
