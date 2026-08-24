/**
 * Zolto Force-Directed Layout Algorithm — Phase 5
 *
 * Deterministic Fruchterman-Reingold spring-embedder layout for network diagrams.
 */

export function layoutForce(graph, opts = {}) {
  const nodes = graph.getNodes();
  const edges = graph.getEdges();

  if (nodes.length === 0) {
    return { width: 400, height: 300, nodePositions: new Map(), edgePaths: [] };
  }

  const nodeWidth = opts.nodeWidth ?? 120;
  const nodeHeight = opts.nodeHeight ?? 45;
  const iterations = opts.iterations ?? 80;

  const width = Math.max(600, nodes.length * 100);
  const height = Math.max(450, nodes.length * 80);

  const k = Math.sqrt((width * height) / nodes.length);
  const positions = new Map();
  const velocities = new Map();

  // Deterministic initial placement along grid
  const cols = Math.ceil(Math.sqrt(nodes.length));
  nodes.forEach((node, idx) => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    const x = (c + 1) * (width / (cols + 1));
    const y = (r + 1) * (height / (Math.ceil(nodes.length / cols) + 1));
    positions.set(node.id, { x, y });
    velocities.set(node.id, { dx: 0, dy: 0 });
  });

  // Force simulation iterations
  let temp = width / 10;
  const dt = temp / iterations;

  for (let iter = 0; iter < iterations; iter++) {
    // Reset forces
    for (const node of nodes) {
      velocities.set(node.id, { dx: 0, dy: 0 });
    }

    // Repulsion forces between all node pairs
    for (let i = 0; i < nodes.length; i++) {
      const u = nodes[i].id;
      const posU = positions.get(u);

      for (let j = i + 1; j < nodes.length; j++) {
        const v = nodes[j].id;
        const posV = positions.get(v);

        let deltaX = posU.x - posV.x;
        let deltaY = posU.y - posV.y;
        let dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY) || 0.01;

        let repForce = (k * k) / dist;
        let fx = (deltaX / dist) * repForce;
        let fy = (deltaY / dist) * repForce;

        const velU = velocities.get(u);
        const velV = velocities.get(v);
        velU.dx += fx; velU.dy += fy;
        velV.dx -= fx; velV.dy -= fy;
      }
    }

    // Attraction forces along edges
    for (const edge of edges) {
      const posU = positions.get(edge.from);
      const posV = positions.get(edge.to);
      if (!posU || !posV) continue;

      let deltaX = posU.x - posV.x;
      let deltaY = posU.y - posV.y;
      let dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY) || 0.01;

      let attForce = (dist * dist) / k;
      let fx = (deltaX / dist) * attForce;
      let fy = (deltaY / dist) * attForce;

      const velU = velocities.get(edge.from);
      const velV = velocities.get(edge.to);
      if (velU) { velU.dx -= fx; velU.dy -= fy; }
      if (velV) { velV.dx += fx; velV.dy += fy; }
    }

    // Apply displacement capped by temperature
    for (const node of nodes) {
      const pos = positions.get(node.id);
      const vel = velocities.get(node.id);

      let dLen = Math.sqrt(vel.dx * vel.dx + vel.dy * vel.dy) || 0.01;
      let cappedDist = Math.min(dLen, temp);

      pos.x += (vel.dx / dLen) * cappedDist;
      pos.y += (vel.dy / dLen) * cappedDist;

      // Constrain within bounding box
      pos.x = Math.max(60, Math.min(width - 60, pos.x));
      pos.y = Math.max(60, Math.min(height - 60, pos.y));
    }

    temp -= dt;
  }

  const nodePositions = new Map();
  for (const node of nodes) {
    const pos = positions.get(node.id);
    nodePositions.set(node.id, {
      x: pos.x - nodeWidth / 2,
      y: pos.y - nodeHeight / 2,
      width: nodeWidth,
      height: nodeHeight,
    });
  }

  const edgePaths = edges.map(edge => {
    const src = nodePositions.get(edge.from);
    const tgt = nodePositions.get(edge.to);

    if (!src || !tgt) return { ...edge, path: '' };

    const x1 = src.x + src.width / 2;
    const y1 = src.y + src.height / 2;
    const x2 = tgt.x + tgt.width / 2;
    const y2 = tgt.y + tgt.height / 2;

    const path = `M ${x1} ${y1} L ${x2} ${y2}`;

    return {
      ...edge,
      x1, y1, x2, y2,
      path,
      labelX: (x1 + x2) / 2,
      labelY: (y1 + y2) / 2,
    };
  });

  return { width, height, nodePositions, edgePaths };
}
