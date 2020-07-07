import { FlowGraph, GraphNode } from '@flogo-web/lib-client/core';
import { BRANCH_PREFIX } from '@flogo-web/lib-client/diagram';
import { isNil } from 'lodash';

export function insertNode(
  flowGraph: FlowGraph,
  node: GraphNode,
  parentId?: string,
): FlowGraph {
  let parent = flowGraph.nodes[parentId];
  let nodes = flowGraph.nodes;
  let rootId = flowGraph.rootId;
  if (parent) {
    const { branches, nonBranches } = categorizeChildren(parent);
    const isInBetween = nonBranches.length > 0;
    if (isInBetween) {
      node = {
        ...node,
        children: [...nonBranches],
      };
      parent = { ...parent, children: [...branches, node.id] };
    } else {
      parent = { ...parent, children: [...parent.children, node.id] };
    }
    nodes = {
      ...nodes,
      [parent.id]: { ...parent },
    };
  } else {
    // Case: adding a tile before the root tile of the diagram
    // If parent is null and diagram has rootId
    if (!isNil(rootId)) {
      const child = {
        ...nodes[flowGraph.rootId],
        parents: [node.id],
      };
      node = {
        ...node,
        children: [flowGraph.rootId],
      };
      nodes = {
        ...nodes,
        [child.id]: child,
      };
    }
    rootId = node.id;
  }
  return {
    ...flowGraph,
    rootId,
    nodes: {
      ...nodes,
      [node.id]: node,
    },
  };
}

function categorizeChildren(node) {
  return {
    branches: getBranchChildren(node),
    nonBranches: getNonBranchChild(node),
  }
}

function getBranchChildren(node) {
  return node.children.filter(child => child.startsWith(BRANCH_PREFIX));
}

function getNonBranchChild(node) {
  return node.children.filter(child => !child.startsWith(BRANCH_PREFIX));
}
