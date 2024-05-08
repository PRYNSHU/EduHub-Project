import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'subjectwise-accuracy',
  templateUrl: './subjectwise-accuracy.component.html',
  styleUrls: ['./subjectwise-accuracy.component.css']
})
export class SubjectwiseAccuracyComponent implements OnInit {

  @Input() subjectWiseAccuracy = {
    physics: 0,
    chemistry: 0,
    mathematics: 0
  }

  constructor() { }

  ngOnInit(): void {
    
  }

  getHeight(accuracy){
    let minus = (50/100) * accuracy
    return `calc(${accuracy}% - ${minus}px)` 
  }

}
