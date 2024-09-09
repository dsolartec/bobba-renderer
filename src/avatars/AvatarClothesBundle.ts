import BobbaAssetBundle from '../BobbaAssetBundle';
import HitTexture from '../hitdetection/HitTexture';
import type { IManifestLibrary } from './AvatarAssetLibraryCollection';
import ManifestData from './data/ManifestData';

export default class AvatarClothesBundle implements IManifestLibrary {
  private textures: Map<string, HitTexture>;

  constructor(
    private readonly bundle: BobbaAssetBundle,
    private readonly manifest: ManifestData
  ) {
    this.textures = new Map();
  }

  static async fromAssetBundle(
    bundle: BobbaAssetBundle
  ): Promise<AvatarClothesBundle> {
    return new AvatarClothesBundle(
      bundle,
      new ManifestData(await bundle.getString('manifest.bin'))
    );
  }

  getManifest(): ManifestData {
    return this.manifest;
  }

  async getTexture(name: string): Promise<HitTexture> {
    const cache = this.textures.get(name);
    if (cache != null) return cache;

    const texture = await HitTexture.fromBlob(
      await this.bundle.getBlob(`${name}.png`)
    );

    this.textures.set(name, texture);

    return texture;
  }
}
