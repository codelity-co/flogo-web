import { Component, Inject } from '@angular/core';
import {
  ConfirmationControl,
  ConfirmationContent,
} from '@flogo-web/lib-client/confirmation';
import { TriggerStatus } from '../interfaces';
import { TRIGGER_STATUS_TOKEN } from './status.token';

@Component({
  selector: 'flogo-stream-triggers-configuration-settings-confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.less'],
})
export class ConfirmationComponent implements ConfirmationContent {
  constructor(
    @Inject(TRIGGER_STATUS_TOKEN) public status: TriggerStatus,
    public control: ConfirmationControl
  ) {}

  closeModal() {
    this.control.cancel();
  }
}
