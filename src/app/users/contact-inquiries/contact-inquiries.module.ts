import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AllCommonModule } from 'src/app/all-common.module';
import { ContactInquiriesComponent } from './contact-inquiries.component';

const routes: Routes = [
    {
        path: "",
        component: ContactInquiriesComponent
    }
]

@NgModule({
    declarations: [
        ContactInquiriesComponent
    ],
    imports: [
        CommonModule,
        AllCommonModule,
        RouterModule.forChild(routes)
    ],
    exports: [

    ]
})
export class ContactInquiriesModule { }