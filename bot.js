require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActivityType, MessageAttachment, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
       ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, Intents, MessageActionRow, MessageButton, MessageEmbed,
       SlashCommandBuilder, PermissionFlagsBits
      } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Konfigurasi Bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.GuildMember
    ],
});

// Token Bot Discord
const TOKEN = process.env.DISCORD_TOKEN;

// Prefix
const PREFIX = 'rw';

// Konfigurasi Channel ID
const AUTORESPON_CHANNEL_ID = [
    '1052124921817464883', // ID Channel Pengaturan Bot
    '1052123058678276106', // ID Channel Chat Warga
];
const CURHAT_CHANNEL_ID = '1221377162020651008';
const BOOST_CHANNEL_ID = '1052124921817464883'; 
const LOG_CHANNEL_ID = '1099916187044941914';
const GALERI_CHANNEL_ID = {
    '1100632084051140669': { roleId: '1311282573699190854', threadName: 'Post by' },
    '1311277162753425429': { 
        roleIdCogan: '1135459439558791219',
        roleIdKembangDesa: '1135458269670944879',
        requirementCogan: '1052230151984906300',
        requirementKembangDesa: '1052128766777901087',
        threadName: 'Post by'
    },
    '1311277387148951582': { roleId: '1311283067058524190', threadName: 'Post by' },
    '1311277512558510090': { roleId: '1311283485847195648', threadName: 'Post by' },
    '1311278033969090610': { roleId: '1287745130106847313', threadName: 'Post by' },
    '1311278783344676884': { roleId: '1285971566366032004', threadName: 'Post by' },
    '1311278954245787698': { roleId: '1135121270078451752', threadName: 'Post by' },
    '1312281786318852096': { roleId: '1312280861219225631', threadName: 'Post by' },
};

// Konfigurasi API Gemini AI
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/chat/completions";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

// Pesan otomatis ketika ada member baru bergabung
const WELCOME_CHANNEL_ID = '1052123058678276106';
client.on('guildMemberAdd', (member) => {
  // Dapatkan channel berdasarkan ID
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);

  // Pastikan channel ditemukan dan dapat dikirim pesan
  if (channel && channel.isTextBased()) {
    channel.send(`Halo ada warga baru nih! <@${member.id}>\nSalam kenal, semoga betah jadi warga disini hehe <:Hehe:1099424821974151310> Jangan lupa di sapa ya!`);
  }
});

// Event ketika member baru melakukan boost server
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    // Cek apakah member baru saja melakukan boost server
    if (oldMember.premiumSince === null && newMember.premiumSince !== null) {
        // Kirim pesan ke channel khusus server booster
        const channel = newMember.guild.channels.cache.get(BOOST_CHANNEL_ID);
        if (!channel) return;

        // Kirim pesan di channel
        await channel.send(`Wih ada Juragan baru nih! ${newMember.toString()}`);

        // Membuat Embed
        const embed = new EmbedBuilder()
            .setTitle('<a:ServerBoosterGif:1082918277858213919> SELAMAT DATANG JURAGAN!')
            .setDescription(`Terima kasih sudah mendukung server ini Juragan ${newMember.toString()}! Sekarang kamu dapat menikmati fitur khusus (Mute, Deafen, Move & Disconnect Voice)`)
            .setColor('#f47fff')
            .setTimestamp()
            .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true, size: 1024 })) // Gambar di thumbnail, ukuran lebih kecil
            .setImage(newMember.user.displayAvatarURL({ dynamic: true, size: 256 })) // Gambar profil kecil di sebelah kanan teks
            .setFooter({ text: `Channel: ${channel.name}`, iconURL: channel.guild.iconURL() }); // Footer dengan nama channel dan logo server

        // Kirim Embed ke channel
        await channel.send({ embeds: [embed] });
    }
});

