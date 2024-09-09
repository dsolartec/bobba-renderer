import BaseData from '../../utils/BaseData';

export interface AvatarActionInfo {
  id: string;
  state: string;
  precedence: number;
  geometryType: string;
  activePartSet: string | null;
  assetPartDefinition: string;
  prevents: string[];
  animation: boolean;
  main: boolean;
  isDefault: boolean;
}

export default class ActionsData extends BaseData {
  private actionsMap: Map<string, AvatarActionInfo>;
  private handItems: Map<string, number>;

  constructor(xml: string) {
    super(xml);

    this.actionsMap = new Map();
    this.handItems = new Map();

    this.setCacheData();
  }

  static async fromUrl(url: string): Promise<ActionsData> {
    const response = await fetch(url);
    const text = await response.text();

    return new ActionsData(text);
  }

  getActions(): AvatarActionInfo[] {
    return Array.from(this.actionsMap.values());
  }

  private getAvatarActionInfoFromElement(element: Element): AvatarActionInfo {
    const id = element.getAttribute('id');
    if (id == null) throw new Error('Invalid id');

    const state = element.getAttribute('state');
    if (state == null) throw new Error('Invalid state');

    const precedenceString = element.getAttribute('precedence');
    if (precedenceString == null) throw new Error('Invalid precedence');

    const precedence = Number(precedenceString);
    if (isNaN(precedence)) throw new Error('Invalid precedence');

    const geometryType = element.getAttribute('geometrytype');
    if (geometryType == null) throw new Error('Invalid geometry type');

    const assetPartDefinition = element.getAttribute('assetpartdefinition');
    if (assetPartDefinition == null)
      throw new Error('Invalid asset part definition');

    const preventsString = element.getAttribute('prevents');
    const prevents = preventsString?.split(',') ?? [];

    const activePartSet = element.getAttribute('activepartset');
    const animation = element.getAttribute('animation');
    const main = element.getAttribute('main');
    const isDefault = element.getAttribute('isdefault');

    return {
      id,
      state,
      precedence,
      geometryType,
      activePartSet,
      assetPartDefinition,
      prevents,
      animation: animation === '1',
      main: main === '1',
      isDefault: isDefault === '1',
    };
  }

  private setCacheData(): void {
    this.querySelectorAll('action').forEach((action) => {
      const actionID = action.getAttribute('id');
      if (actionID == null) return;

      const info = this.getAvatarActionInfoFromElement(action);
      this.actionsMap.set(actionID, info);

      action.querySelectorAll<Element>('param').forEach((param) => {
        const paramID = param.getAttribute('id');
        if (paramID == null) return;

        const value = Number(param.getAttribute('value'));
        if (isNaN(value)) return;

        this.handItems.set(`${actionID}_${paramID}`, value);
      });
    });
  }
}
