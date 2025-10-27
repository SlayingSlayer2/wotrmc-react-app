import { useState, useEffect } from 'react';

export type GameState = {
  wood: number;
  woodHit: number;
  planks: number;
  sticks: number;
  coins: number;
  equippedTool: string;
};

const defaultGameState: GameState = {
  wood: 0,
  woodHit: 0,
  planks: 0,
  sticks: 0,
  coins: 0,
  equippedTool: 'hands'
};

function useGameStorage() {
  const [gameState, setGameState] = useState<GameState>(defaultGameState);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('wotrmcGameState');
      if (saved) {
        setGameState(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading game state:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('wotrmcGameState', JSON.stringify(gameState));
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  }, [gameState]);

  return [gameState, setGameState] as const;
}

export default useGameStorage;
