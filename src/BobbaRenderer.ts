import { Application, Ticker } from 'pixi.js';
import PathfindingManager from './pathfinding/PathfindingManager';
import EventsManager from './events/EventsManager';
import RoomsManager from './rooms/RoomsManager';
import FurnitureManager from './furniture/FurnitureManager';
import AvatarsManager from './avatars/AvatarsManager';

type SubscriptionFn = (frame: number, accurateFrame: number) => void;

interface BobbaRendererOptions {
  application?: Application;
  assetsURL: string;
}

export default class BobbaRenderer {
  private readonly assetsURL: string;

  // Animation ticker
  private readonly tickerSubscriptions: Map<number, SubscriptionFn>;
  private tickerIDCounter: number;
  private tickerFrame: number;
  private readonly ticker: Ticker;

  // Dependencies
  private readonly application: Application;
  private readonly avatarsManager: AvatarsManager;
  private readonly eventsManager: EventsManager;
  private readonly furnitureManager: FurnitureManager;
  private readonly pathfindingManager: PathfindingManager;
  private readonly roomsManager: RoomsManager;

  constructor(options: BobbaRendererOptions) {
    this.assetsURL = options.assetsURL;

    // Animation ticker
    this.tickerSubscriptions = new Map();
    this.tickerIDCounter = 0;
    this.tickerFrame = 0;

    this.ticker = new Ticker();
    this.ticker.maxFPS = 24;
    this.ticker.start();

    // Dependencies
    this.application = options.application ?? new Application();
    this.avatarsManager = new AvatarsManager(this);
    this.eventsManager = new EventsManager(this);
    this.furnitureManager = new FurnitureManager(this);
    this.pathfindingManager = new PathfindingManager();
    this.roomsManager = new RoomsManager(this);
  }

  getResourcesURL(): string {
    return this.assetsURL;
  }

  async initialize(el: HTMLElement | null = null): Promise<void> {
    if (el == null) el = document.body;

    await this.application.init({
      antialias: false,
      autoDensity: true,
      height: el.clientHeight,
      preference: 'webgpu',
      resizeTo: el,
      resolution: window.devicePixelRatio,
      roundPixels: true,
      width: el.clientWidth,
    });

    el.appendChild(this.application.canvas);

    this.application.stage.sortableChildren = true;
    this.ticker.add(this.handleTicker.bind(this));

    this.eventsManager.initialize();
    await this.avatarsManager.initialize();
    await this.furnitureManager.initialize();
  }

  // Animation ticker

  private getNormalizedTickerFrame(): number {
    return this.tickerFrame * (this.ticker.minFPS / this.ticker.maxFPS);
  }

  private handleTicker(): void {
    this.tickerFrame += 1;

    const frame = this.getNormalizedTickerFrame();
    this.tickerSubscriptions.forEach((callback) => callback(~~frame, frame));
  }

  getCurrentTickerFrame(): number {
    return ~~this.getNormalizedTickerFrame();
  }

  subscribeToTicker(callback: SubscriptionFn): () => void {
    const id = this.tickerIDCounter++;

    this.tickerSubscriptions.set(id, callback);
    return () => this.tickerSubscriptions.delete(id);
  }

  // Dependencies
  getApplication(): Application {
    return this.application;
  }

  getAvatarsManager(): AvatarsManager {
    return this.avatarsManager;
  }

  getEventsManager(): EventsManager {
    return this.eventsManager;
  }

  getFurnitureManager(): FurnitureManager {
    return this.furnitureManager;
  }

  getPathfindingManager(): PathfindingManager {
    return this.pathfindingManager;
  }

  getRoomsManager(): RoomsManager {
    return this.roomsManager;
  }
}
