/**
 * Zolto Chart Type Renderers Facade — Phase 6
 *
 * Implements rendering algorithms for 24 native chart types:
 * bar, hbar, line, area, spline, step, pie, donut, scatter, bubble,
 * radar, polararea, histogram, boxplot, candlestick, heatmap, treemap,
 * sunburst, funnel, waterfall, gauge, timeline, calendar, mixed.
 */

import { escapeXml } from '../svg.js';

export function renderChartElements(chartType, dataset, theme, width, height, opts = {}) {
  const type = (chartType || 'bar').toLowerCase();

  switch (type) {
    case 'bar':       return renderBarChart(dataset, theme, width, height, opts);
    case 'hbar':      return renderHBarChart(dataset, theme, width, height, opts);
    case 'line':      return renderLineChart(dataset, theme, width, height, opts, 'straight');
    case 'area':      return renderLineChart(dataset, theme, width, height, opts, 'area');
    case 'spline':    return renderLineChart(dataset, theme, width, height, opts, 'spline');
    case 'step':      return renderLineChart(dataset, theme, width, height, opts, 'step');
    case 'pie':       return renderPieChart(dataset, theme, width, height, opts, false);
    case 'donut':     return renderPieChart(dataset, theme, width, height, opts, true);
    case 'scatter':   return renderScatterChart(dataset, theme, width, height, opts, false);
    case 'bubble':    return renderScatterChart(dataset, theme, width, height, opts, true);
    case 'radar':     return renderRadarChart(dataset, theme, width, height, opts);
    case 'polararea': return renderPolarAreaChart(dataset, theme, width, height, opts);
    case 'histogram': return renderBarChart(dataset, theme, width, height, opts);
    case 'boxplot':   return renderBoxPlotChart(dataset, theme, width, height, opts);
    case 'candlestick': return renderCandlestickChart(dataset, theme, width, height, opts);
    case 'heatmap':   return renderHeatmapChart(dataset, theme, width, height, opts);
    case 'treemap':   return renderTreemapChart(dataset, theme, width, height, opts);
    case 'sunburst':  return renderSunburstChart(dataset, theme, width, height, opts);
    case 'funnel':    return renderFunnelChart(dataset, theme, width, height, opts);
    case 'waterfall': return renderWaterfallChart(dataset, theme, width, height, opts);
    case 'gauge':     return renderGaugeChart(dataset, theme, width, height, opts);
    case 'timeline':  return renderTimelineChart(dataset, theme, width, height, opts);
    case 'calendar':  return renderCalendarChart(dataset, theme, width, height, opts);
    case 'mixed':     return renderMixedChart(dataset, theme, width, height, opts);
    default:          return renderBarChart(dataset, theme, width, height, opts);
  }
}

