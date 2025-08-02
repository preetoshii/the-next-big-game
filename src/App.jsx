import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import PlayerSetup from './interface/PlayerSetup'
import GameController from './interface/GameController'
import SimonSays from './mechanics/SimonSays'
import useGameStore from './state/GameState'
import './App.css'

// Global Game object for console experimentation
window.Game = {
  speak: null,
  gameConfig: null,
  // Add whatever you need here for experiments
}

function App() {
  // Get state from Zustand store
  const { 
    gameConfig, 
    gameStatus,
    currentRound,
    currentTeam,
    currentCommand,
    pauseGame,
    resumeGame,
    skipCommand,
    resetGame
  } = useGameStore();
  
  // Local state for UI flow
  const [gameStarted, setGameStarted] = useState(false);

  // Initialize speech synthesis
  useEffect(() => {
    // Simple speak function ready to use
    const speak = (text, pitch = 1, rate = 1) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.pitch = pitch
      utterance.rate = rate
      window.speechSynthesis.speak(utterance)
    }
    
    // Make it available globally for console experiments
    window.Game.speak = speak
    
    // Test it's working (but quieter now)
    console.log("Audio system ready! Use Game.speak('Hello') to test");
  }, [])

  /**
   * Handles game start from PlayerSetup
   * Receives configuration with players, teams, and rounds
   */
  const handleGameStart = (config) => {
    console.log('Game starting with config:', config);
    setGameStarted(true);
    
    // Store config globally for debugging
    window.Game.gameConfig = config;
  };

  /**
   * Handles round completion
   */
  const handleRoundComplete = (roundData) => {
    console.log('Round complete:', roundData);
    // Could track scores here if needed
  };

  /**
   * Handles game completion
   */
  const handleGameComplete = () => {
    console.log('Game complete!');
    // Show final screen or return to setup
    setTimeout(() => {
      window.Game.speak('Would you like to play again?');
    }, 2000);
  };

  /**
   * Handle exit - reset everything
   */
  const handleExit = () => {
    setGameStarted(false);
    resetGame();
  };

  // Show PlayerSetup if game hasn't started
  if (!gameStarted) {
    return (
      <div className="App">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <PlayerSetup onGameStart={handleGameStart} />
        </motion.div>
      </div>
    );
  }

  // Game view with SimonSays mechanic and GameController UI
  const currentState = {
    round: currentRound + 1,
    team: currentTeam,
    command: currentCommand,
    state: gameStatus
  };
  
  return (
    <div className="App">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="game-content"
      >
        {/* SimonSays mechanic - handles game logic, no visual output */}
        <SimonSays
          gameConfig={window.Game.gameConfig}
          onRoundComplete={handleRoundComplete}
          onGameComplete={handleGameComplete}
        />
        
        {/* GameController UI - displays game state and controls */}
        <GameController
          gameConfig={window.Game.gameConfig}
          currentState={currentState}
          onPause={pauseGame}
          onResume={resumeGame}
          onSkip={skipCommand}
          onExit={handleExit}
        />
      </motion.div>
    </div>
  )
}

export default App