
export enum GameState {
  START = 'START',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR'
}

export interface AdventureTurn {
  locationName: string;
  story: string;
  choices: string[];
  inventory: string[];
  currentQuest: string;
  imagePrompt: string;
}

export interface GameData {
  history: AdventureTurn[];
  currentTurn: AdventureTurn | null;
  genre: string;
  characterDescription: string;
  currentImage: string | null;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
