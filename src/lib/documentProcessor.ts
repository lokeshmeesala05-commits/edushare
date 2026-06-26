import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';
import JSZip from 'jszip';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export type FileType = 'pdf' | 'docx' | 'doc' | 'pptx' | 'ppt' | 'txt' | 'md' | 'image' | 'unknown';

export type ContentType = 'heading' | 'question' | 'answer' | 'paragraph' | 'diagram' | 'table' | 'formula' | 'exercise' | 'definition';

export interface DocumentChunk {
  index: number;
  page: number;
  section: string;
  text: string;
  // Structured metadata
  chapterNumber?: number;
  lessonNumber?: number;
  questionNumber?: number;
  exerciseNumber?: number;
  contentType: ContentType;
}

export interface ProcessingResult {
  fileType: FileType;
  chunks: DocumentChunk[];
  hasContent: boolean;
  error?: string;
}

export const getFileType = (url: string): FileType => {
  const lower = url.toLowerCase().split('?')[0];
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.docx')) return 'docx';
  if (lower.endsWith('.doc')) return 'doc';
  if (lower.endsWith('.pptx')) return 'pptx';
  if (lower.endsWith('.ppt')) return 'ppt';
  if (lower.endsWith('.txt')) return 'txt';
  if (lower.endsWith('.md')) return 'md';
  if (lower.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) return 'image';
  return 'unknown';
};

// ─── STRUCTURED METADATA EXTRACTION ─────────────────────────────────────────

// Extract chapter number from text like "Chapter 5", "CHAPTER-5", "Ch. 5", "ch5"
const extractChapterNumber = (text: string): number | undefined => {
  const m = text.match(/(?:chapter|ch\.?|unit)\s*[-:]?\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : undefined;
};

// Extract lesson number from text like "Lesson 3", "LESSON - 3", "పాఠం 3"
const extractLessonNumber = (text: string): number | undefined => {
  // Match "Lesson 3" or "3 Lesson" (including ordinals like "3rd lesson")
  const m = text.match(/(?:lesson|les\.?|పాఠం|పాఠము)\s*[-:]?\s*(\d+)/i) ||
            text.match(/(\d+)(?:st|nd|rd|th)?\s*(?:lesson|les\.?|పాఠం|పాఠము)/i);
  return m ? parseInt(m[1], 10) : undefined;
};

// Extract question number from text like "Q.4", "Question 4", "4.", "4)", "Q4"
const extractQuestionNumber = (text: string): number | undefined => {
  const patterns = [
    /(?:question|q\.?|ques\.?)\s*[-:]?\s*(\d+)/i,   // "Question 4", "Q.4", "Q4"
    /^(\d{1,3})\s*[.)]\s+\S/m,                        // "4. What is..." or "4) What is..."
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return parseInt(m[1], 10);
  }
  return undefined;
};

// Extract exercise number from text like "Exercise 3.2", "Ex. 5"
const extractExerciseNumber = (text: string): number | undefined => {
  const m = text.match(/(?:exercise|ex\.?)\s*[-:]?\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : undefined;
};

// Detect the content type of a text block
const detectContentType = (text: string): ContentType => {
  const t = text.trim();
  const lower = t.toLowerCase();

  // Heading detection (short lines with heading patterns)
  if (t.length < 80 && /^(chapter|lesson|unit|module|section|exercise|topic)\s+\d+/i.test(t)) return 'heading';
  if (t.length < 80 && /^[IVX]+\.\s+[A-Z]/.test(t)) return 'heading';
  if (t.length < 80 && /^\d+\.\d*\s+[A-Z]/.test(t)) return 'heading';

  // Question detection
  if (/^(q\.?\s*\d|question\s*\d|\d{1,3}\s*[.)]\s*(what|who|which|how|why|when|where|explain|define|describe|write|find|solve|prove|calculate|state|name|list|give|mention|differentiate|compare|discuss|draw|label))/i.test(t)) return 'question';
  if (/\?\s*$/.test(t) && t.length < 300) return 'question';

  // Answer detection (starts with "Ans", "Answer", "A.", "Sol.", "Solution")
  if (/^(ans\.?|answer|a\.\s|sol\.?|solution)\s*/i.test(t)) return 'answer';

  // Definition detection
  if (/^(definition|def\.?|define)\s*[-:]/i.test(t)) return 'definition';
  if (lower.includes(' is defined as ') || lower.includes(' is called ') || lower.includes(' refers to ')) return 'definition';

  // Formula detection
  if (/[=∑∫√π∆±×÷∞]/.test(t) && t.length < 200) return 'formula';
  if (/^(formula|equation)\s*[-:]/i.test(t)) return 'formula';

  // Table detection (multiple tab/pipe separators suggest a table)
  if ((t.match(/\t/g) || []).length > 3) return 'table';
  if ((t.match(/\|/g) || []).length > 4) return 'table';

  // Diagram detection
  if (/^(fig\.?|figure|diagram|flowchart|chart|graph|illustration)\s*\d/i.test(t)) return 'diagram';
  if (/^(fig\.?|figure|diagram|flowchart|chart|graph|illustration)\s*[-:]/i.test(t)) return 'diagram';

  return 'paragraph';
};

