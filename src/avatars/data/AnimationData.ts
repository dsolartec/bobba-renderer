import { PointData } from 'pixi.js';
import BaseData from '../../utils/BaseData';

export interface AvatarAnimationFrame {
  number: number;
  assetPartDefinition: string;
  repeats: number;
}

export default class AnimationData extends BaseData {
  private animationFrames: Map<string, AvatarAnimationFrame[]>;
  private animationFramesCount: Map<string, number>;
  private animationFramesOffsets: Map<string, PointData>;

  constructor(xml: string) {
    super(xml);

    this.animationFrames = new Map();
    this.animationFramesCount = new Map();
    this.animationFramesOffsets = new Map();

    this.setCacheData();
  }

  static async fromUrl(url: string): Promise<AnimationData> {
    const response = await fetch(url);
    const text = await response.text();

    return new AnimationData(text);
  }

  getAnimationFrames(id: string, type: string): AvatarAnimationFrame[] {
    return this.animationFrames.get(`${id}_${type}`) ?? [];
  }

  getAnimationFrame(
    id: string,
    type: string,
    frame: number
  ): AvatarAnimationFrame | null {
    const frames = this.getAnimationFrames(id, type);
    return frames[frame] ?? null;
  }

  getAnimationFramesCount(id: string): number {
    return this.animationFramesCount.get(id) ?? 0;
  }

  getAnimationOffset(
    id: string,
    frame: number,
    direction: number,
    geometryID: number
  ): PointData {
    return (
      this.animationFramesOffsets.get(
        `${id}_${frame}_${direction}_${geometryID}`
      ) ?? { x: 0, y: 0 }
    );
  }

  private getAnimationFrameFromElement(element: Element): AvatarAnimationFrame {
    const n = Number(element.getAttribute('number'));
    if (isNaN(n)) throw new Error('number was NaN');

    let repeats = 2;

    const repeatsString = element.getAttribute('repeats');
    if (repeatsString != null) {
      repeats = Number(repeatsString);
    }

    const assetPartDefinition = element.getAttribute('assetpartdefinition');
    if (assetPartDefinition == null)
      throw new Error('assetpartdefinition was null');

    return {
      number: n,
      assetPartDefinition,
      repeats,
    };
  }

  private getAnimationOffsetFromElement(element: Element): PointData {
    if (element == null) return { x: 0, y: 0 };

    const dx = Number(element.getAttribute('dx'));
    const dy = Number(element.getAttribute('dy'));

    if (isNaN(dx) || isNaN(dy)) return { x: 0, y: 0 };

    return { x: dx, y: dy };
  }

  private setCacheData(): void {
    this.querySelectorAll('action').forEach((action) => {
      const actionID = action.getAttribute('id');
      if (actionID == null) return;

      action.querySelectorAll('part').forEach((part) => {
        const setType = part.getAttribute('set-type');
        if (setType == null) return;

        this.animationFrames.set(
          `${actionID}_${setType}`,
          Array.from(part.querySelectorAll<Element>('frame')).map(
            this.getAnimationFrameFromElement
          )
        );
      });

      const partFrameCount = action.querySelectorAll(
        'part:first-child frame'
      ).length;
      const offsetsFrameCount = action.querySelectorAll('offsets frame').length;
      const frameCount = Math.max(partFrameCount, offsetsFrameCount);

      this.animationFramesCount.set(actionID, frameCount);

      action.querySelectorAll('offsets frame').forEach((frame) => {
        const frameID = frame.getAttribute('id');
        if (frameID == null) return;

        frame.querySelectorAll('directions direction').forEach((direction) => {
          const directionID = direction.getAttribute('id');
          if (directionID == null) return;

          direction.querySelectorAll(`bodypart`).forEach((bodyPart) => {
            const bodyPartID = bodyPart.getAttribute('id');
            if (bodyPartID == null) return;

            this.animationFramesOffsets.set(
              `${actionID}_${frameID}_${directionID}_${bodyPartID}`,
              this.getAnimationOffsetFromElement(bodyPart)
            );
          });
        });
      });
    });
  }
}