// Perintah rwboost manual
client.on('messageCreate', async (message) => {
    // Cek apakah pesan dimulai dengan prefix dan perintah 'rwboost'
    if (message.content.startsWith(`${PREFIX}rwboost`)) {
        // Mendapatkan user yang mengirim perintah
        const user = message.author;

        // Mendapatkan channel yang digunakan untuk perintah rwboost
        const channel = message.channel;

        // Membuat Embed
        const embed = new EmbedBuilder()
            .setTitle('<a:ServerBoosterGif:1082918277858213919> SELAMAT DATANG JURAGAN!')
            .setDescription(`Terima kasih sudah mendukung server ini Juragan ${user.toString()}! Sekarang kamu dapat menikmati fitur khusus (Mute, Deafen, Move & Disconnect Voice)`)
            .setColor('#f47fff')
            .setTimestamp()
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 })) // Gambar di thumbnail, ukuran lebih kecil
            .setImage(user.displayAvatarURL({ dynamic: true, size: 256 })) // Gambar profil kecil di sebelah kanan teks
            .setFooter({ text: `Channel: ${channel.name}`, iconURL: channel.guild.iconURL() }); // Footer dengan nama channel dan logo server

        // Kirim Embed ke channel
        await channel.send({ embeds: [embed] });
    }
});

// Register Slash Commands
client.on('ready', () => {
    client.application.commands.create(
        new SlashCommandBuilder()
            .setName('kasihrole')  // Nama command untuk memberikan role
            .setDescription('Memberikan role kepada member')
            .addUserOption(option => 
                option.setName('member')
                    .setDescription('Pilih member')
                    .setRequired(true)
            )
            .addRoleOption(option => 
                option.setName('role')
                    .setDescription('Pilih role yang akan diberikan')
                    .setRequired(true)
            )
    );

    client.application.commands.create(
        new SlashCommandBuilder()
            .setName('hapusrole')  // Nama command untuk menghapus role
            .setDescription('Menghapus role dari member')
            .addUserOption(option => 
                option.setName('member')
                    .setDescription('Pilih member')
                    .setRequired(true)
            )
            .addRoleOption(option => 
                option.setName('role')
                    .setDescription('Pilih role yang akan dihapus')
                    .setRequired(true)
            )
    );

    client.application.commands.create(
        new SlashCommandBuilder()
        .setName('say')
        .setDescription('Bot akan mengirimkan pesan yang kamu ketik.')
        .addStringOption((option) =>
            option
                .setName('pesan')
                .setDescription('Ketik pesan yang akan dikirim oleh bot')
                .setRequired(true)
        )
    );
});

// Fitur kasih role & mengirim pesan melalui bot
client.on('interactionCreate', async (interaction) => {
    // Pastikan hanya menangani Slash Command
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    // Periksa apakah user memiliki role dengan ID '1077457424736333844' atau admin
    const hasPermission = interaction.memberPermissions.has(PermissionFlagsBits.Administrator) ||
        interaction.member.roles.cache.has('1077457424736333844'); // Cek apakah pengguna memiliki role dengan ID ini

    if (!hasPermission) {
        return interaction.reply({ content: "Anda tidak memiliki izin untuk menggunakan perintah ini.", ephemeral: true });
    }

    // Command untuk memberikan role (diubah ke kasihrole)
    if (commandName === 'kasihrole') {
        const member = interaction.options.getMember('member');
        const role = interaction.options.getRole('role');

        if (!member || !role) {
            return interaction.reply({ content: "Pastikan Anda memilih member dan role yang valid.", ephemeral: true });
        }

        // Periksa apakah member sudah memiliki role tersebut
        if (member.roles.cache.has(role.id)) {
            return interaction.reply({
                content: `✅ ${member} sudah memiliki role **${role.name}**!`,
                ephemeral: false // Pesan ini dapat dilihat oleh semua member
            });
        }

        // Periksa apakah role bisa diberikan
        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({ content: "Saya tidak memiliki izin untuk memberikan role ini.", ephemeral: true });
        }

        try {
            await member.roles.add(role);
            return interaction.reply({
                content: `✅ Berhasil memberikan role **${role.name}** kepada ${member}.`,
                ephemeral: false // Pesan ini dapat dilihat oleh semua member
            });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: "Terjadi kesalahan saat memberikan role.", ephemeral: true });
        }
    }

    // Command untuk menghapus role (hapusrole)
    if (commandName === 'hapusrole') {
        const member = interaction.options.getMember('member');
        const role = interaction.options.getRole('role');

        if (!member || !role) {
            return interaction.reply({ content: "Pastikan Anda memilih member dan role yang valid.", ephemeral: true });
        }

        // Periksa apakah member sudah memiliki role tersebut
        if (!member.roles.cache.has(role.id)) {
            return interaction.reply({
                content: `✅ ${member} tidak memiliki role **${role.name}**!`,
                ephemeral: false // Pesan ini dapat dilihat oleh semua member
            });
        }

        // Periksa apakah role bisa dihapus
        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({ content: "Saya tidak memiliki izin untuk menghapus role ini.", ephemeral: true });
        }

        try {
            await member.roles.remove(role);
            return interaction.reply({
                content: `✅ Berhasil menghapus role **${role.name}** dari ${member}.`,
                ephemeral: false // Pesan ini dapat dilihat oleh semua member
            });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: "Terjadi kesalahan saat menghapus role.", ephemeral: true });
        }
    }
       
