import { Injectable } from '@angular/core';
import { InstalledFunctionSchema } from '@flogo-web/lib-client/core';
import {
  MapperContext,
  MapperTreeNode,
  Mappings,
  MapExpression,
  MapperState,
  MapperSchema,
  OutputContext,
} from '../../models';
import { ArrayMappingHelper, ArrayMappingInfo } from '../../models/array-mapping';
import { AttributeDescriptor } from '../../utils';
import { TreeService } from '../tree.service';
import { TreeNodeFactoryService } from '../tree-node-factory.service';
import { MapperController } from './mapper-controller';
import { createMapperContext } from './create-mapper-context';

@Injectable()
export class MapperControllerFactory {
  constructor(
    private nodeFactory: TreeNodeFactoryService,
    private treeService: TreeService
  ) {}

  createController(
    input: AttributeDescriptor[],
    output: AttributeDescriptor[],
    mappings: any,
    functions: InstalledFunctionSchema[],
    makeSnippet: (nodes) => string,
    MapperTranslator
  ): MapperController {
    const context = createMapperContext(input, output, mappings, functions, MapperTranslator);
    return new MapperController(
      this.createStateFromContext(context, makeSnippet),
      this.nodeFactory,
      this.treeService
    );
  }

  createNodeFromSchema(schema: MapperSchema, makeSnippet: (nodes) => string): MapperTreeNode {
    const [node] = this.createOutputTree(schema, makeSnippet);
    return node;
  }

  private createStateFromContext(context: MapperContext, makeSnippet: (nodes) => string) {
    const newState = this.getInitialState();
    newState.mappings = context.mappings || {};
    const flattenedMappings = this.nodeFactory.flatMappings(newState.mappings);
    const nodeList = this.nodeFactory.fromJsonSchema(
      context.inputSchemas,
      (treeNode: MapperTreeNode, level, path, parents: MapperTreeNode[]) => {
        treeNode.data.level = level;
        const expression = flattenedMappings[path];
        treeNode.data.expression = expression || null;
        return treeNode;
      }
    );
    const [firstNode] = nodeList;
    newState.mappingKey = firstNode ? firstNode.path : null;
    if (firstNode) {
      newState.mappingKey = firstNode.path;
      const { outputs, functions } = this.getSelectionContext(
        firstNode,
        newState.mappings,
        context,
        makeSnippet
      );
      newState.outputs.nodes = outputs;
      newState.functions.nodes = functions;
    }
    newState.inputs.nodes = nodeList.reduce((nodes, node) => {
      nodes[node.path] = node;
      return nodes;
    }, {} as { [path: string]: MapperTreeNode });
    return newState;
  }

  private getSelectionContext(
    node: MapperTreeNode,
    mappings: Mappings,
    context: MapperContext,
    makeSnippet: (nodes) => string
  ): { functions: MapperTreeNode[]; outputs: MapperTreeNode[] } {
    if (node) {
      const outputContext = this.makeOutputContext(node, context.outputSchemas, mappings, makeSnippet);
      return {
        outputs: outputContext.tree,
        functions: this.nodeFactory.fromFunctions(context.functions),
      };
    } else {
      return { functions: [], outputs: [] };
    }
  }

  private makeOutputContext(
    selectedNode: MapperTreeNode,
    outputSchemas: any,
    allMappings: Mappings,
    makeSnippet: (nodes) => string
  ): OutputContext {
    const arrayParentsOfSelectedNode = this.treeService.extractArrayParents(selectedNode);
    let mappings = allMappings;
    // const mappedOutputArrays = this.extractLinkedOutputArrays(arrayParents, allMappings);

    const isMappedParent = (p: ArrayMappingInfo) => p.isForEach; // && p.params.length > 0;

    let mappingKey = selectedNode.path;
    const selectedNodeHasArrayParents =
      arrayParentsOfSelectedNode && arrayParentsOfSelectedNode.length > 0;
    let hasMappedArrayParents = false;
    let mappedOutputArrays = this.extractLinkedOutputArrayPaths(
      arrayParentsOfSelectedNode,
      allMappings
    );
    let lastMappedParent = null;
    if (selectedNodeHasArrayParents) {
      const closestArrayParent =
        arrayParentsOfSelectedNode[arrayParentsOfSelectedNode.length - 1];
      mappedOutputArrays = this.extractLinkedOutputArrayPaths(
        arrayParentsOfSelectedNode,
        allMappings
      );
      hasMappedArrayParents =
        mappedOutputArrays &&
        mappedOutputArrays.length > 0 &&
        mappedOutputArrays.some(p => isMappedParent(p));
      mappingKey = this.makeRelativeNodePath(selectedNode, closestArrayParent);
      const closestArrayParentExpression = closestArrayParent.data.expression || '';
      if (!hasMappedArrayParents || !closestArrayParentExpression.trim()) {
        return null;
      }
      if (hasMappedArrayParents) {
        // outputSchemas = this.nodeFactory.applyArrayFilterToJsonSchema(outputSchemas, mappedOutputArrays);
        lastMappedParent = <ArrayMappingInfo>(
          [...mappedOutputArrays].reverse().find(p => isMappedParent(p))
        );
      }
      mappings = this.getSubMappings(
        arrayParentsOfSelectedNode.concat(selectedNode),
        mappings
      );
    }
    const tree = this.createOutputTree(outputSchemas, makeSnippet);

    /// SYMBOL TABLE necessary for validation only, disabling for now
    const symbolTable = {};
    return {
      mappings,
      tree,
      mappingKey,
      mapRelativeTo: lastMappedParent && lastMappedParent.fullLinkedPath,
      symbolTable,
    };
  }

