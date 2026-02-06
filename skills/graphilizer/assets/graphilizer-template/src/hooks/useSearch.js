import { useState, useMemo, useCallback } from 'react';

export function useSearch(nodes, edges) {
  const [disabledTypes, setDisabledTypes] = useState(() => new Set());
  const [disabledGroups, setDisabledGroups] = useState(() => new Set());

  const { availableTypes, availableGroups } = useMemo(() => {
    const types = new Set();
    const groups = new Set();
    for (const n of nodes) {
      if (n.data?.typeName) types.add(n.data.typeName);
      if (n.data?.group) groups.add(n.data.group);
    }
    return { availableTypes: [...types], availableGroups: [...groups] };
  }, [nodes]);

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

  // Compute which node IDs pass the type/group filters
  const matchingNodeIds = useMemo(() => {
    const ids = new Set();
    for (const node of nodes) {
      if (node.type === 'group') continue;
      if (node.data?.typeName && disabledTypes.has(node.data.typeName)) continue;
      if (node.data?.group && disabledGroups.has(node.data.group)) continue;
      ids.add(node.id);
    }
    return ids;
  }, [nodes, disabledTypes, disabledGroups]);

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

  const totalCount = useMemo(
    () => nodes.filter((n) => n.type !== 'group').length,
    [nodes]
  );

  return {
    activeNodeTypes,
    toggleNodeType,
    activeGroups,
    toggleGroup,
    availableTypes,
    availableGroups,
    matchingNodeIds,
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
