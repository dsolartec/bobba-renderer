import type IRoomPosition from '../interfaces/IRoomPosition';
import RoomObject from './RoomObject';
import RoomVisualization from '../RoomVisualization';
import TileMap from '../tiles/TileMap';
import BaseAvatar from '../../avatars/BaseAvatar';
import ObjectAnimation from './ObjectAnimation';
import type IAvatarLookOptions from '../../avatars/interfaces/IAvatarLookOptions';
import { AvatarAction } from '../../avatars/interfaces/IAvatarLookOptions';
import type ObjectAttachment from './ObjectAttachment';
import BobbaRenderer from '../../BobbaRenderer';

interface WalkObjectAnimationData {
  type: 'walk';
  direction: number;
  headDirection: number;
}

interface MoveObjectAnimationData {
  type: 'move';
}

type AvatarAnimationData = WalkObjectAnimationData | MoveObjectAnimationData;

export interface AvatarOptions {
  direction: number;
  headDirection?: number;
  look: string;
  roomPosition: IRoomPosition;
}

export default class Avatar extends RoomObject {
  private loaded: boolean;
  private roomPosition: IRoomPosition;
  private look: string;
  private direction: number;
  private headDirection: number;

  private animation: ObjectAnimation<AvatarAnimationData> | null;
  private animationPosition: IRoomPosition;
  private walking: boolean;
  private moving: boolean;

  private cancelAnimation: (() => void) | null;
  private frame: number;

  private placeholderAvatar: BaseAvatar | null;
  private loadingAvatar: BaseAvatar;
  private avatar: BaseAvatar;

  private attachedContainers: ObjectAttachment[];

  constructor(
    private readonly bobbaRenderer: BobbaRenderer,
    options: AvatarOptions
  ) {
    super();

    this.loaded = false;

    this.direction = options.direction;
    this.headDirection = options.headDirection ?? options.direction;
    this.look = options.look;
    this.roomPosition = options.roomPosition;

    this.animation = null;
    this.animationPosition = { roomX: 0, roomY: 0, roomZ: 0 };
    this.walking = false;
    this.moving = false;

    this.cancelAnimation = null;
    this.frame = 0;

    this.placeholderAvatar = new BaseAvatar(
      this.bobbaRenderer,
      {
        actions: [],
        look: 'hd-99999-99999',
        direction: this.direction,
        headDirection: this.headDirection,
      },
      () => this.updateAvatar()
    );

    this.placeholderAvatar.alpha = 0.5;

    this.loadingAvatar = new BaseAvatar(
      this.bobbaRenderer,
      this.getCurrentLookOptions(),
      () => {
        this.loaded = true;
        this.updateAvatar();
      }
    );

    this.avatar = this.placeholderAvatar;
    this.attachedContainers = [];
  }

  move(to: IRoomPosition): void {
    this.animation?.move(this.roomPosition, to, { type: 'move' });
    this.roomPosition = to;
  }

  walk(
    to: IRoomPosition,
    {
      direction,
      headDirection,
    }: Pick<WalkObjectAnimationData, 'direction' | 'headDirection'>
  ): void {
    this.animation?.move(this.roomPosition, to, {
      type: 'walk',
      direction,
      headDirection,
    });

    this.roomPosition = to;
  }

  private startWalking(
    options: Pick<WalkObjectAnimationData, 'direction' | 'headDirection'>
  ): void {
    this.walking = true;

    this.direction = options.direction;
    this.headDirection = options.headDirection;

    this.updateAvatar();
  }

  private stopWalking(): void {
    this.walking = false;
    this.updateAvatar();
  }

  private updateAttachmentPosition(attachment: ObjectAttachment): void {
    attachment.setOffsets({
      x: this.getRoom().x + this.getRoom().getRoomVisualization().x,
      y: this.getRoom().y + this.getRoom().getRoomVisualization().y,
    });

    attachment.x = ~~(
      this.avatar.x -
      (-this.avatar.width + 3 + attachment.width / 2)
    );
    attachment.y = ~~(
      this.avatar.y -
      (this.avatar.height - 14 + attachment.height)
    );
    attachment.zIndex = this.avatar.zIndex * 500_000;
  }

  private updateAttachmentsPosition(): void {
    const primaryLayer = this.getRoom()
      .getRoomVisualization()
      .getPrimaryLayer();

    this.attachedContainers.forEach((attachment) => {
      if (primaryLayer.children.indexOf(attachment) === -1) {
        attachment.onUpdateSize = () =>
          this.updateAttachmentPosition(attachment);

        primaryLayer.addChild(attachment);
      }

      this.updateAttachmentPosition(attachment);
    });
  }

  onRoomCameraMove(): void {
    this.updateAttachmentsPosition();
  }

  initialize(): void {
    this.updateAvatar();

    this.animation = new ObjectAnimation(
      this.bobbaRenderer,
      (data) => {
        if (data.type === 'walk') {
          this.startWalking(data);
          this.moving = false;
          return;
        }

        this.stopWalking();
        this.moving = true;
      },
      (position) => {
        this.animationPosition = position;
        this.updatePosition();
      },
      () => {
        this.stopWalking();
        this.moving = false;
      }
    );
  }

  dispose(): void {
    this.avatar.destroy();
    this.animation?.destroy();
    this.cancelAnimation && this.cancelAnimation();
  }

  private updatePosition(): void {
    const position =
      this.walking || this.moving ? this.animationPosition : this.roomPosition;

    const { x, y } = TileMap.getPosition(position);

    this.avatar.x = Math.round(x);
    this.avatar.y = Math.round(y);
    this.avatar.zIndex = RoomVisualization.getZOrder(position) * 1000;
    this.avatar.setSpritesZIndex(this.avatar.zIndex);

    this.getRoom()
      .getRoomVisualization()
      .getPrimaryLayer()
      .addChild(this.avatar);

    this.updateAttachmentsPosition();
  }

  private startAnimation(): void {
    if (this.cancelAnimation != null) return;

    this.frame = 0;

    const start = this.bobbaRenderer.getCurrentTickerFrame();

    this.cancelAnimation = this.bobbaRenderer.subscribeToTicker((value) => {
      this.frame = value - start;
      this.avatar.setCurrentFrame(this.frame);
    });
  }

  private stopAnimation(): void {
    this.frame = 0;

    if (this.cancelAnimation != null) {
      this.cancelAnimation();
      this.cancelAnimation = null;
    }
  }

  private getCurrentLookOptions(): IAvatarLookOptions {
    const actions: AvatarAction[] = [];

    if (this.walking) actions.push(AvatarAction.Move);

    return {
      actions,
      look: this.look,
      direction: this.direction,
      headDirection: this.headDirection,
    };
  }

  private updateAvatar(): void {
    if (this.loaded) {
      if (this.placeholderAvatar != null) this.placeholderAvatar.destroy();

      this.placeholderAvatar = null;
      this.avatar = this.loadingAvatar;
    } else if (this.placeholderAvatar != null) {
      this.avatar = this.placeholderAvatar;
    }

    if (this.walking) this.startAnimation();
    else this.stopAnimation();

    this.avatar.setNextLook(this.getCurrentLookOptions());

    this.updatePosition();
  }
}
