require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, MessageAttachment, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Konfigurasi API Gemini AI
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/chat/completions";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

// Channel yang diizinkan untuk autoresponder
const ALLOWED_CHANNELS = [
    '1052124921817464883', // ID Channel Pengaturan Bot
    '1052123058678276106', // ID Channel Chat Warga
    '1307965374511190068', // ID Channel Tanya Pak RW
    '1307965818654560368', // ID Channel Kantor Pejabat
];
const CONFESSIONS_CHANNEL_ID = '1221377162020651008';


// Prefix
const PREFIX = 'rw';
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

// Konfigurasi Express untuk menangani port
const app = express();
const PORT = process.env.PORT || 3000;

// Routing dasar untuk memastikan aplikasi web berjalan
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'index.html');
    res.sendFile(filePath);
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
        const audioPath = path.join(__dirname, 'audio', 'desa.mp3');
        // Bergabung ke voice channel
        connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        // Membuat player
        player = createAudioPlayer();
        connection.subscribe(player);

        const playResource = () => {
            const resource = createAudioResource(audioPath, {
                inlineVolume: true,
            });
            resource.volume.setVolume(0.075); // Atur volume ke 7.5%
            player.play(resource);
        };
        // Mulai pemutaran audio
        playResource();

        player.on(AudioPlayerStatus.Idle, () => {
            console.log('Audio selesai, memulai ulang...');
            playResource(); // Ulangi pemutaran audio
        });

        player.on('error', (error) => {
            console.error('Kesalahan pada audio player:', error);
        });

        connection.on('error', (error) => {
            console.error('Kesalahan pada koneksi voice channel:', error);
        });

        console.log('Audio sedang diputar di voice channel.');
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
const statusTypes = [ 'online'];
let currentStatusIndex = 0;
let currentTypeIndex = 0;

async function login() {
  try {
    await client.login(process.env.TOKEN);
    console.log('\x1b[36m[ LOGIN ]\x1b[0m', `\x1b[32mLogged in as: ${client.user.tag} ✅\x1b[0m`);
    console.log('\x1b[36m[ INFO ]\x1b[0m', `\x1b[35mBot ID: ${client.user.id} \x1b[0m`);
    console.log('\x1b[36m[ INFO ]\x1b[0m', `\x1b[34mConnected to ${client.guilds.cache.size} server(s) \x1b[0m`);
  } catch (error) {
    console.error('\x1b[31m[ ERROR ]\x1b[0m', 'Failed to log in:', error);
    process.exit(1);
  }
}

function updateStatus() {
  const currentStatus = statusMessages[currentStatusIndex];
  const currentType = statusTypes[currentTypeIndex];
  client.user.setPresence({
    activities: [{ name: currentStatus, type: ActivityType.Custom }],
    status: currentType,
  });
  console.log('\x1b[33m[ STATUS ]\x1b[0m', `Updated status to: ${currentStatus} (${currentType})`);
  currentStatusIndex = (currentStatusIndex + 1) % statusMessages.length;
  currentTypeIndex = (currentTypeIndex + 1) % statusTypes.length;
}

function heartbeat() {
  setInterval(() => {
    console.log('\x1b[35m[ HEARTBEAT ]\x1b[0m', `Bot is alive at ${new Date().toLocaleTimeString()}`);
  }, 30000);
}

client.once('ready', () => {
  console.log('\x1b[36m[ INFO ]\x1b[0m', `\x1b[34mPing: ${client.ws.ping} ms \x1b[0m`);
  updateStatus();
  setInterval(updateStatus, 10000);
  heartbeat();
});

// Fitur Curhat
let confessionCounter = 1;

const createCurhatButton = () => {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('curhat_yuk')
            .setLabel('Curhat Yuk')
            .setStyle(ButtonStyle.Primary)
    );
};

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'curhat_yuk') {
            await interaction.reply({
                content: 'Ketik curhatmu secara anonim dengan mengetik `rwcurhat <isi_curhat>`!',
                ephemeral: true,
            });
        } else if (interaction.customId.startsWith('reply_')) {
            const confessionId = interaction.customId.split('_')[1];
            await interaction.reply({
                content: `Ketik balasanmu untuk curhat #${confessionId} dengan mengetik \`rwreply ${confessionId} <isi_balasan>\`!`,
                ephemeral: true,
            });
        }
    }
});

