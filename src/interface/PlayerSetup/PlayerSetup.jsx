/**
 * PlayerSetup.jsx - UI for player registration and team assignment
 * 
 * This component lives in /interface/ because it's a UI control that humans
 * interact with. It handles player input, team assignment via drag-and-drop,
 * and game configuration. All game logic stays out of here - this is purely
 * for collecting and displaying information.
 */

import { useState } from 'react';
import { createPlayer, validatePlayerName, formatTeamName } from '../../helpers/playerHelpers';
import styles from './PlayerSetup.module.css';

/**
 * PlayerSetup Component
 * Allows players to:
 * - Enter their names
 * - Drag names to assign teams
 * - Configure team names
 * - Set number of rounds
 * - Start the game
 */
function PlayerSetup({ onGameStart }) {
  // Local state for player management - no need for global state yet
  const [players, setPlayers] = useState([createPlayer()]);
  const [leftTeamName, setLeftTeamName] = useState('Red');
  const [rightTeamName, setRightTeamName] = useState('Blue');
  const [rounds, setRounds] = useState(10);
  const [draggedPlayerId, setDraggedPlayerId] = useState(null);

  /**
   * Adds a new empty player to the list
   */
  const addPlayer = () => {
    setPlayers([...players, createPlayer()]);
  };

  /**
   * Removes a player from the list
   */
  const removePlayer = (playerId) => {
    setPlayers(players.filter(p => p.id !== playerId));
  };

  /**
   * Updates a player's name
   */
  const updatePlayerName = (playerId, name) => {
    setPlayers(players.map(p => 
      p.id === playerId ? { ...p, name } : p
    ));
  };

  /**
   * Drag event handlers for team assignment
   */
  const handleDragStart = (e, playerId) => {
    setDraggedPlayerId(playerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, team) => {
    e.preventDefault();
    if (draggedPlayerId) {
      setPlayers(players.map(p => 
        p.id === draggedPlayerId ? { ...p, team } : p
      ));
      setDraggedPlayerId(null);
    }
  };

  /**
   * Assigns a player to a team by clicking (alternative to drag)
   */
  const assignTeam = (playerId, team) => {
    setPlayers(players.map(p => 
      p.id === playerId ? { ...p, team } : p
    ));
  };

  /**
   * Checks if we can start the game
   */
  const canStartGame = () => {
    const validPlayers = players.filter(p => 
      validatePlayerName(p.name) && p.team !== null
    );
    return validPlayers.length > 0;
  };

  /**
   * Starts the game with current configuration
   */
  const startGame = () => {
    const validPlayers = players.filter(p => 
      validatePlayerName(p.name) && p.team !== null
    );
    
    const gameConfig = {
      players: validPlayers,
      teams: {
        left: formatTeamName(leftTeamName),
        right: formatTeamName(rightTeamName)
      },
      rounds: rounds
    };
    
    onGameStart(gameConfig);
  };

  // Get players by team for display
  const leftTeamPlayers = players.filter(p => p.team === 'left');
  const rightTeamPlayers = players.filter(p => p.team === 'right');
  const unassignedPlayers = players.filter(p => p.team === null);

  return (
    <div className={styles.playerSetup}>
      <h1>Team Setup</h1>
      <p>Add players and drag them to their teams</p>

      {/* Player Input Section */}
      <div className={styles.playerInputSection}>
        <h3>Players</h3>
        <div className={styles.playerList}>
          {players.map((player) => (
            <div key={player.id} className={styles.playerRow}>
              <input
                type="text"
                placeholder="Enter player name"
                value={player.name}
                onChange={(e) => updatePlayerName(player.id, e.target.value)}
                className={styles.playerInput}
              />
              {players.length > 1 && (
                <button
                  onClick={() => removePlayer(player.id)}
                  className={styles.removeButton}
                  aria-label="Remove player"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addPlayer} className={styles.addButton}>
          + Add Player
        </button>
      </div>

      {/* Team Assignment Section */}
      <div className={styles.teamSection}>
        <h3>Drag Players to Teams</h3>
        
        {/* Unassigned Players */}
        {unassignedPlayers.length > 0 && (
          <div className={styles.unassignedSection}>
            <h4>Unassigned Players</h4>
            <div className={styles.playerTags}>
              {unassignedPlayers.map((player) => (
                <div
                  key={player.id}
                  className={styles.playerTag}
                  draggable={validatePlayerName(player.name)}
                  onDragStart={(e) => handleDragStart(e, player.id)}
                  style={{ opacity: validatePlayerName(player.name) ? 1 : 0.5 }}
                >
                  {player.name || 'Unnamed Player'}
                  <div className={styles.teamButtons}>
                    <button 
                      onClick={() => assignTeam(player.id, 'left')}
                      className={styles.miniTeamButton}
                    >
                      ←
                    </button>
                    <button 
                      onClick={() => assignTeam(player.id, 'right')}
                      className={styles.miniTeamButton}
                    >
                      →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Areas */}
        <div className={styles.teamsContainer}>
          {/* Left Team */}
          <div 
            className={`${styles.teamArea} ${styles.leftTeam}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'left')}
          >
            <input
              type="text"
              value={leftTeamName}
              onChange={(e) => setLeftTeamName(e.target.value)}
              className={styles.teamNameInput}
              placeholder="Team name"
            />
            <div className={styles.teamPlayers}>
              {leftTeamPlayers.map((player) => (
                <div
                  key={player.id}
                  className={styles.playerTag}
                  draggable
                  onDragStart={(e) => handleDragStart(e, player.id)}
                >
                  {player.name}
                  <button 
                    onClick={() => assignTeam(player.id, null)}
                    className={styles.removeFromTeam}
                  >
                    ×
                  </button>
                </div>
              ))}
              {leftTeamPlayers.length === 0 && (
                <p className={styles.dropHint}>Drop players here</p>
              )}
            </div>
          </div>

          {/* Right Team */}
          <div 
            className={`${styles.teamArea} ${styles.rightTeam}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'right')}
          >
            <input
              type="text"
              value={rightTeamName}
              onChange={(e) => setRightTeamName(e.target.value)}
              className={styles.teamNameInput}
              placeholder="Team name"
            />
            <div className={styles.teamPlayers}>
              {rightTeamPlayers.map((player) => (
                <div
                  key={player.id}
                  className={styles.playerTag}
                  draggable
                  onDragStart={(e) => handleDragStart(e, player.id)}
                >
                  {player.name}
                  <button 
                    onClick={() => assignTeam(player.id, null)}
                    className={styles.removeFromTeam}
                  >
                    ×
                  </button>
                </div>
              ))}
              {rightTeamPlayers.length === 0 && (
                <p className={styles.dropHint}>Drop players here</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Game Configuration */}
      <div className={styles.gameConfig}>
        <label className={styles.roundsLabel}>
          Number of Rounds:
          <input
            type="number"
            min="1"
            max="100"
            value={rounds}
            onChange={(e) => setRounds(parseInt(e.target.value) || 10)}
            className={styles.roundsInput}
          />
        </label>
      </div>

      {/* Start Button */}
      <button 
        onClick={startGame}
        disabled={!canStartGame()}
        className={styles.startButton}
      >
        Start Game
      </button>
    </div>
  );
}

export default PlayerSetup;