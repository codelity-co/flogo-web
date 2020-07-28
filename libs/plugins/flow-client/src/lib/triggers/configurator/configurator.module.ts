import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule as NgCommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { PortalModule } from '@angular/cdk/portal';

import { MonacoEditorModule } from '@flogo-web/editor';
import { SharedModule as FlogoSharedModule } from '@flogo-web/lib-client/common';
import { TriggerIconModule } from '@flogo-web/lib-client/trigger-icon';

import { MapperModule } from '../../shared/mapper';

import { ConfiguratorService } from './services/configurator.service';
import { ConfiguratorComponent } from './configurator.component';
import { ConfigureTriggerComponent } from './trigger/trigger.component';
import { ConfirmationComponent } from './confirmation';
import {
  TriggerDetailComponent,
  TabsComponent,
  ConfigureSettingsComponent,
  ConfigureDetailsService,
  TriggerNameValidatorService,
  SettingsFormBuilder,
  AutoCompleteDirective,
  FieldValueAccesorDirective,
  FieldErrorComponent,
  AutoCompleteContentComponent,
  ActionButtonsComponent,
  SettingsHelpComponent,
  SettingsFormFieldComponent,
  ConfirmEditionComponent,
} from './trigger-detail';

@NgModule({
  imports: [
    NgCommonModule,
    ReactiveFormsModule,
    ScrollingModule,
    PortalModule,
    FlogoSharedModule,
    MapperModule,
    MonacoEditorModule,
    TriggerIconModule,
  ],
  declarations: [
    TriggerDetailComponent,
    ConfiguratorComponent,
    ConfigureTriggerComponent,
    ConfigureSettingsComponent,
    TabsComponent,
    AutoCompleteDirective,
    FieldValueAccesorDirective,
    AutoCompleteContentComponent,
    ActionButtonsComponent,
    ConfirmationComponent,
    SettingsHelpComponent,
    SettingsFormFieldComponent,
    FieldErrorComponent,
    ConfirmEditionComponent,
  ],
  exports: [ConfiguratorComponent],
  providers: [
    ConfiguratorService,
    ConfigureDetailsService,
    SettingsFormBuilder,
    TriggerNameValidatorService,
  ],
  entryComponents: [
    AutoCompleteContentComponent,
    ConfirmationComponent,
    ConfirmEditionComponent,
  ],
})
export class ConfiguratorModule {}
