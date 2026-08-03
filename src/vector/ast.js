/**
 * Zolto Vector Graphics AST Factory & Node Definitions — Phase 7
 *
 * Defines stable monomorphic AST nodes for scenes, artboards, layers,
 * groups, shape primitives, text, gradients, patterns, paths, and transforms.
 */

export function createVectorNode(attrs = {}, children = []) {
  return {
    type: 'vector',
    width: attrs.width ?? 800,
    height: attrs.height ?? 480,
    viewBox: attrs.viewBox || `0 0 ${attrs.width ?? 800} ${attrs.height ?? 480}`,
    background: attrs.background || null,
    theme: attrs.theme || 'dark',
    grid: attrs.grid ?? false,
    units: attrs.units || 'px',
    render: attrs.render || 'svg',
    responsive: attrs.responsive ?? true,
    accessible: attrs.accessible ?? true,
    dpi: attrs.dpi ?? 2,
    children: children || [],
  };
}

export function createSceneNode(id = 'root', children = []) {
  return {
    type: 'vector_scene',
    id,
    children: children || [],
  };
}

export function createArtboardNode(attrs = {}, children = []) {
  return {
    type: 'vector_artboard',
    id: attrs.id || 'artboard',
    x: attrs.x ?? 0,
    y: attrs.y ?? 0,
    w: attrs.w ?? 800,
    h: attrs.h ?? 480,
    children: children || [],
  };
}

export function createLayerNode(id = 'layer', children = []) {
  return {
    type: 'vector_layer',
    id,
    children: children || [],
  };
}

export function createGroupNode(attrs = {}, children = []) {
  return {
    type: 'vector_group',
    id: attrs.id || null,
    class: attrs.class || null,
    transform: attrs.transform || null,
    clip: attrs.clip || null,
    mask: attrs.mask || null,
    style: attrs.style || null,
    opacity: attrs.opacity ?? 1,
    children: children || [],
  };
}

export function createFrameNode(attrs = {}, children = []) {
  return {
    type: 'vector_frame',
    id: attrs.id || 'frame',
    x: attrs.x ?? 0,
    y: attrs.y ?? 0,
    w: attrs.w ?? 400,
    h: attrs.h ?? 300,
    children: children || [],
  };
}

export function createSymbolNode(id = 'symbol', children = []) {
  return {
    type: 'vector_symbol',
    id,
    children: children || [],
  };
}

export function createUseNode(attrs = {}) {
  return {
    type: 'vector_use',
    href: attrs.href || '',
    x: attrs.x ?? 0,
    y: attrs.y ?? 0,
    scale: attrs.scale ?? 1,
    transform: attrs.transform || null,
  };
}

export function createShapeNode(shapeType, attrs = {}) {
  return {
    type: 'vector_shape',
    shape: shapeType, // rect, circle, ellipse, line, polyline, polygon, path, arc, bezier
    id: attrs.id || null,
    class: attrs.class || null,
    x: attrs.x ?? 0,
    y: attrs.y ?? 0,
    w: attrs.w ?? 0,
    h: attrs.h ?? 0,
    cx: attrs.cx ?? 0,
    cy: attrs.cy ?? 0,
    r: Math.max(0, attrs.r ?? 0),
    rx: Math.max(0, attrs.rx ?? 0),
    ry: Math.max(0, attrs.ry ?? 0),
    radius: Math.max(0, attrs.radius ?? attrs.r ?? 0),
    x1: attrs.x1 ?? 0,
    y1: attrs.y1 ?? 0,
    x2: attrs.x2 ?? 0,
    y2: attrs.y2 ?? 0,
    c1x: attrs.c1x ?? attrs.cx ?? 0,
    c1y: attrs.c1y ?? attrs.cy ?? 0,
    c2x: attrs.c2x ?? 0,
    c2y: attrs.c2y ?? 0,
    start: attrs.start ?? 0,
    end: attrs.end ?? 360,
    points: attrs.points || null,
    d: attrs.d || null,
    fill: attrs.fill || null,
    stroke: attrs.stroke || null,
    strokeWidth: attrs.strokeWidth ?? 1,
    strokeLineCap: attrs.strokeLineCap || 'butt',
    strokeLineJoin: attrs.strokeLineJoin || 'miter',
    strokeDash: attrs.strokeDash || null,
    strokeDashOffset: attrs.strokeDashOffset ?? 0,
    opacity: attrs.opacity ?? 1,
    fillOpacity: attrs.fillOpacity ?? 1,
    strokeOpacity: attrs.strokeOpacity ?? 1,
    shadow: attrs.shadow || null,
    blur: attrs.blur ?? 0,
    filter: attrs.filter || null,
    style: attrs.style || null,
    transform: attrs.transform || null,
    translate: attrs.translate || null,
    rotate: attrs.rotate ?? null,
    scale: attrs.scale ?? null,
    skew: attrs.skew || null,
    mirror: attrs.mirror || null,
    origin: attrs.origin || null,
    role: attrs.role || null,
    ariaLabel: attrs.ariaLabel || attrs.title || null,
    ariaHidden: attrs.ariaHidden ?? false,
    title: attrs.title || null,
  };
}

