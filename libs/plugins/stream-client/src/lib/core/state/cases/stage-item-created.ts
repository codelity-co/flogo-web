import { DiagramGraph, GraphNode, NodeType } from '@flogo-web/lib-client/core';

import { FlogoStreamState } from '../stream.state';
import { StageItemCreated } from '../stream.actions';
import { makeStageSelection } from '../../models/stream/selection';
import { ITEMS_DICTIONARY_NAME, GRAPH_NAME } from '../../constants';

export function stageItemCreated(
  state: FlogoStreamState,
  payload: StageItemCreated['payload']
): FlogoStreamState {
  const { item, node } = payload;
  const itemsDictionary = state[ITEMS_DICTIONARY_NAME];
  state = {
    ...state,
    currentSelection: makeStageSelection(node.id),
    [GRAPH_NAME]: addNewNode(state[GRAPH_NAME], node as GraphNode),
    [ITEMS_DICTIONARY_NAME]: {
      ...itemsDictionary,
      [item.id]: { ...item },
    },
  };
  return state;
}

function addNewNode(graph: DiagramGraph, newNode: GraphNode): DiagramGraph {
  const parents = newNode.parents || [];
  const [parentId] = parents;
  const node: GraphNode = {
    ...newNode,
    type: NodeType.Task,
    parents: parentId ? [parentId] : [],
    children: [],
    features: {
      canBranch: false,
      canHaveChildren: true,
      deletable: true,
      ...newNode.features,
    },
    status: {},
  };
  const parent = graph.nodes[parentId];
  let nodes = graph.nodes;
  if (parent) {
    nodes = {
      ...nodes,
      [parent.id]: { ...parent, children: [node.id] },
    };
  } else {
    graph = {
      ...graph,
      rootId: node.id,
    };
  }
  return {
    ...graph,
    nodes: {
      ...nodes,
      [node.id]: node,
    },
  };
}
