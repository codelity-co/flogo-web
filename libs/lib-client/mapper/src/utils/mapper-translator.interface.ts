import { AttributeDescriptor, Mappings } from '@flogo-web/lib-client/mapper';
import {
  FlowMetadata,
  MapperSchema,
  Properties as MapperSchemaProperties,
} from '../../../../plugins/flow-client/src/lib/task-configurator/models';
import { Task } from '../../../../plugins/flow-client/src/lib/core';
import { Dictionary } from '@flogo-web/lib-client/core';

// adjust imports

export type MappingsValidatorFn = (mappings: Mappings) => boolean;

export interface IMapperTranslator {
  createInputSchema(tile: Task): MapperSchema;
  // output params are different
  createOutputSchema(
    tiles: Array<Task | FlowMetadata>,
    additionalSchemas?: MapperSchemaProperties,
    includeEmptySchemas?: boolean
  ): MapperSchema;
  attributesToObjectDescriptor(
    attributes: AttributeDescriptor[],
    additionalProps?: { [key: string]: any }
  ): MapperSchema;
  translateMappingsIn(inputMappings: any);
  rawExpressionToString(rawExpression: any, inputType: number);
  translateMappingsOut(mappings: {
    [attr: string]: { expression: string; mappingType?: number };
  }): Dictionary<any>;
  parseExpression(expression: string);
  // params are different
  getRootType(tile: Task | FlowMetadata);
  makeValidator(): MappingsValidatorFn;
  isValidExpression(expression: any);
}
