import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import PlayerSetup from './interface/PlayerSetup'
import './App.css'

// Global Game object for console experimentation
window.Game = {
  speak: null,
  gameConfig: null,
  // Add whatever you need here for experiments
}

function App() {
  // Local state to manage game flow
  const [gameStarted, setGameStarted] = useState(false);
  const [gameConfig, setGameConfig] = useState(null);

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
    setGameConfig(config);
    setGameStarted(true);
    
    // Store config globally for debugging
    window.Game.gameConfig = config;
    
    // Announce game start
    window.Game.speak(`Game starting with ${config.players.length} players!`);
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

  // Game view (placeholder for now)
  return (
    <div className="App">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="game-content"
      >
        <h1>Game in Progress</h1>
        <p>Teams: {gameConfig.teams.left} vs {gameConfig.teams.right}</p>
        <p>Rounds: {gameConfig.rounds}</p>
        
        <div className="active-players">
          <h3>Players</h3>
          {gameConfig.players.map(player => (
            <span key={player.id} className="player-badge">
              {player.name} ({gameConfig.teams[player.team]})
            </span>
          ))}
        </div>
        
        <button 
          onClick={() => {
            setGameStarted(false);
            setGameConfig(null);
          }}
          style={{ marginTop: '2rem' }}
        >
          Back to Setup
        </button>
      </motion.div>
    </div>
  )
}

export default App