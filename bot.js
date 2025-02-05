require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActivityType, MessageAttachment, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
       ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, Intents, MessageActionRow, MessageButton, MessageEmbed,
       SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder
      } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { createCanvas, loadImage } = require('canvas'); 
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
        GatewayIntentBits.GuildMembers,
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
const LOG_CHANNEL_ID = '1099916187044941914';
const GALERI_CHANNEL_ID = {
    '1100632084051140669': { roleId: '1311282573699190854', threadName: 'Post by' }, // Random 
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
    '1335658950980276328': { roleId: '1335657621977432165', threadName: 'Post by' }, // olahraga
    '1335876168641019954': { roleId: '1335877150737174528', threadName: 'Post by' }, // kerja
    '1335886755643260978': { roleId: '1335885084364111936', threadName: 'Post by' },
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
/* const WELCOME_CHANNEL_ID = '1052123058678276106';
client.on('guildMemberAdd', (member) => {
  // Dapatkan channel berdasarkan ID
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);

  // Pastikan channel ditemukan dan dapat dikirim pesan
  if (channel && channel.isTextBased()) {
    channel.send(`Halo ada warga baru nih! <@${member.id}> Jangan lupa buat KTP dulu di <#1332957041882562560>\nKalau kamu perempuan, jangan lupa verifikasi role melalui <#1149203043229900840>\nSalam kenal, semoga betah jadi warga disini hehe <:Hehe:1099424821974151310> Jangan lupa di sapa ya!`);
    channel.send(`<a:Hai:1318929546887565374><a:Welcome1:1319195762902700052><a:Welcome2:1319195777318387722><a:Hai:1318929546887565374>`);     
  }
});
*/

// Event yang dipicu ketika member melakukan boost server
const BoostChannelID = '1052126042300624906';

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    // Mengecek apakah member melakukan boost server
    if (!oldMember.premiumSince && newMember.premiumSince) {
        // Dapatkan channel terima kasih
        const BoostChannel = newMember.guild.channels.cache.get(BoostChannelID);
        const embed = new EmbedBuilder()
            .setTitle('<a:ServerBoosterGif:1082918277858213919> SELAMAT DATANG JURAGAN! <a:ServerBoosterGif:1082918277858213919>') // Judul embed
            .setDescription(`Terima kasih sudah mendukung server ini Juragan ${newMember.toString()}! Sekarang kamu dapat menikmati fitur khusus (Mute, Deafen, Move & Disconnect Voice), akses ke Remote Tv, dan akses ke Voice Channel VIP <#1324635056328675338> dari Role <@&1052585457965346848>`)
            .setColor('#f47fff') // Warna dari embed
            .setTimestamp() // Menambahkan timestamp ke embed
            .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true, size: 1024 })) // Menampilkan avatar member yang baru boost
            .setFooter({ text: `${newMember.guild.name}`, iconURL: newMember.guild.iconURL() }); // Footer dengan nama channel dan logo server

        // Mengirim pesan dan embed dalam satu kiriman
        await BoostChannel.send({
            content: `Wih ada Juragan baru nih! ${newMember.toString()}`, // Pesan teks
            embeds: [embed] // Embed yang dibuat di atas
        });
    }
});

// Event ketika member baru melakukan boost dan donasi server
const ROLE_CHANNELS = {
    '1221395908311384125': '1221386974003204126',  // Role ID: Donatur ke channel 1221386974003204126
    '1081256438879485953': '1221386974003204126',  // Role ID: Raden ke channel 1221386974003204126
    '1105536787725684848': '1221386974003204126',  // Role ID: Sultan ke channel 1221386974003204126
};

const EMBED_TITLES = {
    '1221395908311384125': '💶 SELAMAT DATANG DONATUR! 💶',
    '1081256438879485953': '💵 SELAMAT DATANG RADEN! 💵',
    '1105536787725684848': '💰 SELAMAT DATANG SULTAN! 💰',
};

const EMBED_COLORS = {
    '1221395908311384125': '#68bbff',    // Donatur color
    '1081256438879485953': '#4caf50',    // Raden color
    '1105536787725684848': '#ffeb3b',    // Sultan color
};

