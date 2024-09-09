export enum AvatarAction {
  Move = 'Move',
  Wave = 'Wave',
  Talk = 'Talk',
  Swim = 'Swim',
  Float = 'Float',
  Sign = 'Sign',
  Respect = 'Respect',
  Blow = 'Blow',
  Laugh = 'Laugh',
  SnowWarRun = 'SnowWarRun',
  SnowWarDieFront = 'SnowWarDieFront',
  SnowWarDieBack = 'SnowWarDieBack',
  SnowWarPick = 'SnowWarPick',
  SnowWarThrow = 'SnowWarThrow',
  Lay = 'Lay',
  Sit = 'Sit',
  Idle = 'Idle',
  Dance = 'Dance',
  UseItem = 'UseItem',
  CarryItem = 'CarryItem',
  Gesture = 'Gesture',
  GestureSmile = 'GestureSmile',
  GestureSad = 'GestureSad',
  GestureAngry = 'GestureAngry',
  GestureSurprised = 'GestureSurprised',
  Sleep = 'Sleep',
  Default = 'Default',
}

export type ParsedLook = Map<
  string,
  {
    setID: number;
    colorIDs: number[];
  }
>;

export default interface IAvatarLookOptions {
  actions: AvatarAction[];
  look: string;
  direction: number;
  headDirection: number;
  item?: string | number;
  effect?: string;
  tint?: number;
}
