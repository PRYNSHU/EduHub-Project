import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'course-top-section',
  templateUrl: './course-top-section.component.html',
  styleUrls: ['./course-top-section.component.css']
})
export class CourseTopSectionComponent implements OnInit {

  @Input() course

  constructor() { }

  ngOnInit(): void {
  }

}