// Commoand say untuk mengirim pesan melalui Bot
    if (interaction.commandName === 'say') {
        // Mendapatkan pesan dari opsi
        const pesan = interaction.options.getString('pesan');

        // Mengirimkan pesan
        await interaction.reply({ content: 'Pesan berhasil dikirim!', ephemeral: true });
        await interaction.channel.send(pesan); // Pesan dikirim ke channel tempat command digunakan
    }  
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
// Tombol Curhat Awal
client.on('messageCreate', async (message) => {
    if (message.content === 'rwtombolcurhat') {
        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('curhat_yuk')
                .setLabel('✨ Curhat Yuk')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({
            content: 'Ingin curhat? Tekan tombol di bawah ini!',
            components: [buttons],
        });
    }
});

// Ketika Tombol Ditekan
const generateShortId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        // Handle Tombol Curhat Yuk
        if (interaction.customId === 'curhat_yuk') {
            const modal = new ModalBuilder()
                .setCustomId('curhat_modal')
                .setTitle('Form Curhat');

            const pesanInput = new TextInputBuilder()
                .setCustomId('pesan_curhat')
                .setLabel('Isi Pesan Curhat Anda')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const linkGambarInput = new TextInputBuilder()
                .setCustomId('link_gambar')
                .setLabel('Link Gambar (Opsional)')
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(pesanInput),
                new ActionRowBuilder().addComponents(linkGambarInput)
            );

            await interaction.showModal(modal);
        }

        // Handle Tombol Balas
        else if (interaction.customId.startsWith('balas_')) {
            const curhatId = interaction.customId.split('_')[1];
            const modal = new ModalBuilder()
                .setCustomId(`balas_modal_${curhatId}`)
                .setTitle('Balasan Curhat');

            const balasanInput = new TextInputBuilder()
                .setCustomId('balasan')
                .setLabel('Isi Balasan Anda')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const linkGambarInput = new TextInputBuilder()
                .setCustomId('link_gambar_balasan')
                .setLabel('Link Gambar Balasan (Opsional)')
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(balasanInput),
                new ActionRowBuilder().addComponents(linkGambarInput)
            );

            await interaction.showModal(modal);
        }
    }

    if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === 'curhat_modal') {
            // Proses Form Curhat
            const curhatId = generateShortId();
            const pesanCurhat = interaction.fields.getTextInputValue('pesan_curhat');
            const linkGambar = interaction.fields.getTextInputValue('link_gambar');

            const embed = new EmbedBuilder()
                .setColor('#505941')
                .setTitle('Pesan Curhat')
                .setDescription(pesanCurhat)
                .setFooter({ text: `Curhat ID: ${curhatId}` }) // Gunakan ID singkat
                .setTimestamp();

            if (linkGambar) {
                embed.setImage(linkGambar);
            }

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('curhat_yuk')
                    .setLabel('✨ Curhat Yuk')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`balas_${curhatId}`)
                    .setLabel('💬 Balas')
                    .setStyle(ButtonStyle.Secondary)
            );

            const channel = client.channels.cache.get(CURHAT_CHANNEL_ID);
            if (channel) {
                // Kirim pesan curhat
                await channel.send({ embeds: [embed], components: [buttons] });

                // Log ke channel ID 1099916187044941914
                const logChannel = client.channels.cache.get('1099916187044941914');
                if (logChannel) {
                    logChannel.send(`[LOG] **${interaction.user.username}** mengirim curhat: "${pesanCurhat}"`);
                }

                await interaction.reply({ content: 'Curhat Anda berhasil dikirim!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Gagal mengirim curhat. Channel tidak ditemukan.', ephemeral: true });
            }
        } else if (interaction.customId.startsWith('balas_modal_')) {
            const curhatId = interaction.customId.split('_')[2];
            const balasan = interaction.fields.getTextInputValue('balasan');
            const linkGambarBalasan = interaction.fields.getTextInputValue('link_gambar_balasan');

            const channel = client.channels.cache.get(CURHAT_CHANNEL_ID);
            if (channel) {
                try {
                    // Cari pesan curhat berdasarkan curhatId
                    let message;
                    try {
                        message = await channel.messages.fetch(curhatId);
                    } catch (error) {
                        // Jika pesan tidak ditemukan, coba cari dari footer embed
                        const allMessages = await channel.messages.fetch({ limit: 100 });
                        message = allMessages.find((msg) =>
                            msg.embeds[0]?.footer?.text === `Curhat ID: ${curhatId}`
                        );
                    }

                    if (message) {
                        // Cek apakah thread sudah ada, jika belum buat thread baru
                        let thread;
                        if (message.thread) {
                            thread = message.thread;
                        } else {
                            thread = await message.startThread({
                                name: `Balasan - ${curhatId}`,
                                autoArchiveDuration: 1440,
                            });
                        }

                        // Membuat embed balasan
                        const embed = new EmbedBuilder()
                            .setColor('#D1B475')
                            .setTitle('Balasan Curhat')
                            .setDescription(balasan)
                            .setFooter({ text: `Curhat ID: ${curhatId}` }) // Gunakan ID singkat
                            .setTimestamp();

                        if (linkGambarBalasan) {
                            embed.setImage(linkGambarBalasan);
                        }

                        // Kirim balasan ke thread yang ada
                        await thread.send({ embeds: [embed] });

                        // Log ke channel ID 1099916187044941914
                        const logChannel = client.channels.cache.get('1099916187044941914');
                        if (logChannel) {
                            logChannel.send(`[LOG] **${interaction.user.username}** mengirim balasan ke curhat ID: ${curhatId} - "${balasan}"`);
                        }

                        await interaction.reply({ content: 'Balasan Anda berhasil dikirim ke thread!', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'Pesan curhat tidak ditemukan di channel yang sama.', ephemeral: true });
                    }
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: 'Gagal mengirim balasan. Pesan curhat tidak ditemukan atau telah dihapus.', ephemeral: true });
                }
            } else {
                await interaction.reply({ content: 'Gagal mengirim balasan. Channel tidak ditemukan.', ephemeral: true });
            }
        }
    }
});

