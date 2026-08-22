// ─────────────────────────────────────────────────────────────────────────────
// src/utils/api.js
//
// PURPOSE:
//   Handles all AI vision API communication for crop disease detection.
//
// ARCHITECTURE — HYBRID SMART DETECTION:
//
//   Phase 1 — FAST PATH (single provider, cheap):
//     Call Provider 1 (Gemini) alone.
//     If confidence >= 80% → return immediately. Fast and cheap.
//
//   Phase 2 — ACCURACY PATH (parallel majority vote, triggered when uncertain):
//     If Phase 1 confidence < 80% → call ALL providers simultaneously.
//     Compare results. Return the majority verdict.
//     2 out of 3 providers agreeing = high reliability diagnosis.
//
//   This means:
//     Clear disease cases   → 1 API call  → fast, cheap
//     Uncertain cases       → 3 API calls → accurate, slightly more expensive
//
// PROVIDERS (in priority order):
//   1. OpenRouter + Gemini 2.0 Flash  — best quality, primary
//   2. OpenRouter + Llama Vision Free — free backup
//   3. Google AI Studio direct        — independent, free tier
//
// MAJORITY VOTE LOGIC:
//   Each provider returns a disease name (or "healthy").
//   The answer that appears most across all providers wins.
//   Tie goes to the more cautious answer (disease over healthy).
//
// SETUP:
//   OPENROUTER_KEY → https://openrouter.ai  (sk-or-v1-...)
//   GOOGLE_AI_KEY  → https://aistudio.google.com (AIzaSy...)
//
// ERROR TYPES THROWN:
//   'LOW_CONFIDENCE'  — image unclear, farmer should retake photo
//   'NETWORK_ERROR'   — all providers failed
//   Other strings     — API or parsing errors
//
// ─────────────────────────────────────────────────────────────────────────────

// ── Secret Keys ───────────────────────────────────────────────────────────────
// Replace with your real keys. Never push to GitHub.
const OPENROUTER_KEY = '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'; // sk-or-v1-...
const GOOGLE_AI_KEY  = 'AIzaSyCcftyZtQ5oq3iwGWd-7dRSz1FlSx6rJ8E';  // AIzaSy...

// ── Confidence thresholds ─────────────────────────────────────────────────────
const CONFIDENCE_FAST_PATH    = 80; // Above this → return immediately (Phase 1)
const CONFIDENCE_MIN_ACCEPT   = 65; // Below this → reject as too uncertain
const DISEASE_MIN_CONFIDENCE  = 60; // Per-disease minimum to be included

