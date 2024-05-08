import { Component, HostListener, OnInit, ViewEncapsulation } from '@angular/core'
import { DialogService } from 'src/app/service/dialog.service'

@Component({
  selector: 'commondialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DialogComponent implements OnInit {
  show: boolean
  content: string
  title: string
  callBack = null
  closeCallBack = null
  callBackButtonColor = "primary"
  callBackButtonText = "Yes"
  component: Component
  constructor(private dialog: DialogService) { }

  ngOnInit(): void {
    this.dialog.Dialog.subscribe((data: any) => {

      if (data == undefined) {
        this.show = false;
        return;
      }

      this.content = data.content
      this.show = true
      this.title = data.title == undefined ? 'Status' : data.title
      this.callBack = data.callBack ? data.callBack : null
      this.closeCallBack = data.closeCallBack ? data.closeCallBack : null
      this.callBackButtonColor = data.callBackButtonColor ? data.callBackButtonColor : "warn"
      this.callBackButtonText = data.callBackButtonText ? data.callBackButtonText : "Delete"
      setTimeout(() => {
        let dialog = document.getElementById("dialog")
        dialog.style.width = data.width ? data.width : "400px"
      }, 10)
    })
  }

  actionFunction() {
    if (this.callBack) {
      this.callBack()
    }
  }

  closeFunction() {
    if (this.closeCallBack) {
      this.closeCallBack()
    }
  }


  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.keyCode == 13 || event.keyCode == 27) {
      this.show = false
    }
  }

}
