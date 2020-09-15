import { Component, HostListener, Inject } from '@angular/core';
import {
  ConfirmationControl,
  ConfirmationContent,
} from '@flogo-web/lib-client/confirmation';
import { TriggerStatus } from '../interfaces';
import { TRIGGER_STATUS_TOKEN } from './status.token';

@Component({
  selector: 'flogo-triggers-configuration-settings-confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.less'],
})
export class ConfirmationComponent implements ConfirmationContent {
  @HostListener('document:keydown.escape')
  closeModal() {
    this.control.cancel();
  }

  constructor(
    @Inject(TRIGGER_STATUS_TOKEN) public status: TriggerStatus,
    public control: ConfirmationControl
  ) {}
}
