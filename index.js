
require('dotenv').config();
const { Client, Intents, GatewayIntentBits } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');

// Konfigurasi API OpenAI
const openaiConfig = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(openaiConfig);

// Token Bot Discord
const TOKEN = process.env.DISCORD_TOKEN;

// Konfigurasi Bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
    ],
});

const PREFIX = 'rw';
const GUILD_ID = process.env.GUILD_ID;
const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

// Bot Siap
client.once('ready', async () => {
    console.log(`${client.user.tag} is online and ready!`);

    // Bergabung ke Voice Channel
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
        console.error('Guild not found!');
        return;
    }

    const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);
    if (!channel || channel.type !== 2) { // 2 = Voice Channel
        console.error('Voice channel not found or invalid!');
        return;
    }

    try {
        await channel.join();
        console.log('Bot joined the voice channel.');
    } catch (error) {
        console.error('Failed to join voice channel:', error);
    }
});

// Respons Otomatis dan Logging
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Logging penggunaan perintah
    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel && message.content.startsWith(PREFIX)) {
        logChannel.send(`[LOG] ${message.author.tag} menggunakan perintah: ${message.content}`);
    }

    // Respons otomatis untuk kata kunci "Welcome"
    if (message.content.toLowerCase().includes('welcome')) {
        message.channel.send('Selamat datang warga baru! Semoga betah jadi warga di sini, join voice sini biar makin akrab.');
    }

    // Perintah untuk ngobrol dengan ChatGPT
    if (message.content.startsWith(`${PREFIX}chat`)) {
        const query = message.content.slice(`${PREFIX}chat`.length).trim();
        if (!query) {
            message.reply('Ketikkan sesuatu untuk saya jawab!');
            return;
        }

        try {
            const response = await openai.createCompletion({
                model: 'text-davinci-003',
                prompt: query,
                max_tokens: 200,
            });

            const reply = response.data.choices[0].text.trim();
            message.reply(reply);
        } catch (error) {
            console.error('Error with OpenAI API:', error);
            message.reply('Maaf, saya mengalami masalah saat mencoba menjawab pertanyaan Anda.');
        }
    }
});

// Login ke bot
client.login(TOKEN);
