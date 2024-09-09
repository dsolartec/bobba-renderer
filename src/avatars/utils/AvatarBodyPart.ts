import BobbaRenderer from '../../BobbaRenderer';
import type { AvatarActionInfo } from '../data/ActionsData';
import type { BodyPart } from '../data/GeometryData';
import type AvatarPart from './AvatarPart';

export default class AvatarBodyPart {
  constructor(
    private readonly bobbaRenderer: BobbaRenderer,
    private bodyPart: BodyPart,
    private parts: AvatarPart[]
  ) {}

  getID(): string {
    return this.bodyPart.id;
  }

  getZ(): number {
    return this.bodyPart.z;
  }

  getSortedParts(geometry: string): AvatarPart[] {
    return this.parts
      .map((part) => {
        const item = this.bobbaRenderer
          .getAvatarsManager()
          .getGeometryData()
          .getBodyPartItem(geometry, this.bodyPart.id, part.getType());

        if (item == null) return null;
        return { part, item };
      })
      .filter((part) => part != null)
      .sort((a, b) => a.item.radius - b.item.radius)
      .map((item) => item.part);
  }

  setActiveAction(action: AvatarActionInfo): void {
    if (action.activePartSet == null) return;

    const activePart = this.bobbaRenderer
      .getAvatarsManager()
      .getPartSetsData()
      .getActivePartSet(action.activePartSet);

    this.parts.forEach((part) => {
      if (!activePart.has(part.getType())) return;
      part.setActiveAction(action);
    });
  }

  setDirection(direction: number): void {
    this.parts.forEach((part) => part.setDirection(direction));
  }
}
