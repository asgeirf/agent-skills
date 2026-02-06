# Graph Schema Reference

Complete reference for the `graph-data.json` format used by the flow-graph animation engine.

## Top-Level Structure

```json
{
  "settings": { ... },
  "steps": [ ... ]
}
```

## Settings Object

| Property            | Type    | Default     | Description                              |
|---------------------|---------|-------------|------------------------------------------|
| `width`             | number  | `1280`      | Viewport width in pixels                 |
| `height`            | number  | `720`       | Viewport height in pixels                |
| `background`        | string  | `"#1a1a2e"` | Background color (hex)                   |
| `animationDuration` | number  | `500`       | Default transition duration in ms        |
| `fitViewOnComplete` | boolean | `true`      | Auto fit-view after all steps complete   |

## Step Types

Every step has a `type` field and an optional `delay` (ms to wait after executing this step, default `500`).

### `addNode`

Add a node to the graph with a fade-in animation.

```json
{
  "type": "addNode",
  "node": {
    "id": "1",
    "label": "My Node",
    "position": [100, 200],
    "type": "default",
    "style": {},
    "className": ""
  },
  "delay": 500
}
```

**Node Properties:**

| Property    | Type              | Required | Description                                          |
|-------------|-------------------|----------|------------------------------------------------------|
| `id`        | string            | yes      | Unique node identifier                               |
| `label`     | string            | no       | Display text (defaults to `id`)                      |
| `position`  | `[x, y]` or `{x, y}` | yes  | Position in the flow canvas                          |
| `type`      | string            | no       | React Flow node type (`"default"`, `"input"`, `"output"`) |
| `style`     | object            | no       | Inline CSS styles (camelCase)                        |
| `className` | string            | no       | Additional CSS class names                           |

### `addEdge`

Add an edge (connection) between two nodes with a fade-in animation.

```json
{
  "type": "addEdge",
  "edge": {
    "id": "e1-2",
    "source": "1",
    "target": "2",
    "type": "default",
    "animated": true,
    "label": "next",
    "style": {}
  },
  "delay": 400
}
```

**Edge Properties:**

| Property   | Type    | Required | Description                                              |
|------------|---------|----------|----------------------------------------------------------|
| `id`       | string  | yes      | Unique edge identifier                                   |
| `source`   | string  | yes      | Source node ID                                           |
| `target`   | string  | yes      | Target node ID                                           |
| `type`     | string  | no       | Edge type (`"default"`, `"straight"`, `"step"`, `"smoothstep"`) |
| `animated` | boolean | no       | Show animated dashes on the edge                         |
| `label`    | string  | no       | Text label on the edge                                   |
| `style`    | object  | no       | Inline CSS styles                                        |

### `highlight`

Highlight one or more nodes with a colored glow.

```json
{
  "type": "highlight",
  "ids": ["2", "3"],
  "color": "#ff6b6b",
  "delay": 800
}
```

| Property | Type     | Required | Description                     |
|----------|----------|----------|---------------------------------|
| `ids`    | string[] | yes      | Node IDs to highlight           |
| `color`  | string   | no       | Highlight color (default `"#ff6b6b"`) |

### `moveNode`

Animate a node to a new position.

```json
{
  "type": "moveNode",
  "id": "2",
  "position": [300, 100],
  "delay": 600
}
```

| Property   | Type              | Required | Description           |
|------------|-------------------|----------|-----------------------|
| `id`       | string            | yes      | Node ID to move       |
| `position` | `[x, y]` or `{x, y}` | yes  | Target position       |

### `removeNode`

Fade out and remove a node (and its connected edges).

```json
{
  "type": "removeNode",
  "id": "3",
  "delay": 500
}
```

### `removeEdge`

Fade out and remove an edge.

```json
{
  "type": "removeEdge",
  "id": "e1-2",
  "delay": 500
}
```

### `updateStyle`

Update inline styles on one or more nodes.

```json
{
  "type": "updateStyle",
  "ids": ["1", "2"],
  "style": {
    "background": "#e94560",
    "color": "#ffffff",
    "borderRadius": "50%"
  },
  "delay": 500
}
```

You can also use `"id"` (singular) instead of `"ids"` for a single node.

### `fitView`

Fit all nodes into the viewport.

```json
{
  "type": "fitView",
  "padding": 0.2,
  "delay": 500
}
```

| Property  | Type   | Default | Description                     |
|-----------|--------|---------|---------------------------------|
| `padding` | number | `0.2`   | Padding around the fitted view  |

### `zoom`

Zoom to a specific level.

```json
{
  "type": "zoom",
  "level": 1.5,
  "delay": 500
}
```

| Property | Type   | Default | Description                 |
|----------|--------|---------|-----------------------------|
| `level`  | number | `1`     | Zoom level (1 = 100%)       |

### `pan`

Pan the viewport to center on a position.

```json
{
  "type": "pan",
  "position": [400, 300],
  "zoom": 1.2,
  "delay": 500
}
```

| Property   | Type              | Required | Description                         |
|------------|-------------------|----------|-------------------------------------|
| `position` | `[x, y]` or `{x, y}` | yes  | Position to center on               |
| `zoom`     | number            | no       | Optional zoom level for the pan     |

### `wait`

Pause the animation for the specified delay without any visual change.

```json
{
  "type": "wait",
  "delay": 2000
}
```

## Style Reference

### Node Styles (camelCase CSS)

Common style properties for nodes:

```json
{
  "background": "#16213e",
  "color": "#e0e0e0",
  "border": "2px solid #e94560",
  "borderRadius": "8px",
  "padding": "10px 16px",
  "fontSize": "14px",
  "fontWeight": "bold",
  "boxShadow": "0 4px 12px rgba(0,0,0,0.3)",
  "width": "180px"
}
```

