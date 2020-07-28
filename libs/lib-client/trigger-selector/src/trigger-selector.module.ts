import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModalModule } from '@flogo-web/lib-client/modal';
import { TriggerIconModule } from '@flogo-web/lib-client/trigger-icon';
import { SearchModule } from '@flogo-web/lib-client/search';
import { TranslateModule } from '@ngx-translate/core';

import { TriggerSelectorComponent } from './trigger-selector.component';

@NgModule({
  declarations: [TriggerSelectorComponent],
  imports: [CommonModule, ModalModule, SearchModule, TranslateModule, TriggerIconModule],

  providers: [],
  exports: [TriggerSelectorComponent],
})
export class TriggerSelectorModule {}
