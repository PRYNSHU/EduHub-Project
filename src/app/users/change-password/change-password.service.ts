import { Injectable } from "@angular/core";
import { AppConstants } from "src/app/AppConstants";
import { CoreService } from "src/app/service/core.service";

@Injectable({
    providedIn: 'root'
})

export class ChangePasswordService {

    constructor(private coreService: CoreService) { }

    changePassword(data) {
        const userId = localStorage.getItem("userId")
        return this.coreService.putRequest(AppConstants.API_URL + `login/${userId}/password`, data)
    }
}