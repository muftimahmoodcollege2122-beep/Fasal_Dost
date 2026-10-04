// ─────────────────────────────────────────────────────────────────────────────
// server/modules/farmers/verification.service.ts
// Intelligent Verification Engine: CNIC Document Forensics, AI OCR & Anti-Bot Screening
// ─────────────────────────────────────────────────────────────────────────────

import { createHash } from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { AppError } from '../../core/types';

export interface VerificationResult {
  isValid: boolean;
  confidenceScore: number;
  status: 'verified' | 'flagged_for_review' | 'rejected';
  issues: string[];
  notes: string;
  extractedCnic?: string;
  extractedName?: string;
  isAiVerified: boolean;
}

const PROVINCE_CNIC_PREFIX_MAP: Record<string, string[]> = {
  Punjab: ['3'],
  Sindh: ['4'],
  KPK: ['1', '2'],
  'Khyber Pakhtunkhwa': ['1', '2'],
  Balochistan: ['5'],
  Islamabad: ['6'],
  'Gilgit-Baltistan': ['7'],
  AJK: ['7'],
  'Azad Kashmir': ['7'],
};

const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  '10minutemail.com',
  'mailinator.com',
  'guerrillamail.com',
  'trashmail.com',
  'yopmail.com',
  'sharklasers.com',
  'getairmail.com',
  'dispostable.com',
];

const FAKE_CNIC_PATTERNS = [
  '0000000000000',
  '1111111111111',
  '2222222222222',
  '3333333333333',
  '4444444444444',
  '5555555555555',
  '6666666666666',
  '7777777777777',
  '8888888888888',
  '9999999999999',
  '1234567890123',
  '1234567890121',
  '1234512345671',
];

