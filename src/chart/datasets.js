/**
 * Zolto Data Source & Dataset Parser — Phase 6
 *
 * Resolves inline data, CSV, TSV, JSON, variable references ($var),
 * and computed expression data sources into standard dataset shapes.
 */

function splitCSVLine(line) {
  const result = [];
  const re = /(?:^|,)(?:"([^"]*)"|([^,]*))/g;
  let m;
  while ((m = re.exec(line)) !== null) {
    if (m.index === re.lastIndex) re.lastIndex++;
    result.push((m[1] !== undefined ? m[1] : m[2]).trim());
  }
  return result;
}

export function parseCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { labels: [], series: [] };

  const header = splitCSVLine(lines[0]);
  const rows = lines.slice(1).map(splitCSVLine);

  const labels = [];
  const seriesMap = new Map();

  for (let c = 1; c < header.length; c++) {
    seriesMap.set(header[c], []);
  }

  for (const row of rows) {
    if (!row.length || !row[0]) continue;
    labels.push(row[0]);
    for (let c = 1; c < header.length; c++) {
      const rawCell = row[c] ?? '0';
      const cleanNumStr = String(rawCell).replace(/,/g, '');
      const val = Number(cleanNumStr);
      const seriesName = header[c] || `Series ${c}`;
      if (!seriesMap.has(seriesName)) seriesMap.set(seriesName, []);
      seriesMap.get(seriesName).push(isNaN(val) ? 0 : val);
    }
  }

  const series = Array.from(seriesMap.entries()).map(([name, data]) => ({ name, data }));
  return { labels, series };
}

export function parseTSV(tsvText) {
  const csvLike = tsvText.replace(/\t/g, ',');
  return parseCSV(csvLike);
}

export function parseJSONData(jsonText) {
  try {
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) {
      const labels = [];
      const data = [];
      for (const item of parsed) {
        if (typeof item === 'object' && item !== null) {
          const labelCandidate = [item.label, item.month, item.name, item.x]
            .find(v => v !== undefined && v !== null);
          labels.push(labelCandidate !== undefined ? labelCandidate : String(labels.length + 1));
          const valueCandidate = [item.value, item.y, item.val]
            .find(v => v !== undefined && v !== null);
          data.push(Number(valueCandidate !== undefined ? valueCandidate : 0));
        } else {
          data.push(Number(item));
        }
      }
      return { labels, series: [{ name: 'Values', data }] };
    }
    return { labels: [], series: [] };
  } catch (err) {
    return { labels: [], series: [] };
  }
}

export function resolveVariableData(varName, contextVariables = {}) {
  const val = contextVariables[varName];
  if (Array.isArray(val)) {
    return { labels: val.map((_, i) => String(i + 1)), series: [{ name: varName, data: val.map(Number) }] };
  }
  return { labels: [], series: [] };
}
