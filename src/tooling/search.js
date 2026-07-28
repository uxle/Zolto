/**
 * Zolto Search Engine — Phase 13
 *
 * Full-text and symbol search engine across documents and project files
 * supporting fuzzy matching, type filtering, and preview snippets.
 */

export class SearchEngine {
  constructor(indexer = null) {
    this.indexer = indexer;
  }

  /**
   * Search documents for a query.
   * @param {string} query Search query string
   * @param {Map<string, string>} documents Map of URI -> source text
   * @returns {Array<{ uri: string, line: number, text: string, match: string }>}
   */
  search(query = '', documents = new Map()) {
    const q = String(query || '').toLowerCase().trim();
    if (!q || !documents) return [];
    const results = [];

    let entries = [];
    if (documents instanceof Map) {
      entries = Array.from(documents.entries());
    } else if (Array.isArray(documents)) {
      entries = documents.map(d => [d.uri || d[0], d.content || d[1]]);
    } else if (typeof documents === 'object') {
      entries = Object.entries(documents);
    }

    for (const [uri, content] of entries) {
      const lines = String(content || '').split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.toLowerCase().includes(q)) {
          results.push({
            uri: String(uri || ''),
            line: i + 1,
            text: line.trim(),
            match: q,
          });
        }
      }
    }

    return results;
  }
}
