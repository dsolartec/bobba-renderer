import { PointData } from 'pixi.js';
import BaseData from '../../utils/BaseData';

export interface ManifestAsset extends PointData {
  name: string;
  flipH: boolean;
  flipV: boolean;
}

export interface ManifestAlias {
  name: string;
  link: string;
  flipH: boolean;
  flipV: boolean;
}

export default class ManifestData extends BaseData {
  private assets: ManifestAsset[];
  private assetByName: Map<string, ManifestAsset>;

  private aliases: ManifestAlias[];

  constructor(xml: string) {
    super(xml);

    this.assets = [];
    this.assetByName = new Map();

    this.aliases = [];

    this.setCacheData();
  }

  getAssets(): ManifestAsset[] {
    return this.assets;
  }

  getAssetByName(name: string): ManifestAsset | null {
    return this.assetByName.get(name) ?? null;
  }

  getAliases(): ManifestAlias[] {
    return this.aliases;
  }

  private setCacheData(): void {
    const assets = this.querySelectorAll('assets asset');
    for (const asset of assets) {
      const offsetParam = asset.querySelector(`param[key="offset"]`);
      const value = offsetParam?.getAttribute('value');
      const name = asset.getAttribute('name');

      if (name == null || value == null) continue;

      const offsets = value.split(',');

      const data: ManifestAsset = {
        name,
        x: Number(offsets[0]),
        y: Number(offsets[1]),
        flipH: false,
        flipV: false,
      };

      this.assets.push(data);
      this.assetByName.set(name, data);
    }

    const aliases = this.querySelectorAll('aliases alias');
    for (const alias of aliases) {
      const name = alias.getAttribute('name');
      const link = alias.getAttribute('link');
      if (name == null || link == null) continue;

      this.aliases.push({
        name,
        link,
        flipH: alias.getAttribute('fliph') === '1',
        flipV: alias.getAttribute('flipv') === '1',
      });
    }
  }
}
