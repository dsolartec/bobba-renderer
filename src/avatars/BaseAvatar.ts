import { Container, type DestroyOptions } from 'pixi.js';
import type IAvatarLookOptions from './interfaces/IAvatarLookOptions';
import HitSprite from '../hitdetection/HitSprite';
import type AvatarDrawDefinition from './utils/AvatarDrawDefinition';
import type { AvatarDrawPart } from './utils/AvatarDrawDefinition';
import type AvatarAsset from './utils/AvatarAsset';
import { AvatarAction } from './interfaces/IAvatarLookOptions';
import { AVATAR_GROUP } from '../events/EventTarget';
import BobbaRenderer from '../BobbaRenderer';

export default class BaseAvatar extends Container {
  private currentLook: IAvatarLookOptions | null;
  private nextLook: IAvatarLookOptions | null;

  private currentFrame: number;
  private spritesZIndex: number;

  private drawDefinition: AvatarDrawDefinition | null;
  private sprites: Map<string, HitSprite>;

  private needRefreshFrame: boolean;
  private needRefreshLook: boolean;
  private updateID: number;

  private cancelTicker: () => void;

  constructor(
    private readonly bobbaRenderer: BobbaRenderer,
    private readonly look: IAvatarLookOptions,
    private readonly onLoad: (() => void) | null = null
  ) {
    super();

    this.sortableChildren = true;

    this.currentFrame = 0;
    this.spritesZIndex = 0;

    this.currentLook = null;
    this.nextLook = look;

    this.drawDefinition = null;
    this.sprites = new Map();

    this.needRefreshFrame = false;
    this.needRefreshLook = false;
    this.updateID = 0;

    this.cancelTicker = this.bobbaRenderer.subscribeToTicker(() => {
      if (this.needRefreshLook) {
        this.needRefreshLook = false;
        this.reloadLook();
      }

      if (this.needRefreshFrame) {
        this.needRefreshFrame = false;
        this.updateFrame();
      }
    });

    this.reloadLook();
  }

  setNextLook(look: IAvatarLookOptions): void {
    const currentActions = new Set(this.currentLook?.actions ?? []).add(
      AvatarAction.Default
    );
    const newActions = new Set(look.actions).add(AvatarAction.Default);

    let equalActions = currentActions.size === newActions.size;
    if (equalActions) {
      for (const a of currentActions) {
        if (!newActions.has(a)) {
          equalActions = false;
          break;
        }
      }
    }

    if (
      this.currentLook == null ||
      !equalActions ||
      this.currentLook.look != look.look ||
      this.currentLook.item != look.item ||
      this.currentLook.effect != look.effect ||
      this.currentLook.direction != look.direction ||
      this.currentLook.headDirection != look.headDirection
    ) {
      this.nextLook = look;
      this.needRefreshLook = true;
    }
  }

  setCurrentFrame(frame: number): void {
    if (this.currentFrame === frame) return;

    this.currentFrame = frame;
    this.needRefreshFrame = true;
  }

  setSpritesZIndex(zIndex: number): void {
    this.spritesZIndex = zIndex;
    this.sprites.forEach((sprite) => {
      sprite.zIndex = this.spritesZIndex;
    });
  }

  private destroyAssets(): void {
    this.sprites.forEach((sprite) => sprite.destroy());
    this.sprites = new Map();
  }

  destroy(options?: DestroyOptions): void {
    super.destroy(options);
    this.destroyAssets();
    this.cancelTicker();
  }

  private createAsset(
    part: AvatarDrawPart,
    asset: AvatarAsset
  ): HitSprite | null {
    if (this.drawDefinition == null)
      throw new Error(
        "Can't create asset when avatar loader result not present"
      );

    const texture = this.bobbaRenderer
      .getAvatarsManager()
      .getAssetLibraryCollection()
      .getTexture(asset.getFileID());

    if (texture == null) return null;

    const sprite = new HitSprite(this.bobbaRenderer, {
      group: AVATAR_GROUP,
      texture,
    });

    sprite.tint = 0xffffff;

    if (
      part.kind === 'AVATAR_DRAW_PART' &&
      part.color != null &&
      part.mode == 'colored'
    )
      sprite.tint = part.color;

    if (this.look.tint != null) sprite.tint = this.look.tint;

    return sprite;
  }

  private updateSprites(): void {
    if (this.destroyed) throw new Error('BaseAvatar was already destroyed');
    if (this.currentLook == null || this.drawDefinition == null) return;

    this.sprites.forEach((sprite) => {
      sprite.visible = false;
    });

    this.removeChildren();

    this.drawDefinition.getDrawDefinition().forEach((part) => {
      if (part.kind === 'AVATAR_DRAW_PART') {
        const frame = this.currentFrame % part.assets.length;
        const asset = part.assets[frame];

        let sprite = this.sprites.get(asset.getFileID()) ?? null;
        if (sprite == null) sprite = this.createAsset(part, asset);
        if (sprite == null) return;

        sprite.x = asset.getX();
        sprite.y = asset.getY();
        sprite.visible = true;
        sprite.zIndex = this.spritesZIndex + part.z;

        sprite.setMirror(asset.isMirror());

        this.sprites.set(asset.getFileID(), sprite);
        this.addChild(sprite);
      }
    });
  }

  private updateFrame(): void {
    if (this.drawDefinition == null) return;

    this.updateSprites();
  }

  private reloadLook(): void {
    if (this.nextLook == null) return;

    const requestID = ++this.updateID;

    this.bobbaRenderer
      .getAvatarsManager()
      .getDrawDefinition(this.nextLook)
      .then((drawDefinition) => {
        if (this.destroyed || requestID !== this.updateID) return;

        this.currentLook = this.nextLook;
        this.nextLook = null;

        this.drawDefinition = drawDefinition;

        this.destroyAssets();
        this.updateSprites();

        this.onLoad && this.onLoad();
      });
  }
}
