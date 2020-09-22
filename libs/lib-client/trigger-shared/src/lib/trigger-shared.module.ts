import { NgModule } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';

import { ConfirmationComponent } from './configurator/confirmation';
import { SharedModule as ClientShareModule } from 'libs/lib-client/common/src/lib/public_api';

@NgModule({
  imports: [A11yModule, ClientShareModule],
  declarations: [ConfirmationComponent],
  entryComponents: [ConfirmationComponent],
})
export class TriggerSharedModule {}
