import { Component, Input, OnChanges, ChangeDetectionStrategy } from '@angular/core';

enum Mode {
  Default = 'default',
  CustomIcon = 'customicon',
  Subflow = 'subflow',
  Terminal = 'terminal',
}

@Component({
  selector: 'flogo-diagram-tile-icon',
  templateUrl: './tile-icon.component.html',
  styleUrls: ['./tile-icon.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TileIconComponent implements OnChanges {
  @Input() isSubflow?: boolean;
  @Input() isTerminal?: boolean;
  @Input() iconUrl?: string;

  Mode = Mode;
  mode: Mode = Mode.Default;

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