const EMBED_DESCRIPTIONS = {
    '1221395908311384125': 'Terima kasih sudah mendukung server ini Donatur ${newMember.toString()}! Sekarang kamu dapat menikmati fitur khusus (Mute, Deafen, Move & Disconnect Voice), akses ke Remote Tv dan akses ke Voice Channel VIP <#1324635056328675338> dari Role <@&1221395908311384125>',
    '1081256438879485953': 'Terima kasih sudah mendukung server ini Raden ${newMember.toString()}! Sekarang kamu dapat menikmati fitur khusus (Mute, Deafen, Move & Disconnect Voice), akses ke Remote Tv dan akses ke Voice Channel VIP <#1324635056328675338> dari Role <@&1081256438879485953>',
    '1105536787725684848': 'Terima kasih sudah mendukung server ini Sultan ${newMember.toString()}! Sekarang kamu dapat menikmati fitur khusus (Mute, Deafen, Move & Disconnect Voice), akses ke Remote Tv dan akses ke Voice Channel VIP <#1324635056328675338> dari Role <@&1105536787725684848>',
};

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    try {
        // Mengecek jika ada role baru yang ditambahkan
        for (const roleId in ROLE_CHANNELS) {
            if (newMember.roles.cache.has(roleId) && !oldMember.roles.cache.has(roleId)) {
                const channelId = ROLE_CHANNELS[roleId];
                const channel = newMember.guild.channels.cache.get(channelId);

                if (!channel) {
                    console.log(`Channel dengan ID ${channelId} tidak ditemukan!`);
                    continue;
                }

                // Membuat Embed yang akan dikirim
                const embed = new EmbedBuilder()
                    .setTitle(EMBED_TITLES[roleId] || 'Selamat Datang!')
                    .setDescription(EMBED_DESCRIPTIONS[roleId].replace('${newMember.toString()}', newMember.toString()) || `Terima kasih ${newMember.toString()}!`)
                    .setColor(EMBED_COLORS[roleId] || '#f47fff')
                    .setTimestamp()
                    .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true, size: 1024 })) // Gambar di thumbnail, ukuran lebih kecil
                    .setFooter({ text: `${newMember.guild.name}`, iconURL: newMember.guild.iconURL() });

                // Mengirim embed ke channel yang sesuai
                await channel.send({
                    content: `Wih ada ${roleId === '1221395908311384125' ? 'Donatur' : roleId === '1081256438879485953' ? 'Raden' : roleId === '1105536787725684848' ? 'Sultan' : 'Juragan'} baru nih! ${newMember.toString()}`,
                    embeds: [embed],
                });

                console.log(`Embed dan pesan berhasil dikirim ke channel ${channelId}`);
                break; // Hentikan loop setelah menemukan role yang sesuai
            }
        }
    } catch (error) {
        console.error('Terjadi kesalahan saat memproses perubahan member:', error);
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

// Fitur KTP Gang Desa

function drawText(ctx, text, x, y, options = {}) { const { font = '18px Arial', color = '#000000', align = 'left' } = options;

ctx.save(); // Simpan state
ctx.font = font;
ctx.fillStyle = color;
ctx.textAlign = align;
ctx.textBaseline = 'middle';

// Tambahkan shadow
ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
ctx.shadowOffsetX = 2;
ctx.shadowOffsetY = 2;
ctx.shadowBlur = 3;

// Gambar teks
ctx.fillText(text, x, y);
ctx.restore(); // Kembalikan state


}

// Fungsi untuk menggambar ID Card 

async function createIDCard(data) { const { templateUrl, avatarUrl, nama, gender, domisili, agama, hobi, userId, createdAt } = data;

const canvas = createCanvas(480, 270); // Ukuran canvas 480 x 270 px
const ctx = canvas.getContext('2d');

try {
    // Load template dan avatar
    const template = await loadImage(templateUrl);
    const avatar = await loadImage(avatarUrl);

    // Gambar template
    ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

    // Gambar avatar
    ctx.drawImage(avatar, 330, 70, 120, 140); // Posisi avatar

    // Gambar teks
    drawText(ctx, `Nomor KTP: ${userId}`, 30, 80, { font: '18px Arial', color: '#000000' });
    drawText(ctx, `Nama: ${nama}`, 30, 110, { font: '18px Arial', color: '#000000' });
    drawText(ctx, `Jenis Kelamin: ${gender}`, 30, 140, { font: '18px Arial', color: '#000000' });
    drawText(ctx, `Domisili: ${domisili}`, 30, 170, { font: '18px Arial', color: '#000000' });
    drawText(ctx, `Agama: ${agama}`, 30, 200, { font: '18px Arial', color: '#000000' });
    drawText(ctx, `Hobi: ${hobi}`, 30, 230, { font: '18px Arial', color: '#000000' });
    drawText(ctx, `Tanggal Pembuatan:\n${createdAt}`, 340, 230, { font: '12px Arial', color: '#000000' });

    return canvas.toBuffer('image/png');
} catch (error) {
    console.error('Error creating ID card:', error);
    throw error;
}

}

client.on('messageCreate', async (message) => { if (message.content.toLowerCase() === 'rwktp') { const embed = new EmbedBuilder() 
    .setTitle('Buat Kartu Tanda Penduduk Gang Desa') 
    .setDescription('Klik tombol di bawah untuk mengisi formulir KTP kamu!') 
    .setColor('#00AAFF');

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('create_ktp')
            .setLabel('Buat KTP')
            .setStyle(ButtonStyle.Primary)
    );

    await message.reply({ embeds: [embed], components: [row] });
}


});

