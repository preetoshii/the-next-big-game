/**
 * GameTimer.js - Core timer system for game rounds
 * 
 * Lives in /systems/ because it's infrastructure that mechanics depend on.
 * Handles countdown timing with configurable speeds and callbacks.
 */

/**
 * GameTimer System
 * Provides countdown functionality with speed adjustments
 */
class GameTimer {
  constructor() {
    this.timeRemaining = 0;
    this.totalTime = 0;
    this.isRunning = false;
    this.intervalId = null;
    this.callbacks = {
      onTick: null,
      onComplete: null,
      onWarning: null
    };
    this.listeners = {
      tick: [],
      complete: [],
      warning: []
    };
    this.warningThreshold = 5; // Seconds before warning
  }

  /**
   * Starts a countdown timer
   * 
   * @param {number} seconds - Duration in seconds
   * @param {Object} callbacks - Optional callbacks for timer events
   */
  start(seconds, callbacks = {}) {
    // Stop any existing timer
    this.stop();
    
    // Set up new timer
    this.totalTime = seconds;
    this.timeRemaining = seconds;
    this.callbacks = { ...this.callbacks, ...callbacks };
    this.isRunning = true;
    
    // Start the interval
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);
    
    // Initial tick callback
    if (this.callbacks.onTick) {
      this.callbacks.onTick(this.timeRemaining, this.totalTime);
    }
  }

  /**
   * Adds a listener for timer events
   */
  addListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  /**
   * Removes a listener for timer events
   */
  removeListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Handles each timer tick
   */
  tick() {
    if (!this.isRunning) return;
    
    this.timeRemaining--;
    
    // Check for warning threshold
    if (this.timeRemaining === this.warningThreshold) {
      // Call main callback
      if (this.callbacks.onWarning) {
        this.callbacks.onWarning(this.timeRemaining);
      }
      // Notify all listeners
      this.listeners.warning.forEach(cb => cb(this.timeRemaining));
    }
    
    // Tick callback
    if (this.callbacks.onTick) {
      this.callbacks.onTick(this.timeRemaining, this.totalTime);
    }
    // Notify all tick listeners
    this.listeners.tick.forEach(cb => cb(this.timeRemaining, this.totalTime));
    
    // Check for completion
    if (this.timeRemaining <= 0) {
      this.complete();
    }
  }

  /**
   * Completes the timer
   */
  complete() {
    this.stop();
    
    if (this.callbacks.onComplete) {
      this.callbacks.onComplete();
    }
    // Notify all complete listeners
    this.listeners.complete.forEach(cb => cb());
  }

  /**
   * Stops the timer
   */
  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Pauses the timer
   */
  pause() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Resumes a paused timer
   */
  resume() {
    if (!this.isRunning && this.timeRemaining > 0) {
      this.isRunning = true;
      this.intervalId = setInterval(() => {
        this.tick();
      }, 1000);
    }
  }

  /**
   * Gets formatted time string (MM:SS)
   * 
   * @returns {string} Formatted time
   */
  getFormattedTime() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Gets time as percentage of total
   * 
   * @returns {number} Percentage (0-100)
   */
  getPercentage() {
    if (this.totalTime === 0) return 0;
    return Math.round((this.timeRemaining / this.totalTime) * 100);
  }

  /**
   * Checks if timer is in warning zone
   * 
   * @returns {boolean}
   */
  isWarning() {
    return this.timeRemaining <= this.warningThreshold && this.timeRemaining > 0;
  }

  /**
   * Adjusts the warning threshold
   * 
   * @param {number} seconds - New warning threshold
   */
  setWarningThreshold(seconds) {
    this.warningThreshold = seconds;
  }

  /**
   * Calculates time for a round based on round number
   * Implements linear decrease in time
   * 
   * @param {number} initialTime - Starting time for round 1
   * @param {number} round - Current round (1-indexed)
   * @param {number} totalRounds - Total number of rounds
   * @param {number} minTime - Minimum time allowed (default: 5 seconds)
   * @returns {number} Time in seconds for this round
   */
  static calculateRoundTime(initialTime, round, totalRounds, minTime = 5) {
    // Linear decrease: lose equal time each round
    const totalDecrease = initialTime - minTime;
    const decreasePerRound = totalDecrease / (totalRounds - 1);
    const timeForRound = initialTime - (decreasePerRound * (round - 1));
    
    // Ensure we don't go below minimum
    return Math.max(Math.round(timeForRound), minTime);
  }

  /**
   * Resets the timer system
   */
  reset() {
    this.stop();
    this.timeRemaining = 0;
    this.totalTime = 0;
    this.callbacks = {
      onTick: null,
      onComplete: null,
      onWarning: null
    };
    // Don't clear listeners on reset - they should persist
  }
}

// Export singleton instance
const gameTimer = new GameTimer();

// Expose to global Game object for debugging
if (typeof window !== 'undefined') {
  window.Game = window.Game || {};
  window.Game.timer = gameTimer;
  window.Game.GameTimer = GameTimer; // Also expose the class for static methods
}

// Export both the instance (default) and the class (named)
export { GameTimer };
export default gameTimer;