/**
 * Zolto Chart Renderer Facade — Phase 6
 *
 * Renders a Chart AST node into an accessible, responsive SVG string.
 */

import { getChartTheme } from './themes.js';
import { renderChartElements } from './renderers/index.js';
import { buildChartLegend, buildChartTitle, escapeXml } from './svg.js';
import { computeStatsSummary } from './statistics.js';
import { resolveVariableData } from './datasets.js';

export function renderChart(chartAst, opts = {}) {
  if (!chartAst || chartAst.type !== 'chart') {
    throw new TypeError('renderChart expected a valid chart AST node (type === "chart")');
  }

  const theme = getChartTheme(chartAst.theme, chartAst.colors);
  const chartId = escapeXml(chartAst.id || `chart-${Math.random().toString(36).slice(2, 8)}`);
  const ariaLabel = escapeXml(chartAst.aria || chartAst.title || `${chartAst.chartType} chart`);

  const width = chartAst.width || 800;
  const height = chartAst.height || 450;

  const dataset = chartAst.datasets[0] ?? { labels: [], series: [], metadata: {} };

  // Resolve variable reference if present
  if (dataset.metadata.variableRef && opts.variables) {
    const resolved = resolveVariableData(dataset.metadata.variableRef, opts.variables);
    dataset.labels = resolved.labels;
    dataset.series = resolved.series;
  }

  // Statistical calculations if requested
  if (chartAst.statsConfig && dataset.series[0]?.data) {
    const stats = computeStatsSummary(dataset.series[0].data);
    dataset.metadata.stats = stats;
  }

  const chartContentHtml = renderChartElements(
    chartAst.chartType,
    dataset,
    theme,
    width,
    height,
    opts
  );

  const titleHtml = buildChartTitle(chartAst.title, chartAst.subtitle, theme, width);
  const legendHtml = buildChartLegend(dataset, theme, width, height, { show: chartAst.legend });

  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg"
     id="${chartId}"
     class="zl-chart zl-chart-${escapeXml(chartAst.chartType)}"
     viewBox="0 0 ${width} ${height}"
     width="100%"
     role="img"
     aria-label="${ariaLabel}"
     style="width: 100% !important; max-width: 100%; height: auto; display: block; margin: 12px auto; background-color: ${theme.background}; font-family: ${theme.fontFamily}; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
  <title>${ariaLabel}</title>
  ${chartAst.subtitle ? `<desc>${escapeXml(chartAst.subtitle)}</desc>` : ''}
  ${titleHtml}
  <g class="zl-chart-body">
    ${chartContentHtml}
  </g>
  ${legendHtml}
</svg>`.trim();

  return svgContent;
}
