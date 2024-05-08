import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class DateTimeFormatService {
  
  getFormattedTime(time) {
    let hours = Math.floor((time % (60 * 60 * 24)) / (60 * 60)).toString();
    let minutes = Math.floor((time % (60 * 60)) / (60)).toString();
    let seconds = Math.floor((time % (60))).toString();
    hours = hours.padStart(2, '0');
    minutes = minutes.padStart(2, '0');
    seconds = seconds.padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  getFormattedDate(dob) {
    let monthNames = ["Jan", "Feb", "Mar", "Apr",
      "May", "Jun", "Jul", "Aug",
      "Sep", "Oct", "Nov", "Dec"];
    let date = new Date(dob)
    let day = date.getDate().toString().padStart(2, "0");
    let monthIndex = date.getMonth();
    let monthName = monthNames[monthIndex];
    let year = date.getFullYear().toString();
    year = year.split("-").pop()
    return `${day}-${monthName}-${year}`;
  }

}