import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AllCommonModule } from 'src/app/all-common.module';
import { ChangePasswordComponent } from './change-password.component';

const routes: Routes = [
    {
        path: "",
        component: ChangePasswordComponent
    }
]

@NgModule({
    declarations: [
        ChangePasswordComponent
    ],
    imports: [
        CommonModule,
        AllCommonModule,
        RouterModule.forChild(routes)
    ],
    exports: [

    ]
})
export class ChangePasswordModule { }
