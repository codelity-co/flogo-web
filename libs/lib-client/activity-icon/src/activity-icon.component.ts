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
  @HostBinding('class.is-default') isDefault: boolean;
  Mode = Mode;
  mode: Mode = Mode.Default;

  ngOnChanges() {
    this.isDefault = true;
    if (this.isTerminal || this.isSubflow || this.iconUrl) {
      this.isDefault = false;
    }
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
