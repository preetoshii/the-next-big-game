# Simon Says Audio Game Requirements

## Overview
A team-based Simon Says game where an AI Simon gives commands to teams of human players through audio output (TTS). Players complete physical challenges with increasing difficulty and speed.

## Game Flow

### Phase 1: Player Setup
- **Player Registration Interface**
  - Single page UI for all players to input their names
  - Each player name on a separate row
  - Drag-and-drop functionality to assign players to teams (Left/Right)
  - Team name customization (default: "Red" and "Blue")
  - No minimum player requirement (can play with 1 player)
  - Teams can be unbalanced

### Phase 2: Game Configuration
- **Configurable Settings**
  - Number of rounds (default: 10, no min/max limits except 0)
  - Initial command time limit (default: 20 seconds, developer-configurable)
  - Time decrease rate (linear progression)
- **Play button** to start the game

### Phase 3: Command Generation
- **Triggered on Play button press**
- Generate 25 commands using OpenAI API (gpt-3.5-turbo or similar fast model)
- **Command Categories by Difficulty**
  - Easy: Simple individual movements
  - Medium: Team coordination activities
  - Hard: Complex multi-person interactions
- **Command Scaling**
  - Adapt to number of players
  - Small groups (2-4): Partner activities ("Pick up your partner")
  - Medium groups (5-20): Team coordination
  - Large groups (20+): Mass coordination ("Form a circle around [player]")
- **Command Constraints**
  - Body movement only (no external props)
  - Ground can be used as a prop
  - Safety-conscious (reasonable physical activities)
  - May specify number of participants when relevant

### Phase 4: Gameplay
- **Simon Agent Behavior**
  - Alternates commands between teams
  - Format: "Alright, Team [Name]... [command]!"
  - Speech speed increases as game progresses
  - Uses pre-generated commands from Phase 3
- **Timer System**
  - Visual countdown display (for debugging)
  - Time limit decreases linearly each round
  - No automated failure detection (human self-policing)
- **Progression**
  - Commands increase in difficulty
  - Time limits decrease
  - Speech speed increases

## Technical Requirements

### Frontend
- React-based single page application
- Drag-and-drop for team assignment
- Visual timer display
- Responsive design for various screen sizes

### Audio System
- Web Audio API for Text-to-Speech
- Default system voice
- Variable speech rate control
- Optional sound effects for timer/transitions

### AI Integration
- OpenAI API for command generation
- Model: gpt-3.5-turbo (or fastest available)
- One-time generation at game start
- Offline-capable after initial generation

### Data Structure
- Player names and team assignments
- Generated commands with difficulty levels
- Game state (current round, active team, time remaining)
- Configuration settings

## Non-Functional Requirements

### Performance
- Instant response to user actions
- Smooth drag-and-drop interactions
- No lag in audio playback

### Accessibility
- Clear visual indicators for team assignment
- Large, readable text for player names
- High contrast timer display

### Scalability
- Support 1-100+ players
- Efficient command generation regardless of player count
- Responsive UI that handles many player names

## Future Considerations
- Scoring system (currently human-managed)
- Failure penalties (currently human-determined)
- Win conditions (currently human-determined)
- Command history tracking
- Game replay functionality

## Development Variables
Key configurable parameters for developers:
- `INITIAL_TIME_LIMIT`: Starting seconds per command (default: 20)
- `TIME_DECREASE_RATE`: Seconds reduced per round
- `DEFAULT_ROUNDS`: Number of rounds (default: 10)
- `SPEECH_RATE_INCREASE`: Rate multiplier per round
- `COMMAND_COUNT`: Total commands to generate (default: 25)