client.on('messageCreate', async (message) => {
    // Perintah rwcurhat
    if (message.content.startsWith('rwcurhat')) {
        const confession = message.content.slice(9).trim();

        if (!confession) {
            await message.reply('Curhatmu kosong! Ketik `rwcurhat <isi_curhat>` untuk mengirim curhat.');
            return;
        }

        const channel = client.channels.cache.get(CONFESSIONS_CHANNEL_ID);

        if (!channel) {
            await message.reply('Channel curhat tidak ditemukan! Pastikan bot memiliki akses ke channel tersebut.');
            return;
        }

        const embed = new EmbedBuilder()
            .setColor('#ff69b4')
            .setTitle(`Anonymous Confession (#${confessionCounter})`)
            .setDescription(`"${confession}"`)
            .setFooter({ text: 'Balas dengan mengetik "rwreply <ID_curhat> <isi_balasan>" atau gunakan tombol di bawah.' })
            .setTimestamp();

        const replyButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`reply_${confessionCounter}`)
                .setLabel('Balas')
                .setStyle(ButtonStyle.Secondary)
        );

        await channel.send({ embeds: [embed], components: [replyButton] });
        await message.reply('Curhatmu berhasil dikirim secara anonim!');

        confessionCounter++;
    }

    // Perintah rwreply
    if (message.content.startsWith('rwreply')) {
        const args = message.content.slice(8).trim().split(' ');
        const confessionId = args.shift();
        const replyText = args.join(' ');

        if (!confessionId || !replyText) {
            await message.reply('Format salah! Ketik `rwreply <ID_curhat> <isi_balasan>` untuk membalas curhat.');
            return;
        }

        const channel = client.channels.cache.get(CONFESSIONS_CHANNEL_ID);

        if (!channel) {
            await message.reply('Channel curhat tidak ditemukan! Pastikan bot memiliki akses ke channel tersebut.');
            return;
        }

        const replyEmbed = new EmbedBuilder()
            .setColor('#00bfff')
            .setTitle(`Balasan untuk Curhat #${confessionId}`)
            .setDescription(`"${replyText}"`)
            .setFooter({ text: 'Dikirim secara anonim' })
            .setTimestamp();

        await channel.send({ embeds: [replyEmbed] });
        await message.reply(`Balasan untuk curhat #${confessionId} berhasil dikirim!`);
    }

    // Perintah untuk memunculkan tombol "Curhat Yuk"
    if (message.content === 'rwtombolcurhat') {
        const row = createCurhatButton();
        await message.channel.send({ content: 'Klik tombol berikut untuk memulai curhat!', components: [row] });
    }
});

