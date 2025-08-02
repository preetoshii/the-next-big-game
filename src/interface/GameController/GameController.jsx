/**
 * GameController.jsx - UI for displaying game state and controls
 * 
 * Lives in /interface/ because it's a UI control component.
 * Displays current command, timer, team info, and game controls.
 * No game logic here - just presentation and user interaction.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gameTimer from '../../systems/GameTimer';
import styles from './GameController.module.css';

/**
 * GameController Component
 * Shows game state and provides controls during gameplay
 */
function GameController({ gameConfig, currentState, onPause, onResume, onSkip, onExit }) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerPercentage, setTimerPercentage] = useState(100);
  const [isWarning, setIsWarning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  /**
   * Subscribe to timer updates
   */
  useEffect(() => {
    // Define our listener functions
    const handleTick = (remaining, total) => {
      setTimeRemaining(remaining);
      setTimerPercentage(gameTimer.getPercentage());
      setIsWarning(gameTimer.isWarning());
    };

    const handleWarning = (remaining) => {
      setIsWarning(true);
    };

    // Add listeners
    gameTimer.addListener('tick', handleTick);
    gameTimer.addListener('warning', handleWarning);

    // Cleanup
    return () => {
      gameTimer.removeListener('tick', handleTick);
      gameTimer.removeListener('warning', handleWarning);
    };
  }, []);

  /**
   * Handle pause/resume toggle
   */
  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      if (onResume) onResume();
    } else {
      setIsPaused(true);
      if (onPause) onPause();
    }
  };

  // Get current team info
  const currentTeamName = currentState?.team ? 
    gameConfig.teams[currentState.team] : '';
  const currentTeamClass = currentState?.team === 'left' ? 
    styles.leftTeam : styles.rightTeam;

  return (
    <div className={styles.gameController}>
      {/* Header with round info */}
      <div className={styles.header}>
        <h2>Round {currentState?.round || 1} of {gameConfig.rounds}</h2>
        <div className={styles.controls}>
          <button 
            onClick={togglePause}
            className={styles.controlButton}
            aria-label={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? '▶️' : '⏸️'}
          </button>
          <button 
            onClick={onSkip}
            className={styles.controlButton}
            aria-label="Skip command"
          >
            ⏭️
          </button>
          <button 
            onClick={onExit}
            className={styles.exitButton}
            aria-label="Exit game"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Current team indicator */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentState?.team}
          className={`${styles.teamIndicator} ${currentTeamClass}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <h3>Team {currentTeamName}'s Turn</h3>
        </motion.div>
      </AnimatePresence>

      {/* Command display */}
      <AnimatePresence mode="wait">
        {currentState?.command && (
          <motion.div 
            key={currentState.command.text}
            className={styles.commandDisplay}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <p className={styles.commandText}>
              {currentState.command.text}
            </p>
            <span className={styles.difficulty}>
              {currentState.command.difficulty} • 
              {currentState.command.estimatedTime}s
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer display */}
      <div className={styles.timerSection}>
        <div className={styles.timerBar}>
          <motion.div 
            className={`${styles.timerFill} ${isWarning ? styles.warning : ''}`}
            animate={{ 
              width: `${timerPercentage}%`,
              backgroundColor: isWarning ? '#ff4444' : '#646cff'
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className={`${styles.timerText} ${isWarning ? styles.warning : ''}`}>
          {gameTimer.getFormattedTime()}
        </div>
      </div>

      {/* Team scores/players */}
      <div className={styles.teamsInfo}>
        <div className={`${styles.teamBox} ${styles.leftTeamBox}`}>
          <h4>{gameConfig.teams.left}</h4>
          <div className={styles.playerList}>
            {gameConfig.players
              .filter(p => p.team === 'left')
              .map(player => (
                <span key={player.id} className={styles.playerName}>
                  {player.name}
                </span>
              ))}
          </div>
        </div>
        
        <div className={styles.vs}>VS</div>
        
        <div className={`${styles.teamBox} ${styles.rightTeamBox}`}>
          <h4>{gameConfig.teams.right}</h4>
          <div className={styles.playerList}>
            {gameConfig.players
              .filter(p => p.team === 'right')
              .map(player => (
                <span key={player.id} className={styles.playerName}>
                  {player.name}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Paused overlay */}
      <AnimatePresence>
        {isPaused && (
          <motion.div 
            className={styles.pausedOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={styles.pausedContent}>
              <h2>Game Paused</h2>
              <button onClick={togglePause} className={styles.resumeButton}>
                Resume Game
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GameController;