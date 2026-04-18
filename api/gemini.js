import { readJsonBody } from './lib/http.js';

const DEFAULT_MODEL = String(process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();

function stripCodeFences(text) {
  const source = String(text || '').trim();
  if (!source.startsWith('```')) {
    return source;
  }

  return source
    .replace(/^```[a-zA-Z]*\s*/, '')
    .replace(/\s*```$/, '')
    .trim();
}

function pickCandidateText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    return '';
  }

  return parts
    .map((part) => String(part?.text || ''))
    .join('')
    .trim();
}

async function callGemini(prompt, temperature = 0.2) {
  const apiKey = String(process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    const error = new Error('Missing GEMINI_API_KEY');
    error.statusCode = 500;
    throw error;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(DEFAULT_MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature,
        responseMimeType: 'application/json',
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || 'Gemini API request failed';
    const error = new Error(message);
    error.statusCode = response.status;
    throw error;
  }

  const text = stripCodeFences(pickCandidateText(payload));
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error('Gemini response is not valid JSON');
  }
}

function buildTranslatePrompt(input) {
  const text = String(input?.text || '').trim();
  const targetLocale = String(input?.targetLocale || 'en').trim().toLowerCase();
  const sourceLocale = String(input?.sourceLocale || 'es').trim().toLowerCase();

  return [
    'Translate the text and return strict JSON only.',
    'Output schema: {"translatedText":"string"}.',
    `Source locale: ${sourceLocale}`,
    `Target locale: ${targetLocale}`,
    `Text: ${JSON.stringify(text)}`,
  ].join('\n');
}

function buildTranslateContentPrompt(input) {
  const targetLocale = String(input?.targetLocale || 'en').trim().toLowerCase();
  const sourceLocale = String(input?.sourceLocale || 'es').trim().toLowerCase();
  const content = input?.content || {};

  return [
    'Translate all human-readable fields of the CV JSON while preserving structure and keys.',
    'Return strict JSON only with this schema: {"translatedContent":object}.',
    'Rules:',
    '- Keep the exact same keys and hierarchy as input content',
    '- Do not invent, remove, or reorder list items',
    '- Preserve emails, URLs, phone numbers, and numeric values unchanged',
    `Source locale: ${sourceLocale}`,
    `Target locale: ${targetLocale}`,
    `Content JSON: ${JSON.stringify(content)}`,
  ].join('\n');
}

function buildAtsPrompt(input) {
  const locale = String(input?.locale || 'es').trim().toLowerCase();
  const jobDescription = String(input?.jobDescription || '').trim();
  const content = input?.content || {};

  return [
    'Analyze ATS match between job description and CV profile.',
    'Return strict JSON only with this schema:',
    '{"total":number,"score":number,"matched":string[],"missing":string[],"suggestions":string[]}.',
    'Rules:',
    '- total must equal matched.length + missing.length',
    '- score is integer from 0 to 100',
    '- suggestions must be concise skill keywords or short phrases',
    `Locale for keywords/suggestions: ${locale}`,
    `Job description: ${JSON.stringify(jobDescription)}`,
    `CV content JSON: ${JSON.stringify(content)}`,
  ].join('\n');
}

function buildCoverLetterPrompt(input) {
  const locale = String(input?.locale || 'es').trim().toLowerCase();
  const company = String(input?.company || '').trim();
  const role = String(input?.role || '').trim();
  const recipient = String(input?.recipient || '').trim();
  const content = input?.content || {};

  return [
    'Generate a professional cover letter body as 4 short paragraphs.',
    'Return strict JSON only with this schema: {"paragraphs":string[]}.',
    'Rules:',
    '- Return exactly 4 paragraphs',
    '- Do not include greeting or signature',
    '- Keep each paragraph focused and concise',
    `Locale: ${locale}`,
    `Company: ${JSON.stringify(company)}`,
    `Role: ${JSON.stringify(role)}`,
    `Recipient: ${JSON.stringify(recipient)}`,
    `Candidate profile JSON: ${JSON.stringify(content)}`,
  ].join('\n');
}

function normalizeAtsResponse(payload) {
  const matched = Array.isArray(payload?.matched)
    ? payload.matched.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const missing = Array.isArray(payload?.missing)
    ? payload.missing.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const suggestions = Array.isArray(payload?.suggestions)
    ? payload.suggestions.map((item) => String(item).trim()).filter(Boolean)
    : [];

  const totalFromPayload = Number.isFinite(payload?.total) ? Math.max(0, Math.trunc(payload.total)) : null;
  const total = totalFromPayload !== null ? totalFromPayload : matched.length + missing.length;
  const rawScore = Number.isFinite(payload?.score) ? Math.trunc(payload.score) : 0;
  const score = Math.min(100, Math.max(0, rawScore));

  return {
    total,
    score,
    matched,
    missing,
    suggestions,
  };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = await readJsonBody(req);
    const task = String(body?.task || '').trim();
    const input = body?.input || {};

    if (!task) {
      return res.status(400).json({ error: 'Missing task' });
    }

    if (task === 'translate_text') {
      const result = await callGemini(buildTranslatePrompt(input), 0.1);
      const translatedText = String(result?.translatedText || '').trim();
      return res.status(200).json({ translatedText });
    }

    if (task === 'translate_content') {
      const result = await callGemini(buildTranslateContentPrompt(input), 0.1);
      const translatedContent = result?.translatedContent && typeof result.translatedContent === 'object'
        ? result.translatedContent
        : null;

      if (!translatedContent) {
        return res.status(502).json({ error: 'Gemini did not return translatedContent' });
      }

      return res.status(200).json({ translatedContent });
    }

    if (task === 'ats_analysis') {
      const result = await callGemini(buildAtsPrompt(input), 0.2);
      return res.status(200).json(normalizeAtsResponse(result));
    }

    if (task === 'cover_letter_paragraphs') {
      const result = await callGemini(buildCoverLetterPrompt(input), 0.35);
      const paragraphs = Array.isArray(result?.paragraphs)
        ? result.paragraphs.map((item) => String(item).trim()).filter(Boolean).slice(0, 4)
        : [];
      return res.status(200).json({ paragraphs });
    }

    return res.status(400).json({ error: 'Unsupported task' });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Gemini request failed' });
  }
}
