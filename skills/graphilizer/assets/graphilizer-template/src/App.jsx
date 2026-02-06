import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ReactFlowProvider, applyNodeChanges } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraphData } from './hooks/useGraphData.js';
import { useAutoLayout } from './hooks/useAutoLayout.js';
import { useSearch, buildSearchIndex, getNeighborhood } from './hooks/useSearch.js';
import { computeRadialLayout, assignEdgeHandles } from './utils/layout.js';

import GraphCanvas from './components/GraphCanvas.jsx';
import SearchPanel from './components/SearchPanel.jsx';
import DetailPanel from './components/DetailPanel.jsx';
import Toolbar from './components/Toolbar.jsx';
import Timeline from './components/Timeline.jsx';

function GraphilizerApp() {
  const { nodes: rawNodes, edges: rawEdges, settings, groups, nodeTypes, edgeTypes } = useGraphData();

  const layoutDirection = settings.layout?.direction || 'TB';

  // Full graph auto-layout
  const allLayoutedNodes = useAutoLayout(rawNodes, rawEdges, layoutDirection, settings);

  // Search index for autocomplete (stable)
  const searchIndex = useMemo(
    () => buildSearchIndex(allLayoutedNodes, rawEdges),
    [allLayoutedNodes, rawEdges]
  );

  // Type/group filter state
  const search = useSearch(allLayoutedNodes, rawEdges);

  // Selection + depth state
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [focusDepth, setFocusDepth] = useState(2);
  const [rfInstance, setRfInstance] = useState(null);

  // Timeline state
  const hasTimeline = useMemo(
    () => rawEdges.some((e) => e.data?.order != null),
    [rawEdges]
  );
  const globalMaxOrder = useMemo(
    () => hasTimeline ? Math.max(...rawEdges.filter((e) => e.data?.order != null).map((e) => e.data.order)) : 0,
    [rawEdges, hasTimeline]
  );
  const [timelineStep, setTimelineStep] = useState(globalMaxOrder);
  const [timelineActive, setTimelineActive] = useState(false);

  const handleTimelineStep = useCallback((v) => {
    setTimelineActive(true);
    setTimelineStep(v);
  }, []);

  // Compute focused subgraph from ALL edges (not timeline-filtered)
  // so the full neighborhood structure is known
  const focusGraph = useMemo(() => {
    if (!selectedNodeId) return null;

    const neighborIds = getNeighborhood(selectedNodeId, rawEdges, focusDepth);
    const subNodes = allLayoutedNodes
      .filter((n) => n.type !== 'group' && neighborIds.has(n.id))
      .map((n) => ({ ...n, parentId: undefined, position: { x: 0, y: 0 } }));
    const subEdges = rawEdges.filter(
      (e) => neighborIds.has(e.source) && neighborIds.has(e.target)
    );
    const layouted = computeRadialLayout(subNodes, subEdges, selectedNodeId);
    return { nodes: layouted, edges: subEdges };
  }, [selectedNodeId, focusDepth, allLayoutedNodes, rawEdges]);

  // Reset timeline to max of scoped edges when focus graph changes
  const prevFocusRef = useRef(focusGraph);
  if (prevFocusRef.current !== focusGraph) {
    prevFocusRef.current = focusGraph;
    const scopedEdges = focusGraph ? focusGraph.edges : rawEdges;
    const scopedOrdered = scopedEdges.filter((e) => e.data?.order != null);
    if (scopedOrdered.length > 0) {
      const scopedMax = Math.max(...scopedOrdered.map((e) => e.data.order));
      setTimelineStep(scopedMax);
    }
  }

  // All edges for the current view (unfiltered by timeline) — used by Timeline
  const allViewEdges = focusGraph ? focusGraph.edges : rawEdges;

  // Choose which nodes to show
  const baseNodes = focusGraph ? focusGraph.nodes : allLayoutedNodes;

  // Assign handles + mark timeline state (future/active/past) on each edge
  const baseEdges = useMemo(() => {
    const withHandles = assignEdgeHandles(baseNodes, allViewEdges);
    if (!hasTimeline || !timelineActive) return withHandles;
    return withHandles.map((e) => {
      const order = e.data?.order;
      if (order == null) return e; // non-ordered edges stay normal
      let timelineState;
      if (order > timelineStep) timelineState = 'future';
      else if (order === timelineStep) timelineState = 'active';
      else timelineState = 'past';
      if (e.data?.timelineState === timelineState) return e;
      return { ...e, data: { ...e.data, timelineState, isTimelineActive: timelineState === 'active' } };
    });
  }, [baseNodes, allViewEdges, hasTimeline, timelineActive, timelineStep]);

  // Compute which nodes are connected to active edges (for highlighting)
  const highlightedNodeIds = useMemo(() => {
    if (!hasTimeline || !timelineActive) return new Set();
    const ids = new Set();
    baseEdges.forEach((e) => {
      if (e.data?.timelineState === 'active') {
        ids.add(e.source);
        ids.add(e.target);
      }
    });
    return ids;
  }, [baseEdges, hasTimeline, timelineActive]);

  // Current subtitle from active edge(s) — only after user interacts with timeline
  const activeSubtitle = useMemo(() => {
    if (!hasTimeline || !timelineActive) return null;
    const subs = baseEdges
      .filter((e) => e.data?.timelineState === 'active' && e.data?.subtitle)
      .map((e) => e.data.subtitle);
    return subs.length > 0 ? subs.join('\n') : null;
  }, [baseEdges, hasTimeline, timelineActive]);

  // React Flow node state (handles drag)
  const [nodeState, setNodeState] = useState(baseNodes);

  // Re-sync when base data changes
  const prevBaseRef = useRef(baseNodes);
  if (prevBaseRef.current !== baseNodes) {
    prevBaseRef.current = baseNodes;
    setNodeState(baseNodes);
  }

  const onNodesChange = useCallback((changes) => {
    setNodeState((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback(() => {}, []);

  // Apply type/group/layer dimming + timeline highlighting as derived state
  const displayNodes = useMemo(() => {
    return nodeState.map((node) => {
      if (node.type === 'group') return node;
      const dimmed = !search.matchingNodeIds.has(node.id);
      const highlighted = highlightedNodeIds.has(node.id);
      if (node.data.dimmed === dimmed && node.data.highlighted === highlighted) return node;
      return { ...node, data: { ...node.data, dimmed, highlighted } };
    });
  }, [nodeState, search.matchingNodeIds, highlightedNodeIds]);

  // Dim edges whose endpoints or layer are filtered out
  const displayEdges = useMemo(() => {
    return baseEdges.map((edge) => {
      const dimmed = !search.matchingEdgeIds.has(edge.id);
      if (edge.data?.dimmed === dimmed) return edge;
      return { ...edge, data: { ...edge.data, dimmed } };
    });
  }, [baseEdges, search.matchingEdgeIds]);

  // Zoom to a specific node
  const zoomToNode = useCallback(
    (nodeId) => {
      if (!rfInstance) return;
      requestAnimationFrame(() => {
        rfInstance.fitView({
          nodes: [{ id: nodeId }],
          duration: 600,
          padding: 0.5,
          maxZoom: 2,
        });
      });
    },
    [rfInstance]
  );

  // Zoom to show edge (both source + target)
  const zoomToEdge = useCallback(
    (sourceId, targetId) => {
      if (!rfInstance) return;
      requestAnimationFrame(() => {
        rfInstance.fitView({
          nodes: [{ id: sourceId }, { id: targetId }],
          duration: 600,
          padding: 0.3,
          maxZoom: 2,
        });
      });
    },
    [rfInstance]
  );

  // Handle autocomplete selection
  const handleSelectResult = useCallback(
    (item) => {
      if (item.kind === 'node') {
        setSelectedNodeId(item.id);
        zoomToNode(item.id);
      } else {
        setSelectedNodeId(item.source);
        zoomToEdge(item.source, item.target);
      }
    },
    [zoomToNode, zoomToEdge]
  );

  // Handle node click on canvas
  const handleNodeClick = useCallback(
    (_event, node) => {
      if (node.type === 'group') return;
      setSelectedNodeId(node.id);
      zoomToNode(node.id);
    },
    [zoomToNode]
  );

  // Find full node object for detail panel
  const selectedNode = useMemo(
    () => (selectedNodeId ? displayNodes.find((n) => n.id === selectedNodeId) || null : null),
    [selectedNodeId, displayNodes]
  );

  const handleSelectNode = useCallback(
    (node) => {
      setSelectedNodeId(node.id);
      zoomToNode(node.id);
    },
    [zoomToNode]
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Fit view after layout changes
  useEffect(() => {
    if (!rfInstance) return;
    const timer = setTimeout(() => {
      rfInstance.fitView({ padding: 0.2, duration: 500 });
    }, 80);
    return () => clearTimeout(timer);
  }, [baseNodes, rfInstance]);

  return (
    <div className="graphilizer-app">
      <Toolbar
        title={settings.title}
        description={settings.description}
      />
      {hasTimeline && (
        <Timeline
          edges={allViewEdges}
          currentStep={timelineStep}
          onStepChange={handleTimelineStep}
        />
      )}
      <div className="graphilizer-main">
        <SearchPanel
          nodes={allLayoutedNodes}
          edges={rawEdges}
          searchIndex={searchIndex}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          activeNodeTypes={search.activeNodeTypes}
          toggleNodeType={search.toggleNodeType}
          activeGroups={search.activeGroups}
          toggleGroup={search.toggleGroup}
          activeLayers={search.activeLayers}
          toggleLayer={search.toggleLayer}
          availableTypes={search.availableTypes}
          availableGroups={search.availableGroups}
          availableLayers={search.availableLayers}
          matchCount={search.matchCount}
          totalCount={search.totalCount}
          onSelectResult={handleSelectResult}
          focusDepth={focusDepth}
          onFocusDepthChange={setFocusDepth}
        />
        <div className="graphilizer-canvas-area">
          <GraphCanvas
            nodes={displayNodes}
            edges={displayEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onInit={setRfInstance}
          />
          {activeSubtitle && (
            <div className="subtitle-bar" key={timelineStep}>
              <span className="subtitle-text">{activeSubtitle}</span>
            </div>
          )}
        </div>
        <DetailPanel
          selectedNode={selectedNode}
          nodes={displayNodes}
          edges={baseEdges}
          onSelectNode={handleSelectNode}
          onClose={handleCloseDetail}
          nodeTypes={nodeTypes}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <GraphilizerApp />
    </ReactFlowProvider>
  );
}
