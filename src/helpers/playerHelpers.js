/**
 * playerHelpers.js - Pure utility functions for player management
 * 
 * This file lives in /helpers/ because it contains pure utility functions
 * that transform input to output with no side effects. These functions
 * support player creation and validation across our game.
 */

/**
 * Generates a unique player ID
 * Uses timestamp + random number to ensure uniqueness
 * 
 * @returns {string} Unique player ID like "player_1234567890_123"
 */
export function generatePlayerId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `player_${timestamp}_${random}`;
}

/**
 * Validates a player name
 * Ensures name is not empty and has reasonable length
 * 
 * @param {string} name - The player name to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function validatePlayerName(name) {
  // Trim whitespace and check if name exists
  const trimmedName = name.trim();
  
  // Name must be between 1 and 50 characters
  return trimmedName.length > 0 && trimmedName.length <= 50;
}

/**
 * Creates a new player object with default values
 * 
 * @param {string} name - The player's name
 * @param {string} team - The team assignment ('left' or 'right')
 * @returns {Object} Player object with id, name, and team
 */
export function createPlayer(name = '', team = null) {
  return {
    id: generatePlayerId(),
    name: name.trim(),
    team: team
  };
}

/**
 * Formats team name for display
 * Capitalizes first letter and handles empty strings
 * 
 * @param {string} teamName - Raw team name
 * @returns {string} Formatted team name
 */
export function formatTeamName(teamName) {
  if (!teamName || !teamName.trim()) return 'Unnamed Team';
  
  const trimmed = teamName.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}