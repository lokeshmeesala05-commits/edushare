import type { DocumentChunk } from './documentProcessor';

export interface RagResult {
  contextString: string;
  sourceChunks: DocumentChunk[];
}

// Lowered from 16000 to 4000 to prevent hitting Groq's 6000 TPM free-tier limit.
// If the document is larger than 4000 chars, it will use BM25 to extract only the most relevant chunks.
const MAX_FULL_TEXT_CHARS = 4000;

// ─── QUERY PARSER ────────────────────────────────────────────────────────────
// Parse user queries like "5th lesson 4th question" or "chapter 3 question 12"
// into structured metadata fields for exact lookup.

interface ParsedQuery {
  chapterNumber?: number;
  lessonNumber?: number;
  questionNumber?: number;
  exerciseNumber?: number;
  pageNumber?: number;
}

const parseQuery = (query: string): ParsedQuery => {
  // Normalize ordinals and number words
  let q = query.toLowerCase();
  const ordinalMap: Record<string, string> = {
    'first':'1','second':'2','third':'3','fourth':'4','fifth':'5',
    'sixth':'6','seventh':'7','eighth':'8','ninth':'9','tenth':'10',
    'eleventh':'11','twelfth':'12','thirteenth':'13','fourteenth':'14','fifteenth':'15',
    'one':'1','two':'2','three':'3','four':'4','five':'5',
    'six':'6','seven':'7','eight':'8','nine':'9','ten':'10',
    '1st':'1','2nd':'2','3rd':'3','4th':'4','5th':'5','6th':'6',
    '7th':'7','8th':'8','9th':'9','10th':'10','11th':'11','12th':'12',
    '13th':'13','14th':'14','15th':'15','16th':'16','17th':'17',
    '18th':'18','19th':'19','20th':'20',
  };
  for (const [k, v] of Object.entries(ordinalMap)) {
    q = q.replace(new RegExp(`\\b${k}\\b`, 'g'), v);
  }

  const result: ParsedQuery = {};

  // Chapter: "chapter 5", "ch 5", "ch.5"
  const chapterMatch = q.match(/(?:chapter|ch\.?|unit)\s*[-:]?\s*(\d+)/);
  if (chapterMatch) result.chapterNumber = parseInt(chapterMatch[1], 10);

  // Lesson: "lesson 3", "5 lesson" (for "5th lesson")
  const lessonMatchPre = q.match(/(\d+)\s*(?:lesson|les\.?)/i);
  const lessonMatchPost = q.match(/(?:lesson|les\.? )\s*[-:]?\s*(\d+)/i);
  if (lessonMatchPre) {
    result.lessonNumber = parseInt(lessonMatchPre[1], 10);
  } else if (lessonMatchPost) {
    result.lessonNumber = parseInt(lessonMatchPost[1], 10);
  }

  // Question: "question 4", "q.4", "4 question" (for "4th question")
  const questionMatch = q.match(/(?:question|q\.?|ques\.?)\s*[-:]?\s*(\d+)/) || q.match(/(\d+)\s*(?:question|q\b)/);
  if (questionMatch) result.questionNumber = parseInt(questionMatch[1], 10);

  // Exercise: "exercise 3", "ex.3"
  const exerciseMatch = q.match(/(?:exercise|ex\.?)\s*[-:]?\s*(\d+)/);
  if (exerciseMatch) result.exerciseNumber = parseInt(exerciseMatch[1], 10);

  // Page: "page 10", "pg 10"
  const pageMatch = q.match(/(?:page|pg\.?|slide)\s*[-:]?\s*(\d+)/);
  if (pageMatch) result.pageNumber = parseInt(pageMatch[1], 10);

  return result;
};

// ─── EXACT METADATA LOOKUP ──────────────────────────────────────────────────

const findExactMatches = (parsed: ParsedQuery, chunks: DocumentChunk[]): DocumentChunk[] => {
  // If no structured fields were parsed, return empty (fall through to BM25)
  if (parsed.chapterNumber === undefined && parsed.lessonNumber === undefined &&
      parsed.questionNumber === undefined && parsed.exerciseNumber === undefined &&
      parsed.pageNumber === undefined) {
    return [];
  }

  let candidates = [...chunks];

  const strictFilter = (field: keyof DocumentChunk, value: number | undefined) => {
    if (value === undefined) return;
    candidates = candidates.filter(c => (c as any)[field] === value);
  };

  // Apply filters in order of specificity
  strictFilter('page', parsed.pageNumber);
  strictFilter('chapterNumber', parsed.chapterNumber);
  strictFilter('lessonNumber', parsed.lessonNumber);
  strictFilter('exerciseNumber', parsed.exerciseNumber);
  strictFilter('questionNumber', parsed.questionNumber);

  return candidates;
};

