import { Component, Output, EventEmitter } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

import { FlowGraph, SingleEmissionSubject } from '@flogo-web/lib-client/core';
import {
  DiagramAction,
  DiagramActionType,
  DiagramSelection,
  DiagramActionChild,
  DiagramActionSelf,
  DiagramActionMove,
  IconProvider,
} from '@flogo-web/lib-client/diagram';

import { HandlerType } from '../core/models';
import { newBranchId } from '../core/models/flow/id-generator';
import { FlowState, FlowActions, FlowSelectors } from '../core/state';
import { IconProviderCreator } from '../core';

@Component({
  selector: 'flogo-flow-diagram',
  templateUrl: 'flow-diagram.component.html',
  styles: [
    `
      :host {
        display: flex;
      }
      flogo-diagram {
        flex: 1;
      }
    `,
  ],
})
export class FlogoFlowDiagramComponent {
  @Output() deleteTask = new EventEmitter<{
    handlerType: HandlerType;
    itemId: string;
  }>();
  items$: Observable<FlowGraph>;
  currentSelection$: Observable<DiagramSelection>;
  iconProvider$: Observable<IconProvider>;
  currentDiagramId: HandlerType;
  private ngOnDestroy$ = SingleEmissionSubject.create();

  constructor(
    private store: Store<FlowState>,
    private iconProviderCreator: IconProviderCreator
  ) {
    this.items$ = this.store.pipe(
      select(FlowSelectors.getCurrentGraph),
      takeUntil(this.ngOnDestroy$)
    );
    this.currentSelection$ = this.store.pipe(
      select(FlowSelectors.getSelectionForCurrentHandler),
      takeUntil(this.ngOnDestroy$)
    );
    this.iconProvider$ = this.store.select(FlowSelectors.getCurrentItemsAndSchemas).pipe(
      map(([items, schemas]) => {
        return items && schemas ? this.iconProviderCreator.create(items, schemas) : null;
      })
    );
    this.store
      .pipe(select(FlowSelectors.getCurrentHandlerId), takeUntil(this.ngOnDestroy$))
      .subscribe(handlerType => {
        this.currentDiagramId = handlerType;
      });
  }

  onDiagramAction(diagramAction: DiagramAction) {
    switch (diagramAction.type) {
      case DiagramActionType.Select: {
        return this.store.dispatch(
          new FlowActions.SelectItem({
            handlerType: this.currentDiagramId,
            itemId: (<DiagramActionSelf>diagramAction).id,
          })
        );
      }
      case DiagramActionType.Configure: {
        return this.store.dispatch(
          new FlowActions.ConfigureItem({
            itemId: (<DiagramActionSelf>diagramAction).id,
          })
        );
      }
      case DiagramActionType.Insert: {
        return this.store.dispatch(
          new FlowActions.SelectCreateItem({
            handlerType: this.currentDiagramId,
            parentItemId: (<DiagramActionChild>diagramAction).parentId,
            insertBetween: (<DiagramActionChild>diagramAction).insertBetween,
          })
        );
      }
      case DiagramActionType.Branch: {
        return this.store.dispatch(
          new FlowActions.CreateBranch({
            handlerType: this.currentDiagramId,
            parentId: (<DiagramActionChild>diagramAction).parentId,
            newBranchId: newBranchId(),
          })
        );
      }
      case DiagramActionType.Remove: {
        return this.deleteTask.emit({
          handlerType: this.currentDiagramId,
          itemId: (<DiagramActionSelf>diagramAction).id,
        });
      }
      case DiagramActionType.Move: {
        return this.store.dispatch(
          new FlowActions.MoveItem({
            handlerType: this.currentDiagramId,
            itemId: (<DiagramActionMove>diagramAction).id,
            parentId: (<DiagramActionMove>diagramAction).parentId,
          })
        );
      }
    }
  }
}
