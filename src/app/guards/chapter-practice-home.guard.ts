import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot } from '@angular/router';
import { NavigationService } from '../service/navigation.service';

@Injectable({
    providedIn: 'root'
})

export class ChapterPracticeHome implements CanDeactivate<boolean> {

    constructor(private navigationService: NavigationService) { }

    canDeactivate(component: any, currentRoute: ActivatedRouteSnapshot,
        currentState: RouterStateSnapshot,
        nextState?: RouterStateSnapshot) {

        if (this.navigationService.getBackClicked() && nextState.url.includes("chapter-practice-page") ) {
            this.navigationService.setBackClicked(false)
            history.pushState(null, null, location.href)
            return false
        }

        return true;
    }
}
