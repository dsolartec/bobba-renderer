import { PointData } from 'pixi.js';
import type HitTexture from '../hitdetection/HitTexture';
import type ManifestData from './data/ManifestData';
import type { ManifestAsset } from './data/ManifestData';

export interface IManifestLibrary {
  getManifest(): ManifestData;
  getTexture(name: string): Promise<HitTexture>;
}

const NO_ASSET = Symbol('NO_ASSET');

export default class AvatarAssetLibraryCollection {
  private assets: Map<string, ManifestAsset>;
  private libraries: Map<string, IManifestLibrary>;
  private textures: Map<string, HitTexture | typeof NO_ASSET>;

  private opened: Set<IManifestLibrary>;

  constructor() {
    this.assets = new Map();
    this.libraries = new Map();
    this.textures = new Map();

    this.opened = new Set();
  }

  async loadTextures(ids: string[]): Promise<void> {
    for await (const id of ids) {
      if (this.textures.has(id)) continue;

      const library = this.libraries.get(id);
      if (library == null) throw new Error(`Couldn't find library for ${id}`);

      this.textures.set(
        id,
        (await library.getTexture(this.assets.get(id)?.name ?? id)) ?? NO_ASSET
      );
    }
  }

  open(bundle: IManifestLibrary): void {
    if (this.opened.has(bundle)) return;

    const manifest = bundle.getManifest();
    manifest.getAssets().map((asset) => {
      this.assets.set(asset.name, asset);
      this.libraries.set(asset.name, bundle);
    });

    manifest.getAliases().map((alias) => {
      const base = manifest.getAssetByName(alias.link);
      if (base == null) return;

      this.assets.set(alias.name, {
        ...base,
        flipH: alias.flipH,
        flipV: alias.flipV,
      });

      this.libraries.set(alias.name, bundle);
    });

    this.opened.add(bundle);
  }

  getOffsets(fileName: string): PointData | null {
    const cache = this.assets.get(fileName) ?? null;
    if (cache == null) return null;

    return { x: cache.x, y: cache.y };
  }

  getTexture(fileName: string): HitTexture | null {
    const texture = this.textures.get(fileName);
    if (texture === NO_ASSET) return null;

    return texture ?? null;
  }
}