export function createTextNode(attrs = {}, content = '') {
  return {
    type: 'vector_text',
    id: attrs.id || null,
    x: attrs.x ?? 0,
    y: attrs.y ?? 0,
    w: attrs.w ?? 0,
    content: content || '',
    fontFamily: attrs.fontFamily || 'Inter, sans-serif',
    fontSize: attrs.fontSize ?? attrs.size ?? 16,
    fontWeight: attrs.fontWeight ?? attrs.weight ?? 400,
    fontStyle: attrs.fontStyle ?? attrs.style ?? 'normal',
    textAlign: attrs.textAlign ?? attrs.align ?? 'left',
    textBaseline: attrs.textBaseline ?? attrs.baseline ?? 'alphabetic',
    letterSpacing: attrs.letterSpacing ?? 0,
    wordSpacing: attrs.wordSpacing ?? 0,
    lineHeight: attrs.lineHeight ?? 1.2,
    wrap: attrs.wrap ?? false,
    maxWidth: attrs.maxWidth ?? attrs.w ?? 0,
    fill: attrs.fill || null,
    stroke: attrs.stroke || null,
    transform: attrs.transform || null,
    ariaLabel: attrs.ariaLabel || null,
  };
}

export function createImageNode(attrs = {}) {
  return {
    type: 'vector_image',
    id: attrs.id || null,
    src: attrs.src || '',
    x: attrs.x ?? 0,
    y: attrs.y ?? 0,
    w: attrs.w ?? 100,
    h: attrs.h ?? 100,
    opacity: attrs.opacity ?? 1,
    mask: attrs.mask || null,
    transform: attrs.transform || null,
  };
}

export function createIconNode(attrs = {}) {
  return {
    type: 'vector_icon',
    id: attrs.id || null,
    name: attrs.name || 'star',
    x: attrs.x ?? 0,
    y: attrs.y ?? 0,
    size: attrs.size ?? 24,
    color: attrs.color || attrs.fill || 'currentColor',
    transform: attrs.transform || null,
  };
}

export function createGradientNode(id, gradientType = 'linear', attrs = {}, stops = []) {
  return {
    type: 'vector_gradient',
    id,
    gradientType, // linear, radial, conic
    x1: attrs.x1 ?? 0,
    y1: attrs.y1 ?? 0,
    x2: attrs.x2 ?? 1,
    y2: attrs.y2 ?? 1,
    cx: attrs.cx ?? 0.5,
    cy: attrs.cy ?? 0.5,
    r: attrs.r ?? 0.5,
    angle: attrs.angle ?? 0,
    stops: stops || [],
  };
}

export function createPatternNode(id, attrs = {}, children = []) {
  return {
    type: 'vector_pattern',
    id,
    w: attrs.w ?? 20,
    h: attrs.h ?? 20,
    units: attrs.units || 'userSpaceOnUse',
    children: children || [],
  };
}

export function createStyleNode(id, properties = {}) {
  return {
    type: 'vector_style',
    id,
    properties: properties || {},
  };
}

export function createMarkerNode(id, attrs = {}, children = []) {
  return {
    type: 'vector_marker',
    id,
    orient: attrs.orient || 'auto',
    w: attrs.w ?? 10,
    h: attrs.h ?? 10,
    children: children || [],
  };
}
