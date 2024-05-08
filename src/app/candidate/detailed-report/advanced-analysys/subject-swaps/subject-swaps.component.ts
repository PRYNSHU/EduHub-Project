import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'subject-swaps',
  templateUrl: './subject-swaps.component.html',
  styleUrls: ['./subject-swaps.component.css']
})
export class SubjectSwapsComponent implements OnInit {

  @Input() value = 0

  constructor() { }

  ngOnInit(): void {
  }

}
