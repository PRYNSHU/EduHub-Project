import { Injectable } from '@angular/core'
import { AppConstants } from '../AppConstants';
import { CoreService } from '../service/core.service';
import { Permissions, permissionsObject } from './user.modal';

@Injectable({
    providedIn: 'root'
})

export class UsersService {
    constructor(private coreService: CoreService) {

    }

    async getUserPermissions() :Promise<Permissions> {
        return await new Promise(resolve => {
            this.coreService.getRequest(AppConstants.API_URL + "users/permissions").subscribe((permissionsData: any) => {
                let permissions: Permissions = permissionsObject
                permissionsData.forEach(p => {
                    for (let key in p.permissions) {
                        permissions[key] = p.permissions[key]
                    }
                })
                resolve(permissions)
            })
        })
    }
}