import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'course-highlights',
  templateUrl: './course-highlights.component.html',
  styleUrls: ['./course-highlights.component.css']
})
export class CourseHighlightsComponent implements OnInit {

  @Input() course


  constructor() { }

  ngOnInit(): void {
  }

}
