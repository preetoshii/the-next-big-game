/**
 * GameState.js - Centralized game state management using Zustand
 * 
 * Lives in /state/ because it's shared data that multiple components need.
 * This store manages the entire game flow, eliminating React state issues.
 */

import { create } from 'zustand';
import commandGenerator from '../systems/CommandGenerator';
import gameTimer, { GameTimer } from '../systems/GameTimer';

/**
 * Game State Store
 * Single source of truth for all game state
 */
const useGameStore = create((set, get) => ({
  // Game configuration
  gameConfig: null,
  
  // Game flow state
  gameStatus: 'setup', // setup, preparing, playing, complete
  currentRound: 0,
  currentTeam: 'left',
  currentCommand: null,
  commandCount: 0,
  speechRate: 1.0,
  
  // Initialization flags
  isInitialized: false,
  commandsGenerated: false,
  
  // Actions
  setGameConfig: (config) => set({ gameConfig: config }),
  
  /**
   * Initialize the game with player configuration
   */
  initializeGame: async (config) => {
    const state = get();
    
    // Prevent multiple initializations
    if (state.isInitialized) {
      console.log('Game already initialized, skipping...');
      return;
    }
    
    console.log('Initializing game with config:', config);
    
    set({
      gameConfig: config,
      gameStatus: 'preparing',
      isInitialized: true,
      currentRound: 0,
      currentTeam: 'left',
      commandCount: 0,
      speechRate: 1.0
    });
    
    // Generate commands
    try {
      const playerCount = config.players.length;
      const teams = {
        left: config.teams.left,
        right: config.teams.right
      };
      
      // Pass player information for personalized commands
      await commandGenerator.generateCommands(playerCount, teams, config.players);
      set({ commandsGenerated: true });
      
      // Start the game
      if (window.Game && window.Game.speak) {
        window.Game.speak("Welcome to Simon Says! Get ready for your commands!", 1.0, 1.0);
      }
      
      setTimeout(() => {
        set({ gameStatus: 'playing' });
        
        if (window.Game && window.Game.speak) {
          window.Game.speak(`${config.teams.left} team, you're up first!`, 1.0, 1.0);
        }
        
        setTimeout(() => {
          get().startNextRound();
        }, 2000);
      }, 3000);
      
    } catch (error) {
      console.error('Failed to initialize game:', error);
      set({ gameStatus: 'setup' });
    }
  },
  
  /**
   * Start the next round of commands
   */
  startNextRound: () => {
    const state = get();
    
    console.log(`Starting next round - Round: ${state.currentRound}, Team: ${state.currentTeam}, Command #: ${state.commandCount + 1}`);
    
    // Check if game is complete
    if (state.currentRound >= state.gameConfig.rounds) {
      get().endGame();
      return;
    }
    
    // Get next command for the current team
    const command = commandGenerator.getNextUnusedCommand(state.currentTeam);
    if (!command) {
      console.error('No more commands available!');
      get().endGame();
      return;
    }
    
    // Calculate timer duration
    const totalCommands = state.gameConfig.rounds * 2;
    const roundTime = GameTimer.calculateRoundTime(20, state.commandCount + 1, totalCommands, 5);
    
    // Update speech rate
    const newSpeechRate = 1.0 + (state.currentRound * 0.05);
    
    // Update state
    set({
      currentCommand: command,
      commandCount: state.commandCount + 1,
      speechRate: newSpeechRate
    });
    
    // Announce command
    const teamName = state.gameConfig.teams[state.currentTeam];
    const announcement = `Alright, Team ${teamName}... ${command.text}!`;
    
    if (window.Game && window.Game.speak) {
      window.Game.speak(announcement, 1.0, newSpeechRate);
    }
    
    console.log(`Timer: ${roundTime}s for command: ${command.text}`);
    
    // Start timer
    gameTimer.start(roundTime, {
      onTick: (remaining, total) => {
        // Timer tick handled by UI component
      },
      onWarning: (remaining) => {
        if (window.Game && window.Game.speak) {
          window.Game.speak(`${remaining} seconds left!`, 1.2, newSpeechRate * 1.2);
        }
      },
      onComplete: () => {
        get().handleRoundComplete();
      }
    });
  },
  
  /**
   * Handle completion of a round
   */
  handleRoundComplete: () => {
    const state = get();
    
    console.log(`Round complete - Team: ${state.currentTeam}, Round: ${state.currentRound + 1}`);
    
    // Determine next team
    const nextTeam = state.currentTeam === 'left' ? 'right' : 'left';
    
    // Update round counter when both teams have gone
    let nextRound = state.currentRound;
    if (nextTeam === 'left') {
      nextRound = state.currentRound + 1;
      
      // Announce new round if not at the end
      if (nextRound < state.gameConfig.rounds) {
        if (window.Game && window.Game.speak) {
          window.Game.speak(`Round ${nextRound + 1}!`, 1.1, state.speechRate);
        }
      }
    }
    
    // Update state
    set({
      currentTeam: nextTeam,
      currentRound: nextRound
    });
    
    // Announce team switch
    const nextTeamName = state.gameConfig.teams[nextTeam];
    if (window.Game && window.Game.speak) {
      window.Game.speak(`${nextTeamName} team, your turn!`, 1.0, state.speechRate);
    }
    
    // Start next round after delay
    setTimeout(() => {
      get().startNextRound();
    }, 2500);
  },
  
  /**
   * End the game
   */
  endGame: () => {
    set({ gameStatus: 'complete' });
    gameTimer.stop();
    
    if (window.Game && window.Game.speak) {
      window.Game.speak("Game complete! Great job everyone!", 1.0, 1.0);
    }
  },
  
  /**
   * Pause the game
   */
  pauseGame: () => {
    gameTimer.pause();
    if (window.Game && window.Game.speak) {
      window.Game.speak("Game paused", 0.9, 1.0);
    }
  },
  
  /**
   * Resume the game
   */
  resumeGame: () => {
    gameTimer.resume();
    if (window.Game && window.Game.speak) {
      window.Game.speak("Game resumed", 0.9, 1.0);
    }
  },
  
  /**
   * Skip current command
   */
  skipCommand: () => {
    gameTimer.stop();
    if (window.Game && window.Game.speak) {
      window.Game.speak("Skipping to next command", 0.9, 1.0);
    }
    get().handleRoundComplete();
  },
  
  /**
   * Reset game to setup state
   */
  resetGame: () => {
    gameTimer.reset();
    commandGenerator.reset();
    
    set({
      gameConfig: null,
      gameStatus: 'setup',
      currentRound: 0,
      currentTeam: 'left',
      currentCommand: null,
      commandCount: 0,
      speechRate: 1.0,
      isInitialized: false,
      commandsGenerated: false
    });
  }
}));

// Expose to global for debugging
if (typeof window !== 'undefined') {
  window.Game = window.Game || {};
  window.Game.store = useGameStore;
}

export default useGameStore;