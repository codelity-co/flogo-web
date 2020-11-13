import { ValueType } from '@flogo-web/core';
import { MapperControllerFactory } from '@flogo-web/lib-client/mapper';
import { CurrentTriggerState } from '../interfaces';
import { ConfigureTriggerSchema, ConfigureTriggersMock } from '../mocks/triggers.mock';
import { ConfigureDetailsService } from './details.service';
import { SettingsFormBuilder } from './settings-form-builder';
import { makeSnippet, MapperTranslator } from '../../../shared/mapper';
import SpyObj = jasmine.SpyObj;

describe('Service: ConfigureDetailsService', function(this: {
  testService: ConfigureDetailsService;
  settingsFormBuilder: SpyObj<SettingsFormBuilder>;
  mapperControllerFactory: SpyObj<MapperControllerFactory>;
}) {
  const MockData: CurrentTriggerState = {
    appId: 'test_app',
    appProperties: [],
    ...ConfigureTriggersMock[0],
    schema: ConfigureTriggerSchema,
    fields: {
      settings: [],
    },
    flowMetadata: {
      input: [],
      output: [
        {
          name: 'myOutput',
          type: ValueType.Any,
          value: null,
        },
      ],
    },
    functions: [],
  };

  beforeEach(() => {
    this.settingsFormBuilder = jasmine.createSpyObj<SettingsFormBuilder>(
      'settingsFormBuilder',
      ['build']
    );
    this.mapperControllerFactory = jasmine.createSpyObj('mapperControllerFactory', [
      'createController',
    ]);
    const nameAsyncValidator = jasmine.createSpyObj('triggerNameValidatorService', [
      'create',
    ]);
    this.testService = new ConfigureDetailsService(
      this.settingsFormBuilder,
      this.mapperControllerFactory,
      nameAsyncValidator
    );
  });

  it('Should disable the common settings when the trigger has multiple handlers', () => {
    this.settingsFormBuilder.build.and.callFake(function() {
      expect(arguments[2]).toEqual(true);
    });
    this.testService.build(MockData);
    expect(this.settingsFormBuilder.build).toHaveBeenCalled();
  });

  it('Should create a reply mapper with the correct arguments', () => {
    this.mapperControllerFactory.createController.and.callFake((...args) => args);
    this.testService.build(MockData);
    expect(
      this.mapperControllerFactory.createController.calls.mostRecent().args
    ).toEqual([
      MockData.schema.reply,
      MockData.flowMetadata.output,
      MockData.handler.actionMappings.output,
      MockData.functions,
      makeSnippet,
      MapperTranslator,
    ]);
  });
});
