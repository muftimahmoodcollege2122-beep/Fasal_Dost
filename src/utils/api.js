// ─────────────────────────────────────────────────────────────────────────────
// src/utils/api.js
//
// PURPOSE:
//   Handles all communication with the AI vision API.
//   Sends a crop image (base64) to the AI and returns a structured
//   disease detection result.
//
// MULTI-PROVIDER FALLBACK SYSTEM:
//   Provider 1 — OpenRouter + Gemini 2.0 Flash  (best quality, paid)
//   Provider 2 — OpenRouter + Llama Vision       (free, good backup)
//   Provider 3 — Google AI Studio direct         (independent fallback)
//
//   The app tries Provider 1 first. If it fails for any reason
//   (API down, quota exceeded, network timeout) it automatically
//   and silently tries Provider 2, then Provider 3.
//   The farmer never sees an error unless ALL THREE fail simultaneously.
//
// SETUP — Replace the placeholder keys below:
//   OPENROUTER_KEY  → https://openrouter.ai  (sk-or-v1-...)
//   GOOGLE_AI_KEY   → https://aistudio.google.com → Get API Key (AIzaSy...)
//
// RESPONSE FORMAT:
//   The API returns a structured JSON object with:
//   - crop_detected_en/ur   — identified crop name
//   - overall_confidence    — 0-100% how certain the AI is
//   - image_quality         — 'good' or 'unclear'
//   - is_healthy            — true if no diseases found
//   - diseases[]            — array of all detected diseases
//   - prevention_en/ur      — general prevention advice
//
// ERROR TYPES:
//   'LOW_CONFIDENCE' — image is blurry or not a crop (thrown as Error)
//   'NETWORK_ERROR'  — all providers failed / no internet
//   Other strings    — API or parsing errors
//
// ─────────────────────────────────────────────────────────────────────────────

// ── Provider keys — replace with your real keys ──────────────────────────────
// ⚠️  Never push real keys to GitHub
const OPENROUTER_KEY = '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'; // sk-or-v1-...
const GOOGLE_AI_KEY  = 'AIzaSyCcftyZtQ5oq3iwGWd-7dRSz1FlSx6rJ8E';  // AIzaSy...

// ── Provider configurations ───────────────────────────────────────────────────
// Each provider is tried in order. If one fails, the next is attempted.
const PROVIDERS = [
  {
    name:    'OpenRouter-Gemini',    // Primary — best quality
    url:     'https://openrouter.ai/api/v1/chat/completions',
    model:   'google/gemini-2.0-flash-001',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer':  'https://fasaldost.app',
      'X-Title':       'FasalDost',
    },
  },
  {
    name:    'OpenRouter-Llama',     // Backup 1 — completely free
    url:     'https://openrouter.ai/api/v1/chat/completions',
    model:   'meta-llama/llama-3.2-11b-vision-instruct:free',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer':  'https://fasaldost.app',
      'X-Title':       'FasalDost',
    },
  },
  {
    name:    'Google-AI-Studio',     // Backup 2 — independent provider
    url:     `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_AI_KEY}`,
    model:   'gemini-1.5-flash',
    headers: {},                     // Google AI uses key in URL, not header
    isGoogle: true,                  // Flag — Google uses different request format
  },
];

// ── System prompt ──────────────────────────────────────────────────────────
// This prompt is sent as the 'system' role in every API call.
// It tells the AI exactly what to do and what format to return.
// temperature: 0.1 keeps responses consistent and deterministic.
const SYSTEM_PROMPT = `You are senior pythologist Dr. Fasal, a senior agronomist specializing in Pakistani crops.
Supported crops: wheat, cotton, rice, sugarcane, maize, mango, tomato, potato, onion, chili, mustard, sunflower, chickpea, lentil, banana, citrus, guava, okra.

Rules:
1. Analyze the image carefully.
2. A single plant can have MORE THAN ONE disease — detect ALL of them.
3. If the image is blurry, not a plant, or confidence is below 50%, set image_quality to "unclear".
4. Respond ONLY with a valid JSON object. No markdown. No backticks. No text outside the JSON.

Required JSON structure:
{
  "image_quality": "good",
  "crop_detected_en": "Wheat",
  "crop_detected_ur": "گندم",
  "overall_confidence": 88,
  "is_healthy": false,
  "diseases": [
    {
      "disease_name_en": "Leaf Rust",
      "disease_name_ur": "پتوں کا زنگ",
      "severity": "medium",
      "confidence": 88,
      "description_en": "Orange-brown pustules on upper leaf surface.",
      "description_ur": "پتوں کی اوپری سطح پر نارنجی بھورے دھبے۔",
      "symptoms_en": ["Orange pustules on leaves", "Yellow patches around spots"],
      "symptoms_ur": ["پتوں پر نارنجی دھبے", "دھبوں کے اردگرد پیلاپن"],
      "treatment_en": ["Remove infected leaves", "Apply Propiconazole 1ml/liter", "Spray every 10 days x3"],
      "treatment_ur": ["متاثرہ پتے ہٹائیں", "پروپیکونازول 1ml فی لیٹر لگائیں", "10 دن میں 3 بار سپرے"],
      "urgency_en": "Act within 3 days to prevent spread.",
      "urgency_ur": "پھیلاؤ روکنے کے لیے 3 دن میں عمل کریں۔"
    }
  ],
  "prevention_en": "Use rust-resistant varieties.",
  "prevention_ur": "زنگ مزاحم اقسام استعمال کریں۔"
}

If healthy: is_healthy=true, diseases=[].
If unclear image: image_quality="unclear", overall_confidence<40, diseases=[].`;

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Parse and validate the raw text response from any provider
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse raw text from AI response into a validated result object.
 * Strips markdown fences, parses JSON, checks confidence threshold.
 * @param {string} rawText - Raw text content from API response
 * @returns {Object} Validated result object
 * @throws {Error} If parsing fails or confidence is too low
 */