### Color Palette Suggestions

| Purpose    | Color     | Description        |
|------------|-----------|--------------------|
| Background | `#1a1a2e` | Dark navy          |
| Node bg    | `#16213e` | Slightly lighter   |
| Border     | `#0f3460` | Medium blue        |
| Accent     | `#e94560` | Vibrant red-pink   |
| Success    | `#53d769` | Green              |
| Warning    | `#ffd93d` | Yellow             |
| Info       | `#6c9bcf` | Light blue         |
| Text       | `#e0e0e0` | Light gray         |

## Complete Examples

### Simple Flowchart

```json
{
  "settings": { "width": 1280, "height": 720, "background": "#1a1a2e" },
  "steps": [
    { "type": "addNode", "node": { "id": "start", "label": "Start", "position": [400, 50] }, "delay": 600 },
    { "type": "addNode", "node": { "id": "process", "label": "Process Data", "position": [400, 200] }, "delay": 600 },
    { "type": "addNode", "node": { "id": "decide", "label": "Valid?", "position": [400, 350], "style": { "borderRadius": "50%", "width": "80px", "height": "80px", "display": "flex", "alignItems": "center", "justifyContent": "center" } }, "delay": 600 },
    { "type": "addNode", "node": { "id": "yes", "label": "Save", "position": [250, 500] }, "delay": 400 },
    { "type": "addNode", "node": { "id": "no", "label": "Retry", "position": [550, 500] }, "delay": 400 },
    { "type": "addEdge", "edge": { "id": "e-s-p", "source": "start", "target": "process", "animated": true }, "delay": 400 },
    { "type": "addEdge", "edge": { "id": "e-p-d", "source": "process", "target": "decide", "animated": true }, "delay": 400 },
    { "type": "addEdge", "edge": { "id": "e-d-y", "source": "decide", "target": "yes", "label": "Yes" }, "delay": 400 },
    { "type": "addEdge", "edge": { "id": "e-d-n", "source": "decide", "target": "no", "label": "No" }, "delay": 400 },
    { "type": "highlight", "ids": ["decide"], "color": "#ffd93d", "delay": 1000 },
    { "type": "wait", "delay": 1500 }
  ]
}
```

### Pipeline / Data Flow

```json
{
  "settings": { "width": 1280, "height": 400, "background": "#0d1117" },
  "steps": [
    { "type": "addNode", "node": { "id": "src", "label": "Source", "position": [50, 150], "style": { "background": "#238636" } }, "delay": 500 },
    { "type": "addNode", "node": { "id": "t1", "label": "Transform", "position": [250, 150] }, "delay": 500 },
    { "type": "addNode", "node": { "id": "t2", "label": "Enrich", "position": [450, 150] }, "delay": 500 },
    { "type": "addNode", "node": { "id": "sink", "label": "Sink", "position": [650, 150], "style": { "background": "#e94560" } }, "delay": 500 },
    { "type": "addEdge", "edge": { "id": "e1", "source": "src", "target": "t1", "animated": true }, "delay": 300 },
    { "type": "addEdge", "edge": { "id": "e2", "source": "t1", "target": "t2", "animated": true }, "delay": 300 },
    { "type": "addEdge", "edge": { "id": "e3", "source": "t2", "target": "sink", "animated": true }, "delay": 300 },
    { "type": "highlight", "ids": ["src"], "color": "#238636", "delay": 600 },
    { "type": "highlight", "ids": ["t1"], "color": "#6c9bcf", "delay": 600 },
    { "type": "highlight", "ids": ["t2"], "color": "#6c9bcf", "delay": 600 },
    { "type": "highlight", "ids": ["sink"], "color": "#e94560", "delay": 600 },
    { "type": "wait", "delay": 2000 }
  ]
}
```

### State Machine

```json
{
  "settings": { "width": 1280, "height": 720, "background": "#1a1a2e" },
  "steps": [
    { "type": "addNode", "node": { "id": "idle", "label": "Idle", "position": [100, 300], "style": { "border": "2px solid #53d769" } }, "delay": 500 },
    { "type": "addNode", "node": { "id": "loading", "label": "Loading", "position": [400, 150] }, "delay": 500 },
    { "type": "addNode", "node": { "id": "success", "label": "Success", "position": [700, 150], "style": { "background": "#238636" } }, "delay": 500 },
    { "type": "addNode", "node": { "id": "error", "label": "Error", "position": [700, 450], "style": { "background": "#e94560" } }, "delay": 500 },
    { "type": "addEdge", "edge": { "id": "e-i-l", "source": "idle", "target": "loading", "label": "fetch()", "animated": true }, "delay": 400 },
    { "type": "addEdge", "edge": { "id": "e-l-s", "source": "loading", "target": "success", "label": "200 OK" }, "delay": 400 },
    { "type": "addEdge", "edge": { "id": "e-l-e", "source": "loading", "target": "error", "label": "Error" }, "delay": 400 },
    { "type": "addEdge", "edge": { "id": "e-s-i", "source": "success", "target": "idle", "label": "reset" }, "delay": 400 },
    { "type": "addEdge", "edge": { "id": "e-e-i", "source": "error", "target": "idle", "label": "retry" }, "delay": 400 },
    { "type": "highlight", "ids": ["idle"], "color": "#53d769", "delay": 800 },
    { "type": "highlight", "ids": ["loading"], "color": "#6c9bcf", "delay": 800 },
    { "type": "wait", "delay": 2000 }
  ]
}
```