// Respons Otomatis dan Logging
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

     // Cek jika channel termasuk dalam daftar channel yang diizinkan
    if (!ALLOWED_CHANNELS.includes(message.channel.id)) return;

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
    const lowerContent = message.content.toLowerCase();

    if (lowerContent.includes('welcome')) {
        message.channel.send('Selamat datang warga baru! 👋\nSemoga betah jadi warga di sini, join voice sini biar makin akrab. <:OkeSip:1291831721313964053>');
    } else if (lowerContent.includes('halo')) {
        message.reply('Halo juga kak! 👋\nGabung sini ke voice biar makin akrab hehe <:Hehe:1099424821974151310>');
    } else if (lowerContent.includes('mabar')) {
        message.reply('Buat yang mau mabar bisa cari di https://discord.com/channels/1052115524273836176/1052428628819984424 ya! 🎮\nJangan lupa tag role game yang mau dimainin <:OkeSip:1291831721313964053>');
    } else if (lowerContent.includes('salam kenal')) {
        message.reply('Salam kenal juga kak! 👏\nDengan kakak siapa nich? <:Halo:1291831692025397270>');
    } else if (lowerContent.includes('donasi')) {
        message.reply('Kalau mau jadi donatur server bisa cek https://discord.com/channels/1052115524273836176/1221385772351881286 yaaa <:Wink:1099424794350473216>');
    } else if (lowerContent.includes('jodoh')) {
        message.reply('Buat yang mau cari jodoh bisa langsung aja ke <#1284544825596837971> <:Love:1291831704171970612>');
    } 
        else if (lowerContent.includes('pagi')) {
            const pagiReplies = [
                'Pagi juga, Kak! Tau nggak, pagi ini beda banget 🌞… ada matahari, ada udara segar 🌿, tapi tetap kamu yang bikin aku semangat. ❤️💪',
                'Selamat pagi juga, Kak 🌞. Hari ini rasanya indah banget, tapi tetep nggak seindah bayangan kamu di kepala aku. ❤️.',
                'Pagi, Kak! Udah ngerasa spesial belum? Kalau belum, coba deh lihat cermin 🪞, karena pagi ini kamu alasanku tersenyum. 😊',
                'Selamat pagi juga, Kak! Kalau aku punya superpower ✨, aku pasti bakal teleport ke kamu sekarang juga, biar pagiku makin lengkap. 💕',
                'Pagi juga! Kalau kamu nggak sibuk, boleh dong aku jadi alasan kamu semangat hari ini. 💪❤️',
                'Selamat pagi juga, Kak 🌅. Hari ini indah banget, tapi tetep nggak seindah senyuman kamu di pikiranku 😘.',
                'Pagi juga! Kalau kamu butuh semangat, ingat ya, aku selalu ada jadi cheerleader buat kamu hari ini. 💃❤️',
                'Pagi, Kak 🌞! Bayangan kamu di kepala aku aja bikin pagi ini terasa sempurna, apalagi kalau kamu ada di sini. ❤️',
                'Selamat pagi, Kak. Kalau aku jadi kopi pagi ini ☕, kamu pasti gula yang bikin semuanya terasa manis 🍬',
                'Pagi, Kak. Jangan lupa sarapan 🥪, biar kamu tetap semangat menjalani hari seperti biasanya. ☕',
            ];
            const randomReply = pagiReplies[Math.floor(Math.random() * pagiReplies.length)];
            message.reply(randomReply);
    } 
        else if (lowerContent.includes('siang')) {
            const siangReplies = [
                'Selamat siang, Kak! Semoga siang ini secerah senyuman kamu yang selalu bikin hariku lengkap. ☀️😊',
                'Siang, Kak! Jangan lupa makan siang ya 🍴, biar kamu tetap punya energi buat terus bikin aku bahagia. ❤️',
                'Selamat siang, Kak. Cuaca mungkin panas ☀️, tapi nggak ada yang lebih hangat dari pikiran tentang kamu. 💕',
                'Siang juga, Kak! Kalau aku boleh jujur, siang ini jadi lebih indah karena kamu ada di hati aku. 🌤️😍',
                'Selamat siang, Kak. Semoga hari ini kamu selalu ceria 😊, karena senyuman kamu adalah mood booster terbaik buat aku. 💖',
                'Siang, Kak! Kamu tahu nggak, walau cuaca panas 🌞, hati aku selalu adem karena ingat kamu. ❄️',
                'Selamat siang, Kak! Kalau siang ini terasa berat 💪, ingat aja aku selalu ada buat nyemangatin kamu. 💕',
                'Selamat siang, Kak. Kamu itu kayak AC di siang panas ini ❄️, selalu bikin hati aku adem tiap mikirin kamu. 😊',
                'Siang, Kak! Jangan lupa istirahat sejenak, ya 🍹. Kamu harus tetap jaga energi, karena kamu itu alasan aku terus semangat. 💖',
                'Siang juga! Semoga siang ini penuh keberuntungan ☀️, kecuali aku, yang udah kalah sama pesona kamu. 😘',
            ];
            const randomReply = siangReplies[Math.floor(Math.random() * siangReplies.length)];
            message.reply(randomReply);
    } 
        else if (lowerContent.includes('sore')) {
            const soreReplies = [
                'Selamat sore, Kak! Langit sore ini mungkin indah 🌅, tapi tetap nggak seindah senyuman kamu. 😊',
                'Sore, Kak! Udara sore ini sejuk banget 🌬️, kayak hati aku tiap kali inget kamu. ❤️',
                'Selamat sore! Kalau aku bisa, aku mau jadi matahari sore 🌇, biar selalu bisa menemani kamu di setiap langkah. 💕',
                'Sore, Kak! Langit mulai berubah warna 🌤️, tapi rasa aku ke kamu nggak pernah berubah. 😍',
                'Selamat sore, Kak! Jangan lupa istirahat sebentar ya 🌄, biar kamu tetap segar dan semangat buat nanti malam. 💖',
                'Sore ini tenang banget 🌅, tapi nggak ada yang lebih tenang dari hati aku tiap kali kamu ada di pikiranku. ❄️',
                'Sore, Kak! Semoga sisa hari ini lancar 🌇, sama lancarnya senyuman kamu yang bikin aku nggak bisa lupa. 😊',
                'Selamat sore! Matahari mungkin mulai tenggelam 🌄, tapi perhatian aku ke kamu nggak pernah surut. ❤️',
                'Sore, Kak! Langit sore ini indah banget 🌅, tapi tetap kalah sama indahnya kehadiran kamu di hidupku.💕',
                '"Selamat sore, Kak! Semoga sore ini kamu bahagia 🌤️, karena kebahagiaan kamu adalah pelengkap hari-hariku. 😊',
            ];
            const randomReply = soreReplies[Math.floor(Math.random() * soreReplies.length)];
            message.reply(randomReply);
    } 
        else if (lowerContent.includes('malam')) {
            const malamReplies = [
                'Selamat malam, Kak! Semoga tidurmu nyenyak dan mimpi indah datang menghampiri 🌙, aku akan selalu ada di hati kamu. ❤️',
                'Malam, Kak. Kalau malam ini kamu merasa sepi, ingatlah aku selalu ada, menunggumu dalam doa 💭, selalu ada di sini. 💕',
                'Malam juga, Kak! Semoga mimpi indah menemani tidurmu 🌙, dan besok pagi kita bisa saling mengingat satu sama lain. 😊',
                'Selamat malam, Kak. Kalau malam ini terasa sepi 🌙, jangan khawatir, aku ada di sini dan selalu siap nemenin kamu dalam mimpi. 😊',
                'Malam, Kak! Setelah hari yang panjang, semoga kamu bisa beristirahat dengan tenang dan bangun besok pagi dengan senyuman yang cerah 🌟💤',
                'Selamat malam juga, Kak. Kalau malam ini terasa panjang 🌙, ingat aku selalu ada di sini, di setiap doamu. 💌',
                'Malam, Kak. Semoga setiap bintang yang bersinar malam ini membawa mimpi manis untuk kamu. ✨💭',
                'Selamat malam juga, Kak! Bintang-bintang udah mulai muncul 🌟, semoga malam ini membawa ketenangan untuk kamu yang selalu ada di hati aku. ❤️',
                'Selamat malam, Kak! Kalau malam ini kamu merasa kesepian 🌜, ingat ada aku yang selalu menemani kamu lewat doa-doa. 💕',
                'Malam juga, Kak! Walau kita berpisah sementara 🌙, aku selalu berharap kita bisa bertemu dalam mimpi. 💭',
                ];
            const randomReply = malamReplies[Math.floor(Math.random() * malamReplies.length)];
            message.reply(randomReply);
    } 

