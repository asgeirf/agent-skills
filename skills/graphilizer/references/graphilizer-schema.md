# Graphilizer Schema Reference

Complete reference for the graph data JSON format used by the graphilizer interactive visualization engine.

---

## Top-Level Structure

```json
{
  "settings": { ... },
  "groups": [ ... ],
  "nodes": [ ... ],
  "edges": [ ... ]
}
```

| Property   | Type   | Required | Description                                    |
|------------|--------|----------|------------------------------------------------|
| `settings` | object | no       | Display settings, type definitions, layout config |
| `groups`   | array  | no       | Visual grouping containers for nodes           |
| `nodes`    | array  | yes      | The nodes (entities) in the graph              |
| `edges`    | array  | yes      | The edges (relationships) between nodes        |

---

## Settings Object

```json
{
  "title": "My Graph",
  "description": "A description shown in the toolbar",
  "layout": { "direction": "TB", "nodeSpacing": 80, "rankSpacing": 120 },
  "nodeTypes": {
    "service": { "color": "#4A90D9", "icon": "🔧", "borderStyle": "solid" }
  },
  "edgeTypes": {
    "calls": { "color": "#4A90D9", "style": "solid", "animated": true }
  }
}
```

| Property    | Type   | Default | Description                                    |
|-------------|--------|---------|------------------------------------------------|
| `title`     | string | `""`    | Display title shown in the toolbar             |
| `description` | string | `""`  | Subtitle / description shown in the toolbar    |
| `layout`    | object | `{}`    | Dagre layout configuration                     |
| `nodeTypes` | object | `{}`    | Node type definitions (color, icon, border)    |
| `edgeTypes` | object | `{}`    | Edge type definitions (color, style, animation) |

### Layout Object

Controls the dagre auto-layout algorithm.

| Property      | Type   | Default  | Description                                    |
|---------------|--------|----------|------------------------------------------------|
| `direction`   | string | `"TB"`   | Layout direction: `"TB"` (top-bottom) or `"LR"` (left-right) |
| `nodeSpacing` | number | `80`     | Horizontal spacing between nodes in pixels     |
| `rankSpacing` | number | `120`    | Vertical spacing between ranks/layers in pixels |

### Node Type Definition

Each key in `nodeTypes` is a type name. The value is an object:

| Property      | Type   | Default     | Description                                    |
|---------------|--------|-------------|------------------------------------------------|
| `color`       | string | (auto)      | Hex color for the node background/border       |
| `icon`        | string | (none)      | Emoji character or image URL displayed on the node |
| `borderStyle` | string | `"solid"`   | Border style: `"solid"` or `"dashed"`          |
| `shape`       | string | `"default"` | Visual rendering shape (see below)             |

**Shapes** control how nodes of this type are rendered:

| Shape     | Description                                             | Best for                                |
|-----------|---------------------------------------------------------|-----------------------------------------|
| `default` | Horizontal box with icon + label + type badge           | Services, entities, generic items       |
| `card`    | Vertical card with large icon/image, title, description, tags | People, products, detailed entities |
| `table`   | Header row + key-value data rows visible on the node    | Databases, configs, specs, inventories  |
| `pill`    | Compact rounded inline label                            | Milestones, statuses, tags, phases      |

Types not defined in `nodeTypes` get auto-assigned colors from a default palette. Types without a `shape` default to `"default"`.

### Edge Type Definition

Each key in `edgeTypes` is a type name. The value is an object:

| Property   | Type    | Default    | Description                                    |
|------------|---------|------------|------------------------------------------------|
| `color`    | string  | (auto)     | Hex color for the edge line                    |
| `style`    | string  | `"solid"`  | Line style: `"solid"`, `"dashed"`, or `"dotted"` |
| `animated` | boolean | `false`    | Whether to show animated flowing dashes        |

Types not defined in `edgeTypes` get auto-assigned colors from a default palette.

---

## Groups Array

Groups provide visual clustering of related nodes. Each group renders as a labeled container.

```json
[
  { "id": "backend", "label": "Backend Services", "style": { "backgroundColor": "#1e293b" } },
  { "id": "frontend", "label": "Frontend Apps" }
]
```

| Property | Type   | Required | Description                                    |
|----------|--------|----------|------------------------------------------------|
| `id`     | string | yes      | Unique group identifier, referenced by nodes   |
| `label`  | string | yes      | Display label for the group container          |
| `style`  | object | no       | Optional style overrides                       |

### Group Style Object

| Property          | Type   | Default | Description                        |
|-------------------|--------|---------|------------------------------------|
| `backgroundColor` | string | (theme) | Background color for the group box |

---

## Nodes Array

Each node represents an entity in the graph.

```json
[
  {
    "id": "api-gateway",
    "label": "API Gateway",
    "type": "service",
    "group": "backend",
    "metadata": { "language": "Go", "team": "platform", "port": "8080" },
    "position": { "x": 200, "y": 100 }
  }
]
```

| Property      | Type   | Required | Description                                    |
|---------------|--------|----------|------------------------------------------------|
| `id`          | string | yes      | Unique node identifier                         |
| `label`       | string | yes      | Display text for the node                      |
| `type`        | string | no       | References a key in `settings.nodeTypes`       |
| `group`       | string | no       | References a group `id` to visually cluster the node |
| `metadata`    | object | no       | Freeform key-value pairs shown in the detail panel |
| `position`    | object | no       | Manual position `{ x, y }` — omit for auto-layout |
| `layer`       | string | no       | Logical layer name for filtering (e.g. "Team", "Architecture") |
| `description` | string | no       | Description text (used by `card` shape)        |
| `tags`        | array  | no       | Array of tag strings (used by `card` shape)    |
| `image`       | string | no       | Image URL for the card visual (used by `card` shape) |
| `rows`        | array  | no       | Array of `{ key, value }` objects (used by `table` shape). If omitted, `metadata` is displayed as rows |

