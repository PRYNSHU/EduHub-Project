import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class TimeFormatService {
  getFormattedTime(time) {
    let hours = Math.floor((time % (60 * 60 * 24)) / (60 * 60)).toString();
    let minutes = Math.floor((time % (60 * 60)) / (60)).toString();
    let seconds = Math.floor((time % (60))).toString();
    hours = hours.padStart(2, '0');
    minutes = minutes.padStart(2, '0');
    seconds = seconds.padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
}
