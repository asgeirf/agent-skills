import { MarkerType } from '@xyflow/react';
import { getNodeTypeStyle, getEdgeTypeStyle } from './theme.js';

export function normalizeGraphData(rawData) {
  const settings = rawData.settings || {};
  const nodeTypes = settings.nodeTypes || {};
  const edgeTypes = settings.edgeTypes || {};

  const groupDefs = rawData.groups || [];
  const groupIds = new Set(groupDefs.map((g) => g.id));

  // Convert groups to parent React Flow nodes
  const groupNodes = groupDefs.map((g) => ({
    id: g.id,
    type: 'group',
    position: { x: 0, y: 0 },
    data: { label: g.label || g.id },
    style: {
      backgroundColor:
        (g.style && g.style.backgroundColor) || 'rgba(255,255,255,0.05)',
      borderRadius: 8,
      padding: 20,
      ...g.style,
    },
  }));

  // Convert nodes
  const nodes = (rawData.nodes || []).map((n) => {
    const typeName = n.type || 'default';
    const { color, icon, borderStyle } = getNodeTypeStyle(typeName, nodeTypes);
    const hasGroup = n.group && groupIds.has(n.group);

    return {
      id: n.id,
      position: n.position || { x: 0, y: 0 },
      type: 'dynamic',
      data: {
        label: n.label || n.id,
        typeName,
        color,
        icon,
        borderStyle,
        metadata: n.metadata || {},
        group: n.group || null,
        dimmed: false,
      },
      ...(hasGroup ? { parentId: n.group } : {}),
    };
  });

  // Convert edges
  const edges = (rawData.edges || []).map((e) => {
    const typeName = e.type || 'default';
    const { color, style, animated } = getEdgeTypeStyle(typeName, edgeTypes);

    return {
      id: e.id || `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      type: 'labeled',
      data: {
        label: e.label || '',
        color,
        dashStyle: style,
        animated,
        order: e.order ?? null,
        subtitle: e.subtitle || null,
        metadata: e.metadata || {},
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color,
      },
      animated,
    };
  });

  // Merge group nodes before regular nodes so React Flow knows about parents first
  const allNodes = [...groupNodes, ...nodes];

  return { nodes: allNodes, edges, settings, groups: groupDefs };
}
