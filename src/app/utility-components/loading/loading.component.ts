import { Component, Input, OnInit } from '@angular/core';
import { CommunicationService } from 'src/app/service/communication.service';

@Component({
  selector: 'loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit {
  constructor(private comm: CommunicationService) { }
  
  ngOnInit(): void {
    this.comm.loading.subscribe((show) => this.show = show)
  }
  @Input() show: boolean = false;
}