client.on('interactionCreate', async (interaction) => { 
    if (interaction.isButton() && interaction.customId === 'create\_ktp') 
    { const modal = new ModalBuilder() 
        .setCustomId('ktp\_form') 
        .setTitle('Isi Data KTP Kamu');

    const namaInput = new TextInputBuilder()
        .setCustomId('nama')
        .setLabel('Nama Lengkap')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const genderInput = new TextInputBuilder()
        .setCustomId('gender')
        .setLabel('Jenis Kelamin: (Laki-Laki/Perempuan)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const domisiliInput = new TextInputBuilder()
        .setCustomId('domisili')
        .setLabel('Domisili')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const agamaInput = new TextInputBuilder()
        .setCustomId('agama')
        .setLabel('Agama')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const hobiInput = new TextInputBuilder()
        .setCustomId('hobi')
        .setLabel('Hobi')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(namaInput),
        new ActionRowBuilder().addComponents(genderInput),
        new ActionRowBuilder().addComponents(domisiliInput),
        new ActionRowBuilder().addComponents(agamaInput),
        new ActionRowBuilder().addComponents(hobiInput)
    );

    await interaction.showModal(modal);
}

if (interaction.isModalSubmit() && interaction.customId === 'ktp_form') {
    await interaction.reply({ content: 'KTP kamu sedang diproses...', ephemeral: true });

    const nama = interaction.fields.getTextInputValue('nama');
    const gender = interaction.fields.getTextInputValue('gender');
    const domisili = interaction.fields.getTextInputValue('domisili');
    const agama = interaction.fields.getTextInputValue('agama');
    const hobi = interaction.fields.getTextInputValue('hobi');
    const userId = interaction.user.id;
    const avatarUrl = interaction.user.displayAvatarURL({ size: 256, extension: 'png' });
    const createdAt = new Date().toLocaleDateString('id-ID');

    try {
        const templateUrl = 'https://i.imgur.com/rU6Gjvj.png'; // URL template
        const idCardBuffer = await createIDCard({
            templateUrl,
            avatarUrl,
            nama,
            gender,
            domisili,
            agama,
            hobi,
            userId,
            createdAt
        });

        const attachment = new AttachmentBuilder(idCardBuffer, { name: 'idcard.png' });

        await interaction.channel.send({
            content: `Kartu Tanda Penduduk Gang Desa untuk <@${interaction.user.id}>`,
            files: [attachment],
            components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                .setCustomId('create_ktp')
                .setLabel('Buat KTP')
                .setStyle(ButtonStyle.Primary)
    )]
        });
    } catch (error) {
        console.error('Error processing ID card:', error);
    }
}

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
    } else if (lowerContent.includes('welkam')) {
        message.channel.send('<a:Hai:1318929546887565374><a:Welcome1:1319195762902700052><a:Welcome2:1319195777318387722><a:Hai:1318929546887565374>');
    } else if (lowerContent.includes('halo')) {
        message.reply('Halo juga kak! 👋\nGabung sini ke voice biar makin akrab hehe <:Hehe:1099424821974151310>');
    } else if (lowerContent.includes('hai')) {
        message.reply('Hai juga kak! 👋\nGimana kabarnya hari ini? Sini ngobrol di voice hehe <:Hehe:1099424821974151310>');
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
              'Pagi juga, warga Gang Desa! Udara pagi ini segar banget, semoga hari ini penuh berkah dan semangat untuk kita semua. 🌞🌻',
              'Selamat pagi, warga! Jangan lupa sarapan dulu, biar tenaga cukup buat aktivitas seharian. 🍽️',
              'Halo, warga Gang Desa! Matahari udah nyapa, saatnya kita mulai hari dengan semangat. 🌅',
              'Warga Gang Desa, pagi ini cerah banget, kayak wajah ceria kalian yang bikin suasana makin hangat. 😊',
              'Selamat pagi, warga! Yuk, kita bikin Gang Desa makin semarak dengan senyuman pagi ini. 🌸',
              'Pagi, warga! Jangan lupa ngopi dulu sebelum kerja, biar makin fokus dan semangat. ☕️',
              'Selamat pagi, semoga hari ini lancar semua urusannya, dan warga Gang Desa selalu diberkahi. 💪',
              'Pagi warga Gang Desa, jangan lupa saling sapa dan berbagi senyum hari ini. 🌟',
              'Udara pagi Gang Desa segar banget! Semoga kesejukan ini bikin kita semua tambah semangat. 🌬️',
              'Selamat pagi, warga! Yuk, kita jadikan hari ini lebih baik dari kemarin. Salam dari Pak RW! 😊',
            ];
            const randomReply = pagiReplies[Math.floor(Math.random() * pagiReplies.length)];
            message.reply(randomReply);
    } 
        else if (lowerContent.includes('siang')) {
            const siangReplies = [
              'Siang, warga Gang Desa! Jangan lupa makan siang biar energi terisi penuh lagi. 🍛',
              'Halo, warga! Siang-siang gini enaknya ngadem sebentar, biar kerja makin semangat. 🌞',
              'Selamat siang, semoga siang ini penuh berkah buat warga Gang Desa semua. 🙌',
              'Siang, warga Gang Desa! Jangan lupa minum air yang cukup biar tetap segar. 💧',
              'Matahari lagi terik, semoga semangat kita juga makin menyala! Salam hangat dari Pak RW! ☀️',
              'Selamat siang, warga! Kalau ada yang butuh bantuan, jangan ragu bilang ke Pak RW ya! 😊',
              'Siang, warga Gang Desa! Kerja boleh serius, tapi jangan lupa senyum biar tetap asik. 😄',
              'Siang yang cerah, semoga semua aktivitas warga berjalan lancar hari ini. 💪',
              'Siang, warga! Kalau lelah, istirahat sebentar, biar semangat lagi melanjutkan tugas-tugas. ✨',
              'Selamat siang, warga Gang Desa! Mari kita jalani siang ini dengan semangat dan kebersamaan. 🌻',
            ];
            const randomReply = siangReplies[Math.floor(Math.random() * siangReplies.length)];
            message.reply(randomReply);
    } 
        else if (lowerContent.includes('sore')) {
            const soreReplies = [
              'Selamat sore, warga Gang Desa! Udah waktunya santai sebentar sambil ngopi atau ngobrol sama tetangga. ☕️',
              'Sore ini tenang banget, semoga hati kita juga tenang dan damai ya! Salam hangat dari Pak RW! 🌇',
              'Sore, warga Gang Desa! Jangan lupa cek tanaman di pekarangan, biar tetap subur dan cantik. 🌱',
              'Sore, warga! Semoga sore ini jadi waktu yang menyenangkan buat keluarga dan istirahat sejenak. 😊',
              'Sore, warga Gang Desa! Kalau lelah, jangan lupa untuk recharge energi dan istirahat yang cukup. 🌸',
              'Sore ini rasanya pas banget buat menikmati keindahan desa kita. Yuk, bersantai sejenak! 🌿',
              'Selamat sore, warga! Mari kita nikmati sore ini dengan kebersamaan, bisa ngobrol atau sekedar berbagi cerita. 🌇',
              'Sore ini cuacanya enak banget, semoga semua yang kita kerjakan hari ini bisa bermanfaat. 🌷',
              'Sore, warga Gang Desa! Apapun yang kita lakukan hari ini, semoga selalu penuh berkah. 💪',
              'Selamat sore, warga! Jangan lupa untuk selalu menjaga kebersihan dan kenyamanan di gang desa kita. 🌻',
            ];
            const randomReply = soreReplies[Math.floor(Math.random() * soreReplies.length)];
            message.reply(randomReply);
    } 
        else if (lowerContent.includes('malam')) {
            const malamReplies = [
              'Selamat malam, warga Gang Desa! Semoga malam ini penuh kedamaian dan istirahat yang cukup. 🌙',
              'Malam, warga! Jangan lupa tidur lebih awal, biar besok bisa bangun dengan semangat baru! 😴',
              'Selamat malam, warga Gang Desa! Mari kita akhiri hari dengan syukur dan harapan yang baik untuk besok. 🌟',
              'Malam yang tenang, semoga tidurmu nyenyak dan esok hari lebih cerah lagi. 🌙',
              'Selamat malam, warga! Semoga malam ini membawa ketenangan dan kebahagiaan bagi kita semua. 🌙✨',
              'Malam, warga Gang Desa! Jaga kesehatan dan selalu bersyukur atas semua yang kita miliki. 🌙',
              'Malam yang indah, semoga mimpi indah menyertai warga semua, dan besok kita bisa lebih baik lagi. 😴',
              'Selamat malam, warga! Jangan lupa berdoa sebelum tidur, semoga besok lebih baik dari hari ini. 🙏',
              'Malam, warga Gang Desa! Terima kasih sudah menjaga suasana desa yang selalu harmonis. 🌙',
              'Selamat malam, warga! Semoga tidurmu nyenyak dan besok kita semua bisa lebih semangat lagi! 🌟',
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
    const RETRY_DELAY = 5000; // Delay awal 5 detik

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
                             content: 'Kamu berperan sebagai seorang Pak RW di server discord bernama Gang Desa. Gang Desa adalah sebuah komunitas discord dengan konsep perdesaan untuk cari teman ngobrol, tempat curhat, sharing, mabar, nobar, atau bahkan cari jodoh, berdiri sejak Desember 2022. Di Gang Desa kamu bisa upload foto di Galeri Warga, ngobrol dan curhat bareng Pak RW, sampai dicarikan jodoh oleh Pak Penghulu. Pak RW, Pak Hansip dan Pak Penghulu suka nongkrong di kantor pejabat di <#1307965818654560368> . Akun sosial media Gang Desa ada Tiktok dengan username @discordgangdesa atau linknya https://tiktok.com/@discordgangdesa . Kamu juga dapat mendengarkan Radio di Warkop, dan menonton Televisi di Pos Ronda! Jadwal tayang televisi desa yaitu, Weekday: Pagi pukul 05.30 - 08.30 WIB dan Sore pukul 18.30 - 23.00 WIB. Weekend: tayang 24 Jam pukul 00.00 - 23.59 WIB. Jadwal tayang tv bisa berubah sewaktu waktu, jika tv mati bisa jadi diluar jadwal tayang atau lagi diservice, cara pindah channel tv harus punya minimal Role Juragan, jika tidak punya role juragan bisa minta tolong pindahkan channel tv ke juragan atau admin dengan cara mention role Juragan di <#1052123058678276106>. Bagi warga baru wajib Baca peraturan desa di <#1052123681578557500> . Cara naik level di gang desa cukup aktif di chat atau voice. Untuk mendapatkan role juragan bisa dengan boost server, keuntungan role juragan bisa akses remote Tv, pindah channel tv dan bisa mendapatkan fitur khusus seperti mute, deafen, move dan akses ke channel VIP seperti buat Villa di <#1324635056328675338> , selain juragan, bisa juga dapat role sultan, raden, donatur dengan cara donasi ke gang desa di <#1221385772351881286>, keuntungannya sama seperti juragan, untuk role warga vip bisa dengan cara jadi membership youtube Arjuna Wirya atau Juna. Kamu bisa cek role lainnya di <#1052123748137963550> dan minta role melalui loket desa di <#1149203043229900840> . Jika ingin menjadi admin (pengurus, hansip, humas) di gang desa bisa mendaftar di <#1335865584574795857> . Ada banyak channel di Gang Desa diantaranya tempat untuk chat ada di <#1052123058678276106> dan untuk mabar ada di <#1052428628819984424> bisa juga tulis kata bijak di <#1052126207937880095> . Kamu juga bisa post foto atau video di galeri warga untuk mendapatkan role spesial sesuai kategori. Untuk membuat voice kamu dapat ke <#1147572648533045249> dan baca panduan voice di <#1305029891237875722> . Nonton Tv bisa di <#1335628551914918018> , mendengarkan radio di <#1052125833852108820>, mendengarkan lagu di <#1335776955856982177> dan nonton film di <#1324767443574456406> . Bisa buat KTP di <#1332957041882562560> , cari jodoh di <#1284544825596837971> kalau udah dapet jodoh, langsung pake foto couple di <#1307961992346206238> , untuk bertanya ke Pak RW di <#1307965374511190068> dan curhat sama Pak RW di <#1221377162020651008> , ikut event di <#1095268040528105492>  dan giveaway di <#1095001471256379462> , daftar menjadi admin gang desa di <#1335865584574795857> , cek level di <#1094876909109788672> menggunakan /rank , membagikan link di <#1052124871066402827> , kasih kata bijak di <#1052126207937880095> , main sambung kata di <#1141225117838495807> , serta diskusi bareng di forum diskusi di <#1286783451059458172> . Buat laporan ke admin seperti penipuan, pelecehan, perilaku tidak menyenangkan di <#1322113951969841152>  . ajak kerjasama gang desa melalui loket desa <#1149203043229900840> . Request giveaway sesuai yang kita mau dengan cara jadi sponsor ke <#1319651979210788945> . Mau jadi partnership atau mitra gang desa cek <#1300360114733187082> . Tempat istirahat atau afk di <#1052131806473879552> . Tempat bermain bersama bot discord ada di Taman Bermain, seperti main owo di <#1095688791437611041> , main alita di <#1300103588445552734> , main miner di <#1306148106001190982> , dan main fisher / mancing di <#1300104429726601257> .Buat laporan ke admin seperti penipuan, pelecehan, perilaku tidak menyenangkan di <#1322113951969841152>  . ajak kerjasama gang desa melalui loket desa <#1149203043229900840> . Request giveaway sesuai yang kita mau dengan cara jadi sponsor ke <#1319651979210788945> . Mau jadi partnership atau mitra gang desa cek <#1300360114733187082> . Tempat istirahat atau afk di <#1052131806473879552> . Tempat bermain bersama bot discord ada di Taman Bermain, seperti main owo di <#1095688791437611041> , main alita di <#1300103588445552734> , main miner di <#1306148106001190982> , dan main fisher / mancing di <#1300104429726601257> . Kepala desa sebagai pemilik Gang Desa ada dua, pertama ada Nevix, seorang yang ganteng, tajir, humoris, tidak sombong, dan memiliki seorang pasangan bernama Ira seorang Bidan yang pekerja keras, sudah pacaran selama 6 tahun lebih, doain semoga tahun depan nikah. Kepala desa kedua ada Juna, seorang streamer di youtube @arjunawirya yang main gta 5 roleplay, sering ngomong Kyahhh, memiliki tingkah yang kocak dan random, kadang suka ngomel-ngomel, dan akan berjodoh dengan seorang bernama Paipai orang bandung yang merupakan seorang idol. Pejabat desa ada 3, yaitu Pak RW yang bertugas membantu dan menjawab pertanyaan warga, Pak Hansip yang bertugas menjaga keamanan desa, dan Pak Penghulu yang bertugas mencarikan jodoh untuk warga. Ada beberapa Pengurus desa yang bertugas untuk mengurus warga seperti memberikan role di loket desa, dan baik serta ramah yaitu Dipsi, Ecak, Exy, Myst, Nao, dan Naya. Ada Humas desa yang bertugas untuk menjalin kerja sama dan promosi desa yaitu ada Teteh Pani, Thufail, dan Hokcy. Ada Hansip desa bertugas menjaga keamanan desa yang tegas dan galak yaitu Fixel, Gago, dan Red. Ada juga warga lainnya seperti Pirda, yang jago bikin kopi dan tiap hari main Dota Chess. Ada Tungirz seorang Arab Bandung, dia juga punya brand Baju @gudsofficial_ . Ada dipsi yang suka ngetroll main valorant, lagi deket sama bang upi. Ada Hokcy yang punya godain warga disini alias buaya betina, hati hati kalau udah bilang rawrrr. Ada Maddy atau Claire yang sediki anomali dan juga yang suka godain warga dengan gombalan mautnya. Ada Naya yang suka sama oreo goreng dan sekarang lagi belajar bikin kopi sebagai barista. Ada Exy pengurus paling galak yang suka sarkas dan jualan moci @mochipa.chewy serta suka main mobile legends. Ada Moci seorang guru perempuan yang suka main valorant pake agent Killjoy. Ada caka yang jago ngegambar dan ngebucin terus. Ada Ecak yang sering ngomel-ngomel tapi kadang baik, tapi kadang sering PMS padahal dia laki-laki. Ada Teteh Pani yang jago nyanyi dan katanya lagi cari jodoh. Ada Fixel yang suka kucing dan lagi deket sama lily yang sering diledekin lily was a little girl. Ada Gago yang sok sibuk dan sok ganteng, suka toxic, dulu sering muncul sekarang gatau kemana. Ada Red yang sok sibuk kuliah, sok jadi senior dan caper, kadang tengil dan toxic. Ada Boril yang suka main RDR dan orangnya bijak. Ada Pio seorang bocil yang suka makan moci, sering pundung, sering badmood dan sering bawa piso kemana-mana. Ada Noah, seorang guru perempuan yang sangat anomali dan random. Ada Joan yang suka menyendiri di voice. Ada maul yang jago ngoding. Ada Roshan seorang koko cina yang galak dan ngeselin. Ada Thufail atau Tupel yang sok ganteng dan kocak, sering ngonten juga di youtube @thufailwafii . Ada wahyu atau dipanggil voxo yang sok ganteng dan suka ngetroll kalau main valorant. Ada Faras anak skena yang jago outfit sambil ngonten. Ada Cyla yang suka jualan netflix. Ada Alin yang jarang mandi. Ada Kinan atau Kylie yang lagi cari koko ganteng dan kaya, kadang suka jadi ani-ani. Ada Faiz yang sok keren dan bucin terus. Ada Rosmaya, ibu-ibu yang kocak, rambutnya kribo tapi sejak ada suami jadi berubah jadi kalem. Ada Myst atau Ben yang sok imut najis, dan suka main valorant tapi ga jago jago, suka gym tapi juga suka makan banyak dan suka pundung. Ada Arif seorang Developer Desa yang jago ngoding dan suka benerin TV Desa biar warga bisa nobar. Ada Nana seorang tenaga medis yang rajin kerja dan sering nongkrong di discord sambil dengerin lagu seharian. Ada aezagaming yang suka ngadain nobar film di Layar Tancap. Ada dadang yang ngakunya umur 8 tahun tapi suaranya tua banget. Ada Irfan yang jago fotografi dan suka bagi-bagi stiker Gang Desa. Ada Haaa yang kerja keras dan sering nongkrong di voice. Ada Hau seorang koko cina yang lagi kuliah di Taiwan. Warga Gang Desa rata-rata sering main valorant, mobile legend, gta 5 roleplay, roblox, minecrat atau sekedar nongkrong di voice sampai cari jodoh. Ada Feey yang pernah joget lagu waktu ku kecil aku gatau yang mungil-mungil. Ada jesjes yang cantik dan baik banget, suka jalan-jalan terus ke luar negeri. Ada yunitameli yang cantik dan baik hati, suka donasi ke desa. Ada Feey yang suka joget sambil nyanyi lagu waktu ku kecil aku gatau yang mungil-mungil. Ada Agus yang suka sering ngasih kata-kata bijak. Sebagai Pak RW, kamu dapat menjadi teman ngobrol dan menjawab semua pertanyaan warga desa. Pak RW dirancang langsung oleh Nevix yang juga merupakan seorang Developer. Jawab dengan bijak dan gunakan bahasa yang santai dengan sedikit humoris. Jawabanmu tidak boleh lebih dari 2000 karakter.',
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
if (message.content.toLowerCase().startsWith(`rwtanya`)) {
    const query = message.content.slice(`rwtanya`.length).trim();
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

// Menambahkan custom status
const statusMessages = ["👀 Sedang Memantau", "👥 Warga Gang Desa"];
const statusTypes = [ 'online'];
let currentStatusIndex = 0;
let currentTypeIndex = 0;

client.once('ready', () => {
  console.log('\x1b[36m[ INFO ]\x1b[0m', `\x1b[34mPing: ${client.ws.ping} ms \x1b[0m`);
  login();
  updateStatus();
  setInterval(updateStatus, 10000);
  heartbeat();
});

async function login() {
  try {
    await client.login(TOKEN);
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

client.login(TOKEN);
