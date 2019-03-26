import { Observable, OperatorFunction } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivitySchema } from '@flogo-web/core';
import { ItemActivityTask } from '@flogo-web/lib-client/core';

export interface DebugActivityTask extends ItemActivityTask {
  schemaHomepage: string;
}

export function combineToDebugActivity(): OperatorFunction<
  [ActivitySchema, ItemActivityTask],
  DebugActivityTask
> {
  return (source: Observable<[ActivitySchema, ItemActivityTask]>) =>
    source.pipe(
      map(([schema, activity]) =>
        activity && schema ? { ...activity, schemaHomepage: schema.homepage } : null
      )
    );
}
