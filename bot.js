require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { Configuration, OpenAIApi } = require('openai');
const express = require('express');
const path = require('path');

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
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

// Konfigurasi Express untuk menangani port
const app = express();
const PORT = process.env.PORT || 3000;

// Routing dasar untuk memastikan aplikasi web berjalan
app.get('/', (req, res) => {
    res.send('Bot Discord berjalan!');
});

app.listen(PORT, () => {
    console.log(`Server Express berjalan di port ${PORT}`);
});

// Untuk menyimpan status player
let player;
let connection;

// Fungsi untuk memutar audio di voice channel
async function playAudio(channel) {
    try {
        // Bergabung ke voice channel
        connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        // Membuat player
        player = createAudioPlayer();

        // Membuat resource dengan volume 10% (0.1)
        const resource = createAudioResource(path.join(__dirname, 'audio', 'desa.mp3'), {
            inlineVolume: true, // Mengaktifkan kontrol volume
        });
        resource.volume.setVolume(0.01); // Mengatur volume ke 10%

        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Playing, () => {
            console.log('Audio sedang diputar.');
        });

        // Replay otomatis saat audio selesai
        player.on(AudioPlayerStatus.Idle, () => {
            console.log('Audio selesai, memulai ulang...');
            const newResource = createAudioResource(resourcePath, { inlineVolume: true });
            newResource.volume.setVolume(0.01);
            player.play(newResource); // Memulai ulang audio
        });

        connection.on('error', (error) => {
            console.error('Kesalahan pada koneksi:', error);
        });
    } catch (error) {
        console.error('Gagal memutar audio:', error);
    }
}

// Bot Siap
client.once('ready', async () => {
    console.log(`${client.user.tag} is online and ready!`);
});
    // Menambahkan custom status
    const statusMessages = ["👀 Sedang Memantau", "👥 Warga Gang Desa"];
    const statusTypes = [ 'dnd', 'idle'];
    let currentStatusIndex = 0;
    let currentTypeIndex = 0;


// Respons Otomatis dan Logging
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Logging penggunaan perintah
    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel && message.content.startsWith(PREFIX)) {
        logChannel.send(`[LOG] ${message.author.tag} menggunakan perintah: ${message.content}`);
    }

    // Perintah untuk bergabung ke voice channel dan memutar audio
    if (message.content.startsWith(`${PREFIX}join`)) {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            message.reply('Anda harus berada di voice channel untuk menggunakan perintah ini.');
            return;
        }

        await playAudio(voiceChannel);
        message.reply('Pak RW telah bergabung ke channel.');
    }

    // Perintah untuk keluar dari voice channel
    if (message.content.startsWith(`${PREFIX}leave`)) {
        if (connection) {
            connection.destroy();
            connection = null;
            player = null;
            message.reply('Pak RW telah keluar dari voice channel.');
        } else {
            message.reply('Pak RW tidak berada di voice channel.');
        }
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
    if (message.content.toLowerCase().includes('pagi')) {
        message.reply('Selamat pagi juga kak! Kamu tuh kaya alarm, suka bangunin hati aku biar terus inget kamu. <:Kiss:1099424790474915912>');
    }
    if (message.content.toLowerCase().includes('siang')) {
        message.reply('Selamat siang juga kak! Siang ini panas, tapi cuma kamu yang bikin hati aku meleleh. Kirim papnya dong di <#1100632084051140669> hehe <:Uwu:1291831737609097338>');
    }
    if (message.content.toLowerCase().includes('sore')) {
        message.reply('Selamat sore juga kak! Matahari boleh tenggelam, tapi rasa sayang aku ke kamu nggak pernah hilang <:Uwu:1291831737609097338>');
    }
    if (message.content.toLowerCase().includes('malam')) {
        message.reply('Selamat malam juga kak! Aku ada pantun nih buat kamu. Mentari terbenam di tepi pantai, Ombak datang menyapa riang. Malam ini hati terasa damai, Karena kamu selalu di pikiranku sayang. Anjayyy gombal <:Love:1291831704171970612>');
    }

    // Perintah untuk ngobrol dengan ChatGPT
    if (message.content.startsWith(`${PREFIX}tanya`)) {
        const query = message.content.slice(`${PREFIX}tanya`.length).trim();
        if (!query) {
            message.reply('Tanyain aja, nanti Pak RW jawab');
            return;
        }

        try {
            const response = await openai.createChatCompletion({
                model: 'gpt-3.5-turbo', // Menggunakan GPT-3.5
                messages: [
                    {
                        role: 'user',
                        content: query, // Pertanyaan dari pengguna
                    },
                ],
            });

            const reply = response.data.choices[0].message.content.trim();
            message.reply(reply);
        } catch (error) {
            console.error('Error with OpenAI API:', error);
            message.reply('Maaf, Pak RW lagi bingung nih sama pertanyaannya');
        }
    }

});

// Login ke bot
client.login(TOKEN);
