import { createCanvas, loadImage } from '@napi-rs/canvas';

function truecolorFg(r: number, g: number, b: number): string {
  return `\x1b[38;2;${r};${g};${b}m`;
}

function truecolorBg(r: number, g: number, b: number): string {
  return `\x1b[48;2;${r};${g};${b}m`;
}

const RESET = '\x1b[0m';
const HALF_BLOCK = '▀';

interface Pixel {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

function getPixel({ data, width }: { readonly data: Uint8ClampedArray; readonly width: number }, x: number, y: number): Pixel {
  const i = (y * width + x) * 4;
  return { r: data[i] ?? 0, g: data[i + 1] ?? 0, b: data[i + 2] ?? 0, a: data[i + 3] ?? 0 };
}

function blendOnBlack(px: Pixel): Pixel {
  const alpha = px.a / 255;
  return {
    r: Math.round(px.r * alpha),
    g: Math.round(px.g * alpha),
    b: Math.round(px.b * alpha),
    a: 255,
  };
}

export async function fetchAvatarLines({ owner, height = 5 }: { readonly owner: string; readonly height?: number }): Promise<readonly string[]> {
  const url = `https://github.com/${owner}.png?size=200`;

  const response = await fetch(url);
  if (!response.ok) return [];

  const arrayBuf = await response.arrayBuffer();
  const image = await loadImage(Buffer.from(arrayBuf));

  const targetHeight = height * 2;
  const aspect = image.width / image.height;
  const targetWidth = Math.round(targetHeight * aspect * 2);

  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const pixels = { data: imageData.data as unknown as Uint8ClampedArray, width: targetWidth };

  const lines: string[] = [];

  for (let row = 0; row < targetHeight; row += 2) {
    let line = '';
    for (let col = 0; col < targetWidth; col++) {
      const top = blendOnBlack(getPixel(pixels, col, row));
      const bottom = row + 1 < targetHeight
        ? blendOnBlack(getPixel(pixels, col, row + 1))
        : { r: 0, g: 0, b: 0, a: 255 };

      line += truecolorFg(top.r, top.g, top.b) + truecolorBg(bottom.r, bottom.g, bottom.b) + HALF_BLOCK;
    }
    line += RESET;
    lines.push(line);
  }

  return lines;
}
