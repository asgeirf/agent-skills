import {
  ReactFlow,
  Background,
} from '@xyflow/react';
import DynamicNode from './DynamicNode.jsx';
import TableNode from './TableNode.jsx';
import CardNode from './CardNode.jsx';
import PillNode from './PillNode.jsx';
import LabeledEdge from './LabeledEdge.jsx';

const nodeTypes = { dynamic: DynamicNode, table: TableNode, card: CardNode, pill: PillNode };
const edgeTypes = { labeled: LabeledEdge };

function GraphCanvas({ nodes, edges, onNodesChange, onEdgesChange, onNodeClick, onInit }) {
  return (
    <div style={{ flex: 1, height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onInit={onInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        minZoom={0.1}
        maxZoom={4}
      >
        <Background variant="dots" gap={20} size={1} color="#ffffff10" />
      </ReactFlow>
    </div>
  );
}

export default GraphCanvas;
