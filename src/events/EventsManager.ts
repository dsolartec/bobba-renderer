import RBush from 'rbush';
import EventNode from './EventNode';
import type { FederatedPointerEvent, PointData } from 'pixi.js';
import EventPropagation from './EventPropagation';
import type EventTarget from './EventTarget';
import { type IEventGroup } from './EventTarget';
import BobbaRenderer from '../BobbaRenderer';

export default class EventsManager {
  private nodes: Map<EventTarget, EventNode>;
  private bush: RBush<EventNode>;

  private pointerDownElements: Set<EventNode>;
  private overElements: Set<EventNode>;

  private stopPropagation: boolean;

  constructor(private readonly bobbaRenderer: BobbaRenderer) {
    this.nodes = new Map();
    this.bush = new RBush();

    this.pointerDownElements = new Set();
    this.overElements = new Set();

    this.stopPropagation = false;
  }

  getStopPropagation(): boolean {
    return this.stopPropagation;
  }

  setStopPropagation(value: boolean) {
    this.stopPropagation = value;
  }

  register(target: EventTarget): EventNode {
    if (this.nodes.has(target)) throw new Error('Target already registered');

    const node = new EventNode(target, this.bush);
    this.nodes.set(target, node);

    return node;
  }

  remove(target: EventTarget) {
    const node = this.nodes.get(target);
    if (node == null) return;

    node.destroy();
    this.nodes.delete(target);
  }

  initialize(): void {
    const app = this.bobbaRenderer.getApplication();

    // Enable interactivity and set canvas as an interactive area.
    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;

    // Event listeners
    app.stage.addEventListener('pointermove', this.onPointerMove.bind(this));
    app.stage.addEventListener('pointerdown', this.onPointerDown.bind(this));
    app.stage.addEventListener('pointerup', this.onPointerUp.bind(this));
  }

  private getHitElements({ x, y }: PointData) {
    const qualifyingElements = this.bush.search({
      minX: x,
      minY: y,
      maxX: x,
      maxY: y,
    });

    const sortedElements = qualifyingElements
      .sort((a, b) => b.getTarget().getZIndex() - a.getTarget().getZIndex())
      .filter((node) => node.getTarget().hits({ x, y }));

    const groups = new Map<IEventGroup, EventNode>();
    const groupElements: EventNode[] = [];

    sortedElements.forEach((node) => {
      const group = node.getTarget().getGroup();
      if (group != null && groups.has(group)) return;

      groupElements.push(node);
      if (group != null) groups.set(group, node);
    });

    return {
      activeNodes: groupElements,
      activeGroups: groups,
    };
  }

  private onPointerMove(e: FederatedPointerEvent): void {
    const position = e.getLocalPosition(
      this.bobbaRenderer.getApplication().stage
    );

    const elements = this.getHitElements({ x: position.x, y: position.y });

    const current = new Set(
      elements.activeNodes.filter((node, index) => index === 0)
    );
    const previous = this.overElements;

    const added = new Set<EventNode>();
    current.forEach((node) => {
      if (!previous.has(node)) added.add(node);
    });

    const removed = new Set<EventNode>();
    previous.forEach((node) => {
      if (!current.has(node)) removed.add(node);
    });

    const addedGroups = new Set<IEventGroup>();
    added.forEach((node) => addedGroups.add(node.getTarget().getGroup()));

    const removedButGroupPresent = new Set<EventNode>();
    const actualRemoved = new Set<EventNode>();

    removed.forEach((node) => {
      if (addedGroups.has(node.getTarget().getGroup())) {
        removedButGroupPresent.add(node);
      }

      actualRemoved.add(node);
    });

    this.overElements = current;

    new EventPropagation(
      this.bobbaRenderer,
      position,
      e,
      Array.from(current),
      (target, event) => target.onPointerMove(event)
    );

    new EventPropagation(
      this.bobbaRenderer,
      position,
      e,
      Array.from(removedButGroupPresent),
      (target, event) => target.onPointerTargetChanged(event)
    );

    new EventPropagation(
      this.bobbaRenderer,
      position,
      e,
      Array.from(actualRemoved),
      (target, event) => target.onPointerOut(event)
    );

    new EventPropagation(
      this.bobbaRenderer,
      position,
      e,
      Array.from(added),
      (target, event) => target.onPointerOver(event)
    );
  }

  private onPointerDown(e: FederatedPointerEvent): void {
    const position = e.getLocalPosition(
      this.bobbaRenderer.getApplication().stage
    );

    const elements = this.getHitElements({ x: position.x, y: position.y });

    this.pointerDownElements = new Set(elements.activeNodes);

    new EventPropagation(
      this.bobbaRenderer,
      position,
      e,
      elements.activeNodes,
      (target, event) => target.onPointerDown(event)
    );
  }

  private onPointerUp(e: FederatedPointerEvent): void {
    const position = e.getLocalPosition(
      this.bobbaRenderer.getApplication().stage
    );

    const elements = this.getHitElements({ x: position.x, y: position.y });

    const elementsSet = new Set(elements.activeNodes);
    const clickedNodes = new Set<EventNode>();

    this.pointerDownElements.forEach((node) => {
      if (elementsSet.has(node)) clickedNodes.add(node);
    });

    new EventPropagation(
      this.bobbaRenderer,
      position,
      e,
      elements.activeNodes,
      (target, event) => target.onPointerUp(event)
    );

    new EventPropagation(
      this.bobbaRenderer,
      position,
      e,
      Array.from(clickedNodes),
      (target, event) => target.onClick(event)
    );
  }
}
