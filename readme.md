# LightCRCON: Discord CRCON Tool

This Discord bot provides an interface for managing and interacting with a Hell let Loose CRCON Server.
It allows server administrators to view player lists, send messages to one or all players and kick players directly from Discord.

## Features

- **Player List**: Generate and refresh a list of current players on the game server.
- **VIP Highlighting**: VIP players are highlighted in the player list.
- **Player Messaging**: Send messages to individual players (manually) or broadcast to all players
- **Player Kicking**: Kick players from the server with a specified reason (manually)
- **Steam Profile Links**: Quick access to players Steam profiles.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)
- A Discord bot token
- Access to a HLL CRCON Server
- CRCON API Token

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/s1lence-aut/hll-lightcrcon.git
   cd hll-lightcrcon
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   DISCORD_BOT_TOKEN=your_discord_bot_token_here
   ALLOWED_CHANNEL_ID=your_discord_channel_id_here
   RCON_API_BASE_URL=your_game_server_api_base_url
   RCON_API_TOKEN=your_crcon_api_token
   ```

   Replace the placeholder values with your actual Discord bot token, channel ID, and game server CRCON API details.

## Usage

To start the bot, run:

```
node main.mjs
```

Once the bot is running and connected to Discord, it will clear the specified channel and post a message with buttons for different actions.

### Commands

The bot uses button interactions instead of text commands. Available actions:

- **Generate New Player List**: Fetches and displays the current list of players on the server.
- **Refresh**: Updates the existing player list.
- **Message@ALL**: Opens a modal to send a message to all players on the server.
- **Message**: Opens a modal to send a message to a specific player.
- **Kick**: Opens a modal to kick a specific player from the server.

## Configuration

The bot's behavior can be customized by modifying the following files:

- `config.mjs`: Contains environment variable configurations.
- `apiClient.mjs`: Handles communication with the CRCON API.
- `logger.mjs`: Configures logging for the application.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)

## Disclaimer

This bot is not affiliated with or endorsed by Discord or any game company. Use it responsibly and in accordance with Discord's Terms of Service and your game server's rules.
