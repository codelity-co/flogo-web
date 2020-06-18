import {
  Component,
  EventEmitter,
  Input,
  Output,
  HostListener,
  HostBinding,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Highlightable } from '@angular/cdk/a11y';
import { ICON_ACTIVITY_DEFAULT } from '@flogo-web/core';

@Component({
  selector: 'flogo-stream-stage-add-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.less'],
})
export class ActivityComponent implements Highlightable, OnChanges {
  @Input() activity;
  @Output() selected = new EventEmitter();
  @HostBinding('class.is-active') isHighlighted = false;
  disabled = false;
  iconUrl: string;

  ngOnChanges({ activity: activityChange }: SimpleChanges) {
    if (activityChange) {
      this.iconUrl = this.activity.icon || ICON_ACTIVITY_DEFAULT;
    }
  }

  @HostListener('click')
  select() {
    this.selected.emit(this.activity);
  }

  setActiveStyles() {
    this.isHighlighted = true;
  }

  setInactiveStyles() {
    this.isHighlighted = false;
  }
}
