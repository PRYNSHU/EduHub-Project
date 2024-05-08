import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'course-buttons',
  templateUrl: './course-buttons.component.html',
  styleUrls: ['./course-buttons.component.css']
})
export class CourseButtonsComponent implements OnInit {

  @Input() activePart: {
    active: string
  }


  constructor() { }

  ngOnInit(): void {
  }

}
