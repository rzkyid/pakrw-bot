require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, AudioPlayer } = require('@discordjs/voice');
const { Configuration, OpenAIApi } = require('openai');
const fs = require('fs');
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
const GUILD_ID = process.env.GUILD_ID;
const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

// Untuk menyimpan status player
let player;
let connection;

// Konfigurasi Bot untuk Play Audio
function playAudio(guild, channelId) {
    const channel = guild.channels.cache.get(channelId);
    if (!channel || channel.type !== 'GUILD_VOICE') {
        console.error('Channel tidak ditemukan atau bukan voice channel');
        return;
    }

    try {
        // Bergabung ke voice channel dan mengaktifkan mode deafen
        connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
        });

        connection.on(VoiceConnectionStatus.Ready, () => {
            console.log('Bot telah siap untuk memutar audio!');
        });

        connection.on(VoiceConnectionStatus.Disconnected, () => {
            console.log('Bot terputus dari voice channel!');
        });

        connection.on(VoiceConnectionStatus.Destroyed, () => {
            console.log('Koneksi dihancurkan!');
        });

        // Mode deafen untuk bot
        const botMember = channel.guild.members.cache.get(client.user.id);
        if (botMember) botMember.voice.setDeaf(true);

        // Membuat audio player
        player = createAudioPlayer();

        // Menambahkan file audio ke audio resource
        const resource = createAudioResource(path.join(__dirname, 'audio', 'your-audio-file.mp3'), {
            inputType: AudioPlayerInputType.Arbitrary,
        });

        player.play(resource);

        // Menambahkan player ke voice connection
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Playing, () => {
            console.log('Audio sedang diputar');
        });

        player.on(AudioPlayerStatus.Idle, () => {
            console.log('Audio selesai, memulai lagi...');
            player.play(resource); // Replay audio untuk 24/7
        });
    } catch (error) {
        console.error('Gagal memutar audio:', error);
    }
}

// Respons Otomatis dan Logging
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

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
    // (Tambahkan respons otomatis lainnya sesuai kebutuhan)

    // Perintah untuk mulai memutar audio
    if (message.content.startsWith(`${PREFIX}play`)) {
        const guild = message.guild;
        if (!guild) {
            message.reply('Bot ini hanya bisa dijalankan di server!');
            return;
        }

        // Memastikan bot sudah berada di voice channel yang sesuai
        playAudio(guild, VOICE_CHANNEL_ID);
        message.reply('Memutar audio 24/7 di voice channel!');
    }

    // Perintah untuk stop audio
    if (message.content.startsWith(`${PREFIX}stop`)) {
        if (player) {
            player.stop();
            connection.destroy();
            message.reply('Audio berhenti dan bot keluar dari voice channel.');
        } else {
            message.reply('Tidak ada audio yang sedang diputar!');
        }
    }

    // Perintah untuk deafen bot
    if (message.content.startsWith(`${PREFIX}deafen`)) {
        const guild = message.guild;
        const botMember = guild.members.cache.get(client.user.id);
        if (botMember) {
            botMember.voice.setDeaf(true);
            message.reply('Bot telah di-deafen.');
        }
    }

    // Perintah untuk undeafen bot
    if (message.content.startsWith(`${PREFIX}undeafen`)) {
        const guild = message.guild;
        const botMember = guild.members.cache.get(client.user.id);
        if (botMember) {
            botMember.voice.setDeaf(false);
            message.reply('Bot telah di-undeafen.');
        }
    }
});

// Login ke bot
client.login(TOKEN);
