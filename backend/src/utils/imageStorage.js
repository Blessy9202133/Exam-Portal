const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const UPLOADS_DIR = path.join(__dirname, '../../uploads/images');

// Ensure uploads/images directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Saves an image Buffer to the server's uploads/images directory
 * and returns the public server URL for that image.
 *
 * @param {Buffer} buffer - Raw image bytes
 * @param {string} extOrMime - File extension (e.g. 'png', 'jpeg') or MIME type ('image/png')
 * @returns {string} Server URL (e.g. 'http://localhost:5000/uploads/images/q_1728300000_abc123.png')
 */
const saveImageToServer = (buffer, extOrMime = 'png') => {
  if (!buffer || !Buffer.isBuffer(buffer)) return '';

  let ext = String(extOrMime).toLowerCase().trim();
  if (ext.includes('/')) {
    ext = ext.split('/')[1];
  }
  ext = ext.replace(/[^a-z0-9]/g, '');
  if (!['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext)) {
    ext = 'png';
  }
  if (ext === 'jpeg') ext = 'jpg';

  const uniqueName = `q_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, uniqueName);

  fs.writeFileSync(filePath, buffer);

  const port = process.env.PORT || 5050;
  return `http://localhost:${port}/uploads/images/${uniqueName}`;
};

/**
 * Resolves a local file path from a stored server imageUrl if it exists on disk.
 *
 * @param {string} imageUrl
 * @returns {string|null} Absolute file path on disk or null
 */
const getLocalImagePathFromUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const match = imageUrl.match(/\/uploads\/images\/([^/?#]+)/i);
  if (!match) return null;
  const filePath = path.join(UPLOADS_DIR, match[1]);
  return fs.existsSync(filePath) ? filePath : null;
};

// CRC32 helper for generating valid PNG chunks
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makePngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/**
 * Generates a clean 160x80 schematic diagram PNG buffer in memory
 * so downloadable Excel & Word templates contain a real embedded sample diagram.
 */
const getSampleDiagramBuffer = () => {
  const width = 160;
  const height = 80;
  const rawData = Buffer.alloc(height * (1 + width * 3));

  const cx = 80;
  const cy = 40;
  const radius = 26;

  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 3);
    rawData[rowStart] = 0; // No filter
    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * 3;
      // Light blueprint background (#F0F4F8)
      let r = 240, g = 244, b = 248;

      // Outer border
      if (x < 2 || x >= width - 2 || y < 2 || y >= height - 2) {
        r = 31; g = 78; b = 120;
      } else {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Circle outline (instrument symbol)
        if (Math.abs(dist - radius) <= 1.8) {
          r = 31; g = 78; b = 120;
        }
        // Horizontal process line outside circle
        else if (Math.abs(y - cy) <= 1.2 && dist >= radius) {
          r = 31; g = 78; b = 120;
        }
        // Horizontal dividing line inside circle (field-mounted transmitter symbol)
        else if (Math.abs(y - cy) <= 1.0 && dist < radius) {
          r = 31; g = 78; b = 120;
        }
        // Inner circle white fill
        else if (dist < radius - 1.8) {
          r = 255; g = 255; b = 255;
        }
      }

      rawData[px] = r;
      rawData[px + 1] = g;
      rawData[px + 2] = b;
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(rawData);
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', idat),
    makePngChunk('IEND', iend),
  ]);
};

module.exports = {
  UPLOADS_DIR,
  saveImageToServer,
  getLocalImagePathFromUrl,
  getSampleDiagramBuffer,
};
