import { Component, Input } from '@angular/core'

@Component({
  selector: 'flogo-trigger-icon',
  templateUrl: './trigger-icon.component.html'
})
export class TriggerIconComponent extends Component {
  @Input() icon: string;
}