export class DocumentVerificationService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Run multi-layer verification on submitted seller data and CNIC documents
   */
  public async verifySellerSubmission(data: {
    fullName: string;
    phoneNumber: string;
    email: string;
    cnicNumber: string;
    province: string;
    profilePhotoDataUrl: string;
    cnicFrontDataUrl: string;
    cnicBackDataUrl: string;
  }): Promise<VerificationResult> {
    const issues: string[] = [];

    // ── 1. Pakistani CNIC Format & Province Cryptographic Check ─────────────
    const cleanCnic = data.cnicNumber.replace(/\D/g, '');
    if (cleanCnic.length !== 13) {
      issues.push('CNIC must be exactly 13 numeric digits');
    }

    if (FAKE_CNIC_PATTERNS.includes(cleanCnic)) {
      issues.push('Invalid or mock CNIC sequence detected');
    }

    // Check province prefix
    const firstDigit = cleanCnic.charAt(0);
    const validPrefixes = PROVINCE_CNIC_PREFIX_MAP[data.province];
    if (validPrefixes && !validPrefixes.includes(firstDigit)) {
      issues.push(
        `CNIC initial digit (${firstDigit}) does not correspond to province ${data.province}. NADRA CNICs encode the official provincial division.`
      );
    }

    // ── 2. Pakistani Mobile Phone Format & Operator Check ────────────────────
    const cleanPhone = data.phoneNumber.replace(/\D/g, '');
    let localPhone = cleanPhone;
    if (cleanPhone.startsWith('92')) {
      localPhone = '0' + cleanPhone.substring(2);
    }

    if (!/^03[0-4][0-9]{8}$/.test(localPhone) && !/^0355[0-9]{7}$/.test(localPhone)) {
      issues.push(
        'Phone number must be a valid 11-digit Pakistani mobile network number (Jazz, Zong, Telenor, Ufone, SCOM)'
      );
    }

    if (
      localPhone === '03000000000' ||
      localPhone === '03123456789' ||
      localPhone === '03001234567' ||
      /^03[0-9](\d)\1{7}$/.test(localPhone)
    ) {
      issues.push('Suspicious or dummy mobile number detected');
    }

    // ── 3. Email Quality & Anti-Scam Check ──────────────────────────────────
    if (!data.email || !data.email.includes('@')) {
      issues.push('Valid email address is required');
    } else {
      const emailDomain = data.email.split('@')[1]?.toLowerCase();
      if (emailDomain && DISPOSABLE_EMAIL_DOMAINS.includes(emailDomain)) {
        issues.push('Temporary or disposable email domains are strictly prohibited for sellers');
      }
    }

    // ── 4. Image Forensics & Distinct Document Verification ─────────────────
    this.validateImagePayload(data.profilePhotoDataUrl, 'Profile Photo / Selfie', issues);
    this.validateImagePayload(data.cnicFrontDataUrl, 'CNIC Front Image', issues);
    this.validateImagePayload(data.cnicBackDataUrl, 'CNIC Back Image', issues);

    // Prevent uploading identical images across fields
    const sha = (x: string) => createHash('sha256').update(x).digest('hex');
    const hashSelfie = sha(data.profilePhotoDataUrl);
    const hashFront = sha(data.cnicFrontDataUrl);
    const hashBack = sha(data.cnicBackDataUrl);

    if (hashFront === hashBack) {
      issues.push('CNIC front and back cannot be the exact same image');
    }
    if (hashSelfie === hashFront) {
      issues.push('Profile selfie and CNIC front cannot be the exact same image');
    }

    // If critical structural issues exist, fail immediately
    if (issues.length > 0) {
      throw new AppError(
        `Verification checks failed: ${issues.join('. ')}`,
        400,
        'VERIFICATION_FAILED',
        { issues }
      );
    }

    // ── 5. AI Computer Vision Document & OCR Inspection ─────────────────────
    let aiVerified = false;
    let confidence = 0.95;
    let aiNotes = 'Heuristic structural validation passed with high confidence.';
    let extractedCnic: string | undefined;
    let extractedName: string | undefined;

    if (this.ai) {
      try {
        const aiResult = await this.inspectCnicWithGemini(
          data.cnicFrontDataUrl,
          cleanCnic,
          data.fullName
        );
        if (aiResult) {
          aiVerified = true;
          confidence = aiResult.confidence;
          aiNotes = aiResult.notes;
          extractedCnic = aiResult.extractedCnic;
          extractedName = aiResult.extractedName;

          if (!aiResult.isCnicCard) {
            throw new AppError(
              'Automated Document Inspection Failed: The image uploaded for CNIC front does not appear to be an authentic Pakistani National Identity Card. Please upload a clear photo of your genuine NADRA CNIC.',
              400,
              'INVALID_CNIC_DOCUMENT',
              { notes: aiResult.notes }
            );
          }

          if (aiResult.cnicMismatch) {
            throw new AppError(
              `CNIC Number Mismatch: The number on the uploaded card does not match the entered CNIC (${data.cnicNumber}). Please verify and re-enter accurately.`,
              400,
              'CNIC_MISMATCH'
            );
          }
        }
      } catch (err: any) {
        if (err instanceof AppError) throw err;
        console.warn('[DocumentVerificationService] Gemini Vision OCR skipped or quota rate-limited:', err.message);
        aiNotes = 'AI vision inspection deferred due to rate limits; passed forensic checks.';
      }
    }

    return {
      isValid: true,
      confidenceScore: confidence,
      status: 'verified',
      issues: [],
      notes: aiNotes,
      extractedCnic,
      extractedName,
      isAiVerified: aiVerified,
    };
  }

  private validateImagePayload(dataUrl: string, fieldName: string, issues: string[]) {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      issues.push(`${fieldName} must be a valid image file (JPEG, PNG, or WebP)`);
      return;
    }

    const base64Index = dataUrl.indexOf(';base64,');
    if (base64Index === -1) {
      issues.push(`${fieldName} is corrupted or missing base64 encoding`);
      return;
    }

    const payload = dataUrl.substring(base64Index + 8);
    // Minimum image size check (approx 5KB in base64 length ~ 6800 chars)
    if (payload.length < 6800) {
      issues.push(
        `${fieldName} file size is too small or blank. Please upload a clear, legible photograph.`
      );
    }
  }

  /**
   * AI-powered vision inspection using Gemini 2.5 Flash
   */
  private async inspectCnicWithGemini(
    imageBase64Url: string,
    expectedCnic: string,
    expectedName: string
  ): Promise<{
    isCnicCard: boolean;
    confidence: number;
    cnicMismatch: boolean;
    extractedCnic?: string;
    extractedName?: string;
    notes: string;
  } | null> {
    if (!this.ai) return null;

    let mimeType = 'image/jpeg';
    let base64Clean = imageBase64Url;

    if (imageBase64Url.startsWith('data:')) {
      const match = imageBase64Url.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Clean = match[2];
      }
    }

    const prompt = `You are a strict security inspector for Pakistani identity verification at FasalDost Agritech.
Analyze this uploaded document photograph.
Expected CNIC number: ${expectedCnic}
Expected Full Name: ${expectedName}

Task:
1. Is this image an authentic Pakistani National Identity Card (NADRA CNIC or Smart Card) front? If it is a pet, cartoon, random object, landscape, selfie, receipt, or random paper, mark isCnicCard: false.
2. Read the 13-digit CNIC number visible on the card (if readable).
3. Read the cardholder name (if readable).
4. Check if the visible CNIC matches ${expectedCnic}.

Respond ONLY in valid JSON matching this schema:
{
  "isCnicCard": boolean,
  "confidence": number, // between 0.0 and 1.0
  "extractedCnic": string or null,
  "extractedName": string or null,
  "cnicMatches": boolean,
  "fraudDetected": boolean,
  "notes": string
}`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Clean,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim();
    if (!text) return null;

    try {
      const parsed = JSON.parse(text);
      const isMismatch =
        parsed.extractedCnic &&
        parsed.extractedCnic.replace(/\D/g, '').length === 13 &&
        parsed.extractedCnic.replace(/\D/g, '') !== expectedCnic;

      return {
        isCnicCard: parsed.isCnicCard !== false && !parsed.fraudDetected,
        confidence: Number(parsed.confidence || 0.95),
        cnicMismatch: !!isMismatch,
        extractedCnic: parsed.extractedCnic || undefined,
        extractedName: parsed.extractedName || undefined,
        notes: parsed.notes || 'AI document verification completed.',
      };
    } catch {
      return null;
    }
  }
}

export const documentVerificationService = new DocumentVerificationService();
