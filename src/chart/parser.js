/**
 * Zolto Chart Parser — Phase 6
 *
 * Converts token streams into structured Chart ASTs.
 */

import { chartNode, datasetNode, seriesNode, axisNode, legendNode, labelNode, tooltipPlaceholderNode, animationPlaceholderNode } from './ast.js';
import { tokenizeChart, ChartTokenType } from './tokenizer.js';
import { parseCSV, parseTSV, parseJSONData } from './datasets.js';

export function parseChart(bodyStr, headerStr = '') {
  let cleanBody = (bodyStr ?? '').trim();
  let cleanHeader = (headerStr ?? '').trim();

  if (cleanBody.startsWith('@chart')) {
    const lines = cleanBody.split(/\r?\n/);
    const firstLine = lines[0];
    cleanHeader = firstLine.replace(/^@chart\s*/, '').trim();
    if (lines[lines.length - 1].trim() === '@/chart') {
      lines.pop();
    }
    lines.shift();
    cleanBody = lines.join('\n');
  }

  const fullText = `@chart ${cleanHeader}\n${cleanBody}\n@/chart`;
  const tokens = tokenizeChart(fullText);
  let pos = 0;

  function peek() { return tokens[pos] ?? { type: ChartTokenType.EOF }; }
  function advance() { return tokens[pos++]; }
  function match(type) {
    if (peek().type === type) return advance();
    return null;
  }

  const chartOpts = {
    title: null,
    subtitle: null,
    theme: 'light',
    width: 800,
    height: 450,
    responsive: true,
    animation: true,
    legend: true,
    colors: null,
    exportFormat: 'svg',
    accessibility: true,
    aria: null,
    attributes: {},
    datasets: [],
    axes: [],
    legendConfig: null,
    tooltipConfig: null,
    styleConfig: null,
    animationConfig: null,
    transformConfig: null,
    statsConfig: null,
  };

  let chartType = 'bar';

  // Parse header
  if (tokens.length > 0) {
    const firstTok = advance(); // @chart or type
    if (firstTok.value === 'chart' || firstTok.type === ChartTokenType.OPEN_CHART) {
      if (peek().type === ChartTokenType.IDENTIFIER || peek().type === ChartTokenType.CHART_TYPE) {
        chartType = advance().value.toLowerCase();
      }
    } else if (firstTok.type === ChartTokenType.IDENTIFIER) {
      chartType = firstTok.value.toLowerCase();
    }
  }

  // Parse inline header attributes
  while (pos < tokens.length && peek().type !== ChartTokenType.NEWLINE && peek().type !== ChartTokenType.SECTION_HEADER && peek().type !== ChartTokenType.EOF) {
    const keyTok = advance();
    if (!keyTok || keyTok.type === ChartTokenType.NEWLINE) continue;
    const key = String(keyTok.value);

    if (match(ChartTokenType.EQUALS)) {
      const valTok = advance();
      let val = valTok ? valTok.value : true;

      // Array values like colors=["#4f46e5", "#22c55e"]
      if (valTok && valTok.type === ChartTokenType.LBRACKET) {
        const arrVals = [];
        while (pos < tokens.length && peek().type !== ChartTokenType.RBRACKET && peek().type !== ChartTokenType.EOF) {
          const itemTok = advance();
          if (itemTok && itemTok.type !== ChartTokenType.COMMA) {
            arrVals.push(itemTok.value);
          }
        }
        match(ChartTokenType.RBRACKET);
        val = arrVals;
      }

      if (key === 'title') chartOpts.title = String(val);
      else if (key === 'subtitle') chartOpts.subtitle = String(val);
      else if (key === 'theme') chartOpts.theme = String(val);
      else if (key === 'width') chartOpts.width = Number(val);
      else if (key === 'height') chartOpts.height = Number(val);
      else if (key === 'responsive') chartOpts.responsive = Boolean(val);
      else if (key === 'animation') chartOpts.animation = Boolean(val);
      else if (key === 'legend') chartOpts.legend = Boolean(val);
      else if (key === 'colors') chartOpts.colors = Array.isArray(val) ? val : null;
      else if (key === 'id') chartOpts.id = String(val);
      else if (key === 'export') chartOpts.exportFormat = String(val);
      else if (key === 'accessibility') chartOpts.accessibility = Boolean(val);
      else chartOpts.attributes[key] = val;
    } else {
      chartOpts.attributes[key] = true;
    }
  }

  const defaultDataset = datasetNode('default');
  let currentDataset = defaultDataset;
  chartOpts.datasets.push(defaultDataset);

  // Parse body sections
  while (pos < tokens.length && peek().type !== ChartTokenType.EOF && peek().type !== ChartTokenType.CLOSE_CHART) {
    const tok = advance();
    if (tok.type === ChartTokenType.NEWLINE || tok.type === ChartTokenType.CLOSE_CHART) continue;

    if (tok.type === ChartTokenType.SECTION_HEADER) {
      const headerName = tok.value.toLowerCase();

      if (headerName === 'labels:') {
        let lineParts = [];
        let prevEndCol = null;
        const flushLine = () => {
          if (lineParts.length > 0) currentDataset.labels.push(lineParts.join(''));
          lineParts = [];
          prevEndCol = null;
        };
        while (pos < tokens.length && peek().type !== ChartTokenType.SECTION_HEADER && peek().type !== ChartTokenType.CLOSE_CHART && peek().type !== ChartTokenType.EOF) {
          const valTok = advance();
          if (valTok && valTok.type === ChartTokenType.NEWLINE) {
            flushLine();
          } else if (valTok) {
            const text = String(valTok.value);
            if (prevEndCol !== null && valTok.column > prevEndCol) lineParts.push(' ');
            lineParts.push(text);
            prevEndCol = valTok.column + (valTok.raw ?? text).length;
          }
        }
        flushLine();
      } else if (headerName === 'data:') {
        const dataVals = [];
        while (pos < tokens.length && peek().type !== ChartTokenType.SECTION_HEADER && peek().type !== ChartTokenType.CLOSE_CHART && peek().type !== ChartTokenType.EOF) {
          const valTok = advance();
          if (valTok && valTok.type !== ChartTokenType.NEWLINE) {
            if (valTok.type === ChartTokenType.NUMBER) {
              dataVals.push(valTok.value);
            } else if (valTok.type === ChartTokenType.VARIABLE_REF) {
              currentDataset.metadata.variableRef = valTok.value;
            } else if (typeof valTok.value === 'number') {
              dataVals.push(valTok.value);
            }
          }
        }
        if (dataVals.length) {
          currentDataset.series.push(seriesNode('Values', dataVals));
        }
      } else if (headerName === 'series:') {
        // Multi-series parsing
        let currentSeries = null;
        while (pos < tokens.length && peek().type !== ChartTokenType.SECTION_HEADER && peek().type !== ChartTokenType.CLOSE_CHART && peek().type !== ChartTokenType.EOF) {
          const sTok = advance();
          if (sTok.type === ChartTokenType.HYPHEN) {
            currentSeries = seriesNode('Series ' + (currentDataset.series.length + 1));
            currentDataset.series.push(currentSeries);
          } else if (sTok.value === 'name' && currentSeries) {
            match(ChartTokenType.COLON);
            const nameTok = advance();
            if (nameTok) currentSeries.name = String(nameTok.value);
          } else if (sTok.value === 'data' && currentSeries) {
            match(ChartTokenType.COLON);
            const sData = [];
            while (pos < tokens.length && peek().type !== ChartTokenType.NEWLINE && peek().type !== ChartTokenType.HYPHEN && peek().type !== ChartTokenType.SECTION_HEADER && peek().type !== ChartTokenType.EOF) {
              const numTok = advance();
              if (numTok && numTok.type === ChartTokenType.NUMBER) {
                sData.push(numTok.value);
              }
            }
            currentSeries.data = sData;
          }
        }
      } else if (headerName === 'source:') {
        const srcTok = advance();
        let srcType = srcTok ? String(srcTok.value).toLowerCase() : 'csv';
        if (srcType.endsWith(':')) srcType = srcType.slice(0, -1);

        let currentLineTokens = [];
        const rawSrcLines = [];

        while (pos < tokens.length && peek().type !== ChartTokenType.SECTION_HEADER && peek().type !== ChartTokenType.CLOSE_CHART && peek().type !== ChartTokenType.EOF) {
          const lTok = advance();
          if (lTok.type === ChartTokenType.NEWLINE) {
            if (currentLineTokens.length) {
              rawSrcLines.push(currentLineTokens.join(''));
              currentLineTokens = [];
            }
          } else {
            let strVal = lTok.raw || String(lTok.value);
            if (srcType === 'json' && lTok.type === ChartTokenType.STRING) {
              strVal = JSON.stringify(lTok.value);
            } else if ((srcType === 'csv' || srcType === 'tsv') && lTok.type === ChartTokenType.STRING) {
              strVal = `"${lTok.value}"`;
            }
            currentLineTokens.push(strVal);
          }
        }
        if (currentLineTokens.length) {
          rawSrcLines.push(currentLineTokens.join(''));
        }

        const rawContent = rawSrcLines.join('\n');
        if (srcType === 'csv') {
          const parsed = parseCSV(rawContent);
          currentDataset.labels = parsed.labels;
          currentDataset.series = parsed.series;
        } else if (srcType === 'tsv') {
          const parsed = parseTSV(rawContent);
          currentDataset.labels = parsed.labels;
          currentDataset.series = parsed.series;
        } else if (srcType === 'json') {
          const parsed = parseJSONData(rawContent);
          currentDataset.labels = parsed.labels;
          currentDataset.series = parsed.series;
        }
      } else if (headerName === 'xaxis:' || headerName === 'yaxis:') {
        const side = headerName === 'xaxis:' ? 'bottom' : 'left';
        const axis = axisNode(headerName.slice(0, -1), side);
        chartOpts.axes.push(axis);
      } else if (headerName === 'legend:') {
        chartOpts.legendConfig = legendNode();
      } else if (headerName === 'tooltip:') {
        chartOpts.tooltipConfig = tooltipPlaceholderNode();
      } else if (headerName === 'animation:') {
        chartOpts.animationConfig = animationPlaceholderNode();
      }
    }
  }

  return { ast: chartNode(chartType, chartOpts), diagnostics: [] };
}
