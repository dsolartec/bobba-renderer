import BobbaAssetBundle from '../BobbaAssetBundle';
import BobbaRenderer from '../BobbaRenderer';
import AvatarAssetLibraryCollection from './AvatarAssetLibraryCollection';
import AvatarClothesBundle from './AvatarClothesBundle';
import AvatarEffectBundle from './AvatarEffectBundle';
import ActionsData from './data/ActionsData';
import AnimationData from './data/AnimationData';
import EffectMapData from './data/EffectMapData';
import FigureData from './data/FigureData';
import FigureMapData from './data/FigureMapData';
import GeometryData from './data/GeometryData';
import PartSetsData from './data/PartSetsData';
import type IAvatarLookOptions from './interfaces/IAvatarLookOptions';
import { AvatarAction, type ParsedLook } from './interfaces/IAvatarLookOptions';
import AvatarDrawDefinition from './utils/AvatarDrawDefinition';

export default class AvatarsManager {
  private actionsData: ActionsData | null;
  private animationData: AnimationData | null;
  private assetLibraryCollection: AvatarAssetLibraryCollection;
  private effectMapData: EffectMapData | null;
  private figureData: FigureData | null;
  private figureMapData: FigureMapData | null;
  private geometryData: GeometryData | null;
  private partSetsData: PartSetsData | null;

  private drawDefinitionsCache: Map<string, AvatarDrawDefinition>;
  private effectCache: Map<string, AvatarEffectBundle>;
  private clothesCache: Map<string, AvatarClothesBundle>;

  constructor(private readonly bobbaRenderer: BobbaRenderer) {
    this.actionsData = null;
    this.animationData = null;
    this.assetLibraryCollection = new AvatarAssetLibraryCollection();
    this.effectMapData = null;
    this.figureData = null;
    this.figureMapData = null;
    this.geometryData = null;
    this.partSetsData = null;

    this.drawDefinitionsCache = new Map();
    this.effectCache = new Map();
    this.clothesCache = new Map();
  }

  private getResourcesPath(): string {
    return this.bobbaRenderer.getResourcesURL();
  }

  getActionsData(): ActionsData {
    if (this.actionsData == null)
      throw new Error("AvatarsManager isn't initialized");
    return this.actionsData;
  }

  getAnimationData(): AnimationData {
    if (this.animationData == null)
      throw new Error("AvatarsManager isn't initialized");
    return this.animationData;
  }

  getAssetLibraryCollection(): AvatarAssetLibraryCollection {
    return this.assetLibraryCollection;
  }

  getEffectMapData(): EffectMapData {
    if (this.effectMapData == null)
      throw new Error("AvatarsManager isn't initialized");
    return this.effectMapData;
  }

  getFigureData(): FigureData {
    if (this.figureData == null)
      throw new Error("AvatarsManager isn't initialized");
    return this.figureData;
  }

  getFigureMapData(): FigureMapData {
    if (this.figureMapData == null)
      throw new Error("AvatarsManager isn't initialized");
    return this.figureMapData;
  }

  getGeometryData(): GeometryData {
    if (this.geometryData == null)
      throw new Error("AvatarsManager isn't initialized");
    return this.geometryData;
  }

  getPartSetsData(): PartSetsData {
    if (this.partSetsData == null)
      throw new Error("AvatarsManager isn't initialized");
    return this.partSetsData;
  }

  async initialize(): Promise<void> {
    const resourcePath = this.getResourcesPath();

    this.actionsData = await ActionsData.fromUrl(
      `${resourcePath}/AvatarActionsData.xml`
    );
    this.animationData = await AnimationData.fromUrl(
      `${resourcePath}/AvatarAnimationData.xml`
    );
    this.effectMapData = await EffectMapData.fromUrl(
      `${resourcePath}/effectmap.xml`
    );
    this.figureData = await FigureData.fromUrl(
      `${resourcePath}/figuredata.xml`
    );
    this.figureMapData = await FigureMapData.fromUrl(
      `${resourcePath}/figuremap.xml`
    );
    this.geometryData = await GeometryData.fromUrl(
      `${resourcePath}/AvatarGeometryData.xml`
    );
    this.partSetsData = await PartSetsData.fromUrl(
      `${resourcePath}/AvatarPartSetsData.xml`
    );

    // Load default placeholder look
    await this.getDrawDefinition({
      actions: [],
      look: 'hd-99999-99999',
      direction: 0,
      headDirection: 0,
    });
  }

