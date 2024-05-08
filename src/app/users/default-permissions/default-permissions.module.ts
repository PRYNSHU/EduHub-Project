import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AllCommonModule } from 'src/app/all-common.module';
import { DefaultPermissionsHomeComponent } from './default-permissions-home/default-permissions-home.component';
import { AddRoleComponent } from './add-role/add-role.component';

const routes:Routes = [
    {
        path:"",
        component:DefaultPermissionsHomeComponent
    }
]

@NgModule({
  declarations: [DefaultPermissionsHomeComponent, AddRoleComponent],
  imports: [
    CommonModule,
    AllCommonModule,
    RouterModule.forChild(routes)
  ],
  exports:[]
})
export class DefaultPermissionsModule { }