import { NgModule } from '@angular/core';

// Local Imports
import { ExampleDemoComponent } from './example-demo.component';

@NgModule({
	imports: [ ],
	declarations: [
		ExampleDemoComponent
	],
	exports: [
		ExampleDemoComponent
	],
	bootstrap: [ ExampleDemoComponent ],
	providers: [ ]
})
export class ExampleDemoModule { }
