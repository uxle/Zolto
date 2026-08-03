/**
 * Zolto Chart SVG DOM Builder — Phase 6
 *
 * Generates accessible, responsive, export-ready SVG DOM containers.
 */

export function escapeXml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildChartLegend(dataset, theme, width, height, opts = {}) {
  if (!opts.show) return '';
  const series = dataset.series || [];
  if (!series.length) return '';

  let html = `<g class="zl-chart-legend" transform="translate(0, ${height - 25})">`;
  const totalW = series.length * 110;
  const startX = Math.max(20, (width - totalW) / 2);

  series.forEach((s, i) => {
    const x = startX + i * 110;
    const color = s.color || theme.colors[i % theme.colors.length];
    const name = escapeXml(s.name || `Series ${i + 1}`);

    html += `
      <g transform="translate(${x}, 0)">
        <rect x="0" y="0" width="12" height="12" rx="3" fill="${color}" />
        <text x="18" y="10" font-size="11" font-family="${theme.fontFamily}" fill="${theme.textSecondary}">${name}</text>
      </g>
    `;
  });

  html += `</g>`;
  return html;
}

export function buildChartTitle(title, subtitle, theme, width) {
  if (!title && !subtitle) return '';
  let html = `<g class="zl-chart-header">`;
  if (title) {
    html += `<text x="20" y="24" font-size="16" font-weight="700" font-family="${theme.fontFamily}" fill="${theme.textColor}">${escapeXml(title)}</text>`;
  }
  if (subtitle) {
    html += `<text x="20" y="40" font-size="12" font-family="${theme.fontFamily}" fill="${theme.textSecondary}">${escapeXml(subtitle)}</text>`;
  }
  html += `</g>`;
  return html;
}
