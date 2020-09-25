import { NgModule } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';

import { ConfirmationComponent } from './configurator/confirmation';
import { SharedModule as ClientShareModule } from 'libs/lib-client/common/src/lib/public_api';
import { TriggerSelectorComponent } from './trigger-selector';
import { TriggerIconComponent} from './trigger-icon';
import { CommonModule } from '@angular/common';
import { ModalModule } from '@flogo-web/lib-client/modal';
import { SearchModule } from '@flogo-web/lib-client/search';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [CommonModule, ModalModule, SearchModule, TranslateModule,
    A11yModule, ClientShareModule],
  declarations: [ConfirmationComponent, TriggerSelectorComponent, TriggerIconComponent],
  exports: [TriggerSelectorComponent, TriggerIconComponent],
  entryComponents: [ConfirmationComponent, TriggerSelectorComponent, TriggerIconComponent],
})
export class TriggerSharedModule {}
