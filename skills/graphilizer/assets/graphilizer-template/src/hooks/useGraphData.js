import { useMemo } from 'react';
import graphDataRaw from '../graph-data.json';
import { normalizeGraphData } from '../utils/normalize.js';

export function useGraphData() {
  return useMemo(() => {
    const { nodes, edges, settings, groups } = normalizeGraphData(graphDataRaw);
    return {
      nodes,
      edges,
      settings,
      groups,
      nodeTypes: settings.nodeTypes || {},
      edgeTypes: settings.edgeTypes || {},
    };
  }, []);
}
