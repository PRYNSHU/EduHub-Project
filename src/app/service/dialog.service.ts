import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'

interface DialogOptions {
  title?: string,
  width?: string,
  content: string,
  callBack?: CallableFunction,
  closeCallBack?:CallableFunction,
  callBackButtonColor?: string,
  callBackButtonText?: string
}

@Injectable({
  providedIn: 'root'
})

export class DialogService {
  private dialog = new Subject<object>()
  Dialog = this.dialog.asObservable()
  constructor() { }

  showDialog(content: DialogOptions) {
    this.dialog.next(content)
  }
}
