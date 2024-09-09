import BobbaRenderer from '../../BobbaRenderer';
import type { AvatarActionInfo } from '../data/ActionsData';
import type { FigureDataPart } from '../data/FigureData';
import AvatarAsset from './AvatarAsset';
import type { DefaultAvatarDrawPart } from './AvatarDrawDefinition';
import getAvatarDirection from './getAvatarDirection';

export enum AvatarFigurePartType {
  Body = 'bd',
  Shoes = 'sh',
  Legs = 'lg',
  Chest = 'ch',
  WaistAccessory = 'wa',
  ChestAccessory = 'ca',
  Head = 'hd',
  Hair = 'hr',
  FaceAccessory = 'fa',
  EyeAccessory = 'ea',
  HeadAccessory = 'ha',
  HeadAccessoryExtra = 'he',
  CoatChest = 'cc',
  ChestPrint = 'cp',
  LeftHandItem = 'li',
  LeftHand = 'lh',
  LeftSleeve = 'ls',
  RightHand = 'rh',
  RightSleeve = 'rs',
  Face = 'fc',
  Eyes = 'ey',
  HairBig = 'hrb',
  RightHandItem = 'ri',
  LeftCoatSleeve = 'lc',
  RightCoatSleeve = 'rc',
}

export default class AvatarPart {
  private assets: AvatarAsset[];

  private action: AvatarActionInfo | null;
  private direction: number | null;
  private frameRepeat: number;

  constructor(
    private readonly bobbaRenderer: BobbaRenderer,
    private readonly figureDataPart: FigureDataPart,
    private readonly color: number | null = null
  ) {
    this.assets = [];

    this.action = null;
    this.direction = null;
    this.frameRepeat = 1;
  }

  getType(): AvatarFigurePartType {
    return this.figureDataPart.type as AvatarFigurePartType;
  }

  getDirection(): number | null {
    if (this.direction == null) return null;
    return getAvatarDirection(this.direction);
  }

  getDrawDefinition(): DefaultAvatarDrawPart | null {
    this.update();

    if (this.assets.length === 0) return null;

    return {
      assets: this.assets.flatMap((asset) =>
        new Array(this.frameRepeat).fill(asset)
      ),
      color: this.figureDataPart.colorable ? this.color : null,
      index: this.figureDataPart.index,
      kind: 'AVATAR_DRAW_PART',
      mode:
        this.figureDataPart.type !== 'ey' && this.figureDataPart.colorable
          ? 'colored'
          : 'just-image',
      type: this.figureDataPart.type,
      z: 0,
    };
  }

  setActiveAction(action: AvatarActionInfo): void {
    this.action = action;
  }

  setDirection(direction: number): void {
    this.direction = getAvatarDirection(direction);
  }

  private update(): void {
    this.assets = [];

    const avatarsManager = this.bobbaRenderer.getAvatarsManager();
    const partInfo = avatarsManager
      .getPartSetsData()
      .getPartInfo(this.getType());

    const direction = this.getDirection();
    if (this.action == null || direction == null) return;

    const frames = avatarsManager
      .getAnimationData()
      .getAnimationFrames(this.action.id, this.getType());

    let framesIndexed = frames.flatMap((frame) =>
      new Array(frame.repeats).fill(frame)
    );
    if (framesIndexed.length === 0) framesIndexed = [null];

    for (const frame of framesIndexed) {
      const asset = AvatarAsset.forFrame(
        this.bobbaRenderer,
        this.action,
        direction,
        this.figureDataPart.id,
        this.figureDataPart.type as AvatarFigurePartType,
        frame,
        partInfo?.flippedSetType != null
          ? (partInfo.flippedSetType as AvatarFigurePartType)
          : null
      );

      if (asset == null) continue;

      this.assets.push(asset);
    }
  }
}
