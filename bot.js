require('dotenv').config();
const { Client, Intents, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
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
    if (!channel) {
        console.error('Voice channel not found!');
        return;
    }

    if (channel.type !== 'GUILD_VOICE') {
        console.error('The channel is not a voice channel!');
        return;
    }

    try {
        // Bergabung ke voice channel
        joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
        });
        console.log('Bot joined the voice channel.');
    } catch (error) {
        console.error('Failed to join voice channel:', error);
    }
});

// Respons Otomatis dan Logging
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Logging untuk Guild dan Channel
    console.log('Guild ID:', GUILD_ID);
    console.log('Voice Channel ID:', VOICE_CHANNEL_ID);

    // Logging penggunaan perintah
    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel && message.content.startsWith(PREFIX)) {
        logChannel.send(`[LOG] ${message.author.tag} menggunakan perintah: ${message.content}`);
    }

    // Respons otomatis untuk kata kunci
    if (message.content.toLowerCase().includes('welcome')) {
        message.reply('Selamat datang warga baru! Semoga betah jadi warga di sini, join voice sini biar makin akrab. <:OkeSip:1291831721313964053>');
    }
    if (message.content.toLowerCase().includes('halo')) {
        message.reply('Halo juga kak! Gabung sini ke voice biar makin akrab hehe <:Hehe:1099424821974151310>');
    }
    if (message.content.toLowerCase().includes('mabar')) {
        message.reply('Buat yang mau mabar bisa cari di https://discord.com/channels/1052115524273836176/1052428628819984424 ya jangan lupa tag role game yang mau dimainin <:OkeSip:1291831721313964053>');
    }
    if (message.content.toLowerCase().includes('salam kenal')) {
        message.reply('Salam kenal juga kak! Dengan kakak siapa nich? <:Halo:1291831692025397270>');
    }
    if (message.content.toLowerCase().includes('donasi')) {
        message.reply('Kalau mau jadi donatur server bisa cek https://discord.com/channels/1052115524273836176/1221385772351881286 yaaa <:Wink:1099424794350473216>');
    }
    if (message.content.toLowerCase().includes('jodoh')) {
        message.reply('Buat yang mau cari jodoh bisa langsung aja ke <#1284544825596837971> <:Love:1291831704171970612>');
    }

    // Perintah untuk ngobrol dengan ChatGPT
    if (message.content.startsWith(`${PREFIX}tanya`)) {
        const query = message.content.slice(`${PREFIX}tanya`.length).trim();
        if (!query) {
            message.reply('Tanyain aja, nanti Pak RW jawab');
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
            message.reply('Maaf, Pak RW lagi bingung nih sama pertanyaannya');
        }
    }
});

// Login ke bot
client.login(TOKEN);
