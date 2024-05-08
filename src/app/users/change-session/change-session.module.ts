import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AllCommonModule } from 'src/app/all-common.module';
import { ChangeSessionComponent } from './change-session.component';

const routes: Routes = [
    {
        path: "",
        component: ChangeSessionComponent
    }
]

@NgModule({
    declarations: [
        ChangeSessionComponent
    ],
    imports: [
        CommonModule,
        AllCommonModule,
        RouterModule.forChild(routes)
    ],
    exports: [

    ]
})
export class ChangeSessionModule { }
