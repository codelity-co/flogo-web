import {
  Component,
  Input,
  OnChanges,
  HostBinding,
  ChangeDetectionStrategy,
} from '@angular/core';

enum Mode {
  Default = 'default',
  CustomIcon = 'customicon',
  Subflow = 'subflow',
  Terminal = 'terminal',
}

@Component({
  selector: 'flogo-activity-icon',
  templateUrl: './activity-icon.component.html',
  styleUrls: ['./activity-icon.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityIconComponent implements OnChanges {
  @Input() isSubflow?: boolean;
  @Input() isTerminal?: boolean;
  @Input() iconUrl?: string;
  @Input() customAltText?: string;
  Mode = Mode;
  mode: Mode = Mode.Default;

  @HostBinding('class.is-default')
  get isDefault() {
    return this.mode === Mode.Default;
  }

  ngOnChanges() {
    if (this.iconUrl) {
      this.mode = Mode.CustomIcon;
    } else if (this.isSubflow) {
      this.mode = Mode.Subflow;
    } else if (this.isTerminal) {
      this.mode = Mode.Terminal;
    } else {
      this.mode = Mode.Default;
    }
  }
}
