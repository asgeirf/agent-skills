import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
  useEdgesState,
  Background,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import graphData from "./graph-data.json";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function AnimatedFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView, zoomTo, setCenter } = useReactFlow();
  const settings = graphData.settings || {};
  const animDuration = settings.animationDuration || 500;
  const running = useRef(false);

  const runSteps = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    window.__animationDone = false;

    for (const step of graphData.steps) {
      const delay = step.delay ?? 500;

      switch (step.type) {
        case "addNode": {
          const n = step.node;
          const pos = Array.isArray(n.position)
            ? { x: n.position[0], y: n.position[1] }
            : n.position;
          setNodes((prev) => [
            ...prev,
            {
              id: n.id,
              type: n.type || "default",
              position: pos,
              data: { label: n.label || n.id },
              style: { opacity: 0, ...n.style },
              className: [n.className, "flow-fade-in"].filter(Boolean).join(" "),
            },
          ]);
          // Trigger fade-in after a frame
          await sleep(50);
          setNodes((prev) =>
            prev.map((node) =>
              node.id === n.id
                ? { ...node, style: { ...node.style, opacity: 1 } }
                : node
            )
          );
          break;
        }

        case "addEdge": {
          const e = step.edge;
          setEdges((prev) => [
            ...prev,
            {
              id: e.id,
              source: e.source,
              target: e.target,
              type: e.type || "default",
              animated: e.animated ?? false,
              label: e.label,
              style: { opacity: 0, ...e.style },
              className: "flow-fade-in",
            },
          ]);
          await sleep(50);
          setEdges((prev) =>
            prev.map((edge) =>
              edge.id === e.id
                ? { ...edge, style: { ...edge.style, opacity: 1 } }
                : edge
            )
          );
          break;
        }

        case "highlight": {
          const color = step.color || "#ff6b6b";
          const ids = new Set(step.ids || []);
          setNodes((prev) =>
            prev.map((node) =>
              ids.has(node.id)
                ? {
                    ...node,
                    style: {
                      ...node.style,
                      boxShadow: `0 0 12px ${color}`,
                      borderColor: color,
                    },
                  }
                : node
            )
          );
          break;
        }

        case "moveNode": {
          const targetPos = Array.isArray(step.position)
            ? { x: step.position[0], y: step.position[1] }
            : step.position;
          setNodes((prev) =>
            prev.map((node) =>
              node.id === step.id
                ? {
                    ...node,
                    position: targetPos,
                    style: {
                      ...node.style,
                      transition: `all ${animDuration}ms ease`,
                    },
                  }
                : node
            )
          );
          break;
        }

        case "removeNode": {
          const removeId = step.id;
          setNodes((prev) =>
            prev.map((node) =>
              node.id === removeId
                ? { ...node, style: { ...node.style, opacity: 0 } }
                : node
            )
          );
          await sleep(animDuration);
          setNodes((prev) => prev.filter((node) => node.id !== removeId));
          setEdges((prev) =>
            prev.filter(
              (e) => e.source !== removeId && e.target !== removeId
            )
          );
          break;
        }

        case "removeEdge": {
          const removeEdgeId = step.id;
          setEdges((prev) =>
            prev.map((edge) =>
              edge.id === removeEdgeId
                ? { ...edge, style: { ...edge.style, opacity: 0 } }
                : edge
            )
          );
          await sleep(animDuration);
          setEdges((prev) => prev.filter((e) => e.id !== removeEdgeId));
          break;
        }

        case "updateStyle": {
          const styleIds = new Set(step.ids || [step.id]);
          const newStyle = step.style || {};
          setNodes((prev) =>
            prev.map((node) =>
              styleIds.has(node.id)
                ? { ...node, style: { ...node.style, ...newStyle } }
                : node
            )
          );
          break;
        }

        case "fitView": {
          await sleep(100);
          fitView({ padding: step.padding ?? 0.2, duration: animDuration });
          break;
        }

        case "zoom": {
          zoomTo(step.level ?? 1, { duration: animDuration });
          break;
        }

        case "pan": {
          const p = Array.isArray(step.position)
            ? { x: step.position[0], y: step.position[1] }
            : step.position;
          setCenter(p.x, p.y, { duration: animDuration, zoom: step.zoom });
          break;
        }

        case "wait":
          break;

        default:
          console.warn(`Unknown step type: ${step.type}`);
      }

      await sleep(delay);
    }

    if (settings.fitViewOnComplete !== false) {
      await sleep(200);
      fitView({ padding: 0.2, duration: animDuration });
      await sleep(animDuration + 500);
    }

    window.__animationDone = true;
  }, [setNodes, setEdges, fitView, zoomTo, setCenter, animDuration, settings]);

  useEffect(() => {
    window.__animationDone = false;
    runSteps();
  }, [runSteps]);

  const bg = settings.background || "#1a1a2e";

  return (
    <div
      style={{
        width: settings.width || 1280,
        height: settings.height || 720,
        background: bg,
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color={lighten(bg, 0.15)} gap={20} />
      </ReactFlow>
    </div>
  );
}

function lighten(hex, amount) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AnimatedFlow />
    </ReactFlowProvider>
  );
}
