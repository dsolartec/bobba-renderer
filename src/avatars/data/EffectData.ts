import BaseData from '../../utils/BaseData';

export default class EffectData extends BaseData {
  constructor(xml: string) {
    super(xml);

    this.setCacheData();
  }

  private setCacheData(): void {}
}