  private createOutputTree(outputSchemas: MapperSchema, makeSnippet: (nodes) => string) {
    return this.nodeFactory.fromJsonSchema(
      outputSchemas,
      (
        treeNode: MapperTreeNode,
        level: number,
        path: string,
        parents: MapperTreeNode[]
      ): MapperTreeNode => {
        const parentsAndCurrentNode = parents.concat(treeNode);
        treeNode.snippet = makeSnippet(parentsAndCurrentNode);
        return treeNode;
      }
    );
  }

  private makeRelativeNodePath(childNode: MapperTreeNode, parentNode: { path?: string }) {
    // a.b.c.x.y - a.b.c = $.x.y
    return '$' + childNode.path.slice(parentNode.path.length);
  }

  private extractLinkedOutputArrayPaths(
    arrayNodes: MapperTreeNode[],
    mappings: Mappings
  ): ArrayMappingInfo[] {
    if (!arrayNodes || arrayNodes.length <= 0 || !mappings) {
      return [];
    }

    const nodes = [...arrayNodes];
    const rootArrayNode = nodes.shift();
    let mapping: MapExpression = nodes ? mappings[rootArrayNode.path] : null;
    const isEmptyExpression = m => !m.expression || !m.expression.trim();
    if (!mapping || isEmptyExpression(mapping)) {
      return [];
    }

    let prevNode = rootArrayNode;
    let node = nodes.shift();

    const linkedArrayPaths = [];
    let processedExpression = ArrayMappingHelper.processExpressionForEach(
      <string>mapping.expression
    );
    processedExpression.node = rootArrayNode;
    processedExpression.fullLinkedPath =
      mapping.parsedExpressionDetails.memberReferences[0];
    linkedArrayPaths.push(processedExpression);

    while (mapping && node) {
      const relativePath = this.makeRelativeNodePath(node, prevNode);
      mapping = mapping.mappings ? mapping.mappings[relativePath] : null;
      if (mapping && !isEmptyExpression(mapping)) {
        processedExpression = ArrayMappingHelper.processExpressionForEach(
          <string>mapping.expression
        );
        processedExpression.node = node;
        const hasMemberReferences =
          mapping.parsedExpressionDetails &&
          mapping.parsedExpressionDetails.memberReferences;
        processedExpression.fullLinkedPath = hasMemberReferences
          ? mapping.parsedExpressionDetails.memberReferences[0]
          : relativePath;
        linkedArrayPaths.push(processedExpression);
      }
      prevNode = node;
      node = nodes.shift();
    }
    return linkedArrayPaths;
  }

  private getSubMappings(arrayNodes: MapperTreeNode[], mappings: Mappings): Mappings {
    const resultSubmappings = arrayNodes
      .slice(0)
      .reverse()
      .map((node: MapperTreeNode, i: number, nodes: MapperTreeNode[]) => {
        const parentArrayNode = nodes[i + 1];
        if (parentArrayNode) {
          return this.makeRelativeNodePath(node, parentArrayNode);
        }
        return node.path;
      })
      .reverse()
      .reduce<{ mappings: Mappings }>(
        (
          submapping: { mappings: Mappings },
          arrayPath: string,
          currentIndex: number,
          paths: string[]
        ) => {
          if (paths[currentIndex + 1]) {
            if (!submapping.mappings[arrayPath]) {
              submapping.mappings[arrayPath] = <any>{
                expression: '',
                mappings: <any>{},
              };
            }
            submapping = <{ mappings: Mappings }>(<any>submapping.mappings[arrayPath]);
          }
          return submapping;
        },
        { mappings }
      );

    return resultSubmappings.mappings;
  }

  private getInitialState(): MapperState {
    return {
      isDirty: false,
      isValid: true,
      mappings: {},
      inputs: {
        filterTerm: null,
        nodes: {},
      },
      outputs: {
        filterTerm: null,
        nodes: [],
      },
      functions: {
        filterTerm: null,
        nodes: [],
      },
    };
  }
}
