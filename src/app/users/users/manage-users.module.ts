import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AllCommonModule } from 'src/app/all-common.module';
import { AddUserComponent } from './add-user/add-user.component';
import { EditUserComponent } from './edit-user/edit-user.component';
import { UserHomeComponent } from './user-home/user-home.component';
import { AssignBatchesToUsersComponent } from './assign-batches-to-users/assign-batches-to-users.component';
import { AssignSubjectsToUsersComponent } from './assign-subjects-to-users/assign-subjects-to-users.component';
import { EditUserPermissionsComponent } from './edit-user-permissions/edit-user-permissions.component';

const routes:Routes = [
  {
    path:"",
    component:UserHomeComponent
  },
  {
    path:"add-user",
    component:AddUserComponent
  },
  {
    path:"assign-batches",
    component:AssignBatchesToUsersComponent
  },
  {
    path:"assign-subjects",
    component:AssignSubjectsToUsersComponent
  }
]

@NgModule({
  declarations: [
    AddUserComponent,
    UserHomeComponent,
    EditUserComponent,
    AssignBatchesToUsersComponent,
    AssignSubjectsToUsersComponent,
    EditUserPermissionsComponent,
  ],
  imports: [
    AllCommonModule,
    RouterModule.forChild(routes)
  ],
  exports:[
    
  ]
})
export class ManageUsersModule { }
