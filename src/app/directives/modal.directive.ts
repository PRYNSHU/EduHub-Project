import { Directive, ElementRef, Input, SimpleChanges, OnChanges } from '@angular/core';

@Directive({
  selector: '[modal]'
})
export class ModalDirective implements OnChanges {

  @Input() show: String = "none";
  @Input() options: any;

  constructor(private el: ElementRef) {

  }

  ngOnChanges(changes: SimpleChanges) {
    this.el.nativeElement.style.display = this.show ? 'flex' : 'none';

    if (this.options.width != undefined) {
      this.el.nativeElement.querySelector(" .dialog").style.width = this.options.width;
    }

    if (this.options.title != undefined) {
      this.el.nativeElement.querySelector(" .modal-header").innerHTML = this.options.title;
    }
  }

}
