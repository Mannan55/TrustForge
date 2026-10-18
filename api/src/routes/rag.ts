import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router, Request, Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Load authoritative corpus
let corpus: any[] = [];
try {
  const possiblePaths = [
    path.resolve(__dirname, '../../../backend/knowledge/authoritative_corpus.json'),
    path.resolve(process.cwd(), 'backend/knowledge/authoritative_corpus.json'),
    path.resolve(process.cwd(), '../backend/knowledge/authoritative_corpus.json'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      corpus = JSON.parse(fs.readFileSync(p, 'utf-8'));
      break;
    }
  }
} catch (err) {
  console.warn('RAG Route: Could not load corpus JSON:', err);
}

router.post('/rag/retrieve', (req: Request, res: Response) => {
  const { query, top_k = 5, source_type_filter } = req.body;

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Search query is required.' });
    return;
  }

  const queryTerms = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  // Score chunks by term frequency & header match
  const scored = corpus.map(chunk => {
    let score = 0;
    const textLower = (chunk.text || '').toLowerCase();
    const headingLower = (chunk.heading || '').toLowerCase();
    const secLower = (chunk.section || '').toLowerCase();

    for (const term of queryTerms) {
      if (secLower.includes(term)) score += 3.0;
      if (headingLower.includes(term)) score += 2.0;
      if (textLower.includes(term)) score += 1.0;
    }

    // Normalize roughly to [0, 1]
    const normScore = Math.min(0.99, Math.round((score / (queryTerms.length * 3 + 1)) * 1000) / 1000);

    return {
      chunk_id: chunk.chunk_id,
      document_id: chunk.document_id,
      document_title: chunk.document_title,
      authority: chunk.authority,
      section: chunk.section,
      heading: chunk.heading,
      text: chunk.text,
      similarity_score: normScore,
      commencement_status: chunk.commencement_status,
      enforceability: chunk.enforceability,
      source_url: chunk.source_url,
      version: chunk.version,
    };
  });

  scored.sort((a, b) => b.similarity_score - a.similarity_score);
  const results = scored.slice(0, Math.min(20, Math.max(1, top_k)));

  res.json(results);
});

export default router;
