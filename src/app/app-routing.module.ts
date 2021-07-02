import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import {TeamComponent} from './team/team.component';
import {LeagueComponent} from './league/league.component';
import {ContactComponent} from './contact/contact.component';

const routes: Routes = [
  {path:"", component: HomeComponent},
  {path: 'team', component: TeamComponent},
  {path: 'contact', component: ContactComponent},
  {path: 'league', component: LeagueComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