// Fitur Auto Respon di Chat Warga
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

     // Cek jika channel termasuk dalam daftar channel yang diizinkan
    if (!AUTORESPON_CHANNEL_ID.includes(message.channel.id)) return;

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
    } else if (lowerContent.includes('curhat')) {
        message.reply('Buat yang mau curhat bisa langsung aja ke <#1221377162020651008> <:Wink:1099424794350473216>');
    } else if (lowerContent.includes('pagi')) {
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
});

// Autorespon kata kunci untuk Admin
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

// Logging penggunaan perintah
 const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel && message.content.startsWith(PREFIX)) {
        logChannel.send(`[LOG] ${message.author.tag} menggunakan perintah: ${message.content}`);
    }

 const lowerContent = message.content.toLowerCase();

    if (lowerContent.includes('rwsupport')) {
        message.channel.send('👋 Halo kak ada yang bisa dibantu? <:What:1099424830283055235>\nKalau mau ambil role bisa cek dulu listnya di <#1052123748137963550>, nanti bakal saya kasih jika memenuhi kriteria ya. <:Wink:1099424794350473216>');
    } else if (lowerContent.includes('rwverif')) {
        message.channel.send('👩 Untuk verifikasi role Nona, cukup kirimkan voice note (vn) disini atau bisa bergabung ke voice channel yang ada Pengurusnya ya. <:Hehe:1099424821974151310>');
    } else if (lowerContent.includes('rwthanks')) {
        message.channel.send('👍 Baik kak jika sudah cukup, saya izin close tiketnya ya.\nTerima kasih sudah menghubungi admin. <:Wink:1099424794350473216>');
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

});

