import { InstalledFunctionSchema } from '@flogo-web/lib-client/core';
import {
  AttributeDescriptor,
  MapperTranslator,
  StaticMapperContextFactory,
} from '../../utils';

export function createMapperContext(
  input: AttributeDescriptor[],
  output: any[],
  handlerMappings: any[],
  functions: InstalledFunctionSchema[]
) {
  const inputSchema = MapperTranslator.attributesToObjectDescriptor(input || []);
  const outputSchema = MapperTranslator.createOutputSchema(output || []);
  const mappings = MapperTranslator.translateMappingsIn(handlerMappings || []);
  return StaticMapperContextFactory.create(
    inputSchema,
    outputSchema,
    mappings,
    functions
  );
}
