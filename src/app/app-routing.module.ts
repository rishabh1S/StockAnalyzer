import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { AuthGuard } from './guard/auth.guard';
import { LandingComponent } from './components/landing/landing.component';
import { RegistrationComponent } from './components/registration/registration.component';
import { LoginComponent } from './components/login/login.component';
import { MainComponent } from './components/main/main.component';
import { PagenotFoundComponent } from './components/pagenot-found/pagenot-found.component';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'register', component: RegistrationComponent },
  { path: 'login', component: LoginComponent },
  { path: 'main', component: MainComponent, canActivate: [AuthGuard] },
  { path: '**', component: PagenotFoundComponent },
  // Add other routes as needed
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
