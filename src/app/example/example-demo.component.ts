import { Component } from '@angular/core';

@Component({
	selector: 'example-demo',
	templateUrl: './example-demo.component.html'
})
export class ExampleDemoComponent {
	name = 'ANGULAR!';

	submitForm() {
		// Do something with this.name
	}

}