// ─── BM25 KEYWORD SEARCH (FALLBACK) ─────────────────────────────────────────

const bm25Search = (userMessage: string, chunks: DocumentChunk[]): DocumentChunk[] => {
  const normalize = (str: string) => {
    let s = str.toLowerCase();
    const map: Record<string, string> = {
      'first':'1','second':'2','third':'3','fourth':'4','fifth':'5',
      'sixth':'6','seventh':'7','eighth':'8','ninth':'9','tenth':'10',
      '1st':'1','2nd':'2','3rd':'3','4th':'4','5th':'5','6th':'6',
      'pg':'page'
    };
    for (const [k, v] of Object.entries(map)) {
      s = s.replace(new RegExp(`\\b${k}\\b`, 'g'), v);
    }
    return s.replace(/[^\w\s]/gi, ' ');
  };

  const normQuery = normalize(userMessage);
  const stopWords = new Set(['the','and','for','are','but','not','you','all','any','can','has','how','why','what','when','where','who','this','that','with','from','then','than','tell','about','me','explain','give']);
  const queryWords = normQuery.split(/\W+/).filter(w => w.length > 0 && !stopWords.has(w));

  const scored = chunks.map(chunk => {
    let score = 0;
    const normChunk = normalize(chunk.text);
    const normSection = normalize(chunk.section);

    // Section title match (big boost)
    for (const w of queryWords) {
      if (normSection.includes(w)) score += 30;
    }

    // Word frequency scoring
    for (const w of queryWords) {
      if (normChunk.includes(` ${w} `) || normChunk.startsWith(`${w} `) || normChunk.endsWith(` ${w}`)) {
        score += /\d/.test(w) ? 5 : 1;
      }
    }

    // Bigram matches (big boost for phrase matches)
    for (let i = 0; i < queryWords.length - 1; i++) {
      const bigram = `${queryWords[i]} ${queryWords[i+1]}`;
      if (normChunk.includes(bigram)) score += 20;
    }

    // Direct page references
    if (normQuery.includes(`page ${chunk.page}`) || normQuery.includes(`slide ${chunk.page}`)) {
      score += 1000;
    }

    return { ...chunk, score };
  });

  // Sort by score descending, take top 4 (reduced from 6 to save tokens)
  scored.sort((a, b) => (b as any).score - (a as any).score);
  return scored.slice(0, 4);
};

// ─── MAIN RAG CONTEXT BUILDER ────────────────────────────────────────────────

