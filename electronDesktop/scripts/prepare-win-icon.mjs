import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const pngPath = resolve(projectRoot, "build", "icon.png");
const icoPath = resolve(projectRoot, "build", "icon.ico");

const SIZES = [16, 24, 32, 48, 64, 128, 256];

function createBmpDib(rgba, width, height) {
  const andMaskRowSize = Math.ceil(width / 8);
  const andMaskPadded = andMaskRowSize + (4 - (andMaskRowSize % 4)) % 4;
  const xorMaskSize = height * width * 4;
  const andMaskSize = height * andMaskPadded;
  const dibSize = 40 + xorMaskSize + andMaskSize;

  const dib = Buffer.alloc(dibSize);
  dib.writeUInt32LE(40, 0);
  dib.writeInt32LE(width, 4);
  dib.writeInt32LE(height * 2, 8);
  dib.writeUInt16LE(1, 12);
  dib.writeUInt16LE(32, 14);
  dib.writeUInt32LE(0, 16);
  dib.writeUInt32LE(xorMaskSize + andMaskSize, 20);
  dib.writeInt32LE(0, 24);
  dib.writeInt32LE(0, 28);

  let xorOffset = 40;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      dib[xorOffset] = rgba[srcIdx + 2];
      dib[xorOffset + 1] = rgba[srcIdx + 1];
      dib[xorOffset + 2] = rgba[srcIdx];
      dib[xorOffset + 3] = rgba[srcIdx + 3];
      xorOffset += 4;
    }
  }

  return dib;
}

async function createIco(pngBuffer) {
  const images = [];

  for (const size of SIZES) {
    const resized = await sharp(pngBuffer)
      .resize(size, size, { fit: "fill" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const rgba = resized.data;
    const dib = createBmpDib(rgba, size, size);

    images.push({
      width: size,
      height: size,
      dib,
    });
  }

  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * images.length;
  let dataOffset = headerSize + dirSize;

  const dirEntries = [];
  const dibs = [];

  for (const img of images) {
    const entry = Buffer.alloc(dirEntrySize);
    entry[0] = img.width >= 256 ? 0 : img.width;
    entry[1] = img.height >= 256 ? 0 : img.height;
    entry[2] = 0;
    entry[3] = 0;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.dib.length, 8);
    entry.writeUInt32LE(dataOffset, 12);
    dirEntries.push(entry);
    dibs.push(img.dib);
    dataOffset += img.dib.length;
  }

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  return Buffer.concat([header, ...dirEntries, ...dibs]);
}

const pngBuffer = await readFile(pngPath);
const icoBuffer = await createIco(pngBuffer);
await writeFile(icoPath, icoBuffer);

console.log(`Prepared Windows icon: ${icoPath} (${icoBuffer.length} bytes, ${SIZES.length} sizes)`);