// Perintah untuk ngobrol dengan Gemini Chat
// Fungsi untuk delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fungsi untuk mencoba kembali dengan retry (Exponential backoff)
const makeRequestWithRetry = async (query) => {
    const MAX_RETRIES = 5; // Maksimal percobaan ulang
    const RETRY_DELAY = 1000; // Delay awal 1 detik

    let attempts = 0;
    while (attempts < MAX_RETRIES) {
        try {
            // Melakukan request ke Gemini API
            const response = await axios.post(
                "https://generativelanguage.googleapis.com/v1beta/chat/completions",
                {
                    model: 'gemini-1.5-flash', // Model Gemini
                    messages: [
                        {
                            role: 'system',
                            content: 'Kamu adalah seorang Pak RW yang pintar, dan akan menjawab semua pertanyaan warga. Jawab dengan bijak dan gunakan bahasa yang santai dan sedikit humoris. Jawabanmu harus singkat, langsung ke poin, dan tidak lebih dari 2000 karakter.',
                        },
                        {
                            role: 'user',
                            content: query, // Pertanyaan dari pengguna
                        },
                    ],
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${process.env.GEMINI_API_KEY}`, // Pastikan kunci API tersedia di .env
                    },
                }
            );

            // Mengambil respons dari Gemini
            const reply = response.data.choices[0].message.content.trim();
            return reply; // Mengembalikan hasil dari Gemini
        } catch (error) {
            if (error.response && error.response.status === 429) {
                attempts++;
                console.log(`Terlalu banyak permintaan, mencoba lagi setelah ${RETRY_DELAY * attempts} ms...`);
                await delay(RETRY_DELAY * attempts); // Exponential backoff
            } else {
                console.error("Error saat mengakses Gemini API:", error.message);
                throw error; // Lemparkan error jika tidak dapat diperbaiki
            }
        }
    }
    throw new Error('Coba lagi setelah beberapa saat, batas maksimum pencobaan tercapai.');
};

// Perintah untuk bot tanya jawab
if (message.content.startsWith(`${PREFIX}tanya`)) {
    const query = message.content.slice(`${PREFIX}tanya`.length).trim();
    if (!query) {
        message.reply('Tanyain aja, nanti Pak RW jawab');
        return;
    }

    try {
        const reply = await makeRequestWithRetry(query); // Menggunakan fungsi retry
        message.reply(reply); // Mengirimkan jawaban ke pengguna
    } catch (error) {
        console.error('Error with Gemini API:', error);
        message.reply('Maaf, Pak RW lagi bingung nih sama pertanyaannya');
    }
}
});

// Login ke bot
client.login(TOKEN);
