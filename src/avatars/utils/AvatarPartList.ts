import BobbaRenderer from '../../BobbaRenderer';
import type { FigureDataSet } from '../data/FigureData';
import type { BodyPart } from '../data/GeometryData';
import type { ParsedLook } from '../interfaces/IAvatarLookOptions';
import AvatarPart, { AvatarFigurePartType } from './AvatarPart';

const BASE_PART_SET = new Set<AvatarFigurePartType>([
  AvatarFigurePartType.LeftHand,
  AvatarFigurePartType.RightHand,
  AvatarFigurePartType.Body,
  AvatarFigurePartType.Head,
]);

export default class AvatarPartList {
  constructor(
    private partsByType: Map<AvatarFigurePartType, AvatarPart[]>,
    private hiddenLayers: Set<string>
  ) {}

  static fromLook(
    bobbaRenderer: BobbaRenderer,
    look: ParsedLook
  ): AvatarPartList {
    const figureData = bobbaRenderer.getAvatarsManager().getFigureData();

    const partsByType: Map<AvatarFigurePartType, AvatarPart[]> = new Map();
    const hiddenLayers: Set<string> = new Set();

    function registerPart(avatarPart: AvatarPart): void {
      const type = avatarPart.getType();

      const current = partsByType.get(type) ?? [];
      partsByType.set(type, [...current, avatarPart]);
    }

    look.forEach(({ setID, colorIDs }, setType) => {
      figureData
        .getHiddenLayers(setType, setID)
        .forEach((layer) => hiddenLayers.add(layer));

      const parts = figureData.getParts(setType, setID);
      if (parts.length === 0) return;

      const colors = colorIDs
        .map((colorID) => figureData.getColor(setType, colorID))
        .filter((e) => e != null);

      parts.forEach((part) =>
        registerPart(
          new AvatarPart(bobbaRenderer, part, colors[part.index] ?? colors[0])
        )
      );
    });

    BASE_PART_SET.forEach((partType) => {
      const partsForType = partsByType.get(partType) ?? [];
      if (partsForType.length > 0) return;

      registerPart(
        new AvatarPart(bobbaRenderer, {
          colorable: false,
          colorIndex: 0,
          id: 1,
          index: 0,
          type: partType,
        })
      );
    });

    return new AvatarPartList(partsByType, hiddenLayers);
  }

  static fromSet(
    bobbaRenderer: BobbaRenderer,
    set: FigureDataSet,
    colors: number[]
  ): AvatarPartList {
    const partsByType: Map<AvatarFigurePartType, AvatarPart[]> = new Map();

    function registerPart(avatarPart: AvatarPart): void {
      const type = avatarPart.getType();

      const current = partsByType.get(type) ?? [];
      partsByType.set(type, [...current, avatarPart]);
    }

    set.parts.forEach((part) =>
      registerPart(
        new AvatarPart(bobbaRenderer, part, colors[part.index] ?? colors[0])
      )
    );

    return new AvatarPartList(partsByType, set.hiddenLayers);
  }

  getParts(): AvatarPart[] {
    return Array.from(this.partsByType.values()).flatMap((part) => part);
  }

  getPartsForBodyPart(bodyPart: BodyPart): AvatarPart[] {
    return bodyPart.items
      .flatMap(
        (bodyPartItem) =>
          this.partsByType.get(bodyPartItem.id as AvatarFigurePartType) ?? []
      )
      .filter((part) => !this.hiddenLayers.has(part.getType()));
  }
}
