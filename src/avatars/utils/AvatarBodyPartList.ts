import BobbaRenderer from '../../BobbaRenderer';
import type { AvatarActionInfo } from '../data/ActionsData';
import AvatarBodyPart from './AvatarBodyPart';
import type AvatarPartList from './AvatarPartList';

export default class AvatarBodyPartList {
  private bodyParts: AvatarBodyPart[];
  private bodyPartsByID: Map<string, AvatarBodyPart>;

  constructor(
    bobbaRenderer: BobbaRenderer,
    partList: AvatarPartList,
    hasItem: boolean
  ) {
    const geometryData = bobbaRenderer.getAvatarsManager().getGeometryData();

    const bodyPartIDs = [...geometryData.getBodyParts('full')];
    if (hasItem) bodyPartIDs.push('rightitem');

    this.bodyParts = bodyPartIDs
      .map((id) => geometryData.getBodyPart('vertical', id))
      .filter((bodyPart) => bodyPart != null)
      .map(
        (bodyPart) =>
          new AvatarBodyPart(
            bobbaRenderer,
            bodyPart,
            partList.getPartsForBodyPart(bodyPart)
          )
      )
      .sort((a, b) => a.getZ() - b.getZ());

    this.bodyPartsByID = new Map();
    this.bodyParts.forEach((bodyPart) =>
      this.bodyPartsByID.set(bodyPart.getID(), bodyPart)
    );
  }

  getBodyPartByID(id: string): AvatarBodyPart | null {
    return this.bodyPartsByID.get(id) ?? null;
  }

  applyActions(actions: AvatarActionInfo[]): void {
    actions.forEach((action) =>
      this.bodyParts.forEach((bodyPart) => bodyPart.setActiveAction(action))
    );
  }

  setBodyPartDirection(direction: number, headDirection: number): void {
    this.bodyParts.forEach((bodyPart) => {
      if (bodyPart.getID() === 'head') bodyPart.setDirection(headDirection);
      else bodyPart.setDirection(direction);
    });
  }
}
