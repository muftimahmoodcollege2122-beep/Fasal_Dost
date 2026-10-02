// ─────────────────────────────────────────────────────────────────────────────
// server/modules/storage/storage.service.ts
// S3-Compatible Storage Service for Seller Verification & Produce Media
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UploadResult {
  url: string;
  key: string;
  sizeBytes: number;
  mimeType: string;
  storageBackend: 's3-compatible-local' | 's3-cloud';
}

export class StorageService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Upload base64 or buffer media into S3-compatible path structure
   */
  public async uploadMedia(
    folder: string,
    fileData: string, // base64 data url or raw base64
    originalName?: string
  ): Promise<UploadResult> {
    let mimeType = 'image/jpeg';
    let base64Clean = fileData;

    // Detect MIME type and extract clean base64 payload if data URL
    if (fileData.startsWith('data:')) {
      const match = fileData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Clean = match[2];
      }
    }

    const extension = this.getExtensionFromMime(mimeType) || (originalName ? path.extname(originalName) : '.jpg');
    const randomHex = crypto.randomBytes(8).toString('hex');
    const filename = `${Date.now()}_${randomHex}${extension}`;

    // Target folder structure (e.g., /sellers/cnic, /sellers/profiles, /listings)
    const targetFolder = path.join(this.uploadsDir, folder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const filePath = path.join(targetFolder, filename);
    const buffer = Buffer.from(base64Clean, 'base64');
    await fs.promises.writeFile(filePath, buffer);

    const relativeUrl = `/uploads/${folder}/${filename}`.replace(/\\/g, '/');
    const s3Key = `fasaldost-storage/${folder}/${filename}`;

    return {
      url: relativeUrl,
      key: s3Key,
      sizeBytes: buffer.length,
      mimeType,
      storageBackend: 's3-compatible-local',
    };
  }

  private getExtensionFromMime(mime: string): string {
    switch (mime) {
      case 'image/jpeg':
      case 'image/jpg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'video/mp4':
        return '.mp4';
      case 'video/webm':
        return '.webm';
      case 'video/quicktime':
        return '.mov';
      default:
        return '.bin';
    }
  }
}

export const storageService = new StorageService();