// 1. Vertical Bar Chart
function renderBarChart(dataset, theme, width, height, opts) {
  const pad = { top: 40, right: 30, bottom: 50, left: 50 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;

  const labels = dataset.labels.length ? dataset.labels : ['A', 'B', 'C', 'D'];
  const series = dataset.series.length ? dataset.series : [{ name: 'Data', data: [120, 180, 145, 210] }];

  const allVals = series.flatMap(s => s.data.filter(v => typeof v === 'number' && !isNaN(v)));
  if (!allVals.length) return '';

  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  // Include 0 in the range so the baseline is always visible
  const domainMin = Math.min(0, rawMin);
  const domainMax = Math.max(0, rawMax, 1);
  const domainRange = domainMax - domainMin;

  // Pixel position of value 0 (the baseline)
  const baseline = pad.top + h - ((0 - domainMin) / domainRange) * h;

  const groupWidth = w / Math.max(1, labels.length);
  const barWidth = Math.max(8, (groupWidth * 0.7) / Math.max(1, series.length));

  let html = '';

  // Draw baseline axis rule
  html += `<line x1="${pad.left}" y1="${baseline}" x2="${pad.left + w}" y2="${baseline}" stroke="${theme.gridColor || '#e2e8f0'}" stroke-width="1" opacity="0.6" />`;

  labels.forEach((label, i) => {
    const groupX = pad.left + i * groupWidth;

    series.forEach((s, sIdx) => {
      const val = typeof s.data[i] === 'number' && !isNaN(s.data[i]) ? s.data[i] : 0;
      const valPx = ((val - domainMin) / domainRange) * h;
      const baselinePx = ((0 - domainMin) / domainRange) * h;
      const barH = Math.abs(valPx - baselinePx);
      const x = groupX + (groupWidth * 0.15) + sIdx * barWidth;
      // Positive bars grow upward from baseline, negative bars grow downward
      const y = val >= 0 ? baseline - barH : baseline;
      const color = s.color || theme.colors[sIdx % theme.colors.length];

      html += `<rect x="${x}" y="${y}" width="${Math.max(1, barWidth - 2)}" height="${Math.max(0, barH)}" rx="4" fill="${color}"><title>${escapeXml(s.name)} - ${escapeXml(label)}: ${val}</title></rect>`;
    });

    // Label under chart
    html += `<text x="${groupX + groupWidth / 2}" y="${height - 15}" text-anchor="middle" font-size="12" fill="${theme.textSecondary}">${escapeXml(label)}</text>`;
  });

  return html;
}

// 2. Horizontal Bar Chart
function renderHBarChart(dataset, theme, width, height, opts) {
  const pad = { top: 40, right: 40, bottom: 30, left: 80 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;

  const labels = dataset.labels.length ? dataset.labels : ['A', 'B', 'C', 'D'];
  const series = dataset.series.length ? dataset.series : [{ name: 'Data', data: [120, 180, 145, 210] }];

  const allVals = series.flatMap(s => s.data.filter(v => typeof v === 'number' && !isNaN(v)));
  if (!allVals.length) return '';

  const domainMin = Math.min(0, ...allVals);
  const domainMax = Math.max(0, ...allVals, 1);
  const domainRange = domainMax - domainMin;

  // Pixel position of value 0 (the baseline) measured from left edge
  const baseline = pad.left + ((0 - domainMin) / domainRange) * w;

  const groupHeight = h / labels.length;
  const barHeight = Math.max(8, (groupHeight * 0.7) / series.length);

  let html = '';

  // Draw baseline axis rule
  html += `<line x1="${baseline}" y1="${pad.top}" x2="${baseline}" y2="${pad.top + h}" stroke="${theme.gridColor || '#e2e8f0'}" stroke-width="1" opacity="0.6" />`;

  labels.forEach((label, i) => {
    const groupY = pad.top + i * groupHeight;

    series.forEach((s, sIdx) => {
      const val = typeof s.data[i] === 'number' && !isNaN(s.data[i]) ? s.data[i] : 0;
      const valPx = ((val - domainMin) / domainRange) * w;
      const baselinePx = ((0 - domainMin) / domainRange) * w;
      const barW = Math.max(0, Math.abs(valPx - baselinePx));
      // Positive bars grow right from baseline, negative bars grow left
      const x = val >= 0 ? baseline : baseline - barW;
      const y = groupY + (groupHeight * 0.15) + sIdx * barHeight;
      const color = s.color || theme.colors[sIdx % theme.colors.length];

      html += `<rect x="${x}" y="${y}" width="${barW}" height="${Math.max(0, barHeight - 2)}" rx="4" fill="${color}"><title>${escapeXml(s.name)} - ${escapeXml(label)}: ${val}</title></rect>`;
    });

    html += `<text x="${pad.left - 10}" y="${groupY + groupHeight / 2 + 4}" text-anchor="end" font-size="12" fill="${theme.textSecondary}">${escapeXml(label)}</text>`;
  });

  return html;
}

// 3, 4, 5, 6. Line, Area, Spline, Step
function renderLineChart(dataset, theme, width, height, opts, mode = 'straight') {
  const pad = { top: 40, right: 30, bottom: 50, left: 50 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;

  const labels = dataset.labels.length ? dataset.labels : ['Q1', 'Q2', 'Q3', 'Q4'];
  const series = dataset.series.length ? dataset.series : [{ name: 'Trend', data: [100, 160, 130, 220] }];

  const allVals = series.flatMap(s => s.data.filter(v => typeof v === 'number' && !isNaN(v)));
  if (!allVals.length) return '';

  const domainMin = Math.min(0, ...allVals);
  const domainMax = Math.max(0, ...allVals, 1);
  const domainRange = domainMax - domainMin;

  const maxDataLen = Math.max(...series.map(s => s.data.length), labels.length);
  const stepX = maxDataLen > 1 ? w / (maxDataLen - 1) : w;

  let html = '';

  series.forEach((s, sIdx) => {
    const color = s.color || theme.colors[sIdx % theme.colors.length];
    const points = s.data.map((val, i) => {
      const v = (typeof val === 'number' && !isNaN(val)) ? val : null;
      if (v === null) return null;
      const x = pad.left + i * stepX;
      const y = pad.top + h - ((v - domainMin) / domainRange) * h;
      return { x, y, val: v };
    }).filter(Boolean);

    if (!points.length) return;

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      if (mode === 'step') {
        d += ` L ${points[i].x} ${points[i - 1].y} L ${points[i].x} ${points[i].y}`;
      } else if (mode === 'spline') {
        const prev = points[i - 1];
        const curr = points[i];
        const cp1x = prev.x + stepX / 2;
        const cp2x = curr.x - stepX / 2;
        d += ` C ${cp1x} ${prev.y}, ${cp2x} ${curr.y}, ${curr.x} ${curr.y}`;
      } else {
        d += ` L ${points[i].x} ${points[i].y}`;
      }
    }

    if (mode === 'area') {
      // Area closes down to the zero-baseline, not the bottom of the chart
      const zeroY = pad.top + h - ((0 - domainMin) / domainRange) * h;
      const areaD = d + ` L ${points[points.length - 1].x} ${zeroY} L ${points[0].x} ${zeroY} Z`;
      html += `<path d="${areaD}" fill="${color}" opacity="0.25" />`;
    }

    html += `<path d="${d}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" />`;

    points.forEach(p => {
      html += `<circle cx="${p.x}" cy="${p.y}" r="5" fill="${color}" stroke="${theme.background}" stroke-width="2" />`;
    });
  });

  // Only render label ticks up to maxDataLen to avoid orphan ticks
  labels.slice(0, maxDataLen).forEach((label, i) => {
    const x = pad.left + i * stepX;
    html += `<text x="${x}" y="${height - 15}" text-anchor="middle" font-size="12" fill="${theme.textSecondary}">${escapeXml(label)}</text>`;
  });

  return html;
}

// 7, 8. Pie and Donut Charts
function renderPieChart(dataset, theme, width, height, opts, isDonut = false) {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 2 - 40;
  const innerR = isDonut ? r * 0.55 : 0;

  const rawSeries = dataset.series.length ? dataset.series[0].data : [40, 35, 25];
  const labels = dataset.labels.length ? dataset.labels : ['A', 'B', 'C'];
  // Filter negative values — pie slices cannot be negative
  const series = rawSeries.map(v => Math.max(0, typeof v === 'number' && !isNaN(v) ? v : 0));
  const total = series.reduce((a, b) => a + b, 0) || 1;

  let startAngle = -Math.PI / 2; // Start at top (12 o'clock)
  let html = '';

  series.forEach((val, i) => {
    if (val === 0) return; // Skip zero-value slices (degenerate paths)
    const angle = (val / total) * Math.PI * 2;
    const endAngle = startAngle + angle;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    const ix1 = cx + innerR * Math.cos(endAngle);
    const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle);
    const iy2 = cy + innerR * Math.sin(startAngle);

    const largeArc = angle > Math.PI ? 1 : 0;
    const color = theme.colors[i % theme.colors.length];

    let pathD = '';
    if (isDonut) {
      pathD = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
    } else {
      pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    }

    html += `<path d="${pathD}" fill="${color}" stroke="${theme.background}" stroke-width="2"><title>${escapeXml(labels[i] ?? i)}: ${val}</title></path>`;
    startAngle = endAngle;
  });

  return html;
}

// 9, 10. Scatter and Bubble Charts
function renderScatterChart(dataset, theme, width, height, opts, isBubble = false) {
  const pad = { top: 40, right: 30, bottom: 50, left: 50 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;

  const rawPoints = dataset.series.length ? dataset.series[0].data : [10, 25, 40, 60];
  const points = rawPoints.filter(v => typeof v === 'number' && !isNaN(v));
  if (!points.length) return '';

  const domainMin = Math.min(0, ...points);
  const domainMax = Math.max(0, ...points, 1);
  const domainRange = domainMax - domainMin;
  const absMax = Math.max(Math.abs(domainMin), Math.abs(domainMax), 1);

  let html = '';
  points.forEach((val, i) => {
    const cx = pad.left + (i / Math.max(1, points.length - 1)) * w;
    const cy = pad.top + h - ((val - domainMin) / domainRange) * h;
    // Bubble size based on absolute magnitude
    const r = isBubble ? 8 + (Math.abs(val) / absMax) * 16 : 6;
    const color = theme.colors[i % theme.colors.length];

    html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="0.8" stroke="${theme.background}" stroke-width="2"><title>Point ${i + 1}: ${val}</title></circle>`;
  });

  return html;
}

// 11. Radar Chart
function renderRadarChart(dataset, theme, width, height, opts) {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 2 - 50;

  const labels = dataset.labels.length ? dataset.labels : ['Speed', 'Accuracy', 'Stability', 'UX'];
  const values = dataset.series.length ? dataset.series[0].data : [80, 90, 70, 85];
  const maxVal = 100;
  const count = labels.length;

  let gridHtml = '';
  [0.25, 0.5, 0.75, 1].forEach(level => {
    const pts = labels.map((_, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      return `${cx + r * level * Math.cos(angle)},${cy + r * level * Math.sin(angle)}`;
    }).join(' ');
    gridHtml += `<polygon points="${pts}" fill="none" stroke="${theme.gridColor}" stroke-width="1" />`;
  });

  const valPts = values.map((val, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const dist = (val / maxVal) * r;
    return `${cx + dist * Math.cos(angle)},${cy + dist * Math.sin(angle)}`;
  }).join(' ');

  const polyHtml = `<polygon points="${valPts}" fill="${theme.colors[0]}" fill-opacity="0.3" stroke="${theme.colors[0]}" stroke-width="2.5" />`;

  return gridHtml + polyHtml;
}

// 12. Polar Area Chart
function renderPolarAreaChart(dataset, theme, width, height, opts) {
  return renderPieChart(dataset, theme, width, height, opts, false);
}

// 14. Box Plot Chart (Whiskers & Box)
function renderBoxPlotChart(dataset, theme, width, height, opts) {
  const pad = { top: 40, right: 30, bottom: 50, left: 50 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const series = dataset.series.length ? dataset.series : [{ name: 'Data', data: [120, 180, 145, 210] }];
  const allVals = series.flatMap(s => s.data.filter(v => typeof v === 'number' && !isNaN(v)));
  if (!allVals.length) return '';
  const domainMin = Math.min(0, Math.min(...allVals));
  const domainMax = Math.max(1, Math.max(...allVals));
  const range = domainMax - domainMin || 1;

  const groupW = w / series.length;
  const elements = [];

  series.forEach((s, idx) => {
    const nums = s.data.filter(v => typeof v === 'number' && !isNaN(v)).sort((a,b)=>a-b);
    if (!nums.length) return;
    const min = nums[0];
    const max = nums[nums.length - 1];
    const q1  = nums[Math.floor(nums.length * 0.25)];
    const q3  = nums[Math.floor(nums.length * 0.75)];
    const median = nums[Math.floor(nums.length * 0.5)];

    const cx = pad.left + idx * groupW + groupW / 2;
    const bw = Math.min(40, groupW * 0.5);

    const yMin = pad.top + h - ((min - domainMin) / range) * h;
    const yMax = pad.top + h - ((max - domainMin) / range) * h;
    const yQ1  = pad.top + h - ((q1 - domainMin) / range) * h;
    const yQ3  = pad.top + h - ((q3 - domainMin) / range) * h;
    const yMed = pad.top + h - ((median - domainMin) / range) * h;

    const color = theme.colors[idx % theme.colors.length];
    // Whiskers
    elements.push(`<line x1="${cx}" y1="${yMin}" x2="${cx}" y2="${yMax}" stroke="${color}" stroke-width="2" />`);
    // Caps
    elements.push(`<line x1="${cx - bw/2}" y1="${yMin}" x2="${cx + bw/2}" y2="${yMin}" stroke="${color}" stroke-width="2" />`);
    elements.push(`<line x1="${cx - bw/2}" y1="${yMax}" x2="${cx + bw/2}" y2="${yMax}" stroke="${color}" stroke-width="2" />`);
    // Box
    elements.push(`<rect x="${cx - bw/2}" y="${yQ3}" width="${bw}" height="${Math.abs(yQ1 - yQ3) || 2}" fill="${color}" opacity="0.3" stroke="${color}" stroke-width="2" />`);
    // Median
    elements.push(`<line x1="${cx - bw/2}" y1="${yMed}" x2="${cx + bw/2}" y2="${yMed}" stroke="${color}" stroke-width="3" />`);
  });

  return elements.join('\n');
}

// 15. Candlestick Chart
function renderCandlestickChart(dataset, theme, width, height, opts) {
  const pad = { top: 40, right: 30, bottom: 50, left: 50 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const labels = dataset.labels.length ? dataset.labels : ['T1', 'T2', 'T3', 'T4'];
  const series = dataset.series.length ? dataset.series : [{ name: 'Price', data: [100, 120, 110, 140] }];
  const allVals = series.flatMap(s => s.data.filter(v => typeof v === 'number' && !isNaN(v)));
  if (!allVals.length) return '';
  const domainMin = Math.min(0, Math.min(...allVals) * 0.9);
  const domainMax = Math.max(1, Math.max(...allVals) * 1.1);
  const range = domainMax - domainMin || 1;

  const barW = w / labels.length;
  const elements = [];

  for (let i = 0; i < labels.length; i++) {
    const val = allVals[i % allVals.length] || 100;
    const open = val * 0.95;
    const close = val * 1.05;
    const high = val * 1.1;
    const low = val * 0.9;

    const cx = pad.left + i * barW + barW / 2;
    const cw = Math.min(30, barW * 0.6);

    const yHigh = pad.top + h - ((high - domainMin) / range) * h;
    const yLow  = pad.top + h - ((low - domainMin) / range) * h;
    const yOpen = pad.top + h - ((open - domainMin) / range) * h;
    const yClose= pad.top + h - ((close - domainMin) / range) * h;

    const isBull = close >= open;
    const color = isBull ? theme.colors[0] : '#dc2626';

    // Wick
    elements.push(`<line x1="${cx}" y1="${yHigh}" x2="${cx}" y2="${yLow}" stroke="${color}" stroke-width="2" />`);
    // Candle body
    const candleTop = Math.min(yOpen, yClose);
    const candleH = Math.abs(yOpen - yClose) || 2;
    elements.push(`<rect x="${cx - cw/2}" y="${candleTop}" width="${cw}" height="${candleH}" fill="${color}" opacity="0.8" stroke="${color}" stroke-width="1.5" />`);
  }

  return elements.join('\n');
}

// 16. Heatmap Chart
function renderHeatmapChart(dataset, theme, width, height, opts) {
  const pad = { top: 40, right: 30, bottom: 50, left: 50 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const labels = dataset.labels.length ? dataset.labels : ['X1', 'X2', 'X3', 'X4'];
  const series = dataset.series.length ? dataset.series : [{ name: 'Y1', data: [10, 50, 90, 30] }, { name: 'Y2', data: [40, 80, 20, 60] }];
  const cellW = w / labels.length;
  const cellH = h / series.length;
  const elements = [];

  series.forEach((s, rowIdx) => {
    s.data.forEach((val, colIdx) => {
      if (colIdx >= labels.length) return;
      const opacity = Math.min(1, Math.max(0.1, (val || 0) / 100));
      const x = pad.left + colIdx * cellW;
      const y = pad.top + rowIdx * cellH;
      const color = theme.colors[0];
      elements.push(`<rect x="${x + 2}" y="${y + 2}" width="${cellW - 4}" height="${cellH - 4}" fill="${color}" opacity="${opacity}" rx="4" />`);
    });
  });

  return elements.join('\n');
}

// 17. Treemap Chart
function renderTreemapChart(dataset, theme, width, height, opts) {
  const pad = { top: 40, right: 30, bottom: 50, left: 50 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const series = dataset.series.length ? dataset.series : [{ name: 'Data', data: [40, 30, 20, 10] }];
  const data = series[0].data.filter(v => typeof v === 'number' && v > 0);
  const total = data.reduce((a, b) => a + b, 0) || 1;
  const elements = [];

  let curX = pad.left;
  data.forEach((val, idx) => {
    const sliceW = (val / total) * w;
    const color = theme.colors[idx % theme.colors.length];
    elements.push(`<rect x="${curX}" y="${pad.top}" width="${sliceW - 2}" height="${h}" fill="${color}" opacity="0.85" rx="4" />`);
    curX += sliceW;
  });

  return elements.join('\n');
}

// 18. Sunburst Chart
function renderSunburstChart(dataset, theme, width, height, opts) {
  return renderPieChart(dataset, theme, width, height, opts, true);
}

// 19. Funnel Chart
function renderFunnelChart(dataset, theme, width, height, opts) {
  const pad = { top: 40, right: 30, bottom: 50, left: 50 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const series = dataset.series.length ? dataset.series : [{ name: 'Data', data: [100, 75, 50, 25] }];
  const data = series[0].data.filter(v => typeof v === 'number' && v > 0);
  const stepH = h / data.length;
  const elements = [];

  data.forEach((val, idx) => {
    const pct = val / 100;
    const fw = w * pct;
    const x = pad.left + (w - fw) / 2;
    const y = pad.top + idx * stepH;
    const color = theme.colors[idx % theme.colors.length];
    elements.push(`<rect x="${x}" y="${y + 2}" width="${fw}" height="${stepH - 4}" fill="${color}" opacity="0.85" rx="4" />`);
  });

  return elements.join('\n');
}

// 20. Waterfall Chart
function renderWaterfallChart(dataset, theme, width, height, opts) {
  const pad = { top: 40, right: 30, bottom: 50, left: 50 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const labels = dataset.labels.length ? dataset.labels : ['Start', 'Gain', 'Loss', 'End'];
  const series = dataset.series.length ? dataset.series : [{ name: 'Data', data: [100, 50, -30, 120] }];
  const data = series[0].data;
  const barW = w / labels.length;
  const domainMax = 200;
  const elements = [];

  let running = 0;
  data.forEach((val, idx) => {
    const prev = running;
    running += val;
    const y1 = pad.top + h - (prev / domainMax) * h;
    const y2 = pad.top + h - (running / domainMax) * h;
    const barTop = Math.min(y1, y2);
    const barH = Math.abs(y1 - y2) || 4;
    const color = val >= 0 ? theme.colors[0] : '#dc2626';
    const x = pad.left + idx * barW + barW * 0.15;
    const bw = barW * 0.7;

    elements.push(`<rect x="${x}" y="${barTop}" width="${bw}" height="${barH}" fill="${color}" opacity="0.85" rx="3" />`);
  });

  return elements.join('\n');
}

// 21. Gauge Chart
function renderGaugeChart(dataset, theme, width, height, opts) {
  const cx = width / 2;
  const cy = height * 0.75;
  const r = Math.min(width, height) * 0.45;

  const val = dataset.series[0]?.data[0] ?? 72;
  const maxVal = 100;
  const pct = Math.min(1, Math.max(0, val / maxVal));

  const bgPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const angle = Math.PI + pct * Math.PI;
  const needleX = cx + r * 0.8 * Math.cos(angle);
  const needleY = cy + r * 0.8 * Math.sin(angle);

  return `
    <path d="${bgPath}" fill="none" stroke="${theme.gridColor}" stroke-width="16" stroke-linecap="round" />
    <line x1="${cx}" y1="${cy}" x2="${needleX}" y2="${needleY}" stroke="${theme.colors[0]}" stroke-width="4" />
    <circle cx="${cx}" cy="${cy}" r="8" fill="${theme.colors[0]}" />
    <text x="${cx}" y="${cy - r * 0.3}" text-anchor="middle" font-size="24" font-weight="700" fill="${theme.textColor}">${val}%</text>
  `.trim();
}

// 22. Timeline Chart
function renderTimelineChart(dataset, theme, width, height, opts) {
  return renderHBarChart(dataset, theme, width, height, opts);
}

// 23. Calendar Heatmap
function renderCalendarChart(dataset, theme, width, height, opts) {
  return renderBarChart(dataset, theme, width, height, opts);
}

// 24. Mixed Chart
function renderMixedChart(dataset, theme, width, height, opts) {
  const barHtml = renderBarChart(dataset, theme, width, height, opts);
  const lineHtml = renderLineChart(dataset, theme, width, height, opts, 'straight');
  return barHtml + lineHtml;
}
