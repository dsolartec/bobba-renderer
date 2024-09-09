import { PointData } from 'pixi.js';
import type { AvatarActionInfo } from '../data/ActionsData';
import type { AvatarAnimationFrame } from '../data/AnimationData';
import { AvatarFigurePartType } from './AvatarPart';
import BobbaRenderer from '../../BobbaRenderer';

interface FlippedMetaData {
  direction: number;
  flip: boolean;
  partType: AvatarFigurePartType;
  swapped: boolean;
}

export default class AvatarAsset {
  constructor(
    private readonly fileID: string,
    private readonly position: PointData,
    private readonly mirror: boolean,
    private readonly library: string = '',
    private readonly substractWidth: boolean | null = null
  ) {}

  getFileID(): string {
    return this.fileID;
  }

  getX(): number {
    return this.position.x;
  }

  getY(): number {
    return this.position.y;
  }

  isMirror(): boolean {
    return this.mirror;
  }

  private static isDirectionFlipped(direction: number): boolean {
    return [false, false, false, false, true, true, true, false][direction];
  }

  private static getBasicFlippedMetaData(
    direction: number
  ): Pick<FlippedMetaData, 'direction' | 'flip'> {
    switch (direction) {
      case 4:
        return { direction: 2, flip: true };
      case 5:
        return { direction: 1, flip: true };
      case 6:
        return { direction: 0, flip: true };
      default:
        return { direction, flip: false };
    }
  }

  private static getFlippedMetaData(
    assetPartDefinition: string,
    direction: number,
    partType: AvatarFigurePartType,
    flippedPartType: AvatarFigurePartType | null = null
  ): FlippedMetaData {
    if (!this.isDirectionFlipped(direction)) {
      return { direction, partType, flip: false, swapped: false };
    }

    if (
      assetPartDefinition === 'wav' &&
      (partType == AvatarFigurePartType.LeftHand ||
        partType == AvatarFigurePartType.LeftSleeve ||
        partType == AvatarFigurePartType.LeftCoatSleeve)
    )
      return { direction, partType, flip: true, swapped: false };

    if (
      assetPartDefinition == 'drk' &&
      (partType == AvatarFigurePartType.RightHand ||
        partType == AvatarFigurePartType.RightSleeve ||
        partType == AvatarFigurePartType.RightCoatSleeve)
    )
      return { direction, partType, flip: true, swapped: false };

    if (
      assetPartDefinition == 'blw' &&
      partType == AvatarFigurePartType.RightHand
    )
      return { direction, partType, flip: true, swapped: false };

    if (
      assetPartDefinition == 'sig' &&
      partType == AvatarFigurePartType.LeftHand
    )
      return { direction, partType, flip: true, swapped: false };

    if (
      assetPartDefinition == 'respect' &&
      partType == AvatarFigurePartType.LeftHand
    )
      return { direction, partType, flip: true, swapped: false };

    if (partType == AvatarFigurePartType.RightHandItem) {
      return { direction, partType, flip: true, swapped: false };
    }

    if (partType == AvatarFigurePartType.LeftHandItem) {
      return { direction, partType, flip: true, swapped: false };
    }

    if (partType == AvatarFigurePartType.ChestPrint) {
      return { direction, partType, flip: true, swapped: false };
    }

    const override = this.getBasicFlippedMetaData(direction);
    if (flippedPartType != partType) {
      return {
        direction: override.direction,
        partType: flippedPartType ?? partType,
        flip: override.flip,
        swapped: true,
      };
    }

    return {
      direction: override.direction,
      partType,
      flip: override.flip,
      swapped: false,
    };
  }

  private static generateAssetName(
    assetPartDefinition: string,
    partType: string,
    partID: number,
    direction: number,
    frame: number
  ): string {
    return `h_${assetPartDefinition}_${partType}_${partID}_${direction}_${frame}`;
  }

  private static applyOffsets(
    offsets: PointData,
    customOffsets: PointData,
    flipped: boolean,
    lay: boolean
  ): PointData {
    let x = -offsets.x - customOffsets.x;
    let y = -offsets.y - customOffsets.y + 16;

    if (flipped) x = 64 - x;
    if (lay) x = flipped ? x - 52 : x + 52;

    return { x, y };
  }

  static forFrame(
    bobbaRenderer: BobbaRenderer,
    actionData: AvatarActionInfo,
    direction: number,
    partID: number,
    partType: AvatarFigurePartType,
    animationFrame: AvatarAnimationFrame | null = null,
    flippedPartType: AvatarFigurePartType | null = null,
    customOffset: PointData = { x: 0, y: 0 }
  ): AvatarAsset | null {
    let assetPartDefinition = actionData.assetPartDefinition;

    let frameNumber: number = 0;
    if (animationFrame != null) {
      frameNumber = animationFrame.number;

      if (
        animationFrame.assetPartDefinition &&
        animationFrame.assetPartDefinition.length > 0
      )
        assetPartDefinition = animationFrame.assetPartDefinition;
    }

    const flipped = this.getFlippedMetaData(
      assetPartDefinition,
      direction,
      partType,
      flippedPartType
    );

    let assetID = this.generateAssetName(
      assetPartDefinition,
      flipped.partType,
      partID,
      flipped.direction,
      frameNumber
    );

    const assetLibraryCollection = bobbaRenderer
      .getAvatarsManager()
      .getAssetLibraryCollection();

    let offset = assetLibraryCollection.getOffsets(assetID);
    if (offset == null) {
      assetID = this.generateAssetName(
        'std',
        flipped.partType,
        partID,
        flipped.direction,
        0
      );

      offset = assetLibraryCollection.getOffsets(assetID);
    }

    if (offset == null) return null;

    const newOffsets = this.applyOffsets(
      offset,
      customOffset,
      flipped.flip,
      assetPartDefinition === 'lay'
    );

    if (isNaN(newOffsets.x)) throw new Error('Invalid x offset');
    if (isNaN(newOffsets.y)) throw new Error('Invalid y offset');

    return new AvatarAsset(assetID, newOffsets, flipped.flip);
  }
}
