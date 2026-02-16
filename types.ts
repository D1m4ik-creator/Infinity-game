
export enum GameState {
  START = 'START',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  COMBAT = 'COMBAT',
  GAMEOVER = 'GAMEOVER',
  ERROR = 'ERROR'
}

export interface CharacterStats {
  hp: number;
  maxHp: number;
  str: number;
  agi: number;
  int: number;
  level: number;
  exp: number;
}

export interface CombatInfo {
  enemyName: string;
  enemyHp: number;
  enemyMaxHp: number;
  lastActionLog: string;
}

export interface AdventureTurn {
  locationName: string;
  locationType: 'threat' | 'poi' | 'neutral';
  threatLevel: number;
  discoveryTag?: string;
  story: string;
  choices: string[];
  inventory: string[];
  currentQuest: string;
  imagePrompt: string;
  combatInfo?: CombatInfo;
}

export interface GameData {
  history: AdventureTurn[];
  currentTurn: AdventureTurn | null;
  genre: string;
  characterDescription: string;
  currentImage: string | null;
  stats: CharacterStats;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
