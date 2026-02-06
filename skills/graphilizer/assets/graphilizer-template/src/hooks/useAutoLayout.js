import { useMemo } from 'react';
import { computeLayout } from '../utils/layout.js';

export function useAutoLayout(nodes, edges, direction = 'TB', settings = {}) {
  return useMemo(() => {
    if (!nodes.length) return nodes;
    const layout = settings.layout || {};
    return computeLayout(nodes, edges, {
      direction,
      nodeSpacing: layout.nodeSpacing || 80,
      rankSpacing: layout.rankSpacing || 120,
    });
  }, [nodes, edges, direction, settings]);
}