function parseResult(rawText) {
  if (!rawText || !rawText.trim()) {
    throw new Error('Empty response from AI');
  }

  // Strip markdown code fences that some models add accidentally
  const clean = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i,     '')
    .replace(/\s*```$/,      '')
    .trim();

  let result;
  try {
    result = JSON.parse(clean);
  } catch {
    throw new Error('AI returned invalid format. Please try again.');
  }

  // Reject unclear or low-confidence results
  // Better to ask farmer to retake photo than show wrong diagnosis
  if (
    result.image_quality === 'unclear' ||
    (typeof result.overall_confidence === 'number' && result.overall_confidence < 50)
  ) {
    throw new Error('LOW_CONFIDENCE');
  }

  // Always ensure diseases is an array (AI sometimes omits it for healthy crops)
  if (!Array.isArray(result.diseases)) {
    result.diseases = [];
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Call a single provider and return raw text response
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Make one API call to a given provider and return the raw text content.
 * @param {Object} provider  - Provider config from PROVIDERS array
 * @param {string} imageBase64
 * @param {string} userText
 * @returns {Promise<string>} Raw text from the AI
 * @throws {Error} On network failure or bad HTTP status
 */
async function callProvider(provider, imageBase64, userText) {
  let body;

  if (provider.isGoogle) {
    // ── Google AI Studio uses a different request format ──────────────────
    body = JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
          { text: SYSTEM_PROMPT + '\n\n' + userText },
        ]
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2000 },
    });
  } else {
    // ── OpenRouter uses OpenAI-compatible format ───────────────────────────
    body = JSON.stringify({
      model:       provider.model,
      max_tokens:  2000,
      temperature: 0.1,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role:    'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            { type: 'text',      text: userText },
          ],
        },
      ],
    });
  }

  let response;
  try {
    response = await fetch(provider.url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...provider.headers },
      body,
    });
  } catch {
    // fetch() threw — network unavailable for this provider
    throw new Error('NETWORK_ERROR');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Invalid response from server');
  }

  if (!response.ok) {
    const msg = data?.error?.message || `HTTP ${response.status}`;
    throw new Error(msg);
  }

  // Extract text from response — format differs between providers
  if (provider.isGoogle) {
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
  return data?.choices?.[0]?.message?.content || '';
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN FUNCTION — Multi-provider fallback
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send a crop image to the AI and get a disease detection result.
 * Automatically tries up to 3 providers if one fails.
 * The farmer never sees an error unless ALL providers fail.
 *
 * @param {string} imageBase64 - Base64 encoded JPEG image string (no data: prefix)
 * @param {string} cropName    - Optional crop name to improve accuracy
 * @returns {Promise<Object>}  - Structured result object
 *
 * @throws {Error} 'LOW_CONFIDENCE' — image unclear, ask farmer to retake
 * @throws {Error} 'NETWORK_ERROR'  — all providers failed
 * @throws {Error} Other message    — unrecoverable error
 */
export async function detectDisease(imageBase64, cropName = '') {
  // Validate input before making any API call
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    throw new Error('No image provided');
  }

  const userText = cropName.trim()
    ? `The crop is: ${cropName.trim()}. Detect ALL diseases. Be specific to Pakistani farming.`
    : `Identify the crop first, then detect ALL diseases. Be specific to Pakistani farming.`;

  let lastError = null;

  // ── Try each provider in order ────────────────────────────────────────────
  for (const provider of PROVIDERS) {
    try {
      console.log(`[FasalDost API] Trying provider: ${provider.name}`);

      const rawText = await callProvider(provider, imageBase64, userText);
      const result  = parseResult(rawText);

      // SUCCESS — log which provider worked and return result
      console.log(`[FasalDost API] Success via: ${provider.name}`);
      return result;

    } catch (err) {
      // LOW_CONFIDENCE is not a provider failure — it means image is bad.
      // No point trying other providers with the same bad image.
      if (err.message === 'LOW_CONFIDENCE') {
        throw err;
      }

      // Provider failed — log and try the next one
      console.warn(`[FasalDost API] Provider ${provider.name} failed: ${err.message}`);
      lastError = err;
      // Continue to next provider in loop
    }
  }

  // ── All providers failed ──────────────────────────────────────────────────
  console.error('[FasalDost API] All providers failed. Last error:', lastError?.message);
  throw new Error('NETWORK_ERROR');
}