// ── Provider configurations ───────────────────────────────────────────────────
const PROVIDERS = [
  {
    name:     'OpenRouter-Gemini',
    url:      'https://openrouter.ai/api/v1/chat/completions',
    model:    'google/gemini-2.0-flash-001',
    headers:  {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer':  'https://fasaldost.app',
      'X-Title':       'FasalDost',
    },
    isGoogle: false,
  },
  {
    name:     'OpenRouter-Llama',
    url:      'https://openrouter.ai/api/v1/chat/completions',
    model:    'meta-llama/llama-3.2-11b-vision-instruct:free',
    headers:  {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer':  'https://fasaldost.app',
      'X-Title':       'FasalDost',
    },
    isGoogle: false,
  },
  {
    name:     'Google-AI-Studio',
    url:      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_AI_KEY}`,
    model:    'gemini-1.5-flash',
    headers:  {},
    isGoogle: true,
  },
];

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Dr. Fasal, a senior agronomist specializing in Pakistani crops.

Supported crops: wheat, cotton, rice, sugarcane, maize, mango, tomato, potato, onion, chili, mustard, sunflower, chickpea, lentil, banana, citrus, guava, okra.

STRICT RULES — follow exactly:
1. Analyze the image with extreme care before responding.
2. Detect ALL diseases present — a single plant can have more than one.
3. If image is blurry, not a plant, or unclear — set image_quality to "unclear" and overall_confidence below 40.
4. CRITICAL: If overall_confidence for a HEALTHY declaration is below 80 — set image_quality to "unclear" instead. Never guess healthy.
5. CRITICAL: is_healthy=true and non-empty diseases array must NEVER appear together.
6. CRITICAL: If you see ANY suspicious spot, lesion, discoloration, or abnormality — identify it. Do NOT declare healthy when in doubt.
7. A wrong diagnosis destroys farmer trust permanently. When uncertain — request a clearer photo.
8. Respond ONLY with valid JSON. No markdown. No backticks. No text outside JSON.

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

If healthy: is_healthy=true, diseases=[], overall_confidence must be above 80.
If unclear: image_quality="unclear", overall_confidence below 40, diseases=[].`;

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — RAW API CALLER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Make one API call to a given provider and return raw text.
 *
 * @param {Object} provider    - Provider config from PROVIDERS array
 * @param {string} imageBase64 - Base64 encoded JPEG image
 * @param {string} userText    - Instruction text
 * @returns {Promise<string>}  - Raw text from AI
 * @throws {Error}             - On network failure or bad HTTP status
 */
async function callProvider(provider, imageBase64, userText) {
  let body;

  if (provider.isGoogle) {
    // Google AI Studio uses a different request format
    body = JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
          { text: `${SYSTEM_PROMPT}\n\n${userText}` },
        ],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2000 },
    });
  } else {
    // OpenRouter uses OpenAI-compatible format
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
    throw new Error('NETWORK_ERROR');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Invalid JSON response from server');
  }

  if (!response.ok) {
    const msg = data?.error?.message || `HTTP ${response.status}`;
    throw new Error(msg);
  }

  // Extract text — format differs by provider
  if (provider.isGoogle) {
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
  return data?.choices?.[0]?.message?.content || '';
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — JSON PARSER & VALIDATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse raw AI text into a validated result object.
 * Returns null if parsing fails or result is unusable.
 *
 * @param {string} rawText - Raw text from AI
 * @returns {Object|null}  - Validated result or null
 */
function parseResult(rawText) {
  if (!rawText || !rawText.trim()) return null;

  // Strip markdown fences some models add accidentally
  const clean = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i,     '')
    .replace(/\s*```$/,      '')
    .trim();

  let result;
  try {
    result = JSON.parse(clean);
  } catch {
    return null;
  }

  if (typeof result !== 'object' || result === null) return null;

  // Normalize diseases array
  if (!Array.isArray(result.diseases)) {
    result.diseases = [];
  }

  // Remove diseases below minimum confidence threshold
  result.diseases = result.diseases.filter(d =>
    !d.confidence || d.confidence >= DISEASE_MIN_CONFIDENCE
  );

  // Guard: healthy + diseases cannot coexist — diseases win (safer)
  if (result.is_healthy === true && result.diseases.length > 0) {
    result.is_healthy = false;
  }

  // Guard: no diseases + not healthy — mark as healthy
  if (result.diseases.length === 0 && result.is_healthy === false) {
    result.is_healthy = true;
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — MAJORITY VOTE ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compare results from multiple providers and return the majority verdict.
 *
 * VOTING LOGIC:
 *   - Get primary label from each result (disease name or "HEALTHY")
 *   - Count votes per label
 *   - Winner = most votes
 *   - Tie-breaking: disease beats healthy (cautious for farmer safety)
 *   - If still tied: higher average confidence wins
 *
 * @param {Array<Object>} results - Valid result objects from providers
 * @returns {Object}              - The winning result
 */
function majorityVote(results) {
  if (results.length === 0) return null;
  if (results.length === 1) return results[0];

  // Build vote tally
  const votes = {};

  results.forEach(result => {
    const label = result.is_healthy
      ? 'HEALTHY'
      : (result.diseases[0]?.disease_name_en || 'UNKNOWN').toUpperCase().trim();

    if (!votes[label]) {
      votes[label] = { count: 0, result, totalConfidence: 0 };
    }

    votes[label].count++;
    votes[label].totalConfidence += result.overall_confidence || 0;

    // Keep highest-confidence result for this label
    if ((result.overall_confidence || 0) > (votes[label].result.overall_confidence || 0)) {
      votes[label].result = result;
    }
  });

  // Find winning label
  let winnerLabel      = null;
  let winnerVotes      = 0;
  let winnerConfidence = 0;

  Object.entries(votes).forEach(([label, data]) => {
    const avgConf = data.totalConfidence / data.count;
    const isDisease = label !== 'HEALTHY';
    const currentIsDisease = winnerLabel !== 'HEALTHY';

    if (
      data.count > winnerVotes ||
      // Tie: disease beats healthy
      (data.count === winnerVotes && isDisease && !currentIsDisease) ||
      // Tie between diseases: higher confidence wins
      (data.count === winnerVotes && isDisease && currentIsDisease && avgConf > winnerConfidence)
    ) {
      winnerLabel      = label;
      winnerVotes      = data.count;
      winnerConfidence = avgConf;
    }
  });

  const winner = votes[winnerLabel].result;

  // Boost confidence when majority agrees — more providers agreeing = more certain
  if (winnerVotes >= 2) {
    winner.overall_confidence = Math.min(
      99,
      (winner.overall_confidence || 0) + (winnerVotes - 1) * 5
    );
  }

  console.log(`[FasalDost Majority] ${winnerLabel} won with ${winnerVotes}/${results.length} votes`);
  return winner;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — FINAL VALIDATOR
// Last gate before returning to screen.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Final validation before returning result to ScanScreen.
 *
 * @param {Object} result - Parsed result
 * @returns {Object}      - Validated result
 * @throws {Error}        - 'LOW_CONFIDENCE' if not reliable enough
 */
function validateFinal(result) {
  if (!result) throw new Error('NETWORK_ERROR');

  if (result.image_quality === 'unclear') {
    throw new Error('LOW_CONFIDENCE');
  }

  if (
    typeof result.overall_confidence === 'number' &&
    result.overall_confidence < CONFIDENCE_MIN_ACCEPT
  ) {
    throw new Error('LOW_CONFIDENCE');
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — MAIN EXPORTED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect crop disease from an image using hybrid AI detection.
 *
 * FLOW:
 *   1. Validate inputs
 *   2. Phase 1: Call primary provider (Gemini) alone — fast path
 *   3. If confidence >= 80% → return immediately
 *   4. If confidence < 80%  → Phase 2: call ALL providers in parallel
 *   5. Apply majority vote to parallel results
 *   6. Final validation and return
 *
 * @param {string} imageBase64 - Base64 JPEG string (no data: prefix)
 * @param {string} cropName    - Optional crop name for accuracy
 * @returns {Promise<Object>}  - Disease detection result
 *
 * @throws {Error} 'LOW_CONFIDENCE' — image unclear, ask farmer to retake
 * @throws {Error} 'NETWORK_ERROR'  — all providers failed
 */
export async function detectDisease(imageBase64, cropName = '') {

  // Validate input
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    throw new Error('No image provided');
  }

  const userText = cropName.trim()
    ? `The crop is: ${cropName.trim()}. Detect ALL diseases with high precision. Be specific to Pakistani farming conditions.`
    : `Identify the crop first, then detect ALL diseases with high precision. Be specific to Pakistani farming conditions.`;

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 1 — FAST PATH
  // Try primary provider alone. If confident — return immediately.
  // Handles 70-80% of scans cheaply and instantly.
  // ─────────────────────────────────────────────────────────────────────────

  console.log('[FasalDost] Phase 1 → Fast path:', PROVIDERS[0].name);

  let phase1Result = null;

  try {
    const rawText = await callProvider(PROVIDERS[0], imageBase64, userText);
    phase1Result  = parseResult(rawText);
  } catch (err) {
    console.warn('[FasalDost] Phase 1 failed:', err.message, '→ Phase 2');
  }

  // High confidence on Phase 1 — return immediately
  if (
    phase1Result &&
    phase1Result.image_quality !== 'unclear' &&
    (phase1Result.overall_confidence || 0) >= CONFIDENCE_FAST_PATH
  ) {
    console.log(`[FasalDost] Phase 1 ✓ confidence: ${phase1Result.overall_confidence}%`);
    return validateFinal(phase1Result);
  }

  console.log(`[FasalDost] Phase 1 low confidence (${phase1Result?.overall_confidence || 0}%) → Phase 2`);

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 2 — ACCURACY PATH
  // Call ALL providers simultaneously. Apply majority vote.
  // Handles uncertain cases with maximum reliability.
  // ─────────────────────────────────────────────────────────────────────────

  console.log('[FasalDost] Phase 2 → Parallel call to', PROVIDERS.length, 'providers');

  // Promise.allSettled never throws — failed providers return null
  const parallelResults = await Promise.allSettled(
    PROVIDERS.map(provider =>
      callProvider(provider, imageBase64, userText)
        .then(rawText => {
          const result = parseResult(rawText);
          if (result) {
            console.log(`[FasalDost] ${provider.name} → ${result.overall_confidence}% conf, healthy: ${result.is_healthy}`);
          }
          return result;
        })
        .catch(err => {
          console.warn(`[FasalDost] ${provider.name} failed:`, err.message);
          return null;
        })
    )
  );

  // Collect valid results (exclude nulls and unclear responses)
  const validResults = parallelResults
    .map(r => r.status === 'fulfilled' ? r.value : null)
    .filter(r => r !== null && r.image_quality !== 'unclear');

  console.log(`[FasalDost] Phase 2 → ${validResults.length}/${PROVIDERS.length} providers succeeded`);

  // No valid results from any provider
  if (validResults.length === 0) {
    // Fall back to Phase 1 result as last resort
    if (phase1Result) {
      console.warn('[FasalDost] All parallel failed — using Phase 1 fallback');
      return validateFinal(phase1Result);
    }
    throw new Error('NETWORK_ERROR');
  }

  // Apply majority vote and return winner
  const winner = majorityVote(validResults);
  return validateFinal(winner);
}
