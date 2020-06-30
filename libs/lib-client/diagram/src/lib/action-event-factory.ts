import { DiagramActionType, DiagramActionMove } from './interfaces';
import { DiagramActionChild, DiagramActionSelf } from './interfaces';

export const actionEventFactory = {
  insert(parentId: string, insertBetween:boolean): DiagramActionChild {
    return {
      type: DiagramActionType.Insert,
      parentId,
      insertBetween
    };
  },
  move(id: string, parentId: string): DiagramActionMove {
    return {
      type: DiagramActionType.Move,
      id,
      parentId: parentId || null,
    };
  },
  branch(parentId: string): DiagramActionChild {
    return {
      type: DiagramActionType.Branch,
      parentId,
    };
  },
  select(id: string): DiagramActionSelf {
    return {
      type: DiagramActionType.Select,
      id,
    };
  },
  configure(id: string): DiagramActionSelf {
    return {
      type: DiagramActionType.Configure,
      id,
    };
  },
  remove(id: string): DiagramActionSelf {
    return {
      type: DiagramActionType.Remove,
      id,
    };
  },
};
