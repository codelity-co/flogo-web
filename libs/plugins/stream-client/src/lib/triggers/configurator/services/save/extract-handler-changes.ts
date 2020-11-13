import { fromPairs, isEqual } from 'lodash';
import { FormGroup } from '@angular/forms';
import { Dictionary, TriggerHandler } from '@flogo-web/lib-client/core';
import { MapperController} from '@flogo-web/lib-client/mapper';
import { MapperTranslator } from '../../../../shared/mapper';
import { SettingControlGroup } from '../../interfaces';
import { SaveParams } from './save-params';
import { convertSettingsFormValues } from './convert-setting-form-values';

export function extractHandlerChanges(
  oldHandler: TriggerHandler,
  { settings, streamInputMapper, replyMapper }: SaveParams
) {
  const changes = [];
  const settingChanges = checkForSettingChanges(settings);
  if (settingChanges) {
    changes.push(['settings', settingChanges]);
  }
  const mappingChanges = checkForMappingChanges(
    oldHandler,
    streamInputMapper,
    replyMapper
  );
  if (mappingChanges) {
    changes.push(['actionMappings', mappingChanges]);
  }
  return changes.length > 0 ? fromPairs(changes) : null;
}

function checkForSettingChanges(settings: FormGroup) {
  if (!settings && !settings.dirty) {
    return null;
  }
  const handlerSettingsControl = settings.get(SettingControlGroup.HANDLER) as FormGroup;
  if (handlerSettingsControl && handlerSettingsControl.dirty) {
    return convertSettingsFormValues(handlerSettingsControl);
  }
  return null;
}

function checkForMappingChanges(
  prevHandler: TriggerHandler,
  streamInputMapper?: MapperController,
  replyMapper?: MapperController
) {
  const originalMappings = prevHandler.actionMappings;
  let newMappings = originalMappings;
  if (streamInputMapper) {
    newMappings = { ...newMappings, input: extractMappings(streamInputMapper) };
  }
  if (replyMapper) {
    newMappings = { ...newMappings, output: extractMappings(replyMapper) };
  }
  return !isEqual(newMappings, originalMappings) ? newMappings : null;
}

function extractMappings(mapperController: MapperController): Dictionary<any> {
  return MapperTranslator.translateMappingsOut(mapperController.getMappings());
}
