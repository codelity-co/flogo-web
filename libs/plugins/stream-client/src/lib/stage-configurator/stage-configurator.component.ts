import { cloneDeep, defaultsDeep, isEmpty } from 'lodash';
import { select, Store } from '@ngrx/store';
import { switchMap, takeUntil, skip } from 'rxjs/operators';
import { Subscription, of } from 'rxjs';

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';

import { ActivitySchema, ICON_ACTIVITY_DEFAULT } from '@flogo-web/core';
import {
  Dictionary,
  SingleEmissionSubject,
  HttpUtilsService,
  InstalledFunctionSchema,
} from '@flogo-web/lib-client/core';
import { formatConnectionTypeSettings } from '@flogo-web/lib-client/activity-configuration';
import { hasStageWithSameName } from '@flogo-web/plugins/stream-core';

import {
  FlogoStreamState,
  selectStreamState,
  selectStageConfigure,
  getInstalledFunctions,
  CancelStageConfiguration,
  Item,
  CommitStageConfiguration,
  ROOT_TYPES,
} from '../core';
import {
  MapperTranslator,
  MapperControllerFactory,
  MapperController,
} from '../shared/mapper';
import { Tabs } from '../shared/tabs/models/tabs.model';
import { StreamMetadata } from './models';
import { SchemaOutputs } from '../core/interfaces/schema-outputs';

const TASK_TABS = {
  INPUT_MAPPINGS: 'inputMappings',
  OUTPUT_MAPPINGS: 'outputMappings',
  SETTINGS: 'settings',
};
const INPUT_MAPPINGS_TAB_INFO = {
  name: TASK_TABS.INPUT_MAPPINGS,
  labelKey: 'TASK-CONFIGURATOR:TABS:MAP-INPUTS',
};
const OUTPUT_MAPPINGS_TAB_INFO = {
  name: TASK_TABS.OUTPUT_MAPPINGS,
  labelKey: 'TASK-CONFIGURATOR:TABS:MAP-OUTPUTS',
};
const SETTINGS_TAB_INFO = {
  name: TASK_TABS.SETTINGS,
  labelKey: 'TASK-CONFIGURATOR:TABS:SETTINGS',
};

@Component({
  selector: 'flogo-stream-stage-configurator',
  styleUrls: ['stage-configurator.component.less'],
  templateUrl: 'stage-configurator.component.html',
  animations: [
    trigger('dialog', [
      transition('void => *', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('250ms ease-in'),
      ]),
      transition('* => void', [
        animate('250ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 })),
      ]),
    ]),
  ],
})
export class StageConfiguratorComponent implements OnInit, OnDestroy {
  @Input() iconIndex: { [itemId: string]: string };

  streamState: FlogoStreamState;
  activitySchemaUrl: string;
  activitySchema: ActivitySchema;
  currentTile: Item;
  inputScope: any[];
  outputScope: any[];
  tabs: Tabs;

  isActive = false;
  title: string;
  isValidTaskName: boolean;
  isTaskDetailEdited: boolean;
  inputMapperController: MapperController;
  settingsController: MapperController;
  outputMapperController: MapperController;
  installedFunctions: InstalledFunctionSchema[];
  iconUrl: string;

  private inputMapperStateSubscription: Subscription;
  private activitySettingsStateSubscription: Subscription;
  private outputMapperStateSubscription: Subscription;
  private contextChange$ = SingleEmissionSubject.create();
  private destroy$ = SingleEmissionSubject.create();

  constructor(
    private store: Store<FlogoStreamState>,
    private mapperControllerFactory: MapperControllerFactory,
    private httpUtilsService: HttpUtilsService
  ) {}

  ngOnInit(): void {
    this.store
      .pipe(
        select(selectStageConfigure),
        switchMap(itemId => (itemId ? this.store.select(selectStreamState) : of(null))),
        takeUntil(this.destroy$)
      )
      .subscribe(state => {
        if (state && state.stageConfigure) {
          this.initConfiguration(state);
        } else if (this.isActive) {
          this.close();
        }
      });
    this.store
      .pipe(select(getInstalledFunctions), takeUntil(this.destroy$))
      .subscribe(functions => {
        this.installedFunctions = functions;
      });
  }