// Detect section title from a text block and return it
const detectSection = (text: string, currentSection: string): string => {
  const lines = text.split('\n');
  for (const line of lines) {
    const t = line.trim();
    if (t.length < 5 || t.length > 80) continue;
    if (/^(chapter|lesson|unit|module|section|exercise|topic)\s+\d+/i.test(t)) return t;
    if (/^[IVX]+\.\s+[A-Z]/.test(t)) return t;
    if (/^\d+\.\d*\s+[A-Z]/.test(t)) return t;
  }
  return currentSection;
};

// ─── SPLIT RAW TEXT INTO STRUCTURED CHUNKS ───────────────────────────────────

// This function takes a raw page of text and splits it into individual records.
// Each question, heading, definition, etc. becomes its own chunk.
const splitIntoStructuredChunks = (
  rawText: string,
  pageNumber: number,
  currentSection: string,
  currentChapter: number | undefined,
  currentLesson: number | undefined,
  currentExercise: number | undefined,
  startIndex: number
): { chunks: DocumentChunk[]; section: string; chapter: number | undefined; lesson: number | undefined; exercise: number | undefined; nextIndex: number } => {
  const chunks: DocumentChunk[] = [];
  let idx = startIndex;
  let section = currentSection;
  let chapter = currentChapter;
  let lesson = currentLesson;
  let exercise = currentExercise;

  // Split the raw text into logical blocks by:
  // 1. Blank lines
  // 2. Lines starting with a question number pattern (e.g. "1. ", "Q.1", "1)")
  const blocks: string[] = [];
  let currentBlock = '';

  const lines = rawText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Start a new block if this looks like a new question/heading/exercise
    const isNewRecord = (
      /^(q\.?\s*\d|question\s*\d)/i.test(trimmed) ||                // Q.1, Question 1
      /^\d{1,3}\s*[.)]\s+\S/.test(trimmed) ||                        // 1. What, 1) What
      /^(chapter|lesson|unit|module|section|exercise|topic)\s+\d/i.test(trimmed) || // Chapter 1
      /^(ans\.?|answer|sol\.?|solution)\s*/i.test(trimmed) ||         // Answer
      /^(definition|def\.? )\s*[-:]/i.test(trimmed) ||                 // Definition
      /^(fig\.?|figure|diagram|flowchart)\s*\d/i.test(trimmed)   // Figure with number
    );

    if (isNewRecord && currentBlock.trim().length > 0) {
      blocks.push(currentBlock.trim());
      currentBlock = '';
    }

    if (trimmed.length === 0 && currentBlock.trim().length > 300) {
      // Large block followed by blank line — split here too
      blocks.push(currentBlock.trim());
      currentBlock = '';
    } else {
      currentBlock += line + '\n';
    }
  }
  if (currentBlock.trim().length > 0) {
    blocks.push(currentBlock.trim());
  }

  for (const block of blocks) {
    const contentType = detectContentType(block);

    // Update metadata regardless of content type
    section = detectSection(block, section);
    const ch = extractChapterNumber(block);
    if (ch !== undefined) {
      chapter = ch;
      // Reset lesson when chapter changes to avoid stale lesson numbers
      lesson = undefined;
    }
    const le = extractLessonNumber(block);
    if (le !== undefined) lesson = le;
    const ex = extractExerciseNumber(block);
    if (ex !== undefined) exercise = ex;


    const questionNumber = extractQuestionNumber(block);

    chunks.push({
      index: idx++,
      page: pageNumber,
      section,
      text: block,
      chapterNumber: chapter,
      lessonNumber: lesson,
      questionNumber: contentType === 'question' ? questionNumber : undefined,
      exerciseNumber: exercise,
      contentType
    });
  }

  return { chunks, section, chapter, lesson, exercise, nextIndex: idx };
};

// ─── MAIN PROCESSING FUNCTION ────────────────────────────────────────────────

