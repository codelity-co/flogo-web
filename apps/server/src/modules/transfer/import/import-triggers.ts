import { flow, map, filter } from 'lodash/fp';

import {
  FlogoAppModel,
  Handler,
  Trigger,
  ContributionType,
  TYPE_CONNECTION,
  ContributionSchema,
  TriggerSchema,
  SchemaSettingAttributeDescriptor,
} from '@flogo-web/core';
import { ImportsRefAgent, ValidationErrorDetail } from '@flogo-web/lib-server/core';

import { normalizeHandlerMappings } from '../common/normalize-handler-mappings';
import { tryAndAccumulateValidationErrors } from '../common/try-validation-errors';
import { normalizeSettingsWithPrefix } from './normalize-settings-with-prefix';

type ImportHandlerFn = (
  triggerRef: string,
  handler: Partial<Handler>,
  rawHandler: FlogoAppModel.Handler
) => Handler;

export function importTriggers(
  rawTriggers: FlogoAppModel.Trigger[],
  normalizedResourceIds: Map<string, string>,
  contributions: Map<string, ContributionSchema>,
  importHandler: ImportHandlerFn,
  generateId: () => string,
  createdAt: string = null,
  importsRefAgent: ImportsRefAgent
): {
  triggers: Trigger[];
  errors: ValidationErrorDetail[];
  normalizedTriggerIds: Map<string, string>;
} {
  const normalizedTriggerIds = new Map<string, string>();
  const triggers: Trigger[] = [];
  const importAllHandlers = allHandlersImporter(
    importHandler,
    handlerReconciler(normalizedResourceIds),
    createdAt
  );
  const errors: ValidationErrorDetail[] = [];
  rawTriggers.forEach((rawTrigger, triggerIndex) => {
    const newTrigger: any = {
      ...rawTrigger,
      id: generateId(),
      name: rawTrigger.name || rawTrigger.id,
      createdAt,
      updatedAt: null,
      settings: normalizeSettingsWithPrefix(rawTrigger.settings),
    };
    newTrigger.ref = getPackageRef(
      importsRefAgent,
      ContributionType.Trigger,
      newTrigger.ref
    );
    const triggerSchema = <TriggerSchema>contributions.get(newTrigger.ref);
    if (newTrigger.settings) {
      newTrigger.settings = transformConnectionSettingsRefs(
        newTrigger.settings,
        triggerSchema?.settings,
        importsRefAgent
      );
    }
    newTrigger.handlers = transformHandlerSettings(
      newTrigger.handlers,
      triggerSchema,
      importsRefAgent
    );
    const { errors: handlerErrors, handlers } = importAllHandlers(
      rawTrigger.id,
      triggerIndex,
      rawTrigger.handlers
    );
    if (handlerErrors) {
      errors.push(...handlerErrors);
    } else {
      newTrigger.handlers = handlers;
    }
    triggers.push(newTrigger);
    normalizedTriggerIds.set(rawTrigger.id, newTrigger.id);
  });
  return {
    triggers,
    errors: errors.length > 0 ? errors : null,
    normalizedTriggerIds,
  };
}

function allHandlersImporter(
  importHandler: ImportHandlerFn,
  reconcileHandlers: (handlers: Handler[]) => Handler[],
  createdAt: string
): (
  triggerId: string,
  triggerIndex: number,
  handlers: FlogoAppModel.Handler[]
) => { errors: null | ValidationErrorDetail[]; handlers: Handler[] } {
  return (triggerId: string, triggerIndex: number, handlers: FlogoAppModel.Handler[]) => {
    const { errors, result } = tryAndAccumulateValidationErrors(
      handlers,
      (handler: FlogoAppModel.Handler) => {
        const normalized = preNormalizeHandler(createdAt, handler);
        const imported = importHandler(triggerId, normalized, handler);
        delete imported['action'];
        return imported;
      },
      index => `.triggers[${triggerIndex}].handlers[${index}]`
    );

    if (!errors) {
      return { errors: null, handlers: reconcileHandlers(result) };
    } else {
      return { errors, handlers: null };
    }
  };
}

function handlerReconciler(
  normalizedResourceIds: Map<string, string>
): (handlers: Handler[]) => Handler[] {
  return flow(
    filter((handler: Handler) => normalizedResourceIds.has(handler.resourceId)),
    map(
      handler =>
        ({
          ...handler,
          resourceId: normalizedResourceIds.get(handler.resourceId),
        } as Handler)
    )
  );
}

function preNormalizeHandler(
  createdAt: string,
  handler: FlogoAppModel.Handler
): Partial<Handler> {
  return {
    ...normalizeHandlerMappings(handler),
    settings: normalizeSettingsWithPrefix(handler.settings),
    outputs: {},
    createdAt,
    updatedAt: null,
  };
}

function transformHandlerSettings(handlers, triggerSchema, importsRefAgent) {
  return handlers.map(handler => {
    if (handler?.settings) {
      handler.settings = transformConnectionSettingsRefs(
        handler.settings,
        triggerSchema?.handler?.settings,
        importsRefAgent
      );
    }
    return handler;
  });
}

function transformConnectionSettingsRefs(
  settings: FlogoAppModel.Settings,
  schemaSettings: SchemaSettingAttributeDescriptor[],
  importsRefAgent: ImportsRefAgent
) {
  const connectionTypeSettings = schemaSettings?.filter(
    setting => setting.type === TYPE_CONNECTION.Connection
  );
  if (connectionTypeSettings && connectionTypeSettings.length) {
    connectionTypeSettings.forEach(connection => {
      const connectionSetting = settings[connection.name];
      if (connectionSetting) {
        connectionSetting.ref = getPackageRef(
          importsRefAgent,
          ContributionType.Connection,
          connectionSetting.ref
        );
      }
    });
  }
  return settings;
}

function getPackageRef(
  importsRefAgent: ImportsRefAgent,
  contribType: ContributionType,
  ref: string
) {
  return importsRefAgent.getPackageRef(contribType, ref);
}
