import { FlowGraph, GraphNode, NodeType } from '@flogo-web/lib-client/core';
import { BRANCH_PREFIX } from '@flogo-web/lib-client/diagram';

export function insertNode(
  flowGraph: FlowGraph,
  node: GraphNode,
  parentId?: string,
  insertBetween?: boolean
): FlowGraph {
  let parent = flowGraph.nodes[parentId];
  let nodes = flowGraph.nodes;
  let rootId = flowGraph.rootId;
  if (parent) {
    if (insertBetween) {
      const nonBranchChild = getNonBranchChild(parent);
      node = {
        ...node,
        children: [...nonBranchChild],
      };
      parent = { ...parent, children: [...getBranchChildren(parent), node.id] };
    } else {
      parent = { ...parent, children: [...parent.children, node.id] };
    }
    nodes = {
      ...nodes,
      [parent.id]: { ...parent },
    };
  } else {
    // case when adding a tile before the root tile of the diagram
    if (insertBetween) {
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

function getBranchChildren(node) {
  return node.children.filter(child => child.startsWith(BRANCH_PREFIX));
}

function getNonBranchChild(node) {
  return node.children.filter(child => !child.startsWith(BRANCH_PREFIX));
}