export const processDocument = async (
  url: string,
  onProgress?: (msg: string) => void
): Promise<ProcessingResult> => {
  const fileType = getFileType(url);
  const cacheKey = `edu_doc_v2_${url}`;

  // Check cache first
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      return { ...parsed, fileType };
    } catch (e) {
      sessionStorage.removeItem(cacheKey);
    }
  }

  let allChunks: DocumentChunk[] = [];
  let currentSection = 'Document Start';
  let currentChapter: number | undefined;
  let currentLesson: number | undefined;
  let currentExercise: number | undefined;
  let chunkIndex = 0;

  try {
    if (fileType === 'pdf') {
      onProgress?.('Reading PDF pages...');
      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      const maxPages = Math.min(pdf.numPages, 300);
      
      for (let i = 1; i <= maxPages; i++) {
        onProgress?.(`Extracting & indexing... page ${i} of ${maxPages}`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ').trim();
        
        if (pageText.length > 10) {
          const result = splitIntoStructuredChunks(pageText, i, currentSection, currentChapter, currentLesson, currentExercise, chunkIndex);
          allChunks.push(...result.chunks);
          currentSection = result.section;
          currentChapter = result.chapter;
          currentLesson = result.lesson;
          currentExercise = result.exercise;
          chunkIndex = result.nextIndex;
        }
      }
    } else if (fileType === 'docx') {
      onProgress?.('Reading Word document...');
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const extracted = await mammoth.extractRawText({ arrayBuffer });
      const text = extracted.value;
      
      // Split into virtual pages of ~2000 chars
      for (let i = 0; i < text.length; i += 2000) {
        const slice = text.slice(i, i + 2000);
        const virtualPage = Math.floor(i / 2000) + 1;
        onProgress?.(`Indexing... section ${virtualPage}`);
        const result = splitIntoStructuredChunks(slice, virtualPage, currentSection, currentChapter, currentLesson, currentExercise, chunkIndex);
        allChunks.push(...result.chunks);
        currentSection = result.section;
        currentChapter = result.chapter;
        currentLesson = result.lesson;
        currentExercise = result.exercise;
        chunkIndex = result.nextIndex;
      }
    } else if (fileType === 'image') {
      onProgress?.('Loading OCR engine (may take ~20s)...');
      const worker = await createWorker(['eng', 'tel'], 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            onProgress?.(`Reading image text... ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      onProgress?.('Scanning image for text...');
      const { data: { text } } = await worker.recognize(url);
      await worker.terminate();
      
      if (text.trim().length > 10) {
        const result = splitIntoStructuredChunks(text.trim(), 1, 'Image Content', undefined, undefined, undefined, 0);
        allChunks.push(...result.chunks);
      }
    } else if (fileType === 'pptx') {
      onProgress?.('Reading PowerPoint document...');
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      
      // Collect slide filenames and sort them numerically
      const slideFiles: { name: string; num: number }[] = [];
      for (const filename of Object.keys(zip.files)) {
        const m = filename.match(/ppt\/slides\/slide(\d+)\.xml/);
        if (m) slideFiles.push({ name: filename, num: parseInt(m[1], 10) });
      }
      slideFiles.sort((a, b) => a.num - b.num);

      for (const sf of slideFiles) {
        onProgress?.(`Extracting text... slide ${sf.num}`);
        const xmlData = await zip.files[sf.name].async('string');
        const textMatches = xmlData.match(/<a:t>.*?<\/a:t>/g);
        if (textMatches) {
          const slideText = textMatches.map(t => t.replace(/<\/?a:t>/g, '')).join(' ');
          if (slideText.trim().length > 0) {
            const result = splitIntoStructuredChunks(slideText, sf.num, `Slide ${sf.num}`, currentChapter, currentLesson, currentExercise, chunkIndex);
            allChunks.push(...result.chunks);
            currentSection = result.section;
            currentChapter = result.chapter;
            currentLesson = result.lesson;
            currentExercise = result.exercise;
            chunkIndex = result.nextIndex;
          }
        }
      }
    } else if (fileType === 'txt' || fileType === 'md') {
      onProgress?.(`Reading ${fileType.toUpperCase()} document...`);
      const response = await fetch(url);
      const text = await response.text();
      
      for (let i = 0; i < text.length; i += 2000) {
        const slice = text.slice(i, i + 2000);
        const virtualPage = Math.floor(i / 2000) + 1;
        const result = splitIntoStructuredChunks(slice, virtualPage, currentSection, currentChapter, currentLesson, currentExercise, chunkIndex);
        allChunks.push(...result.chunks);
        currentSection = result.section;
        currentChapter = result.chapter;
        currentLesson = result.lesson;
        currentExercise = result.exercise;
        chunkIndex = result.nextIndex;
      }
    } else if (fileType === 'doc' || fileType === 'ppt') {
      return { fileType, chunks: [], hasContent: false, error: `Old .${fileType} format not supported. Please use .${fileType}x or PDF.` };
    }

    onProgress?.('Building structured index...');

    const hasContent = allChunks.length > 0;
    const processingResult = { fileType, chunks: allChunks, hasContent };
    
    if (hasContent) {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(processingResult));
      } catch (e) {
        // Ignore quota exceeded errors
      }
    }

    return processingResult;

  } catch (err: any) {
    console.error('Document processing failed:', err);
    return { fileType, chunks: [], hasContent: false, error: err.message };
  }
};
