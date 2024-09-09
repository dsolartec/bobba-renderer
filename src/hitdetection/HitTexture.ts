import { Texture, type PointData, type TextureOptions } from 'pixi.js';

export default class HitTexture extends Texture {
  private cachedHitMap: Uint32Array | null;

  constructor(options?: TextureOptions) {
    super(options);

    this.cachedHitMap = null;
  }

  static fromCanvas(canvas: HTMLCanvasElement): HitTexture {
    return new HitTexture(Texture.from(canvas));
  }

  static async fromUrl(url: string): Promise<HitTexture> {
    const canvas = document.createElement('canvas');
    const image = new Image();

    image.crossOrigin = 'anonymous';
    image.src = url;

    await new Promise((resolve, reject) => {
      image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;

        const context = canvas.getContext('2d');
        if (context == null)
          return reject(new Error('Invalid canvas context.'));

        context.drawImage(image, 0, 0, image.width, image.height);

        resolve(true);
      };
      image.onerror = (e) => reject(e);
    });

    return new HitTexture(Texture.from(canvas));
  }

  static async fromBlob(blob: Blob): Promise<HitTexture> {
    const reader = new FileReader();

    const url = await new Promise<string>((resolve) => {
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result as string);
    });

    return HitTexture.fromUrl(url);
  }

  private getHitMap() {
    if (this.cachedHitMap == null) {
      const canvas = document.createElement('canvas');
      canvas.width = this.source.resourceWidth;
      canvas.height = this.source.resourceHeight;

      const context = canvas.getContext('2d');
      if (context == null) throw new Error('Invalid context 2d');

      context.drawImage(this.source.resource, 0, 0);

      const w = canvas.width;
      const h = canvas.height;

      const imageData = context.getImageData(0, 0, w, h);

      const hitmap = new Uint32Array(Math.ceil((w * h) / 32));
      for (let i = 0; i < w * h; i++) {
        const ind1 = i % 32;
        const ind2 = (i / 32) | 0;
        if (imageData.data[i * 4 + 3] >= 25) {
          hitmap[ind2] = hitmap[ind2] | (1 << ind1);
        }
      }

      this.cachedHitMap = hitmap;
    }

    return this.cachedHitMap;
  }

  hits(point: PointData, transform: PointData, mirrored: boolean) {
    point.x -= transform.x;
    point.y -= transform.y;

    if (mirrored) point.x = -point.x;

    const dx = Math.round(this.orig.x + point.x * this.source.resolution);
    const dy = Math.round(this.orig.y + point.y * this.source.resolution);
    const ind = dx + dy * this.source.resourceWidth;
    const ind1 = ind % 32;
    const ind2 = (ind / 32) | 0;

    return (this.getHitMap()[ind2] & (1 << ind1)) !== 0;
  }
}
