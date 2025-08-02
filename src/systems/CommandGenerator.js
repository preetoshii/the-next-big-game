/**
 * CommandGenerator.js - AI-powered command generation system
 * 
 * This lives in /systems/ because it's core infrastructure that mechanics
 * depend on. It uses OpenAI to generate contextual commands based on
 * player count and scales difficulty appropriately.
 */

import OpenAI from 'openai';

/**
 * CommandGenerator System
 * Generates game commands using AI that scale with player count
 * and difficulty levels
 */
class CommandGenerator {
  constructor() {
    // Initialize OpenAI client - API key should be set in environment
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // We're in a browser environment
    });
    
    // Store generated commands
    this.commands = [];
    this.teamCommands = { left: [], right: [] }; // Store team-specific commands
    this.usedCommandIndices = new Set(); // Track which commands have been used
    this.isGenerating = false;
  }

  /**
   * Generates commands based on player configuration
   * 
   * @param {number} playerCount - Total number of players
   * @param {Object} teams - Team configuration with team names
   * @param {Array} players - Array of player objects with name and team
   * @returns {Promise<Object>} Object with team-specific command arrays
   */
  async generateCommands(playerCount, teams, players = null) {
    if (this.isGenerating) {
      console.warn('Commands are already being generated');
      return this.teamCommands;
    }

    this.isGenerating = true;
    
    try {
      // If players provided, generate team-specific commands
      if (players && players.length > 0) {
        // Generate commands for each team
        const leftPlayers = players.filter(p => p.team === 'left');
        const rightPlayers = players.filter(p => p.team === 'right');
        
        // Generate left team commands
        const leftPrompt = this.createTeamPrompt(leftPlayers, teams.left || 'Red');
        const leftCommands = await this.generateTeamCommands(leftPrompt, leftPlayers.length);
        
        // Generate right team commands
        const rightPrompt = this.createTeamPrompt(rightPlayers, teams.right || 'Blue');
        const rightCommands = await this.generateTeamCommands(rightPrompt, rightPlayers.length);
        
        this.teamCommands.left = leftCommands;
        this.teamCommands.right = rightCommands;
        
        // For backward compatibility, create a unified command list
        this.commands = [...leftCommands, ...rightCommands];
        
      } else {
        // Fallback to generic commands if no player data
        const prompt = this.createPrompt(playerCount, teams);
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a creative game designer creating physical commands for a Simon Says style game. 
                       Commands should be safe, fun, and appropriate for all ages. 
                       They should use only body movements and the ground (no props).
                       Output JSON array with exactly 25 commands.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          response_format: { type: 'json_object' }
        });

        // Parse the response
        const result = JSON.parse(response.choices[0].message.content);
        this.commands = result.commands || [];
        
        // Validate we got 25 commands
        if (this.commands.length !== 25) {
          console.warn(`Expected 25 commands but got ${this.commands.length}`);
          // Pad with backup commands if needed
          this.commands = this.padCommands(this.commands, playerCount);
        }
        
        // Organize commands for proper difficulty progression
        this.organizeCommands();
      }
      
      // Log all commands for debugging
      console.log('=== Generated Commands ===');
      if (players && players.length > 0) {
        console.log('LEFT TEAM COMMANDS:');
        this.teamCommands.left.forEach((cmd, index) => {
          console.log(`${index + 1}. [${cmd.difficulty.toUpperCase()}] ${cmd.text} (${cmd.estimatedTime}s)`);
        });
        console.log('\nRIGHT TEAM COMMANDS:');
        this.teamCommands.right.forEach((cmd, index) => {
          console.log(`${index + 1}. [${cmd.difficulty.toUpperCase()}] ${cmd.text} (${cmd.estimatedTime}s)`);
        });
      } else {
        this.commands.forEach((cmd, index) => {
          console.log(`${index + 1}. [${cmd.difficulty.toUpperCase()}] ${cmd.text} (${cmd.estimatedTime}s)`);
        });
      }
      console.log('=========================');

      return players ? this.teamCommands : this.commands;
      
    } catch (error) {
      console.error('Failed to generate commands:', error);
      // Return fallback commands if API fails
      this.commands = this.getFallbackCommands(playerCount);
      this.organizeCommands();
      
      // Log fallback commands for debugging
      console.log('=== Fallback Commands (API Failed) ===');
      this.commands.forEach((cmd, index) => {
        console.log(`${index + 1}. [${cmd.difficulty.toUpperCase()}] ${cmd.text} (${cmd.estimatedTime}s)`);
      });
      console.log('=====================================');
      
      return this.commands;
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Creates the prompt for OpenAI based on game configuration
   */
  createPrompt(playerCount, teams) {
    const teamNames = Object.values(teams);
    
    return `Create 25 unique physical commands for a Simon Says game with ${playerCount} players.
    Teams: ${teamNames.join(' vs ')}
    
    Requirements:
    - Mix of difficulty levels: 8 easy, 12 medium, 5 hard
    - Some commands for individuals, some for pairs/groups, some for whole team
    - Scale complexity based on ${playerCount} players:
      * 1-4 players: Focus on individual and pair activities
      * 5-15 players: Mix of small group coordination
      * 16+ players: Include mass coordination challenges
    - Make sure that commands are suited to ${playerCount/2} players at a time
    - Use only body movements and ground contact (no props)
    - Keep commands safe and appropriate for outdoor play
    - Commands should complete in 5-30 seconds
    
    Return as JSON with this structure:
    {
      "commands": [
        {
          "text": "Jump three times while clapping",
          "difficulty": "easy",
          "targetSize": "individual",
          "estimatedTime": 5
        },
        ...
      ]
    }`;
  }

  /**
   * Creates a prompt for team-specific commands using player names
   */
  createTeamPrompt(players, teamName) {
    const playerNames = players.map(p => p.name);
    const playerCount = players.length;
    
    return `Create 25 unique physical commands for Team ${teamName} in a Simon Says game.
    Team members: ${playerNames.join(', ')}
    
    Requirements:
    - Use player names in commands when appropriate (e.g., "Sarah, give Tom a high five")
    - Mix of difficulty levels: 8 easy, 12 medium, 5 hard
    - Some commands for specific individuals, some for pairs, some for the whole team
    - Scale complexity based on ${playerCount} players:
      * 1-2 players: Focus on individual activities with occasional interaction
      * 3-5 players: Mix of individual, pair, and small group activities
      * 6+ players: Include team coordination challenges
    - Use only body movements and ground contact (no props)
    - Keep commands safe and appropriate for outdoor play
    - Commands should complete in 5-30 seconds
    - Make commands personal and engaging by using names creatively
    
    Return as JSON with this structure:
    {
      "commands": [
        {
          "text": "${playerNames[0] || 'First player'}, jump three times while ${playerNames[1] || 'another player'} counts",
          "difficulty": "easy",
          "targetSize": "pair",
          "estimatedTime": 5
        },
        ...
      ]
    }`;
  }

  /**
   * Generate commands for a specific team
   */
  async generateTeamCommands(prompt, playerCount) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a creative game designer creating physical commands for a Simon Says style game. 
                     Commands should be safe, fun, personalized, and appropriate for all ages. 
                     Use player names to make commands engaging and specific.
                     Output JSON array with exactly 25 commands.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' }
      });
      
      const result = JSON.parse(response.choices[0].message.content);
      let commands = result.commands || [];
      
      // Validate we got 25 commands
      if (commands.length !== 25) {
        console.warn(`Expected 25 commands but got ${commands.length}`);
        // Pad with backup commands if needed
        commands = this.padTeamCommands(commands, playerCount);
      }
      
      // Organize commands for proper difficulty progression
      return this.organizeCommandsArray(commands);
      
    } catch (error) {
      console.error('Failed to generate team commands:', error);
      // Return generic fallback commands
      return this.getFallbackCommands(playerCount);
    }
  }

  /**
   * Pads command list to ensure we have exactly 25
   */
  padCommands(commands, playerCount) {
    const paddedCommands = [...commands];
    const basicCommands = this.getFallbackCommands(playerCount);
    
    while (paddedCommands.length < 25) {
      const index = paddedCommands.length % basicCommands.length;
      paddedCommands.push(basicCommands[index]);
    }
    
    return paddedCommands.slice(0, 25);
  }

  /**
   * Fallback commands if AI generation fails
   */
  getFallbackCommands(playerCount) {
    const commands = [
      // Easy commands
      { text: "Touch your toes", difficulty: "easy", targetSize: "individual", estimatedTime: 3 },
      { text: "Spin around three times", difficulty: "easy", targetSize: "individual", estimatedTime: 5 },
      { text: "Do five jumping jacks", difficulty: "easy", targetSize: "individual", estimatedTime: 5 },
      { text: "Stand on one foot for 5 seconds", difficulty: "easy", targetSize: "individual", estimatedTime: 5 },
      { text: "Clap your hands above your head 10 times", difficulty: "easy", targetSize: "individual", estimatedTime: 5 },
      { text: "Touch the ground then jump", difficulty: "easy", targetSize: "individual", estimatedTime: 3 },
      { text: "Wave with both hands", difficulty: "easy", targetSize: "individual", estimatedTime: 3 },
      { text: "March in place counting to 10", difficulty: "easy", targetSize: "individual", estimatedTime: 5 },
      
      // Medium commands
      { text: "High-five every teammate", difficulty: "medium", targetSize: "team", estimatedTime: 10 },
      { text: "Form a line from tallest to shortest", difficulty: "medium", targetSize: "team", estimatedTime: 15 },
      { text: "Everyone hop on one foot in a circle", difficulty: "medium", targetSize: "team", estimatedTime: 10 },
      { text: "Do a team huddle and shout your team name", difficulty: "medium", targetSize: "team", estimatedTime: 8 },
      { text: "Partner up and do mirror movements", difficulty: "medium", targetSize: "pair", estimatedTime: 10 },
      { text: "Create a human chain by holding hands", difficulty: "medium", targetSize: "team", estimatedTime: 10 },
      { text: "Everyone sit down then stand up together", difficulty: "medium", targetSize: "team", estimatedTime: 8 },
      { text: "Do the wave as a team", difficulty: "medium", targetSize: "team", estimatedTime: 10 },
      { text: "Form your team initial with your bodies", difficulty: "medium", targetSize: "team", estimatedTime: 15 },
      { text: "Everyone point to the youngest player", difficulty: "medium", targetSize: "team", estimatedTime: 5 },
      { text: "Link elbows and skip in a circle", difficulty: "medium", targetSize: "team", estimatedTime: 10 },
      { text: "Pat your head and rub your belly", difficulty: "medium", targetSize: "individual", estimatedTime: 5 },
      
      // Hard commands
      { text: "Form a human pyramid", difficulty: "hard", targetSize: "team", estimatedTime: 20 },
      { text: "Everyone do a synchronized dance move", difficulty: "hard", targetSize: "team", estimatedTime: 15 },
      { text: "Spell your team name with your bodies on the ground", difficulty: "hard", targetSize: "team", estimatedTime: 25 },
      { text: "Create a team sculpture that represents victory", difficulty: "hard", targetSize: "team", estimatedTime: 20 },
      { text: "Everyone must touch the ground with a different body part", difficulty: "hard", targetSize: "team", estimatedTime: 15 }
    ];

    // Adjust commands for larger groups
    if (playerCount > 15) {
      commands.push(
        { text: `Form a circle around the tallest player`, difficulty: "medium", targetSize: "team", estimatedTime: 15 },
        { text: `Create ${Math.floor(playerCount/3)} groups of 3 and pose`, difficulty: "hard", targetSize: "team", estimatedTime: 20 }
      );
    }

    return commands;
  }

  /**
   * Gets a random command of specified difficulty
   * 
   * @param {string} difficulty - 'easy', 'medium', or 'hard'
   * @returns {Object} Command object
   */
  getCommandByDifficulty(difficulty) {
    const filtered = this.commands.filter(cmd => cmd.difficulty === difficulty);
    if (filtered.length === 0) return this.commands[0]; // Fallback
    
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  /**
   * Shuffles array in place using Fisher-Yates algorithm
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Organizes commands for game progression
   * Ensures good difficulty distribution throughout the game
   */
  organizeCommands() {
    if (this.commands.length === 0) return;
    this.commands = this.organizeCommandsArray(this.commands);
  }

  /**
   * Organizes any command array for proper difficulty progression
   */
  organizeCommandsArray(commands) {
    if (commands.length === 0) return commands;
    
    // Separate commands by difficulty
    const easy = commands.filter(cmd => cmd.difficulty === 'easy');
    const medium = commands.filter(cmd => cmd.difficulty === 'medium');
    const hard = commands.filter(cmd => cmd.difficulty === 'hard');
    
    // Shuffle each difficulty group
    this.shuffleArray(easy);
    this.shuffleArray(medium);
    this.shuffleArray(hard);
    
    // Create a progression: start easy, mix in medium, end with hard
    const organized = [];
    
    // First 30% - mostly easy with occasional medium
    const earlyPhase = Math.floor(commands.length * 0.3);
    let easyIndex = 0, mediumIndex = 0, hardIndex = 0;
    
    for (let i = 0; i < earlyPhase; i++) {
      if (i % 4 === 3 && mediumIndex < medium.length) {
        organized.push(medium[mediumIndex++]);
      } else if (easyIndex < easy.length) {
        organized.push(easy[easyIndex++]);
      }
    }
    
    // Middle 40% - mix of easy and medium
    const midPhase = Math.floor(commands.length * 0.7);
    for (let i = organized.length; i < midPhase; i++) {
      if (i % 2 === 0 && mediumIndex < medium.length) {
        organized.push(medium[mediumIndex++]);
      } else if (easyIndex < easy.length) {
        organized.push(easy[easyIndex++]);
      } else if (mediumIndex < medium.length) {
        organized.push(medium[mediumIndex++]);
      }
    }
    
    // Final 30% - medium and hard
    for (let i = organized.length; i < commands.length; i++) {
      if (i % 3 >= 1 && hardIndex < hard.length) {
        organized.push(hard[hardIndex++]);
      } else if (mediumIndex < medium.length) {
        organized.push(medium[mediumIndex++]);
      } else if (hardIndex < hard.length) {
        organized.push(hard[hardIndex++]);
      } else if (easyIndex < easy.length) {
        organized.push(easy[easyIndex++]);
      }
    }
    
    return organized;
  }

  /**
   * Pads team commands to ensure we have exactly 25
   */
  padTeamCommands(commands, playerCount) {
    const paddedCommands = [...commands];
    const basicCommands = this.getFallbackCommands(playerCount);
    
    while (paddedCommands.length < 25) {
      const index = paddedCommands.length % basicCommands.length;
      paddedCommands.push(basicCommands[index]);
    }
    
    return paddedCommands.slice(0, 25);
  }

  /**
   * Gets the next unused command
   * 
   * @param {string} team - Optional team identifier ('left' or 'right')
   * @returns {Object} Command object or null if all used
   */
  getNextUnusedCommand(team = null) {
    // If we have team-specific commands and team is specified
    if (team && this.teamCommands[team] && this.teamCommands[team].length > 0) {
      const teamCommands = this.teamCommands[team];
      const usedCount = Array.from(this.usedCommandIndices).filter(idx => 
        idx >= (team === 'left' ? 0 : 25) && idx < (team === 'left' ? 25 : 50)
      ).length;
      
      if (usedCount >= teamCommands.length) {
        console.warn(`All commands for team ${team} have been used!`);
        return null;
      }
      
      const nextIndex = team === 'left' ? usedCount : 25 + usedCount;
      this.usedCommandIndices.add(nextIndex);
      return teamCommands[usedCount];
    }
    
    // Fallback to generic commands
    const nextIndex = this.usedCommandIndices.size;
    
    if (nextIndex >= this.commands.length) {
      console.warn('All commands have been used!');
      return null;
    }
    
    this.usedCommandIndices.add(nextIndex);
    return this.commands[nextIndex];
  }

  /**
   * Gets command for specific round, with increasing difficulty
   * 
   * @param {number} round - Current round number (0-indexed)
   * @param {number} totalRounds - Total number of rounds
   * @returns {Object} Command object
   */
  getCommandForRound(round, totalRounds) {
    // Simply get the next unused command (already organized by difficulty)
    return this.getNextUnusedCommand();
  }

  /**
   * Clears stored commands
   */
  reset() {
    this.commands = [];
    this.teamCommands = { left: [], right: [] };
    this.usedCommandIndices.clear();
    this.isGenerating = false;
  }
}

// Export singleton instance
const commandGenerator = new CommandGenerator();

// Expose to global Game object for debugging
if (typeof window !== 'undefined') {
  window.Game = window.Game || {};
  window.Game.commandGenerator = commandGenerator;
}

export default commandGenerator;