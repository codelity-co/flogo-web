import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

import { SingleEmissionSubject } from '@flogo-web/lib-client/core';
import {
  ConfirmationService,
  ConfirmationResult,
} from '@flogo-web/lib-client/confirmation';
import { IconProvider } from '@flogo-web/lib-client/diagram';

import { TriggerConfigureSelectors } from '../../core/state/triggers-configure';
import * as TriggerConfigureActions from '../../core/state/triggers-configure/trigger-configure.actions';
import { FlowState } from '../../core/state';

import { configuratorAnimations } from './configurator.animations';
import { ConfiguratorService as TriggerConfiguratorService } from './services/configurator.service';
import { TriggerStatus } from './interfaces';
import { ConfirmationComponent } from './confirmation';
import { TRIGGER_STATUS_TOKEN } from './confirmation/status.token';

@Component({
  selector: 'flogo-triggers-configuration',
  templateUrl: 'configurator.component.html',
  styleUrls: ['configurator.component.less'],
  animations: configuratorAnimations,
  providers: [ConfirmationService],
})
export class ConfiguratorComponent implements OnInit, OnDestroy {
  @Input() iconProvider?: IconProvider;
  isConfiguratorInitialized$: Observable<boolean>;
  triggerStatuses$: Observable<TriggerStatus[]>;
  currentTriggerDetailStatus: TriggerStatus;
  selectedTriggerId: string;
  isOpen: boolean;

  private ngDestroy$ = SingleEmissionSubject.create();

  constructor(
    private triggerConfiguratorService: TriggerConfiguratorService,
    private confirmationService: ConfirmationService,
    private store: Store<FlowState>
  ) {}

  ngOnInit() {
    this.isConfiguratorInitialized$ = this.store.pipe(
      select(TriggerConfigureSelectors.getHasTriggersConfigure)
    );
    const triggerStatuses$ = this.store.pipe(
      select(TriggerConfigureSelectors.getTriggerStatuses)
    );
    this.triggerStatuses$ = this.observeWhileConfiguratorIsActive(triggerStatuses$, []);

    this.isConfiguratorInitialized$
      .pipe(takeUntil(this.ngDestroy$))
      .subscribe(isConfigInitialized => {
        this.isOpen = isConfigInitialized;
        if (this.isOpen) {
          this.triggerConfiguratorService.clear();
        }
      });

    this.store
      .pipe(
        TriggerConfigureSelectors.getCurrentTriggerOverallStatus,
        takeUntil(this.ngDestroy$)
      )
      .subscribe(status => {
        this.currentTriggerDetailStatus = status;
      });

    const currentTriggerId$ = this.store.pipe(
      select(TriggerConfigureSelectors.selectCurrentTriggerId)
    );
    this.observeWhileConfiguratorIsActive(currentTriggerId$, null).subscribe(
      currentTriggerId => {
        this.selectedTriggerId = currentTriggerId;
      }
    );
  }

  changeTriggerSelection(triggerId: string) {
    const switchTrigger = () =>
      this.store.dispatch(new TriggerConfigureActions.SelectTrigger(triggerId));
    this.checkForContextSwitchConfirmation((result?: ConfirmationResult) => {
      if (!result || result === ConfirmationResult.Discard) {
        switchTrigger();
      } else if (result === ConfirmationResult.Confirm) {
        this.triggerConfiguratorService.save().subscribe(() => {});
        switchTrigger();
      }
    });
  }

  ngOnDestroy() {
    this.triggerConfiguratorService.clear();
    this.ngDestroy$.emitAndComplete();
  }

  onCloseOrDismiss() {
    const close = () => this.store.dispatch(new TriggerConfigureActions.CloseConfigure());
    this.checkForContextSwitchConfirmation((result?: ConfirmationResult) => {
      if (!result || result === ConfirmationResult.Discard) {
        close();
      } else if (result === ConfirmationResult.Confirm) {
        this.triggerConfiguratorService.save().subscribe(() => {});
        close();
      }
    });
  }

  private checkForContextSwitchConfirmation(
    onResult: (result?: ConfirmationResult | null) => void
  ) {
    const status = this.currentTriggerDetailStatus;
    if (!status || !status.isDirty) {
      return onResult();
    }
    const injectionTokens = new WeakMap();
    injectionTokens.set(TRIGGER_STATUS_TOKEN, status);
    const confirmation = this.confirmationService.openModal(
      ConfirmationComponent,
      injectionTokens
    );
    confirmation.result.subscribe(onResult);
  }

  private observeWhileConfiguratorIsActive<T>(
    observable$: Observable<T>,
    valueWhenNotInitialized: any
  ) {
    return this.isConfiguratorInitialized$.pipe(
      switchMap(isInitialized =>
        isInitialized ? observable$ : of(valueWhenNotInitialized)
      ),
      takeUntil(this.ngDestroy$)
    );
  }
}
