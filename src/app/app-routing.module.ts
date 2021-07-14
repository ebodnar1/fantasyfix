import { NgModule } from '@angular/core';
import { Routes, RouterModule, ExtraOptions } from '@angular/router';
import { HomeComponent } from './home/home.component';
import {TeamComponent} from './team/team.component';
import {LeagueComponent} from './league/league.component';
import {ContactComponent} from './contact/contact.component';
import {InfoComponent} from './info/info.component';

const routes: Routes = [
  {path:"", component: HomeComponent},
  {path: 'team', component: TeamComponent},
  {path: 'contact', component: ContactComponent},
  {path: 'league', component: LeagueComponent},
  {path: 'info', component: InfoComponent}
];

const routerOptions: ExtraOptions = {
  anchorScrolling: 'enabled',
  onSameUrlNavigation: 'reload',
  scrollPositionRestoration: 'enabled'
}

@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
