import BobbaRenderer from '../../BobbaRenderer';
import type AvatarEffectBundle from '../AvatarEffectBundle';
import type { AvatarActionInfo } from '../data/ActionsData';
import type { ParsedLook } from '../interfaces/IAvatarLookOptions';
import type AvatarAsset from './AvatarAsset';
import AvatarBodyPartList from './AvatarBodyPartList';
import AvatarPartList from './AvatarPartList';
import getAvatarDirection from './getAvatarDirection';

export interface DefaultAvatarDrawPart {
  kind: 'AVATAR_DRAW_PART';
  type: string;
  index: number;
  mode: 'colored' | 'just-image';
  color: number | null;
  assets: AvatarAsset[];
  z: number;
}

interface AvatarEffectDrawPart {
  kind: 'EFFECT_DRAW_PART';
  assets: AvatarAsset[];
  z: number;
  ink: number | null;
  addition: boolean;
}

export type AvatarDrawPart = DefaultAvatarDrawPart | AvatarEffectDrawPart;

export default class AvatarDrawDefinition {
  private drawPartsCache: AvatarDrawPart[] | null;

  private activeActions: AvatarActionInfo[];
  private bodyParts: AvatarBodyPartList;

  constructor(
    bobbaRenderer: BobbaRenderer,
    look: ParsedLook,
    actions: Set<string>,
    private readonly direction: number,
    headDirection: number,
    private readonly item: string | number | null = null,
    private readonly effect: AvatarEffectBundle | null = null,
    private readonly frame: number = 0
  ) {
    this.drawPartsCache = null;

    const partList = AvatarPartList.fromLook(bobbaRenderer, look);

    this.activeActions = bobbaRenderer
      .getAvatarsManager()
      .getActionsData()
      .getActions()
      .filter((info) => actions.has(info.id))
      .sort((a, b) => {
        if (a.precedence < b.precedence) return 1;
        if (a.precedence > b.precedence) return -1;
        return 0;
      });

    this.bodyParts = new AvatarBodyPartList(
      bobbaRenderer,
      partList,
      item != null
    );
    this.bodyParts.applyActions(this.activeActions);
    this.bodyParts.setBodyPartDirection(direction, headDirection);
  }

  private getDrawOrderForActions(): 'std' | 'lh-up' | 'rh-up' {
    const activePartSets = new Set<string>();
    this.activeActions.forEach((info) => {
      if (info.activePartSet == null) return;
      activePartSets.add(info.activePartSet);
    });

    if (this.item != null) activePartSets.add('itemRight');

    if (activePartSets.has('handLeft')) return 'lh-up';

    if (
      activePartSets.has('handRightAndHead') ||
      activePartSets.has('handRight')
    )
      return 'rh-up';

    return 'std';
  }

  getDrawDefinition(): AvatarDrawPart[] {
    if (this.drawPartsCache != null) return this.drawPartsCache;

    const orderID = this.getDrawOrderForActions();
    const direction = getAvatarDirection(this.direction);

    const bodyPartsOrder: string[] = DRAW_ORDERS[orderID][direction] ?? [];

    const sortedParts = bodyPartsOrder
      .map((id) => this.bodyParts.getBodyPartByID(id))
      .filter((bodyPart) => bodyPart != null)
      .flatMap((bodyPart) => bodyPart.getSortedParts('vertical'));

    this.drawPartsCache = sortedParts
      .map((part) => part.getDrawDefinition())
      .filter((part) => part != null);

    return this.drawPartsCache;
  }
}

const DEFAULT_DRAW_ORDER: Record<number, string[]> = {
  0: [
    'behind',
    'bottom',
    'leftitem',
    'leftarm',
    'torso',
    'rightitem',
    'rightarm',
    'head',
    'top',
  ],
  1: [
    'behind',
    'bottom',
    'leftitem',
    'leftarm',
    'torso',
    'rightitem',
    'rightarm',
    'head',
    'top',
  ],
  2: [
    'behind',
    'bottom',
    'leftitem',
    'leftarm',
    'torso',
    'rightitem',
    'rightarm',
    'head',
    'top',
  ],
  3: [
    'behind',
    'bottom',
    'torso',
    'leftitem',
    'leftarm',
    'rightitem',
    'rightarm',
    'head',
    'top',
  ],
  4: [
    'behind',
    'bottom',
    'rightarm',
    'rightitem',
    'torso',
    'leftitem',
    'leftarm',
    'head',
    'top',
  ],
  5: [
    'behind',
    'bottom',
    'rightarm',
    'rightitem',
    'torso',
    'leftitem',
    'leftarm',
    'head',
    'top',
  ],
  6: [
    'bottom',
    'rightarm',
    'rightitem',
    'torso',
    'leftitem',
    'leftarm',
    'head',
    'behind',
    'top',
  ],
  7: [
    'bottom',
    'rightarm',
    'rightitem',
    'leftitem',
    'leftarm',
    'torso',
    'head',
    'behind',
    'top',
  ],
};

const RIGHT_HAND_ACTIVE_DRAW_ORDER: Record<number, string[]> = {
  ...DEFAULT_DRAW_ORDER,
  2: [
    'behind',
    'bottom',
    'leftitem',
    'leftarm',
    'torso',
    'head',
    'rightitem',
    'rightarm',
    'top',
  ],
  3: [
    'behind',
    'bottom',
    'leftitem',
    'leftarm',
    'torso',
    'head',
    'rightitem',
    'rightarm',
    'top',
  ],
  4: [
    'behind',
    'bottom',
    'rightarm',
    'torso',
    'leftitem',
    'leftarm',
    'head',
    'rightitem',
    'top',
  ],
};

const LEFT_HAND_ACTIVE_DRAW_ORDER: Record<number, string[]> = {
  ...DEFAULT_DRAW_ORDER,
  5: [
    'behind',
    'bottom',
    'rightarm',
    'rightitem',
    'torso',
    'head',
    'leftitem',
    'leftarm',
    'top',
  ],
  6: [
    'behind',
    'bottom',
    'rightarm',
    'rightitem',
    'torso',
    'head',
    'leftitem',
    'leftarm',
    'top',
  ],
};

const DRAW_ORDERS = {
  'rh-up': RIGHT_HAND_ACTIVE_DRAW_ORDER,
  'lh-up': LEFT_HAND_ACTIVE_DRAW_ORDER,
  std: DEFAULT_DRAW_ORDER,
};
