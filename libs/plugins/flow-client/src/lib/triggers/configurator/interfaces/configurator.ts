import { TriggerState } from '@flogo-web/lib-client/trigger-shared';
import { FlowMetadata } from '../../../core';

export interface ConfiguratorStatus {
  disableSave?: boolean;
  isOpen?: boolean;
  triggers?: TriggerStatus[];
  selectedTriggerId?: string;
}

export interface TriggerStatus {
  id?: string;
  isValid?: boolean;
  isDirty?: boolean;
  name?: string;
}

export interface CurrentTriggerState extends TriggerState {
  flowMetadata: FlowMetadata;
}
