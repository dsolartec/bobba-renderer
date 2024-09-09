import { PointData } from 'pixi.js';

export interface FurnitureAsset extends PointData {
  name: string;
  flipH: boolean;
  valid: boolean;
  source?: string;
}

export type FurniBundleAssetsData = { [name: string]: FurnitureAsset };

export default class FurnitureAssetsData {
  private assets: Map<string, FurnitureAsset>;

  constructor(data: FurniBundleAssetsData) {
    this.assets = new Map(Object.entries(data));
  }

  getOne(name: string): FurnitureAsset | null {
    return this.assets.get(name) ?? null;
  }

  getAll(): FurnitureAsset[] {
    return Array.from(this.assets.values());
  }
}
