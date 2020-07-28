import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CoreModule as FlogoCoreModule } from '@flogo-web/lib-client/core';
import { SharedModule as FlogoSharedModule } from '@flogo-web/lib-client/common';
import { ContribInstallerModule } from '@flogo-web/lib-client/contrib-installer';
import {
  TriggerSelectorComponent,
  TriggerSelectorModule,
} from '@flogo-web/lib-client/trigger-selector';
import { TriggerIconModule } from '@flogo-web/lib-client/trigger-icon';

import { FlogoStreamTriggersPanelComponent } from './triggers.component';
import { ConfiguratorModule as TriggersConfiguratorModule } from './configurator';
import { TriggerBlockComponent } from './trigger-block';

@NgModule({
  imports: [
    CommonModule,
    TriggerSelectorModule,
    FlogoSharedModule,
    FlogoCoreModule,
    ContribInstallerModule,
    TriggersConfiguratorModule,
    TriggerIconModule,
  ],
  declarations: [TriggerBlockComponent, FlogoStreamTriggersPanelComponent],
  exports: [FlogoStreamTriggersPanelComponent],
  entryComponents: [TriggerSelectorComponent],
})
export class TriggersModule {}
