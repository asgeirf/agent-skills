import dagre from '@dagrejs/dagre';

const DEFAULT_NODE_WIDTH = 200;
const DEFAULT_NODE_HEIGHT = 60;

export function computeLayout(nodes, edges, options = {}) {
  const {
    direction = 'TB',
    nodeSpacing = 80,
    rankSpacing = 120,
  } = options;

  const g = new dagre.graphlib.Graph({ compound: true });
  g.setGraph({
    rankdir: direction,
    nodesep: nodeSpacing,
    ranksep: rankSpacing,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    g.setNode(node.id, {
      width: DEFAULT_NODE_WIDTH,
      height: DEFAULT_NODE_HEIGHT,
    });
    if (node.parentId) {
      g.setParent(node.id, node.parentId);
    }
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    if (!pos) return node;

    if (node.position.x === 0 && node.position.y === 0) {
      return {
        ...node,
        position: {
          x: pos.x - DEFAULT_NODE_WIDTH / 2,
          y: pos.y - DEFAULT_NODE_HEIGHT / 2,
        },
      };
    }
    return node;
  });
}

/**
 * Radial layout: places centerNodeId at origin, then arranges neighbors
 * in concentric rings by BFS depth. Used for focus mode.
 */
export function computeRadialLayout(nodes, edges, centerNodeId) {
  if (nodes.length === 0) return nodes;

  // BFS from center to assign depth to each node
  const adj = new Map();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source).push(e.target);
      adj.get(e.target).push(e.source);
    }
  }

  const depthMap = new Map();
  depthMap.set(centerNodeId, 0);
  const queue = [centerNodeId];
  let qi = 0;
  while (qi < queue.length) {
    const cur = queue[qi++];
    const d = depthMap.get(cur);
    for (const nb of (adj.get(cur) || [])) {
      if (!depthMap.has(nb)) {
        depthMap.set(nb, d + 1);
        queue.push(nb);
      }
    }
  }

  // Group nodes by depth ring
  const rings = new Map();
  for (const n of nodes) {
    const d = depthMap.get(n.id) ?? 0;
    if (!rings.has(d)) rings.set(d, []);
    rings.get(d).push(n.id);
  }

  // Compute positions: center at origin, rings at increasing radii
  const ringRadius = 220;
  const posMap = new Map();
  posMap.set(centerNodeId, { x: -DEFAULT_NODE_WIDTH / 2, y: -DEFAULT_NODE_HEIGHT / 2 });

  for (const [depth, ids] of rings) {
    if (depth === 0) continue;
    const r = depth * ringRadius;
    const count = ids.length;
    // Offset angle so nodes don't stack on the same line
    const angleOffset = depth % 2 === 0 ? 0 : Math.PI / count;
    for (let i = 0; i < count; i++) {
      const angle = angleOffset + (2 * Math.PI * i) / count;
      posMap.set(ids[i], {
        x: Math.cos(angle) * r - DEFAULT_NODE_WIDTH / 2,
        y: Math.sin(angle) * r - DEFAULT_NODE_HEIGHT / 2,
      });
    }
  }

  return nodes.map((node) => ({
    ...node,
    position: posMap.get(node.id) || node.position,
  }));
}

/**
 * Assigns sourceHandle/targetHandle to each edge based on relative node positions.
 * Picks the side (top/right/bottom/left) that faces the other node.
 */
export function assignEdgeHandles(nodes, edges) {
  const posMap = new Map();
  for (const n of nodes) {
    posMap.set(n.id, {
      cx: n.position.x + DEFAULT_NODE_WIDTH / 2,
      cy: n.position.y + DEFAULT_NODE_HEIGHT / 2,
    });
  }

  return edges.map((edge) => {
    const src = posMap.get(edge.source);
    const tgt = posMap.get(edge.target);
    if (!src || !tgt) return edge;

    const dx = tgt.cx - src.cx;
    const dy = tgt.cy - src.cy;

    // Pick the side based on the dominant direction
    let sourceHandle, targetHandle;
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal dominant
      sourceHandle = dx > 0 ? 's-right' : 's-left';
      targetHandle = dx > 0 ? 't-left' : 't-right';
    } else {
      // Vertical dominant
      sourceHandle = dy > 0 ? 's-bottom' : 's-top';
      targetHandle = dy > 0 ? 't-top' : 't-bottom';
    }

    return { ...edge, sourceHandle, targetHandle };
  });
}
