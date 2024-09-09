import BaseData from '../../utils/BaseData';

interface AvatarPartInfo {
  removeSetType: string | null;
  flippedSetType: string | null;
}

export default class PartSetsData extends BaseData {
  static async fromUrl(url: string): Promise<PartSetsData> {
    const response = await fetch(url);
    const text = await response.text();

    return new PartSetsData(text);
  }

  getPartInfo(id: string): AvatarPartInfo | null {
    const element = this.querySelector(`partSet part[set-type="${id}"]`);
    if (element == null) return null;

    return {
      flippedSetType: element.getAttribute('flipped-set-type') ?? null,
      removeSetType: element.getAttribute('remove-set-type') ?? null,
    };
  }

  getActivePartSet(id: string): Set<string> {
    const elements = this.querySelectorAll(
      `activePartSet[id="${id}"] activePart`
    );

    return new Set(
      elements.map((element) => {
        const setType = element.getAttribute('set-type');
        if (setType == null) throw new Error('Invalid set type');

        return setType;
      })
    );
  }
}
