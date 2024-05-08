import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tex'
})
export class MathTexPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    // setTimeout(()=>{
    //   let MathJax = (<any>window).MathJax;
    //   if(MathJax!=undefined)
    //   MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
    // },10);
    return value;
  }

}