  initConfiguration(state: FlogoStreamState) {
    this.streamState = state;
    const itemId = state.stageConfigure;
    this.ensurePreviousContextCleanup();
    this.contextChange$ = SingleEmissionSubject.create();

    this.currentTile = cloneDeep(state.mainItems[itemId]);
    this.activitySchema = (state.schemas[this.currentTile.ref] || {}) as ActivitySchema;
    this.activitySchemaUrl = this.activitySchema.homepage;
    this.title = this.currentTile.name;

    this.isValidTaskName = true;
    this.isTaskDetailEdited = false;

    this.iconUrl = ICON_ACTIVITY_DEFAULT;
    if (this.activitySchema && this.activitySchema.icon) {
      this.iconUrl = this.httpUtilsService.apiPrefix(this.activitySchema.icon);
    }

    this.resetState();

    const streamMetadata = this.getStreamMetadata(state);

    this.inputScope = this.getInputScope(itemId, state, streamMetadata);
    const { propsToMap, mappings } = this.getInputMappingsInfo(this.activitySchema);
    this.initInputMappings(propsToMap, this.inputScope, mappings);

    const { settingPropsToMap, activitySettings } = this.getActivitySettingsInfo(
      this.activitySchema
    );
    this.initActivitySettings(settingPropsToMap, activitySettings);

    this.outputScope = this.getOutputScope(this.activitySchema);
    const { outputPropsToMap, outputMappings } = this.getOutputMappingsInfo(
      streamMetadata
    );
    this.initOutputMappings(outputPropsToMap, this.outputScope, outputMappings);

    this.setSelectTab(settingPropsToMap);

    this.open();
  }

  private getInputScope(stageId, state, streamMetadata) {
    const { mainGraph } = state;
    const scope = [{ ...streamMetadata }];
    const prevStageSchema = this.getPrevStageSchema(stageId, mainGraph, state);
    const schemaOutputs = this.getSchemaOutputs(prevStageSchema, 'previousStage');
    if (schemaOutputs) {
      scope.push(schemaOutputs);
    }
    return scope;
  }

  private getSchemaOutputs(schema, stage): SchemaOutputs {
    if (!isEmpty(schema)) {
      return {
        type: schema.type,
        stage,
        outputs: schema.outputs,
      };
    }
    return null;
  }

  private getOutputScope(activitySchema) {
    const scope = [];
    const currentSchemaOutputs = this.getSchemaOutputs(activitySchema, 'currentStage');
    if (currentSchemaOutputs) {
      scope.push(currentSchemaOutputs);
    }
    return scope;
  }

  private getPrevStageSchema(stageId, graph, state) {
    const { mainItems } = state;
    const selectedNode = graph.nodes[stageId];
    if (stageId !== graph.rootId && !isEmpty(selectedNode.parents)) {
      const [prevNode] = selectedNode.parents;
      const prevStage = mainItems[prevNode];
      const activityRef = prevStage['ref'];
      return state.schemas[activityRef];
    }
    return null;
  }

  private getStreamMetadata(streamState: FlogoStreamState): StreamMetadata {
    return defaultsDeep({ type: 'metadata' }, streamState.metadata, {
      input: [],
      output: [],
    });
  }

  private getInputMappingsInfo(
    activitySchema
  ): { propsToMap: any[]; mappings: Dictionary<any> } {
    const mappings = this.currentTile.inputMappings;
    const propsToMap = activitySchema.inputs;
    return { mappings, propsToMap };
  }

  private getActivitySettingsInfo(
    activitySchema
  ): { settingPropsToMap: any[]; activitySettings: { [settingName: string]: any } } {
    const activitySettings = this.currentTile.activitySettings;
    const settingPropsToMap = activitySchema.settings;
    return { activitySettings, settingPropsToMap };
  }

  private getOutputMappingsInfo(
    streamMetadata
  ): { outputPropsToMap: any[]; outputMappings: Dictionary<any> } {
    const outputMappings = this.currentTile.output;
    let outputPropsToMap = streamMetadata ? streamMetadata.output : [];
    if (outputPropsToMap) {
      outputPropsToMap = this.normalizeOutputs(outputPropsToMap);
    }
    return { outputMappings, outputPropsToMap };
  }

  private normalizeOutputs(outputs) {
    return outputs.map(output => ({
      ...output,
      name: `${ROOT_TYPES.PIPELINE}.${output.name}`,
    }));
  }