export const buildRagContext = (userMessage: string, chunks: DocumentChunk[]): RagResult => {
  if (chunks.length === 0) return { contextString: '', sourceChunks: [] };

  // For small documents, return everything
  const fullText = chunks.map(c => {
    const meta = [
      `Page ${c.page}`,
      c.section,
      c.questionNumber !== undefined ? `Q.${c.questionNumber}` : '',
      c.contentType !== 'paragraph' ? `[${c.contentType.toUpperCase()}]` : ''
    ].filter(Boolean).join(' | ');
    return `[${meta}]\n${c.text}`;
  }).join('\n\n');

  if (fullText.length <= MAX_FULL_TEXT_CHARS) {
    return {
      contextString: `\n\n=== ENTIRE DOCUMENT CONTENT (Structured Index) ===\n${fullText}\n=== END ===`,
      sourceChunks: chunks
    };
  }

  // DEBUG LOGGING FOR METADATA LOOKUP

  // Parse query and log parsed object
  const parsed = parseQuery(userMessage);
  console.log('🔍 Parsed Query:', parsed);

  // Log total number of indexed DocumentChunks
  console.log('📦 Total DocumentChunks:', chunks.length);

  // Count chunks with lessonNumber = 5
  const lesson5Chunks = chunks.filter(c => c.lessonNumber === 5);
  console.log('🔢 Chunks with lessonNumber = 5:', lesson5Chunks.length);
  // Count chunks with questionNumber = 4
  const question4Chunks = chunks.filter(c => c.questionNumber === 4);
  console.log('❓ Chunks with questionNumber = 4:', question4Chunks.length);

  // Find exact matches and log details
  const exactMatches = findExactMatches(parsed, chunks);
  console.log('✅ Exact Matches Found:', exactMatches.length);
  if (exactMatches.length > 0) {
    exactMatches.forEach((c, idx) => {
      console.log(`Exact Match #${idx + 1}:`, {
        lessonNumber: c.lessonNumber,
        chapterNumber: c.chapterNumber,
        questionNumber: c.questionNumber,
        page: c.page,
        section: c.section,
        contentType: c.contentType,
        snippet: c.text.substring(0, 150).replace(/\n/g, ' ')
      });
    });
  } else {
    console.log('⚠️ No exact matches. Reasoning:');
    // Explain why filters eliminated candidates
    const reasonLines = [];
    if (parsed.chapterNumber !== undefined) {
      const before = chunks.length;
      const after = chunks.filter(c => c.chapterNumber === parsed.chapterNumber).length;
      reasonLines.push(`Chapter filter (${parsed.chapterNumber}) reduced ${before} -> ${after}`);
    }
    if (parsed.lessonNumber !== undefined) {
      const before = chunks.filter(c => c.chapterNumber === parsed.chapterNumber || parsed.chapterNumber === undefined).length;
      const after = chunks.filter(c => c.lessonNumber === parsed.lessonNumber).length;
      reasonLines.push(`Lesson filter (${parsed.lessonNumber}) reduced ${before} -> ${after}`);
    }
    if (parsed.questionNumber !== undefined) {
      const before = chunks.filter(c => c.lessonNumber === parsed.lessonNumber || parsed.lessonNumber === undefined).length;
      const after = chunks.filter(c => c.questionNumber === parsed.questionNumber).length;
      reasonLines.push(`Question filter (${parsed.questionNumber}) reduced ${before} -> ${after}`);
    }
    console.log(reasonLines.join(' | '));
  }

  // Proceed with original logic
  let finalChunks: DocumentChunk[];
  
  const hasStructuralMetadata = parsed.chapterNumber !== undefined || 
                                parsed.lessonNumber !== undefined || 
                                parsed.questionNumber !== undefined || 
                                parsed.exerciseNumber !== undefined;

  if (exactMatches.length > 0 && exactMatches.length <= 10) {
    const tocChunks = chunks.slice(0, 2).filter(c => !exactMatches.includes(c));
    finalChunks = [...tocChunks, ...exactMatches].sort((a, b) => a.index - b.index);
  } else if (exactMatches.length === 0 && hasStructuralMetadata) {
    console.log('⚠️ Structural metadata requested but not found. Falling back to BM25 with disclaimer.');
    // Still use BM25 to find best available content — disclaimer is added below
    const bm25Results = bm25Search(userMessage, chunks);
    const tocChunks = chunks.slice(0, 1).filter(c => !bm25Results.includes(c));
    finalChunks = [...tocChunks, ...bm25Results].sort((a, b) => a.index - b.index);
  } else {
    // Fallback to BM25
    console.log('🔄 Falling back to BM25 search because no suitable exact matches.');
    const bm25Results = bm25Search(userMessage, chunks);
    // Include 1 TOC chunk instead of 2 to save tokens
    const tocChunks = chunks.slice(0, 1).filter(c => !bm25Results.includes(c));
    finalChunks = [...tocChunks, ...bm25Results].sort((a, b) => a.index - b.index);
  }

  // Build disclaimer if structural metadata was requested but not found
  let disclaimer = '';
  if (hasStructuralMetadata && exactMatches.length === 0) {
    let targetStrs: string[] = [];
    if (parsed.chapterNumber !== undefined) targetStrs.push(`Chapter ${parsed.chapterNumber}`);
    if (parsed.lessonNumber !== undefined) targetStrs.push(`Lesson ${parsed.lessonNumber}`);
    if (parsed.exerciseNumber !== undefined) targetStrs.push(`Exercise ${parsed.exerciseNumber}`);
    if (parsed.questionNumber !== undefined) targetStrs.push(`Question ${parsed.questionNumber}`);
    const targetStr = targetStrs.join(' ');
    disclaimer = `\n\n⚠️ IMPORTANT: The user asked for "${targetStr}" but this exact section could not be pinpointed in the document index. 
    You MUST reply exactly with: "⚠️ I couldn't pinpoint the exact ${targetStr} in this document. Could you please type out the actual question you are looking for?"
    Do not try to answer from the content below, just ask the user to provide the question directly.\n`;
  }

  // Build context string
  const contextString = disclaimer +
    `\n\n=== RELEVANT SECTIONS FROM DOCUMENT ===\n` +
    finalChunks.map(c => {
      const meta = [
        `Page ${c.page}`,
        c.section,
        c.questionNumber !== undefined ? `Q.${c.questionNumber}` : '',
        c.contentType !== 'paragraph' ? `[${c.contentType.toUpperCase()}]` : ''
      ].filter(Boolean).join(' | ');
      return `[Source: ${meta}]\n${c.text}`;
    }).join('\n\n') +
    `\n=== END ===`;

  return { contextString, sourceChunks: finalChunks };
};
