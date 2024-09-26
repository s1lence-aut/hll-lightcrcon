import './config.mjs';
import { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { getPlayers, doMessagePlayer, doKickPlayer } from './apiClient.mjs';
import logger from './logger.mjs';

// Generate a unique prefix using the current timestamp
const uniquePrefix = Date.now().toString();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction
    ]
});

const allowedChannelId = process.env.ALLOWED_CHANNEL_ID;
let botMessageIds = []; // To store bot message IDs

// Function to clear all messages in a channel
async function clearChannel(channel) {
    let message;
    do {
        const messages = await channel.messages.fetch({ limit: 100 });
        if (messages.size === 0) break;
        message = messages.first();
        await Promise.all(messages.map(m => m.delete()));
    } while (message);
    logger.info('Channel cleared successfully');
}

function splitMessage(message, maxLength) {
    const parts = [];
    let currentPart = '';
    message.split('\n').forEach(line => {
        if ((currentPart + line).length > maxLength) {
            parts.push(currentPart);
            currentPart = line + '\n';
        } else {
            currentPart += line + '\n';
        }
    });
    if (currentPart) {
        parts.push(currentPart);
    }
    return parts;
}

client.once('ready', async () => {
    logger.info('Bot is ready!');

    try {
        const channel = await client.channels.fetch(allowedChannelId);
        if (channel && channel.type === ChannelType.GuildText) {
            // Clear the channel before starting
            await clearChannel(channel);

            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${uniquePrefix}_fetch_usernames`)
                        .setLabel('Generate New Player List')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`${uniquePrefix}_refresh_usernames`)
                        .setLabel('Refresh')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`${uniquePrefix}_message_all`)
                        .setLabel('Message@ALL')
                        .setStyle(ButtonStyle.Danger)
                );

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${uniquePrefix}_message_player`)
                        .setLabel('Message')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`${uniquePrefix}_kick_player`)
                        .setLabel('Kick')
                        .setStyle(ButtonStyle.Danger)
                );

            const message = await channel.send({ components: [row1, row2] });
            botMessageIds.push(message.id);
        } else {
            logger.error('The specified channel is not a text channel.');
        }
    } catch (error) {
        logger.error('Error fetching the channel:', error);
    }
});

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isButton()) {
            const channel = await client.channels.fetch(allowedChannelId);

            if (interaction.customId === `${uniquePrefix}_fetch_usernames`) {
                await interaction.deferUpdate();

                try {
                    logger.info('Button clicked. Fetching usernames...');
                    const players = await getPlayers();
                    players.sort((a, b) => {
                        if (b.is_vip !== a.is_vip) {
                            return b.is_vip - a.is_vip;
                        }
                        return a.name.localeCompare(b.name);
                    });

                    const replyContent = `# Players on Server\n\n${players.map(player => {
                        const vipTag = player.is_vip ? '**(VIP)** ' : '';
                        const profileLink = `[Profile](<https://steamcommunity.com/profiles/${player.steam_id_64}>)`;
                        return `${vipTag}${player.name} - ${profileLink}`;
                    }).join('\n')}`;

                    const messageParts = splitMessage(replyContent, 2000);

                    botMessageIds = []; // Clear previous message IDs
                    for (const part of messageParts) {
                        const message = await channel.send(part);
                        botMessageIds.push(message.id);
                    }

                    const row1 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`${uniquePrefix}_fetch_usernames`)
                                .setLabel('Generate New Player List')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`${uniquePrefix}_refresh_usernames`)
                                .setLabel('Refresh')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId(`${uniquePrefix}_message_all`)
                                .setLabel('Message@ALL')
                                .setStyle(ButtonStyle.Danger)
                        );

                    const row2 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`${uniquePrefix}_message_player`)
                                .setLabel('Message')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`${uniquePrefix}_kick_player`)
                                .setLabel('Kick')
                                .setStyle(ButtonStyle.Danger)
                        );

                    const message = await channel.send({ components: [row1, row2] });
                    botMessageIds.push(message.id);
                } catch (error) {
                    logger.error('Error fetching usernames from API:', error);
                    await interaction.followUp({ content: 'Error fetching usernames from server.', ephemeral: true });
                }
            } else if (interaction.customId === `${uniquePrefix}_refresh_usernames`) {
                await interaction.deferUpdate();

                try {
                    logger.info('Button clicked. Refreshing usernames...');
                    const players = await getPlayers();
                    players.sort((a, b) => {
                        if (b.is_vip !== a.is_vip) {
                            return b.is_vip - a.is_vip;
                        }
                        return a.name.localeCompare(b.name);
                    });

                    const replyContent = `# Players on Server\n\n${players.map(player => {
                        const vipTag = player.is_vip ? '**(VIP)** ' : '';
                        const profileLink = `[Profile](<https://steamcommunity.com/profiles/${player.steam_id_64}>)`;
                        return `${vipTag}${player.name} - ${profileLink}`;
                    }).join('\n')}`;

                    const messageParts = splitMessage(replyContent, 2000);

                    for (let i = 0; i < messageParts.length; i++) {
                        const part = messageParts[i];
                        const messageId = botMessageIds[i];
                        const message = await channel.messages.fetch(messageId);
                        await message.edit(part);
                    }

                    const row1 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`${uniquePrefix}_fetch_usernames`)
                                .setLabel('Generate New Player List')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`${uniquePrefix}_refresh_usernames`)
                                .setLabel('Refresh')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId(`${uniquePrefix}_message_all`)
                                .setLabel('Message@ALL')
                                .setStyle(ButtonStyle.Danger)
                        );

                    const row2 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`${uniquePrefix}_message_player`)
                                .setLabel('Message')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`${uniquePrefix}_kick_player`)
                                .setLabel('Kick')
                                .setStyle(ButtonStyle.Danger)
                        );

                    for (let i = messageParts.length; i < botMessageIds.length; i++) {
                        const messageId = botMessageIds[i];
                        const message = await channel.messages.fetch(messageId);
                        await message.edit({ components: [row1, row2] });
                    }

                    botMessageIds = botMessageIds.slice(0, messageParts.length);
                } catch (error) {
                    logger.error('Error refreshing usernames from API:', error);
                    await interaction.followUp({ content: 'Error refreshing usernames from server.', ephemeral: true });
                }
            } else if (interaction.customId === `${uniquePrefix}_message_all`) {
                const modal = new ModalBuilder()
                    .setCustomId(`${uniquePrefix}_message_all_modal`)
                    .setTitle('Message to all players');

                const messageInput = new TextInputBuilder()
                    .setCustomId(`${uniquePrefix}_message_input`)
                    .setLabel('Message')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                const actionRow = new ActionRowBuilder().addComponents(messageInput);
                modal.addComponents(actionRow);

                await interaction.showModal(modal);
            } else if (interaction.customId === `${uniquePrefix}_message_player`) {
                const modal = new ModalBuilder()
                    .setCustomId(`${uniquePrefix}_message_player_modal`)
                    .setTitle('Message to a player');

                const usernameInput = new TextInputBuilder()
                    .setCustomId(`${uniquePrefix}_username_input`)
                    .setLabel('Username')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const messageInput = new TextInputBuilder()
                    .setCustomId(`${uniquePrefix}_message_input`)
                    .setLabel('Message')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                const usernameActionRow = new ActionRowBuilder().addComponents(usernameInput);
                const messageActionRow = new ActionRowBuilder().addComponents(messageInput);

                modal.addComponents(usernameActionRow, messageActionRow);

                await interaction.showModal(modal);
            } else if (interaction.customId === `${uniquePrefix}_kick_player`) {
                const modal = new ModalBuilder()
                    .setCustomId(`${uniquePrefix}_kick_player_modal`)
                    .setTitle('Kick player');

                const usernameInput = new TextInputBuilder()
                    .setCustomId(`${uniquePrefix}_username_input`)
                    .setLabel('Username')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const reasonInput = new TextInputBuilder()
                    .setCustomId(`${uniquePrefix}_reason_input`)
                    .setLabel('Reason')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                const usernameActionRow = new ActionRowBuilder().addComponents(usernameInput);
                const reasonActionRow = new ActionRowBuilder().addComponents(reasonInput);

                modal.addComponents(usernameActionRow, reasonActionRow);

                await interaction.showModal(modal);
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === `${uniquePrefix}_message_all_modal`) {
                await interaction.deferReply({ ephemeral: true });

                const message = interaction.fields.getTextInputValue(`${uniquePrefix}_message_input`);
                try {
                    const players = await getPlayers();

                    for (const player of players) {
                        try {
                            await doMessagePlayer(player.name, player.steam_id_64, message);
                            logger.info(`Message sent to ${player.name}`);
                        } catch (error) {
                            logger.error(`Error sending message to ${player.name}:`, error);
                        }
                    }

                    await interaction.followUp({ content: 'All messages sent successfully', ephemeral: true });
                } catch (error) {
                    logger.error('Error sending messages to all players:', error);
                    await interaction.followUp({ content: 'Error sending messages to all players.', ephemeral: true });
                }
            } else if (interaction.customId === `${uniquePrefix}_message_player_modal`) {
                await interaction.deferReply({ ephemeral: true });

                const username = interaction.fields.getTextInputValue(`${uniquePrefix}_username_input`);
                const message = interaction.fields.getTextInputValue(`${uniquePrefix}_message_input`);
                try {
                    const players = await getPlayers();
                    const player = players.find(p => p.name === username);

                    if (player) {
                        try {
                            await doMessagePlayer(player.name, player.steam_id_64, message);
                            logger.info(`Message sent to ${player.name}`);
                            await interaction.followUp({ content: `Message successfully sent to ${player.name}`, ephemeral: true });
                        } catch (error) {
                            logger.error(`Error sending message to ${player.name}:`, error);
                            await interaction.followUp({ content: `Error sending message to ${player.name}: ${error.message}`, ephemeral: true });
                        }
                    } else {
                        await interaction.followUp({ content: `Player ${username} not found`, ephemeral: true });
                    }
                } catch (error) {
                    logger.error('Error fetching players:', error);
                    await interaction.followUp({ content: 'Error fetching players from server.', ephemeral: true });
                }
            } else if (interaction.customId === `${uniquePrefix}_kick_player_modal`) {
                await interaction.deferReply({ ephemeral: true });

                const username = interaction.fields.getTextInputValue(`${uniquePrefix}_username_input`);
                const reason = interaction.fields.getTextInputValue(`${uniquePrefix}_reason_input`);
                try {
                    const players = await getPlayers();
                    const player = players.find(p => p.name === username);

                    if (player) {
                        try {
                            await doKickPlayer(player.name, player.steam_id_64, reason);
                            logger.info(`Player ${player.name} kicked`);
                            await interaction.followUp({ content: `Player ${player.name} successfully kicked`, ephemeral: true });
                        } catch (error) {
                            logger.error(`Error kicking ${player.name}:`, error);
                            await interaction.followUp({ content: `Error kicking ${player.name}: ${error.message}`, ephemeral: true });
                        }
                    } else {
                        await interaction.followUp({ content: `Player ${username} not found`, ephemeral: true });
                    }
                } catch (error) {
                    logger.error('Error fetching players:', error);
                    await interaction.followUp({ content: 'Error fetching players from server.', ephemeral: true });
                }
            }
        }
    } catch (error) {
        logger.error('Unexpected error during interaction:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'An error occurred while processing your interaction.', ephemeral: true });
        }
    }
});

client.on('error', error => {
    logger.error('Client error:', error);
});

client.login(process.env.DISCORD_BOT_TOKEN);