### Notes on Nodes

- **Positions are optional.** When omitted, dagre auto-layout positions nodes based on the graph structure and layout settings. This is the recommended approach for most graphs.
- **Metadata** is freeform — any key-value pairs are accepted and displayed in the detail panel when the node is clicked.
- **Type** determines the node's visual appearance (color, icon, border, shape). If the type is not defined in `settings.nodeTypes`, a color is auto-assigned with the default shape.
- **Group** visually nests the node inside the referenced group container.
- **Shape-specific fields** (`description`, `tags`, `image`, `rows`) are only used when the node's type has a matching shape. They are ignored for other shapes.
- **Layer** assigns the node to a logical section. When multiple layers exist, toggle pills appear in the sidebar. Toggling a layer off dims its nodes and edges. Nodes without a layer are always visible.

---

## Edges Array

Each edge represents a relationship between two nodes.

```json
[
  {
    "id": "e1",
    "source": "api-gateway",
    "target": "user-service",
    "label": "REST calls",
    "type": "calls",
    "order": 1,
    "subtitle": "Gateway begins routing traffic to user service",
    "metadata": { "protocol": "HTTP/2", "latency": "12ms" }
  }
]
```

| Property   | Type    | Required | Description                                    |
|------------|---------|----------|------------------------------------------------|
| `id`       | string  | yes      | Unique edge identifier                         |
| `source`   | string  | yes      | Source node `id`                               |
| `target`   | string  | yes      | Target node `id`                               |
| `label`    | string  | no       | Text label displayed on the edge               |
| `type`     | string  | no       | References a key in `settings.edgeTypes`       |
| `order`    | integer | no       | Sequence position for timeline animation (enables the timeline player when present on any edge) |
| `subtitle` | string  | no       | Descriptive text shown at the bottom of the canvas during this edge's timeline step |
| `layer`    | string  | no       | Logical layer name for filtering (e.g. "Team", "Architecture") |
| `metadata` | object  | no       | Freeform key-value pairs shown in the detail panel |

### Notes on Edges

- **Metadata** is freeform — any key-value pairs are accepted and displayed in the detail panel when the edge is clicked.
- **Type** determines the edge's visual appearance (color, line style, animation). If the type is not defined in `settings.edgeTypes`, a color is auto-assigned.
- **Order** enables the timeline player. Edges with the same `order` value animate simultaneously. The timeline plays 3 seconds per step. Future edges appear translucent, active edges glow with an animated dot, and past edges show at full opacity.
- **Subtitle** is shown in a teletext-style bar at the bottom of the canvas when the edge's step is active. Multiple edges with the same order display their subtitles on separate lines.
- **Layer** assigns the edge to a logical section. Edges are dimmed when their layer is toggled off or when both endpoints are dimmed. Edges without a layer are dimmed only if both endpoints are dimmed.

---

## Complete Example

A small infrastructure graph showing services, databases, and their relationships:

```json
{
  "settings": {
    "title": "Payment System",
    "description": "Microservices architecture for payment processing",
    "layout": { "direction": "LR", "nodeSpacing": 100, "rankSpacing": 160 },
    "nodeTypes": {
      "service": { "color": "#4A90D9", "icon": "🔧" },
      "database": { "color": "#E8A838", "icon": "🗄️", "borderStyle": "dashed" },
      "queue": { "color": "#9B59B6", "icon": "📬" },
      "external": { "color": "#95A5A6", "icon": "🌐" }
    },
    "edgeTypes": {
      "sync": { "color": "#4A90D9", "style": "solid", "animated": true },
      "async": { "color": "#9B59B6", "style": "dashed", "animated": true },
      "reads": { "color": "#E8A838", "style": "dotted" }
    }
  },
  "groups": [
    { "id": "core", "label": "Core Services" },
    { "id": "data", "label": "Data Layer" }
  ],
  "nodes": [
    { "id": "gateway", "label": "API Gateway", "type": "service", "group": "core", "metadata": { "language": "Go", "replicas": "3" } },
    { "id": "payment", "label": "Payment Service", "type": "service", "group": "core", "metadata": { "language": "Java", "replicas": "5" } },
    { "id": "notify", "label": "Notification Service", "type": "service", "group": "core", "metadata": { "language": "Python" } },
    { "id": "pg", "label": "PostgreSQL", "type": "database", "group": "data", "metadata": { "version": "15", "storage": "500GB" } },
    { "id": "redis", "label": "Redis", "type": "database", "group": "data", "metadata": { "version": "7", "mode": "cluster" } },
    { "id": "kafka", "label": "Kafka", "type": "queue", "group": "data", "metadata": { "partitions": "12" } },
    { "id": "stripe", "label": "Stripe API", "type": "external" }
  ],
  "edges": [
    { "id": "e1", "source": "gateway", "target": "payment", "label": "charge request", "type": "sync" },
    { "id": "e2", "source": "payment", "target": "stripe", "label": "process payment", "type": "sync", "metadata": { "protocol": "HTTPS" } },
    { "id": "e3", "source": "payment", "target": "pg", "label": "persist transaction", "type": "reads" },
    { "id": "e4", "source": "payment", "target": "kafka", "label": "payment.completed", "type": "async" },
    { "id": "e5", "source": "kafka", "target": "notify", "label": "consume events", "type": "async" },
    { "id": "e6", "source": "gateway", "target": "redis", "label": "session cache", "type": "reads" }
  ]
}
```
