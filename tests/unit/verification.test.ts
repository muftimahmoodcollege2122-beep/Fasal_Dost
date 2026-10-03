import { describe, it, expect } from 'vitest';
import { documentVerificationService } from '../../server/modules/farmers/verification.service';

describe('DocumentVerificationService (Anti-Fraud & CNIC Engine)', () => {
  it('validates a correct Pakistani CNIC number format and province match', () => {
    // 35201-1234567-1 is Punjab prefix 3
    const result = documentVerificationService.validateCnicFormat('35201-1234567-1', 'Punjab');
    expect(result.valid).toBe(true);
  });

  it('rejects a dummy/repetitive CNIC sequence', () => {
    const result = documentVerificationService.validateCnicFormat('11111-1111111-1', 'KPK');
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('CNIC cannot be a dummy sequence');
  });

  it('rejects mismatched province and CNIC division prefix', () => {
    // Prefix 5 is Balochistan, but province is Punjab
    const result = documentVerificationService.validateCnicFormat('51201-1234567-1', 'Punjab');
    expect(result.valid).toBe(false);
    expect(result.issues?.some((i) => i.includes('does not match selected province'))).toBe(true);
  });

  it('validates Pakistani mobile phone operators', () => {
    const validMobile = documentVerificationService.validatePhone('03001234567');
    expect(validMobile.valid).toBe(true);

    const invalidMobile = documentVerificationService.validatePhone('02001234567');
    expect(invalidMobile.valid).toBe(false);
  });

  it('blocks disposable and temporary email domains', () => {
    const disposable = documentVerificationService.validateEmail('user@mailinator.com');
    expect(disposable.valid).toBe(false);

    const genuine = documentVerificationService.validateEmail('farmer@gmail.com');
    expect(genuine.valid).toBe(true);
  });
});
