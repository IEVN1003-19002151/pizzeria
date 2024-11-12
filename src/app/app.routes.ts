import { Routes, RouterModule } from '@angular/router';
import { ClienteComponent } from './tem/cliente/cliente.component';
import { NgModule } from '@angular/core';

export const routes: Routes = [
    { path: 'cliente', component: ClienteComponent },
    
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
