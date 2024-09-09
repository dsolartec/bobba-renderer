import { PointData } from 'pixi.js';
import HitTexture from '../hitdetection/HitTexture';
import FurnitureAssetsData, {
  type FurniBundleAssetsData,
} from './data/FurnitureAssetsData';
import FurnitureIndexData, {
  type FurniBundleIndexData,
} from './data/FurnitureIndexData';
import FurnitureVisualizationData, {
  type FurniBundleVisualizationData,
} from './data/FurnitureVisualizationData';
import BobbaAssetBundle from '../BobbaAssetBundle';
import BobbaRenderer from '../BobbaRenderer';

interface FurniBundleSpritesheetFrameData {
  frame: { w: number; h: number } & PointData;
}

interface FurniBundleSpritesheetData {
  frames: { [name: string]: FurniBundleSpritesheetFrameData };
}

interface FurniBundleData {
  assets: FurniBundleAssetsData;
  index: FurniBundleIndexData;
  spritesheet: FurniBundleSpritesheetData;
  visualization: FurniBundleVisualizationData;
}

export default class FurniBundle {
  private textures: Map<string, HitTexture>;

  constructor(
    private readonly bobbaRenderer: BobbaRenderer,
    private readonly data: FurniBundleData,
    private readonly spritesheet: HTMLImageElement
  ) {
    this.textures = new Map();
  }

  getAssets(): FurnitureAssetsData {
    return new FurnitureAssetsData(this.data.assets);
  }

  getIndex(): FurnitureIndexData {
    return new FurnitureIndexData(this.bobbaRenderer, this.data.index);
  }

  getVisualization(): FurnitureVisualizationData {
    return new FurnitureVisualizationData(this.data.visualization);
  }

  static async fromAssetBundle(
    bobbaRenderer: BobbaRenderer,
    bundle: BobbaAssetBundle
  ) {
    const reader = new FileReader();

    const spritesheet = await bundle.getBlob('spritesheet.png');
    const image = new Image();

    await new Promise((resolve, reject) => {
      reader.readAsDataURL(spritesheet);
      reader.onloadend = () => {
        image.src = reader.result as string;
        image.onload = () => resolve(true);
        image.onerror = (e) => reject(e);
      };
    });

    return new FurniBundle(
      bobbaRenderer,
      JSON.parse(await bundle.getString('index.json')),
      image
    );
  }

  getTexture(name: string): HitTexture {
    const cache = this.textures.get(name);
    if (cache != null) return cache;

    const frame = this.data.spritesheet.frames[name];
    if (frame == null) throw new Error('Frame not found.');

    const canvas = document.createElement('canvas');
    canvas.width = frame.frame.w;
    canvas.height = frame.frame.h;

    const context = canvas.getContext('2d');
    if (context == null) throw new Error('Canvas context not valid.');

    context.drawImage(
      this.spritesheet,
      frame.frame.x,
      frame.frame.y,
      frame.frame.w,
      frame.frame.h,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const texture = HitTexture.fromCanvas(canvas);
    this.textures.set(name, texture);

    return texture;
  }
}
