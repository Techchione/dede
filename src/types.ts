export interface Car {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  speed: number;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: 'car' | 'pothole' | 'oil';
  color: string;
}

export type GameStatus = 'START' | 'PLAYING' | 'GAMEOVER';

export interface GameState {
  score: number;
  level: number;
  status: GameStatus;
  highScore: number;
}
