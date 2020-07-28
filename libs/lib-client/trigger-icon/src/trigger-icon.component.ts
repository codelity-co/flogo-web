import { Component, Input } from '@angular/core';

@Component({
  selector: 'flogo-trigger-icon',
  templateUrl: './trigger-icon.component.html',
  styles: [
    `
      .trigger-icon {
        height: 24px;
        width: 24px;
      }
    `,
  ],
})
export class TriggerIconComponent extends Component {
  @Input() icon: string;
}
