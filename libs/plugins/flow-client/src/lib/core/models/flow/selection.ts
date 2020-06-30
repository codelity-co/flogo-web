import {
  SelectionType,
  CurrentSelection,
  InsertTaskSelection,
  TaskSelection,
  TriggerSelection,
} from '../selection';
import { HandlerType } from '../handler-type';

export function makeTaskSelection(
  handlerType: HandlerType,
  taskId: string
): TaskSelection {
  return {
    type: SelectionType.Task,
    taskId,
    handlerType,
  };
}

export function makeInsertSelection(
  handlerType: HandlerType,
  parentId: string,
  insertBetween?:boolean
): InsertTaskSelection {
  return {
    type: SelectionType.InsertTask,
    parentId,
    handlerType,
    insertBetween,
  };
}

export function makeTriggerSelection(triggerId: string): TriggerSelection {
  return {
    type: SelectionType.Trigger,
    triggerId,
  };
}

export function isTriggerSelection(
  selection: null | CurrentSelection
): selection is TriggerSelection {
  return selection && selection.type === SelectionType.Trigger;
}
