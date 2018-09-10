import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { DraggableDirective } from './directives/draggable.directive';
import { FormsModule } from "@angular/forms";
import { TargetComponent } from './components/target/target.component';

@NgModule({
  declarations: [
    AppComponent,
    DraggableDirective,
    TargetComponent
  ],
  imports: [
    FormsModule,
    BrowserModule, 
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
