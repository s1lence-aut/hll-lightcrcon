import './config.mjs';
import fetch from 'node-fetch';

const API_BASE_URL = process.env.RCON_API_BASE_URL;
const API_TOKEN = process.env.RCON_API_TOKEN;

export async function getPlayers() {
    const url = `${API_BASE_URL}/api/get_players`;
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`
            }
        });
        if (response.status !== 200) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('API response:', data); // Log the response to see its structure

        if (Array.isArray(data.result)) {
            return data.result.map(player => ({
                name: player.name,
                player_id: player.player_id,
                is_vip: player.is_vip
            }));
        } else {
            throw new Error('Unexpected response format');
        }
    } catch (error) {
        console.error('Error fetching player data:', error);
        throw error;
    }
}

export async function doMessagePlayer(player, player_id, message) {
    const url = `${API_BASE_URL}/api/message_player`;
    const data = {
        player_name: player,
        player_id: player_id,
        message,
        save_message: true
    };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (response.status !== 200) {
            throw new Error(`Failed to send message: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error sending message to player ${player}:`, error);
        throw error;
    }
}

export async function doKickPlayer(player, player_id, reason) {
    const url = `${API_BASE_URL}/api/kick`;
    const data = {
        player_name: player,
        player_id: player_id,
        reason,
        by: "Admin"
    };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (response.status !== 200) {
            throw new Error(`Failed to kick player: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error kicking player ${player}:`, error);
        throw error;
    }
}
