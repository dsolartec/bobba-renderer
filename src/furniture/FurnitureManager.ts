import BobbaAssetBundle from '../BobbaAssetBundle';
import BobbaRenderer from '../BobbaRenderer';
import FurnitureData, {
  type FurniInfo,
  type FurniPlacement,
} from './data/FurnitureData';
import FurniBundle from './FurniBundle';
import FurniDrawDefinition from './FurniDrawDefinition';

export default class FurnitureManager {
  private furnitureData: FurnitureData | null;

  private furnisCache: Map<string, FurniBundle>;

  constructor(private readonly bobbaRenderer: BobbaRenderer) {
    this.furnitureData = null;

    this.furnisCache = new Map();
  }

  getFurnitureData(): FurnitureData {
    if (this.furnitureData == null)
      throw new Error("FurnitureManager isn't initialized");
    return this.furnitureData;
  }

  async initialize(): Promise<void> {
    this.furnitureData = await FurnitureData.fromUrl(
      `${this.bobbaRenderer.getResourcesURL()}/furnidata.xml`
    );
  }

  private async loadFurniBundle({
    name,
    revision,
  }: FurniInfo): Promise<FurniBundle> {
    return await FurniBundle.fromAssetBundle(
      this.bobbaRenderer,
      await BobbaAssetBundle.fromUrl(
        `${this.bobbaRenderer.getResourcesURL()}/hof_furni/${revision}/${name.split('*')[0]}.furni`
      )
    );
  }

  private async loadFurniBundleFromCache(
    info: FurniInfo
  ): Promise<FurniBundle> {
    const cache = this.furnisCache.get(info.name);
    if (cache != null) return cache;

    const furni = await this.loadFurniBundle(info);
    this.furnisCache.set(info.name, furni);

    return furni;
  }

  async getFurniBundleByName(
    name: string,
    placement: FurniPlacement
  ): Promise<FurniBundle> {
    const info = this.getFurnitureData().getFurniInfoByName(name, placement);
    if (info == null) throw new Error("Couldn't find furniture.");

    return await this.loadFurniBundleFromCache(info);
  }

  async loadFurni(
    name: string,
    placement: FurniPlacement
  ): Promise<FurniDrawDefinition> {
    const info = this.getFurnitureData().getFurniInfoByName(name, placement);
    if (info == null) throw new Error("Couldn't find furniture.");

    const bundle = await this.loadFurniBundleFromCache(info);

    return new FurniDrawDefinition(info, bundle);
  }
}