  private async loadEffect(effectID: string): Promise<AvatarEffectBundle> {
    const effect = this.getEffectMapData().getEffectInfo(effectID);
    if (effect == null) throw new Error('Effect id invalid');

    return await AvatarEffectBundle.fromAssetBundle(
      await BobbaAssetBundle.fromUrl(
        `${this.getResourcesPath()}/effects/${effect.lib}.figure`
      )
    );
  }

  private async loadEffectFromCache(
    effectID: string
  ): Promise<AvatarEffectBundle> {
    const cache = this.effectCache.get(effectID);
    if (cache != null) return cache;

    const effect = await this.loadEffect(effectID);
    this.effectCache.set(effectID, effect);

    return effect;
  }

  async loadClothesFromCache(
    clothesName: string
  ): Promise<AvatarClothesBundle> {
    const cache = this.clothesCache.get(clothesName);
    if (cache != null) return cache;

    const clothes = await AvatarClothesBundle.fromAssetBundle(
      await BobbaAssetBundle.fromUrl(
        `${this.getResourcesPath()}/clothes/${clothesName}.figure`
      )
    );

    this.clothesCache.set(clothesName, clothes);

    return clothes;
  }

  private parseLook(look: string): ParsedLook {
    const parsedLook: ParsedLook = new Map();

    for (const str of look.split('.')) {
      const partData = str.split('-');

      const setType = partData.shift() ?? null;
      if (setType == null) continue;

      parsedLook.set(setType, {
        setID: Number(partData.shift()),
        colorIDs: partData.map(Number),
      });
    }

    return parsedLook;
  }

  private getLibrariesForLook(look: ParsedLook): Set<string> {
    const libraries = new Set<string>();
    libraries.add('hh_human_face');
    libraries.add('hh_human_item');
    libraries.add('hh_human_body');

    const figureParts = Array.from(look).flatMap(([setType, { setID }]) =>
      this.getFigureData()
        .getParts(setType, setID)
        .map((part) => ({ ...part, setID, setType }))
    );

    for (const part of figureParts) {
      let libraryID = this.getFigureMapData().getLibraryOfPart(
        part.id,
        part.type
      );
      if (libraryID == null) continue;

      const checkParts = this.getFigureData().getParts(
        part.setType,
        part.setID
      );
      for (const checkPart of checkParts) {
        libraryID = this.getFigureMapData().getLibraryOfPart(
          checkPart.id,
          checkPart.type
        );
        if (libraryID != null) break;
      }

      if (libraryID != null) libraries.add(libraryID);
    }

    return libraries;
  }

  private getLookOptionsKey({
    actions,
    direction,
    headDirection,
    item,
    look,
    effect,
  }: IAvatarLookOptions): string {
    const parts: string[] = [];

    if (actions.length > 0) {
      const actionString = Array.from(new Set(actions))
        .map((action) => action)
        .join(',');
      parts.push(`actions(${actionString})`);
    }

    parts.push(`direction(${direction})`);
    parts.push(`head-direction(${headDirection})`);

    if (item != null) parts.push(`item(${item})`);
    if (look != null) parts.push(`look(${look})`);
    if (effect != null) parts.push(`effect(${effect})`);

    return parts.join(',');
  }

  async getDrawDefinition(
    options: IAvatarLookOptions
  ): Promise<AvatarDrawDefinition> {
    options.actions.push(AvatarAction.Default);

    const cacheKey = this.getLookOptionsKey(options);

    const cache = this.drawDefinitionsCache.get(cacheKey);
    if (cache != null) return cache;

    let effectBundle: AvatarEffectBundle | null = null;
    if (options.effect != null)
      effectBundle = await this.loadEffectFromCache(options.effect);
    if (effectBundle != null)
      this.getAssetLibraryCollection().open(effectBundle);

    const parsedLook = this.parseLook(options.look);

    const clothesBundles = await Promise.all(
      Array.from(this.getLibrariesForLook(parsedLook)).map((library) =>
        this.loadClothesFromCache(library)
      )
    );

    clothesBundles.map((bundle) =>
      this.getAssetLibraryCollection().open(bundle)
    );

    const drawDefinition = new AvatarDrawDefinition(
      this.bobbaRenderer,
      parsedLook,
      new Set(options.actions),
      options.direction,
      options.headDirection,
      options.item,
      effectBundle
    );

    await this.getAssetLibraryCollection().loadTextures(
      drawDefinition
        .getDrawDefinition()
        .flatMap((part) => part.assets)
        .map((asset) => asset.getFileID())
    );

    this.drawDefinitionsCache.set(cacheKey, drawDefinition);

    return drawDefinition;
  }
}