  private initInputMappings(propsToMap, scope, mappings) {
    const {
      subscription,
      controller,
    } = this.configureMappingsController(
      TASK_TABS.INPUT_MAPPINGS,
      this.inputMapperStateSubscription,
      { propsToMap, scope, mappings }
    );
    this.inputMapperStateSubscription = subscription;
    this.inputMapperController = controller;
  }

  private initActivitySettings(settingPropsToMap, activitySettings) {
    const {
      subscription,
      controller,
    } = this.configureMappingsController(
      TASK_TABS.SETTINGS,
      this.activitySettingsStateSubscription,
      { propsToMap: settingPropsToMap, scope: [], mappings: activitySettings }
    );
    this.activitySettingsStateSubscription = subscription;
    this.settingsController = controller;
  }

  private initOutputMappings(outputPropsToMap, scope = [], outputMappings) {
    const {
      subscription,
      controller,
    } = this.configureMappingsController(
      TASK_TABS.OUTPUT_MAPPINGS,
      this.outputMapperStateSubscription,
      { propsToMap: outputPropsToMap, scope, mappings: outputMappings }
    );
    this.outputMapperStateSubscription = subscription;
    this.outputMapperController = controller;
  }

  private configureMappingsController(
    tabType: string,
    prevSubscription: Subscription,
    { propsToMap, scope, mappings }
  ) {
    if (prevSubscription && !prevSubscription.closed) {
      prevSubscription.unsubscribe();
    }
    const controller = this.mapperControllerFactory.createController(
      propsToMap,
      scope,
      mappings,
      this.installedFunctions
    );
    const subscription = controller.status$
      .pipe(skip(1), takeUntil(this.contextChange$))
      .subscribe(({ isValid, isDirty }) => {
        const selectedTab = this.tabs.get(tabType);
        selectedTab.isValid = isValid;
        selectedTab.isDirty = isDirty;
      });
    return { controller, subscription };
  }

  private setSelectTab(settingPropsToMap) {
    if (!isEmpty(settingPropsToMap)) {
      this.selectTab(TASK_TABS.SETTINGS);
    } else {
      this.tabs.get(TASK_TABS.SETTINGS).enabled = false;
      this.selectTab(TASK_TABS.INPUT_MAPPINGS);
    }
  }

  private resetState() {
    if (this.tabs) {
      this.tabs.clear();
    }
    const tabsInfo = [
      SETTINGS_TAB_INFO,
      INPUT_MAPPINGS_TAB_INFO,
      OUTPUT_MAPPINGS_TAB_INFO,
    ];
    this.tabs = Tabs.create(tabsInfo);
  }

  selectTab(name: string) {
    const selectedTab = this.tabs.get(name);
    if (selectedTab.enabled) {
      this.tabs.markSelected(name);
    }
  }

  private open() {
    this.isActive = true;
  }

  private close() {
    if (!this.contextChange$.closed) {
      this.contextChange$.emitAndComplete();
    }
    this.isActive = false;
  }

  changeStageDetail(content, property) {
    this.isTaskDetailEdited = true;
    if (property === 'name') {
      const repeatedName = hasStageWithSameName(content, this.streamState.mainItems);
      if ((repeatedName && content !== this.currentTile.name) || content === '') {
        this.isValidTaskName = false;
      } else {
        this.isValidTaskName = true;
        this.title = content;
      }
    }
  }

  cancel() {
    this.store.dispatch(new CancelStageConfiguration());
  }

  save() {
    let activitySettings = this.settingsController
      ? MapperTranslator.translateMappingsOut(
          this.settingsController.getCurrentState().mappings
        )
      : undefined;
    if (activitySettings) {
      activitySettings = formatConnectionTypeSettings(
        activitySettings,
        this.activitySchema
      );
    }
    const item: Partial<Item> = {
      id: this.currentTile.id,
      name: this.title,
      description: this.currentTile.description,
      inputMappings: MapperTranslator.translateMappingsOut(
        this.inputMapperController.getCurrentState().mappings
      ),
      activitySettings,
      output: MapperTranslator.translateMappingsOut(
        this.outputMapperController.getCurrentState().mappings
      ),
    };
    this.store.dispatch(new CommitStageConfiguration(item));
  }

  trackTabsByFn(index, [tabName, tab]) {
    return tabName;
  }

  private ensurePreviousContextCleanup() {
    if (this.contextChange$ && !this.contextChange$.isStopped) {
      this.contextChange$.emitAndComplete();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.emitAndComplete();
  }
}
