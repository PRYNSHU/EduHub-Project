import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  private backClicked = false;
  private rightPathClick = false;
  constructor() {

  }

  setBackClicked(status:boolean){
    this.backClicked = status;
  }

  getBackClicked(){
    return this.backClicked;
  }

  setRightPathClicked(status:boolean){
    this.rightPathClick = status;
  }

  getRightPathClicked(){
    return this.rightPathClick;
  }

}
