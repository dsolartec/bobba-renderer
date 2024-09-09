import BaseData from '../../utils/BaseData';

interface AvatarEffect {
  id: string;
  lib: string;
  type: string;
}

export default class EffectMapData extends BaseData {
  private effects: Map<string, AvatarEffect>;

  constructor(xml: string) {
    super(xml);

    this.effects = new Map();

    this.setCacheData();
  }

  static async fromUrl(url: string): Promise<EffectMapData> {
    const response = await fetch(url);
    const text = await response.text();

    return new EffectMapData(text);
  }

  getEffectInfo(id: string): AvatarEffect | null {
    return this.effects.get(id) ?? null;
  }

  private setCacheData(): void {
    this.querySelectorAll('effect').forEach((element) => {
      const id = element.getAttribute('id');
      if (id == null) throw new Error('Invalid id');

      const lib = element.getAttribute('lib');
      if (lib == null) throw new Error('Invalid lib for effect');

      const type = element.getAttribute('type');
      if (type == null) throw new Error('Invalid type for effect');

      this.effects.set(id, { id, lib, type });
    });
  }
}
