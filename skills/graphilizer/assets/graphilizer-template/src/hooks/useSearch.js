import { useState, useMemo, useCallback } from 'react';

export function useSearch(nodes, edges) {
  const [disabledTypes, setDisabledTypes] = useState(() => new Set());
  const [disabledGroups, setDisabledGroups] = useState(() => new Set());
  const [disabledLayers, setDisabledLayers] = useState(() => new Set());

  const { availableTypes, availableGroups, availableLayers } = useMemo(() => {
    const types = new Set();
    const groups = new Set();
    const layers = new Set();
    for (const n of nodes) {
      if (n.data?.typeName) types.add(n.data.typeName);
      if (n.data?.group) groups.add(n.data.group);
      if (n.data?.layer) layers.add(n.data.layer);
    }
    for (const e of edges) {
      if (e.data?.layer) layers.add(e.data.layer);
    }
    return { availableTypes: [...types], availableGroups: [...groups], availableLayers: [...layers].sort() };
  }, [nodes, edges]);

  const toggleNodeType = useCallback((type) => {
    setDisabledTypes((prev) => {
      const s = new Set(prev);
      if (s.has(type)) s.delete(type);
      else s.add(type);
      return s;
    });
  }, []);

  const toggleGroup = useCallback((group) => {
    setDisabledGroups((prev) => {
      const s = new Set(prev);
      if (s.has(group)) s.delete(group);
      else s.add(group);
      return s;
    });
  }, []);

  const toggleLayer = useCallback((layer) => {
    setDisabledLayers((prev) => {
      const s = new Set(prev);
      if (s.has(layer)) s.delete(layer);
      else s.add(layer);
      return s;
    });
  }, []);

  // Compute which node IDs pass the type/group/layer filters
  const matchingNodeIds = useMemo(() => {
    const ids = new Set();
    for (const node of nodes) {
      if (node.type === 'group') continue;
      if (node.data?.typeName && disabledTypes.has(node.data.typeName)) continue;
      if (node.data?.group && disabledGroups.has(node.data.group)) continue;
      if (node.data?.layer && disabledLayers.has(node.data.layer)) continue;
      ids.add(node.id);
    }
    return ids;
  }, [nodes, disabledTypes, disabledGroups, disabledLayers]);

  // Compute which edge IDs pass layer filters
  // An edge matches if: (1) it has no layer and both endpoints match, or
  // (2) its explicit layer is active and both endpoints match
  const matchingEdgeIds = useMemo(() => {
    const ids = new Set();
    for (const e of edges) {
      const edgeLayer = e.data?.layer;
      if (edgeLayer && disabledLayers.has(edgeLayer)) continue;
      if (!matchingNodeIds.has(e.source) || !matchingNodeIds.has(e.target)) continue;
      ids.add(e.id);
    }
    return ids;
  }, [edges, matchingNodeIds, disabledLayers]);

  const activeNodeTypes = useMemo(() => {
    const s = new Set(availableTypes);
    for (const t of disabledTypes) s.delete(t);
    return s;
  }, [availableTypes, disabledTypes]);

  const activeGroups = useMemo(() => {
    const s = new Set(availableGroups);
    for (const g of disabledGroups) s.delete(g);
    return s;
  }, [availableGroups, disabledGroups]);

  const activeLayers = useMemo(() => {
    const s = new Set(availableLayers);
    for (const l of disabledLayers) s.delete(l);
    return s;
  }, [availableLayers, disabledLayers]);

  const totalCount = useMemo(
    () => nodes.filter((n) => n.type !== 'group').length,
    [nodes]
  );

  return {
    activeNodeTypes,
    toggleNodeType,
    activeGroups,
    toggleGroup,
    activeLayers,
    toggleLayer,
    availableTypes,
    availableGroups,
    availableLayers,
    matchingNodeIds,
    matchingEdgeIds,
    matchCount: matchingNodeIds.size,
    totalCount,
  };
}

// Autocomplete: search nodes + edges by label/metadata
export function buildSearchIndex(nodes, edges) {
  const nodeItems = nodes
    .filter((n) => n.type !== 'group')
    .map((n) => ({
      kind: 'node',
      id: n.id,
      label: n.data.label,
      typeName: n.data.typeName,
      color: n.data.color,
      icon: n.data.icon,
      searchText: [
        n.data.label,
        ...Object.values(n.data.metadata || {}).map(String),
      ]
        .join(' ')
        .toLowerCase(),
    }));

  const edgeItems = edges.map((e) => ({
    kind: 'edge',
    id: e.id,
    label: e.data?.label || '',
    source: e.source,
    target: e.target,
    color: e.data?.color,
    searchText: [
      e.data?.label || '',
      ...Object.values(e.data?.metadata || {}).map(String),
    ]
      .join(' ')
      .toLowerCase(),
  }));

  return [...nodeItems, ...edgeItems];
}

export function queryIndex(index, query, limit = 10) {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  return index.filter((item) => item.searchText.includes(q)).slice(0, limit);
}

// BFS to get N-depth neighborhood around a node
export function getNeighborhood(centerNodeId, edges, depth) {
  const visited = new Set([centerNodeId]);
  let frontier = new Set([centerNodeId]);

  for (let d = 0; d < depth; d++) {
    const next = new Set();
    for (const edge of edges) {
      const src = edge.source;
      const tgt = edge.target;
      if (frontier.has(src) && !visited.has(tgt)) {
        visited.add(tgt);
        next.add(tgt);
      }
      if (frontier.has(tgt) && !visited.has(src)) {
        visited.add(src);
        next.add(src);
      }
    }
    frontier = next;
  }

  return visited;
}
