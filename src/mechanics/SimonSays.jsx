/**
 * SimonSays.jsx - Core game mechanic for Simon Says gameplay
 * 
 * Lives in /mechanics/ because it's a self-contained game feature.
 * This mechanic now uses Zustand store for all state management,
 * eliminating React state issues.
 */

import { useEffect } from 'react';
import useGameStore from '../state/GameState';

/**
 * SimonSays Mechanic
 * Manages the core game loop using centralized state
 */
function SimonSays({ gameConfig, onRoundComplete, onGameComplete }) {
  const { 
    gameStatus,
    currentRound,
    currentTeam,
    currentCommand,
    initializeGame,
    pauseGame,
    resumeGame,
    skipCommand
  } = useGameStore();
  
  /**
   * Initialize game when component mounts
   */
  useEffect(() => {
    if (gameConfig && gameStatus === 'setup') {
      initializeGame(gameConfig);
    }
  }, [gameConfig, gameStatus, initializeGame]);
  
  /**
   * Notify parent of round completion
   */
  useEffect(() => {
    if (currentCommand && onRoundComplete) {
      onRoundComplete({
        round: currentRound + 1,
        team: currentTeam,
        command: currentCommand
      });
    }
  }, [currentCommand, currentRound, currentTeam, onRoundComplete]);
  
  /**
   * Notify parent of game completion
   */
  useEffect(() => {
    if (gameStatus === 'complete' && onGameComplete) {
      onGameComplete();
    }
  }, [gameStatus, onGameComplete]);
  
  /**
   * Expose controls to global Game object
   */
  useEffect(() => {
    if (window.Game) {
      window.Game.simonSays = {
        pause: pauseGame,
        resume: resumeGame,
        skip: skipCommand,
        getState: () => ({
          status: gameStatus,
          round: currentRound,
          team: currentTeam,
          command: currentCommand
        })
      };
    }
  }, [gameStatus, currentRound, currentTeam, currentCommand, pauseGame, resumeGame, skipCommand]);
  
  // This mechanic is headless - no visual rendering
  return null;
}

export default SimonSays;