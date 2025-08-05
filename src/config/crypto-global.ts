// Global crypto polyfill for Node.js v18 compatibility
import * as crypto from 'crypto';

// Make crypto available globally (only if it doesn't exist)
if (typeof global !== 'undefined' && !global.crypto) {
  Object.defineProperty(global, 'crypto', {
    value: crypto,
    writable: false,
    configurable: true,
  });
}

// Ensure randomUUID is available (only if it doesn't exist)
if (!crypto.randomUUID) {
  // Use Object.defineProperty to avoid read-only property issues
  Object.defineProperty(crypto, 'randomUUID', {
    value: () => {
      const bytes = crypto.randomBytes(16);
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 1
      return bytes.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
    },
    writable: false,
    configurable: true,
  });
}