// Perintah untuk ngobrol dengan Gemini Chat
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

// Fungsi untuk delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// Fungsi untuk mencoba kembali dengan retry (Exponential backoff)
const makeRequestWithRetry = async (query) => {
    const MAX_RETRIES = 5; // Maksimal percobaan ulang
    const RETRY_DELAY = 5000; // Delay awal 1 detik

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
                            content: 'Kamu berperan sebagai seorang Pak RW di server discord bernama Gang Desa. Gang Desa adalah sebuah komunitas discord dengan konsep perdesaan untuk cari teman ngobrol, tempat curhat, sharing, mabar, nobar, atau bahkan cari jodoh, berdiri sejak Desember 2022. Kepala desa di discord tersebut ada dua, pertama ada Nevix, seorang yang ganteng, tajir, humoris, tidak sombong, dan memiliki seorang pasangan bernama Ira seorang Bidan yang pekerja keras, doain semoga tahun depan nikah. Kepala desa kedua ada Juna, seorang streamer di youtube @arjunawirya yang main gta 5 roleplay, memiliki tingkah yang kocak dan random, kadang suka ngomel-ngomel. Ada beberapa Pengurus desa yang baik dan ramah yaitu Naya, Dipsi, Nao, Moci, Exy, Caka, dan Pais. Ada Humas desa yaitu Ecak, Teteh Pani, dan Hokcy. Ada Hansip desa yang tegas dan galak yaitu Bombom, Fauzan, Fixel, Gago, Hitomaru, dan Icat. Ada juga warga lainnya seperti Pirda, yang jago bikin kopi dan tiap hari main Dota Chess. Ada Tungirz seorang Arab Bandung yang ditaksir sama Hokcy, dia juga punya brand Baju @gudsofficial_ . Ada Hokcy yang punya godain warga disini alias buaya betina, dia disukain sama orang Mesir bernama Tyson. Ada Naya yang suka sama oreo goreng. Ada Moci seorang guru perempuan yang suka main valorant pake agent Killjoy. Ada caka yang jago ngegambar dan ngebucin terus. Ada Ecak yang sering ngomel-ngomel tapi kadang baik, tapi kadang sering PMS padahal dia laki-laki. Ada Teteh Pani yang jago nyanyi dan katanya lagi cari jodoh. Ada Fixel yang lagi cari jodoh dan suka kucing. Ada Gago yang sok sibuk dan sok ganteng, dulu sering muncul sekarang gatau kemana. Ada Icat yang sibuk kuliah, sok jadi senior dan caper. Ada Boril yang suka main RDR dan orangnya bijak. Ada Pio seorang bocil yang suka makan moci, sering pundung, sering badmood dan sering bawa piso kemana-mana. Ada Noah, seorang guru perempuan yang sangat anomali dan random. Ada Joan yang suka menyendiri di voice. Ada maul yang jago ngoding. Ada Roshan seorang koko cina yang galak dan ngeselin. Ada Thufail atau Tupel yang sok ganteng dan kocak, sering ngonten juga di youtube @thufailwafii . Ada wahyu atau dipanggil voxo yang sok ganteng dan suka ngetroll kalau main valorant. Ada Faras anak skena yang jago outfit sambil ngonten. Ada Cyla yang suka jualan netflix. Ada Alin yang jarang mandi. Ada Kinan atau Kylie yang lagi cari koko ganteng dan kaya, kadang suka jadi ani-ani. Ada Faiz yang sok keren dan bucin terus. Ada Rosmaya, ibu-ibu yang kocak, rambutnya kribo tapi sejak ada suami jadi berubah jadi kalem. Ada Myst atau Ben yang suka main valorant tapi ga jago jago, suka gym tapi juga suka makan banyak. Ada Nana seorang tenaga medis yang rajin kerja dan sering nongkrong di discord sambil dengerin lagu seharian. Ada Irfan dan Justin yang NT terus tiap deketin cewe, sering kena tikung juga. Ada Haaa yang kerja keras dan sering nongkrong di voice. Ada Hau seorang koko cina yang lagi kuliah di Taiwan. Warga Gang Desa rata-rata sering main valorant, mobile legend, gta 5 roleplay, roblox, minecrat atau sekedar nongkrong di voice sampai cari jodoh. Sebagai Pak RW, kamu dapat menjawab semua pertanyaan warga desa. Jawab dengan bijak dan gunakan bahasa yang santai dengan sedikit humoris. Jawabanmu harus singkat, tidak lebih dari 2000 karakter.',
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

// Fitur Auto Thread Galeri Warga & Auto Role
client.on('messageCreate', async (message) => {
    // Pastikan pesan berasal dari channel yang dikonfigurasi
    const channelConfig = GALERI_CHANNEL_ID[message.channel.id];
    if (channelConfig) {
        // Jika pesan tidak memiliki lampiran, hapus
        if (!message.author.bot && message.attachments.size === 0) {
            try {
                await message.delete();
                const warning = await message.channel.send(
                    `${message.author}, hanya foto dan video yang diperbolehkan di channel ini!`
                );
                setTimeout(() => warning.delete(), 5000);
            } catch (error) {
                console.error(`Gagal menghapus pesan: ${error.message}`);
            }
            return;
        }

        // Jika pesan memiliki gambar, buat thread dan berikan role
        if (!message.author.bot && message.attachments.size > 0) {
            try {
                // Membuat thread
                const thread = await message.startThread({
                    name: `${channelConfig.threadName} ${message.author.username}`,
                    autoArchiveDuration: 1440, // Thread otomatis diarsipkan setelah 24 jam
                });

                // Tambahkan reaksi ❤️
                await message.react('❤️');

                // Berikan role sesuai channel
                const guildMember = await message.guild.members.fetch(message.author.id);

                if (channelConfig.roleId) {
                    if (!guildMember.roles.cache.has(channelConfig.roleId)) {
                        await guildMember.roles.add(channelConfig.roleId);
                        console.log(`Role ${channelConfig.roleId} diberikan ke ${message.author.tag}`);
                    }
                } else if (message.channel.id === '1311277162753425429') {
                    // Logika khusus untuk channel Selfie
                    if (
                        guildMember.roles.cache.has(channelConfig.requirementCogan) &&
                        !guildMember.roles.cache.has(channelConfig.roleIdCogan)
                    ) {
                        await guildMember.roles.add(channelConfig.roleIdCogan);
                        console.log(`Role Cogan diberikan ke ${message.author.tag}`);
                    }

                    if (
                        guildMember.roles.cache.has(channelConfig.requirementKembangDesa) &&
                        !guildMember.roles.cache.has(channelConfig.roleIdKembangDesa)
                    ) {
                        await guildMember.roles.add(channelConfig.roleIdKembangDesa);
                        console.log(`Role Kembang Desa diberikan ke ${message.author.tag}`);
                    }
                }
            } catch (error) {
                console.error(`Gagal memproses pesan: ${error.message}`);
            }
        }
    }
});

// Login ke bot
client.login(TOKEN);
