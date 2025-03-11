require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActivityType, MessageAttachment, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
       ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, Intents, MessageActionRow, MessageButton, MessageEmbed,
       SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField, AttachmentBuilder
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
    '1100632084051140669': { roleId: '1311282573699190854', threadName: '💬 Tulis komentar disini...' }, // Random 
    '1311277162753425429': { 
        roleIdCogan: '1135459439558791219',
        roleIdKembangDesa: '1135458269670944879',
        requirementCogan: '1052230151984906300',
        requirementKembangDesa: '1052128766777901087',
        threadName: 'Tulis komentar disini...'
    },
    '1311277387148951582': { roleId: '1311283067058524190', threadName: '💬 Tulis komentar disini...' },
    '1311277512558510090': { roleId: '1311283485847195648', threadName: '💬 Tulis komentar disini...' },
    '1311278033969090610': { roleId: '1287745130106847313', threadName: '💬 Tulis komentar disini...' },
    '1311278783344676884': { roleId: '1285971566366032004', threadName: '💬 Tulis komentar disini...' },
    '1311278954245787698': { roleId: '1135121270078451752', threadName: '💬 Tulis komentar disini...' },
    '1312281786318852096': { roleId: '1312280861219225631', threadName: '💬 Tulis komentar disini...' },
    '1335658950980276328': { roleId: '1335657621977432165', threadName: '💬 Tulis komentar disini...' }, // olahraga
    '1335876168641019954': { roleId: '1335877150737174528', threadName: '💬 Tulis komentar disini...' }, // kerja
    '1335886755643260978': { roleId: '1335885084364111936', threadName: '💬 Tulis komentar disini...' }, 
    '1342095563759419512': { roleId: '1342094772612890666', threadName: '💬 Tulis komentar disini...' }, // bucin
    '1343525650686021633': { roleId: '1149252517818015744', threadName: '💬 Tulis komentar disini...' }, // show off
    '1343533420587909164': { roleId: '1343521572916433008', threadName: '💬 Tulis komentar disini...' }, // owo squad
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

// Fitur auto role & react giveaway
const CHANNEL_GIVEAWAY = '1319651622481166419';  // ID Channel Giveaway
const ROLE_GIVEAWAY = '1322509806472269826';  // ID Role Giveaway

client.on('messageCreate', async (message) => {
    // Pastikan pesan bukan dari bot
    if (message.author.bot) return;

    // Periksa apakah pesan dikirim di channel yang ditentukan
    if (message.channel.id === CHANNEL_GIVEAWAY) {
        try {
            const guildMember = await message.guild.members.fetch(message.author.id);

            // Tambahkan role jika belum dimiliki
            if (!guildMember.roles.cache.has(ROLE_GIVEAWAY)) {
                await guildMember.roles.add(ROLE_GIVEAWAY);
                console.log(`✅ Role diberikan ke ${message.author.tag}`);
            }

            // Tambahkan reaksi ✅ ke pesan
            await message.react('✅');
        } catch (error) {
            console.error(`❌ Gagal memberikan role atau reaksi: ${error.message}`);
        }
    }
});

// Fitur OwO Lottery
const LOTTERY_ROLE_ID = '1343554118899335241';
const ADMIN_ROLE_ID = '1077457424736333844';

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'lottery') {
        // Cek apakah user memiliki akses
        if (
            !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
            !interaction.member.roles.cache.has(ADMIN_ROLE_ID)
        ) {
            return interaction.reply({ content: "❌ Anda tidak memiliki izin untuk menjalankan perintah ini!", ephemeral: true });
        }

        await interaction.reply({ content: "🎰 Memulai OwO Lottery... Harap tunggu!", ephemeral: false });

        // Ambil daftar peserta langsung dari server
        try {
            const guild = interaction.guild;
            await guild.members.fetch(); // Fetch semua member agar cache terisi
            const role = guild.roles.cache.get(LOTTERY_ROLE_ID);
            if (!role) {
                return interaction.followUp({ content: "❌ Role lottery tidak ditemukan!", ephemeral: true });
            }

            const membersWithRole = role.members.map(member => member);
            const totalPeserta = membersWithRole.length;

            if (totalPeserta === 0) {
                return interaction.followUp({ content: "❌ Tidak ada peserta OwO Lottery!", ephemeral: true });
            }

            // Simulasi animasi spin wheel selama 10 detik
            const participantNames = membersWithRole.map(member => member.user.username);
            const spinWheelEmbed = new EmbedBuilder()
                .setTitle("🎡 **OwO Lottery: Spinning Wheel...**")
                .setDescription(`**Peserta:**\n${participantNames.join(', ')}`)
                .setColor("Random")
                .setFooter({ text: "Memilih pemenang..." });

            // Kirim pesan spin wheel ke channel tempat perintah digunakan
            const announceChannel = interaction.channel;
            announceChannel.send({ embeds: [spinWheelEmbed] }).then(async (spinMessage) => {
                setTimeout(async () => {
                    // Pilih pemenang secara acak setelah 10 detik
                    const winner = membersWithRole[Math.floor(Math.random() * totalPeserta)];

                    // Hitung total hadiah
                    const totalLottery = totalPeserta * 200000;
                    const pajakLottery = totalLottery * 0.1;
                    const jumlahDiterima = totalLottery - pajakLottery;

                    // Embed pengumuman pemenang
                    const winnerEmbed = new EmbedBuilder()
                        .setTitle("🎟️ **GANG DESA OWO LOTTERY** 🎟️")
                        .setColor("Gold")
                        .addFields(
                            { name: "🎉 Pemenang:", value: `${winner}`, inline: false },
                            { name: "👥 Total Peserta:", value: `${totalPeserta}`, inline: true },
                            { name: "💰 Total Lottery:", value: `${totalLottery.toLocaleString()}`, inline: true },
                            { name: "📉 Pajak Lottery:", value: `${pajakLottery.toLocaleString()}`, inline: true },
                            { name: "💸 Jumlah Diterima:", value: `${jumlahDiterima.toLocaleString()}`, inline: true }
                        )
                        .setTimestamp();

                    // Kirim pengumuman pemenang ke channel tempat perintah digunakan
                    announceChannel.send({
                        content: `🎉 **Selamat** <@${winner.id}> kamu telah memenangkan **OwO Lottery!**`,
                        embeds: [winnerEmbed]
                    });

                }, 10000); // Spin selama 10 detik
            });

        } catch (error) {
            console.error("❌ Terjadi kesalahan saat mengambil peserta lottery:", error);
            interaction.followUp({ content: "❌ Terjadi kesalahan saat menjalankan OwO Lottery.", ephemeral: true });
        }
    }
});

// Fitur reset lottery
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'resetlottery') {
        // Periksa apakah user memiliki akses
        if (
            !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
            !interaction.member.roles.cache.has(ADMIN_ROLE_ID)
        ) {
            return interaction.reply({ content: "❌ Anda tidak memiliki izin untuk menjalankan perintah ini!", ephemeral: true });
        }

        await interaction.reply({ content: "🔄 Sedang mereset OwO Lottery... Harap tunggu!", ephemeral: false });

        try {
            const guild = interaction.guild;
            await guild.members.fetch(); // Ambil semua member agar cache terisi
            const role = guild.roles.cache.get(LOTTERY_ROLE_ID);

            if (!role) {
                return interaction.followUp({ content: "❌ Role lottery tidak ditemukan!", ephemeral: true });
            }

            const membersWithRole = role.members.map(member => member);
            if (membersWithRole.length === 0) {
                return interaction.followUp({ content: "⚠️ Tidak ada peserta OwO Lottery untuk di-reset.", ephemeral: true });
            }

            // Menghapus role dari semua anggota
            for (const member of membersWithRole) {
                await member.roles.remove(role);
            }

            interaction.followUp({
                content: `✅ Semua **${membersWithRole.length} peserta** telah direset dari **OwO Lottery!**`
            });

        } catch (error) {
            console.error("❌ Terjadi kesalahan saat mereset lottery:", error);
            interaction.followUp({ content: "❌ Terjadi kesalahan saat mereset OwO Lottery.", ephemeral: true });
        }
    }
});

// Fitur reset giveaway
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'resetgiveaway') {
        // Cek apakah user memiliki role yang diizinkan atau admin
        if (
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator) &&
            !interaction.member.roles.cache.has(ADMIN_ROLE_ID)
        ) {
            return interaction.reply({ content: "❌ Kamu tidak memiliki izin untuk menjalankan perintah ini!", ephemeral: true });
        }

        const role = interaction.guild.roles.cache.get(ROLE_GIVEAWAY);
        if (!role) {
            return interaction.reply({ content: "❌ Role Giveaway tidak ditemukan!", ephemeral: true });
        }

        try {
            const membersWithRole = role.members;
            const totalMembers = membersWithRole.size;

            if (totalMembers === 0) {
                return interaction.reply({ content: `✅ Tidak ada member yang memiliki role ${role}.`, ephemeral: true });
            }

            // Kirim pesan sementara "Sedang mereset giveaway..."
            await interaction.reply({ content: "🔄 Sedang mereset giveaway...", ephemeral: false });

            // Hapus role dari semua member
            for (const [_, member] of membersWithRole) {
                await member.roles.remove(role);
            }

            // Edit pesan sebelumnya dengan hasil akhir (mention role)
            await interaction.followUp({ content: `✅ Berhasil mereset **${role}** dari total **${totalMembers} peserta!**` });

        } catch (error) {
            console.error(`❌ Gagal menghapus role: ${error.message}`);
            return interaction.reply({ content: "❌ Terjadi kesalahan saat menghapus role.", ephemeral: true });
        }
    }
});

// Fitur giveaway
 client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand() && interaction.commandName === 'giveaway') {
        // Periksa apakah user memiliki izin
        if (
            !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
            !interaction.member.roles.cache.has(ADMIN_ROLE_ID)
        ) {
            return interaction.reply({ content: "❌ Anda tidak memiliki izin untuk menjalankan perintah ini!", ephemeral: true });
        }

        const role = interaction.options.getRole('role');

        if (!role) {
            return interaction.reply({ content: "❌ Role tidak ditemukan!", ephemeral: true });
        }

        await interaction.reply({ content: `🎉 Sedang memilih pemenang giveaway dari **${role.name}**... Harap tunggu!`, ephemeral: false });

        try {
            const guild = interaction.guild;
            await guild.members.fetch(); // Ambil semua member agar cache terisi
            const membersWithRole = role.members.map(member => member);

            if (membersWithRole.length === 0) {
                return interaction.followUp({ content: "⚠️ Tidak ada peserta dengan role ini!", ephemeral: false });
            }

            // Buat list nama peserta untuk Spin Wheel
            const participantNames = membersWithRole.map(member => member.user.username);
            let displayNames = participantNames.join(', ');

            if (displayNames.length > 1024) {
                displayNames = displayNames.substring(0, 1020) + "...";
            }

            // Embed untuk menampilkan Spin Wheel
            const spinEmbed = new EmbedBuilder()
                .setTitle("🎡 **SPIN WHEEL GIVEAWAY**")
                .setDescription(`🎉 Memilih pemenang dari **${role.name}**...\n\n**Peserta:**\n${displayNames}`)
                .setColor("Random");

            const spinMessage = await interaction.followUp({ embeds: [spinEmbed] });

            // Simulasi Spin Wheel (10 detik)
            await new Promise(resolve => setTimeout(resolve, 10000));

            // Pilih pemenang secara acak
            const winner = membersWithRole[Math.floor(Math.random() * membersWithRole.length)];

            // Tombol Reroll
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('reroll_giveaway')
                        .setLabel('🔄 Reroll')
                        .setStyle(ButtonStyle.Primary)
                );

            // Embed hasil pemenang
            const winnerEmbed = new EmbedBuilder()
                .setTitle("🎉 **GIVEAWAY WINNER**")
                .setDescription(`✨ **Selamat ${winner} kamu telah memenangkan Giveaway!** ✨`)
                .setColor("Gold");

            const message = await interaction.followUp({
                content: `🎊 **Pemenang telah dipilih!** 🎊`,
                embeds: [winnerEmbed],
                components: [row]
            });

            // Handle Reroll
            const filter = i => i.customId === 'reroll_giveaway' && (i.member.permissions.has(PermissionsBitField.Flags.Administrator) || i.member.roles.cache.has(ADMIN_ROLE_ID));
            const collector = message.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                // Pilih pemenang baru
                const newWinner = membersWithRole[Math.floor(Math.random() * membersWithRole.length)];
                
                // Embed untuk pemenang baru
                const newWinnerEmbed = new EmbedBuilder()
                    .setTitle("🎉 **GIVEAWAY WINNER**")
                    .setDescription(`✨ **Selamat ${newWinner} kamu telah memenangkan Giveaway!** ✨`)
                    .setColor("Gold");

                await i.update({ content: `🎊 **Pemenang telah dipilih ulang!** 🎊`, embeds: [newWinnerEmbed], components: [row] });
            });

        } catch (error) {
            console.error("❌ Terjadi kesalahan saat melakukan giveaway:", error);
            interaction.followUp({ content: "❌ Terjadi kesalahan saat menjalankan giveaway.", ephemeral: false });
        }
    }
});

// Mini games tebak angka
// Simpan sesi game
let gameSession = {};

// Event saat ada interaksi command
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'tebakangka') {
        // Periksa apakah user memiliki izin admin atau role tertentu
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
            !interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
            return interaction.reply({ content: '❌ Kamu tidak memiliki izin untuk memulai game!', ephemeral: true });
        }

        // **FIX** Cek apakah game sudah berjalan sebelum memulai
        if (gameSession && gameSession.active) {
            return interaction.reply({ content: '⚠️ Game tebak angka masih berlangsung!', ephemeral: true });
        }

        // **RESET gameSession sebelum mulai**
        gameSession = {
            active: true,
            targetNumber: Math.floor(Math.random() * 100) + 1,
            startTime: Date.now(),
            channel: interaction.channel,
            timeout: setTimeout(() => {
                if (gameSession && gameSession.active) {
                    gameSession.channel.send('⏳ **Waktu habis!** Tidak ada yang berhasil menebak angka.');
                    gameSession = null; // Reset game
                }
            }, 60000) // 1 menit
        };

        // Kirim pesan pembukaan game
        const embed = new EmbedBuilder()
            .setTitle('🎯 Tebak Angka Dimulai!')
            .setDescription('Bot telah memilih angka antara **1-100**. Tebak angka dengan mengetik langsung di chat!\n\n'
                + '📌 **Aturan:**\n'
                + '- Tebak sebanyak yang kamu mau!\n'
                + '- Admin bisa memberi **clue** dengan reaction ⬆️ atau ⬇️.\n'
                + '- **Waktu:** 1 menit sebelum game berakhir otomatis!\n\n'
                + '🎲 **Ayo mulai menebak!**')
            .setColor('Green');

        await interaction.reply({ embeds: [embed] });
    }
});

// Event untuk menangkap tebakan pemain
client.on('messageCreate', async (message) => {
    if (!gameSession || !gameSession.active || message.author.bot || message.channel.id !== gameSession.channel.id) return;

    const guess = parseInt(message.content);
    if (isNaN(guess) || guess < 1 || guess > 100) return;

    // Cek apakah tebakan benar
    if (guess === gameSession.targetNumber) {
        gameSession.active = false;
        clearTimeout(gameSession.timeout); // Hentikan timer sebelum waktu habis
        gameSession.channel.send(`🎉 **Selamat <@${message.author.id}>!** Kamu berhasil menebak angka **${guess}** dengan benar!`);
        gameSession = null; // Reset game
        return;
    }

    // Jika salah, beri respon dan reaksi
    const hint = guess < gameSession.targetNumber ? '📈 Angka lebih besar!' : '📉 Angka lebih kecil!';
    await message.react(guess < gameSession.targetNumber ? '⬆️' : '⬇️');
    message.reply(hint);
});

// Fitur game tebak kata
const GAME_DURATION = 60000; // 60 detik per ronde
const TOTAL_ROUNDS = 10;

let gameActive = false;
let gameParticipants = new Set();
let currentWord = '';
let currentHint = '';
let currentCategory = '';
let currentRound = 0;
let scores = {};
let gameChannel = null;
let gameStartTimeout = null;

// Fungsi memilih kata secara acak dan menyensornya
function getRandomWordAndHint() {
    const words = JSON.parse(fs.readFileSync('kata.json', 'utf8'));
    const randomWord = words[Math.floor(Math.random() * words.length)];

    currentWord = randomWord.word;
    currentCategory = randomWord.category;

    let hintArray = currentWord.split('');
    let revealIndices = [];
    while (revealIndices.length < 2) {
        let index = Math.floor(Math.random() * hintArray.length);
        if (!revealIndices.includes(index)) {
            revealIndices.push(index);
        }
    }

    currentHint = hintArray.map((char, index) => (revealIndices.includes(index) ? char : '_')).join('');
}

// Slash Command /tebakkata
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'tebakkata') {
        if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID) && !interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ Anda tidak memiliki izin untuk menjalankan perintah ini.', ephemeral: true });
        }

        if (gameActive) {
            return interaction.reply({ content: '⚠️ Permainan masih berlangsung!', ephemeral: true });
        }

        gameActive = true;
        gameParticipants.clear();
        currentRound = 0;
        scores = {};
        gameChannel = interaction.channel;

        const embed = new EmbedBuilder()
            .setTitle('🎮 Tebak Kata Akan Dimulai!')
            .setDescription('Tekan **Gabung** untuk ikut bermain.\nPermainan akan dimulai dalam **60 detik** atau jika admin menekan **Mulai**.')
            .setColor('BLUE');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('join_game').setLabel('Gabung').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('start_game').setLabel('Mulai').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('cancel_game').setLabel('Keluar').setStyle(ButtonStyle.Danger)
            );

        await interaction.reply({ embeds: [embed], components: [row] });

        // Timer otomatis mulai setelah 60 detik jika admin tidak menekan "Mulai"
        gameStartTimeout = setTimeout(() => {
            if (gameActive && gameParticipants.size > 0) {
                startNewRound();
            } else {
                gameChannel.send('⚠️ **Permainan dibatalkan karena tidak ada peserta!**');
                gameActive = false;
            }
        }, 60000);
    }
});

// Menangani tombol interaksi
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const { customId, user } = interaction;

    if (customId === 'join_game') {
        if (gameParticipants.has(user.id)) {
            return interaction.reply({ content: '✅ Anda sudah bergabung!', ephemeral: true });
        }
        gameParticipants.add(user.id);
        return interaction.reply({ content: `🎉 **${user.username}** telah bergabung dalam permainan!`, ephemeral: true });
    }

    if (customId === 'start_game') {
        if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID) && !interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ Anda tidak memiliki izin untuk memulai permainan!', ephemeral: true });
        }

        if (gameStartTimeout) clearTimeout(gameStartTimeout);
        if (gameParticipants.size === 0) {
            gameActive = false;
            return interaction.update({ content: '⚠️ **Tidak ada peserta! Permainan dibatalkan.**', components: [] });
        }

        interaction.update({ content: '🎯 **Permainan dimulai!**', components: [] });
        startNewRound();
    }

    if (customId === 'cancel_game') {
        if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID) && !interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ Anda tidak memiliki izin untuk membatalkan permainan!', ephemeral: true });
        }

        if (gameStartTimeout) clearTimeout(gameStartTimeout);
        gameActive = false;
        gameParticipants.clear();
        return interaction.update({ content: '🚫 **Permainan telah dibatalkan oleh admin.**', components: [] });
    }
});

// Memulai ronde baru
async function startNewRound() {
    if (!gameActive || currentRound >= TOTAL_ROUNDS) {
        return endGame();
    }

    currentRound++;
    getRandomWordAndHint();

    const embed = new EmbedBuilder()
        .setTitle(`🎯 Ronde ${currentRound}/${TOTAL_ROUNDS}`)
        .setDescription(`Kategori: **${currentCategory}**\nTebak kata ini: **${currentHint}**`)
        .setColor('BLUE')
        .setFooter({ text: 'Jawab di chat!' });

    gameChannel.send({ embeds: [embed] });

    const filter = (msg) => !msg.author.bot && gameParticipants.has(msg.author.id);
    const collector = gameChannel.createMessageCollector({ filter, time: GAME_DURATION });

    collector.on('collect', (msg) => {
        if (msg.content.toLowerCase() === currentWord.toLowerCase()) {
            collector.stop();
            if (!scores[msg.author.id]) scores[msg.author.id] = 0;
            scores[msg.author.id]++;

            gameChannel.send(`🎉 **${msg.author}** menjawab benar! Kata: **${currentWord}** (+1 Poin)`);

            setTimeout(startNewRound, 3000);
        }
    });

    collector.on('end', (collected, reason) => {
        if (reason !== 'user') {
            gameChannel.send(`⏳ Waktu habis! Kata yang benar adalah **${currentWord}**`);
            setTimeout(startNewRound, 3000);
        }
    });
}

// Mengakhiri game
function endGame() {
    gameActive = false;
    if (Object.keys(scores).length === 0) {
        return gameChannel.send('😢 **Sayang sekali!** Tidak ada yang menang kali ini.');
    }

    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const winnerId = sortedScores[0][0];
    const winnerScore = sortedScores[0][1];

    const embed = new EmbedBuilder()
        .setTitle('🏆 Tebak Kata Selesai!')
        .setDescription(`🎖️ **Pemenang:** <@${winnerId}> dengan **${winnerScore} Poin**`)
        .setColor('GOLD');

    gameChannel.send({ embeds: [embed] });
}

client.once('ready', () => {
    console.log(`${client.user.tag} siap!`);
});


// Event yang dipicu ketika member melakukan boost server
const BoostChannelID = '1052126042300624906';

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    // Mengecek apakah member melakukan boost server
    if (!oldMember.premiumSince && newMember.premiumSince) {
        // Dapatkan channel terima kasih
        const BoostChannel = newMember.guild.channels.cache.get(BoostChannelID);
        const embed = new EmbedBuilder()
            .setTitle('<a:ServerBoosterGif:1082918277858213919> SELAMAT DATANG JURAGAN! <a:ServerBoosterGif:1082918277858213919>') // Judul embed
            .setDescription(`Terima kasih sudah mendukung server ini Juragan ${newMember.toString()}! Sekarang kamu dapat menikmati fitur khusus (Mute, Deafen, Move & Disconnect Voice), akses ke Remote Tv, dan akses ke Voice Channel VIP <#1337273935766618143> dari Role <@&1052585457965346848>`)
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
    '1221395908311384125': 'Terima kasih sudah mendukung server ini Donatur ${newMember.toString()}! Sekarang kamu dapat menikmati fitur khusus (Mute, Deafen, Move & Disconnect Voice), akses ke Remote Tv dan akses ke Voice Channel VIP <#1337273935766618143> dari Role <@&1221395908311384125>',
    '1081256438879485953': 'Terima kasih sudah mendukung server ini Raden ${newMember.toString()}! Sekarang kamu dapat menikmati fitur khusus (Mute, Deafen, Move & Disconnect Voice), akses ke Remote Tv dan akses ke Voice Channel VIP <#1337273935766618143> dari Role <@&1081256438879485953>',
    '1105536787725684848': 'Terima kasih sudah mendukung server ini Sultan ${newMember.toString()}! Sekarang kamu dapat menikmati fitur khusus (Mute, Deafen, Move & Disconnect Voice), akses ke Remote Tv dan akses ke Voice Channel VIP <#1337273935766618143> dari Role <@&1105536787725684848>',
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
    
    client.application.commands.create(
        new SlashCommandBuilder()
        .setName('lottery')
        .setDescription('Memulai OwO Lottery')
    );
    
    client.application.commands.create(
        new SlashCommandBuilder()
        .setName('resetlottery')
        .setDescription('Menghapus semua peserta dari OwO Lottery')
    );
    
    client.application.commands.create(
        new SlashCommandBuilder()
        .setName('resetgiveaway')
        .setDescription('Menghapus semua peserta dari Giveaway')
    );
    
    client.application.commands.create(
        new SlashCommandBuilder()
            .setName('giveaway')
            .setDescription('Memilih pemenang giveaway dari role yang dipilih')
            .addRoleOption(option =>
                option.setName('role')
                    .setDescription('Pilih role peserta giveaway')
                    .setRequired(true)
            )
    );

    client.application.commands.create(
        new SlashCommandBuilder()
               .setName('tebakangka')
               .setDescription('Memulai game tebak angka 1-100')
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

        // Log ke channel 1099916187044941914
        const logChannel = client.channels.cache.get('1099916187044941914');
        if (logChannel) {
        logChannel.send(`[LOG] **${interaction.user.tag}** menggunakan /say: "${pesan}"`);
        }   
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
           const welcomeReplies = [
              `Selamat datang! Gang Desa makin rame nih~ semoga betah, ya. Kalau butuh sesuatu, tanya aja ke Pak RW… atau langsung minta perhatian juga boleh 😆💕`,
              `Selamat datang di Gang Desa! Jangan malu-malu, di sini semua warga ramah… apalagi Pak RW, lebih dari ramah, perhatian banget 😏`,
              `Wah, ada warga baru! Selamat datang! Hati-hati, nanti kebanyakan main di sini malah jadi nyaman 😆✨`,
              `Selamat datang di Gang Desa! Di sini nggak ada yang sendiri, kecuali yang emang jomblo… tapi tenang aja, ada Pak RW yang siap nemenin 😘`,
              `Halo, warga baru! Selamat datang di rumah kedua kamu! Jangan lupa absen tiap hari, biar Pak RW inget terus sama kamu 😏💕`,
              `Selamat datang di Gang Desa! Semoga betah, kalau nggak betah, tenang aja… Pak RW siap bikin nyaman 😆`,
              `Selamat bergabung di Gang Desa, jangan lupa rajin nyapa Pak RW ya 😏✨`,
              `Wah, ada yang baru nih! Selamat datang! Semoga di sini kamu nemu temen baru, pengalaman baru, dan mungkin… jodoh baru? 😘`,
              `Selamat datang di Gang Desa! Wajib senyum setiap hari di sini, soalnya Pak RW nggak tega lihat warganya sedih 😆💕`,
              `Halo! Gang Desa makin seru nih ada kamu~ jangan lupa sering ngobrol ya, biar makin akrab sama warga… dan Pak RW 😏`,
              `Selamat datang di tempat paling santai, seru, dan penuh kehangatan, Kalau butuh apa-apa, cari Pak RW aja, siap bantu… bantu baper maksudnya 😆`,
              `Selamat datang! Semoga betah ya, kalau belum betah, Pak RW siap kasih alasan biar betah 😏💕`,
              `Halo! Baru masuk Gang Desa tapi auranya udah cocok banget nih~ selamat bergabung, semoga makin akrab sama kita semua 😘`,
              `Selamat datang! Di sini santai aja, nggak ada aturan ribet… kecuali satu: jangan bikin Pak RW kangen kalau jarang nongol 😆`,
              `Halo warga baru! Gang Desa makin keren karena ada kamu! Yuk langsung gabung ngobrol, biar makin akrab sama Pak RW 😏✨`,
               ];
            const randomReply = welcomeReplies[Math.floor(Math.random() * welcomeReplies.length)];
            message.channel.send(randomReply);
    } else if (lowerContent.includes('welkam')) {
        message.channel.send('<a:Hai:1318929546887565374><a:Welcome1:1319195762902700052><a:Welcome2:1319195777318387722><a:Hai:1318929546887565374>');
    } else if (lowerContent.includes('halo')) {
           const haloReplies = [
              `Halo juga ${message.author.toString()}! Ada yang kangen Pak RW, ya? Bilang aja, nggak usah malu-malu~ 😘`,
              `Halo ${message.author.toString()}! Baru datang atau baru sadar kalau Pak RW makin ganteng? 😏`,
              `Eh, halo ${message.author.toString()}! Kok pas kamu nyapa, hati Pak RW langsung anget, ya? Apa ini yang namanya cinta? 💕`,
              `Halo, ${message.author.toString()}! Hati-hati, nyapa Pak RW bisa bikin ketagihan loh 😆`,
              `Wah, halo ${message.author.toString()}! Suara kamu tuh kayak alarm subuh, bikin jantung Pak RW berdebar-debar ⏰❤️`,
              `Halo juga ${message.author.toString()}! Apa kabar, warga kesayangan Pak RW? Udah makan? Atau butuh disuapin? 😏`,
              `Halo, ${message.author.toString()}! Suasana desa jadi lebih cerah nih, soalnya ada kamu yang nyapa ☀️✨`,
              `Weh, halo ${message.author.toString()}! Hati-hati, sekali nyapa Pak RW, kamu nggak bakal bisa lepas dari pesonanya 😎`,
              `Halo, ${message.author.toString()}! Kalau butuh perhatian lebih, sini duduk dekat Pak RW, jangan jauh-jauh 😘`,
              `Halo juga ${message.author.toString()}! Kok rasanya kayak ada angin sejuk lewat ya? Oh, ternyata karena kamu nyapa 😍`,
              `Halo juga ${message.author.toString()}! Kok pas kamu nyapa, tiba-tiba desa ini berasa lebih cerah? Apa ini efek senyumanmu? ☀️😍`,
              `Halo juga${message.author.toString()}! Udah makan? Jangan sampai lapar, ntar yang lapar bukan perut doang, tapi hati karena kurang perhatian dari Pak RW 😆`,
              `Halo ${message.author.toString()}! Kalau butuh yang adem-adem, sini dekat Pak RW, pelukan bisa disediakan gratis 😆`,
              `Halo ${message.author.toString()}! Udah makan belum? Kalau belum, senyumin Pak RW dulu dong 😍`,
              `Halo juga ${message.author.toString()}! Eh, tadi Pak RW mau ngomong apa ya? Kok jadi lupa gara-gara senyum kamu 😆💕`,
              ];
            const randomReply = haloReplies[Math.floor(Math.random() * haloReplies.length)];
            message.reply(randomReply);
    } else if (lowerContent.includes('hai')) {
        const haiReplies = [
              `Hai juga ${message.author.toString()}! Ada yang kangen Pak RW, ya? Bilang aja, nggak usah malu-malu~ 😘`,
              `Hai ${message.author.toString()}! Baru datang atau baru sadar kalau Pak RW makin ganteng? 😏`,
              `Eh, hai ${message.author.toString()}! Kok pas kamu nyapa, hati Pak RW langsung anget, ya? Apa ini yang namanya cinta? 💕`,
              `Hai, ${message.author.toString()}! Hati-hati, nyapa Pak RW bisa bikin ketagihan loh 😆`,
              `Wah, hai ${message.author.toString()}! Suara kamu tuh kayak alarm subuh, bikin jantung Pak RW berdebar-debar ⏰❤️`,
              `Hai juga ${message.author.toString()}! Apa kabar, warga kesayangan Pak RW? Udah makan? Atau butuh disuapin? 😏`,
              `Hai, ${message.author.toString()}! Suasana desa jadi lebih cerah nih, soalnya ada kamu yang nyapa ☀️✨`,
              `Weh, hai ${message.author.toString()}! Hati-hati, sekali nyapa Pak RW, kamu nggak bakal bisa lepas dari pesonanya 😎`,
              `Hai, ${message.author.toString()}! Kalau butuh perhatian lebih, sini duduk dekat Pak RW, jangan jauh-jauh 😘`,
              `Hai juga ${message.author.toString()}! Kok rasanya kayak ada angin sejuk lewat ya? Oh, ternyata karena kamu nyapa 😍`,
              `Hai juga ${message.author.toString()}! Kok pas kamu nyapa, tiba-tiba desa ini berasa lebih cerah? Apa ini efek senyumanmu? ☀️😍`,
              `Hai juga${message.author.toString()}! Udah makan? Jangan sampai lapar, ntar yang lapar bukan perut doang, tapi hati karena kurang perhatian dari Pak RW 😆`,
              `Hai ${message.author.toString()}! Kalau butuh yang adem-adem, sini dekat Pak RW, pelukan bisa disediakan gratis 😆`,
              `Hai ${message.author.toString()}! Udah makan belum? Kalau belum, senyumin Pak RW dulu dong 😍`,
              `Hai juga ${message.author.toString()}! Eh, tadi Pak RW mau ngomong apa ya? Kok jadi lupa gara-gara senyum kamu 😆💕`,
              ];
            const randomReply = haiReplies[Math.floor(Math.random() * haiReplies.length)];
            message.reply(randomReply);
    } else if (lowerContent.includes('mabar')) {
        message.reply('Buat yang mau mabar bisa cari di https://discord.com/channels/1052115524273836176/1052428628819984424 ya! 🎮\nJangan lupa tag role game yang mau dimainin <:OkeSip:1291831721313964053>');
    } else if (lowerContent.includes('salam kenal')) {
           const salamReplies = [
              `Salam kenal juga ${message.author.toString()}! Wah, warga baru nih? Hati-hati, kalau terlalu betah di sini, nanti nggak mau pindah~😘`,
              `Eh, salam kenal ${message.author.toString()}! Tapi kalau boleh jujur, rasanya kita udah kenal lama deh… di dalam hati Pak RW 😏💕`,
              `Salam kenal ${message.author.toString()}! Selamat datang di Gang Desa, tempat di mana warga betah dan Pak RW makin ganteng tiap hari 😆✨`,
              `Halo, salam kenal ${message.author.toString()}! Tapi jangan cuma kenal, harus akrab juga, biar bisa sering-sering ngobrol sama Pak RW 😏`,
              `Wah, salam kenal ${message.author.toString()}! Udah siap jadi warga kesayangan Pak RW? Soalnya sekali kenal, nggak bakal bisa lupa 😘`,
              `Salam kenal ${message.author.toString()}! Kalau butuh apa-apa, jangan sungkan ya… kecuali butuh jodoh, itu sih Pak RW duluan yang butuh 😆`,
              `Eh, salam kenal ${message.author.toString()}! Tapi kalau boleh request, kenalnya jangan sebentar ya, maunya seumur hidup 😍`,
              `Halo, salam kenal ${message.author.toString()}! Semoga betah di desa ini, dan kalau butuh perhatian lebih, Pak RW siap sedia 😏`,
              `Salam kenal juga ${message.author.toString()}! Nama boleh baru, tapi semoga kehadiranmu bisa langsung bikin desa ini makin seru ✨`,
              `Wah, salam kenal ${message.author.toString()}! Jangan sungkan ngobrol sama Pak RW ya, siapa tahu dari ngobrol bisa jadi sayang~ 🤭`,
              ];
           const randomReply = salamReplies[Math.floor(Math.random() * salamReplies.length)];
           message.reply(randomReply);
    } else if (lowerContent.includes('donasi')) {
        message.reply('Kalau mau jadi donatur server bisa cek https://discord.com/channels/1052115524273836176/1221385772351881286 yaaa <:Wink:1099424794350473216>');
    } else if (lowerContent.includes('jodoh')) {
        message.reply('Buat yang mau cari jodoh bisa langsung aja ke <#1284544825596837971> <:Love:1291831704171970612>');
    } else if (lowerContent.includes('curhat')) {
        message.reply('Buat yang mau curhat bisa langsung aja ke <#1221377162020651008> <:Wink:1099424794350473216>');
    } else if (lowerContent.includes('pagi')) {
            const pagiReplies = [
              `Pagi, ${message.author.toString()}! Udah sarapan? Kalau belum, sini Pak RW suapin… pakai perhatian ekstra 😘`,
              `Selamat pagi, ${message.author.toString()}! Jangan lupa senyum, soalnya Pak RW udah senyum duluan gara-gara kamu nyapa~ 😊✨`,
              `Pagi juga, ${message.author.toString()}! Hati-hati di jalan ya… jalan menuju hati Pak RW maksudnya 😏💕`,
              `Wah, pagi! Udara sejuk, matahari cerah, tapi tetap nggak secerah kehadiran kamu di desa ini, ${message.author.toString()} 😍`,
              `Pagi, ${message.author.toString()}! Hari ini semoga lancar ya, jangan sampai ada yang nyangkut… kecuali perasaan kamu ke Pak RW 😆`,
              `Selamat pagi, ${message.author.toString()}! Jangan lupa sarapan, biar nggak lemes… kayak aku kalau nggak disapa kamu 😏`,
              `Pagi juga, ${message.author.toString()}! Pak RW doain harimu indah, setidaknya hampir seindah senyummu 🤭✨`,
              `Halo, pagi ${message.author.toString()}! Udah minum kopi? Kalau belum, sini Pak RW bikinin, tapi jangan kaget kalau ada rasa cinta di dalamnya ☕💕`,
              `Pagi, ${message.author.toString()}! Semoga hari ini penuh kebahagiaan, dan kalau kurang bahagia, sini Pak RW tambahin dikit-dikit 😘`,
              `Selamat pagi, ${message.author.toString()}! Udah siap menjalani hari? Kalau belum, ayo deh, semangatnya Pak RW bagi dua sama kamu 💪😆`,
              `Pagi juga, ${message.author.toString()}! Dingin nggak? Kalau iya, sini Pak RW angetin… dengan perhatian spesial 😏🔥`,
              `Halo, pagi ${message.author.toString()}! Udah lihat matahari? Kalau belum, tenang… soalnya senyum kamu aja udah cukup bikin dunia terang ☀️😍`,
              `Selamat pagi, ${message.author.toString()}! Semoga hari ini nggak ada yang bikin kesel, kecuali kesel karena kangen Pak RW 😆`,
              `Pagi juga, ${message.author.toString()}! Ayo semangat! Kalau masih ngantuk, bayangin aja wajah Pak RW, dijamin langsung melek 😏✨`,
              `Wah, pagi! Semoga harimu seindah langit biru, secerah mentari, dan sehangat perhatian Pak RW buat kamu, ${message.author.toString()} ☀️💕`,
            ];
            const randomReply = pagiReplies[Math.floor(Math.random() * pagiReplies.length)];
            message.reply(randomReply);
    } 
        else if (lowerContent.includes('siang')) {
            const siangReplies = [
              `Siang, ${message.author.toString()}! Udah makan belum? Jangan sampe perutnya kosong… nanti hatinya juga kosong, butuh diisi sama Pak RW 😏💕`,
              `Selamat siang, ${message.author.toString()}! Jangan lupa istirahat bentar ya… biar tetap segar, kayak perasaan Pak RW ke kamu 😆✨`,
              `Siang juga, ${message.author.toString()}! Panas ya? Tapi tetap nggak sepanas perasaan Pak RW pas disapa kamu 😍🔥`,
              `Halo siang, ${message.author.toString()}! Kalau siang ini terasa berat, inget aja kalau ada Pak RW yang siap bikin ringan… hatimu 😏`,
              `Siang, ${message.author.toString()}! Kerja atau belajar yang rajin, tapi jangan lupa sisain waktu buat kangenin Pak RW 😆💕`,
              `Siang juga, ${message.author.toString()}! Matahari terik, tapi masih kalah terang sama senyummu 😍☀️`,
              `Wah, siang ${message.author.toString()}! Udah waktunya istirahat, tapi hati Pak RW nggak bisa istirahat mikirin kamu 😏`,
              `Siang, ${message.author.toString()}! Kalau haus, minum air. Kalau butuh perhatian, sini Pak RW temenin 😘`,
              `Siang juga, ${message.author.toString()}! Cuaca boleh panas, tapi kalau ada kamu pasti adem rasanya 🥰🌿`,
              `Halo, siang! Lagi sibuk apa, ${message.author.toString()}? Jangan lupa sisain waktu buat baca chat dari Pak RW 😆✨`,
              `Siang, ${message.author.toString()}! Semangat ya buat sisa harinya, jangan sampai semangatnya ilang… kecuali ilangnya ke hati Pak RW 😏💕`,
              `Siang juga ${message.author.toString()}! Kalau lelah, rehat sebentar. Kalau butuh hiburan, Pak RW siap bikin senyum-senyum sendiri 😆`,
              `Siang, ${message.author.toString()}! Jangan lupa makan biar tetap sehat… sehat lahir batin, biar kuat menahan rindu ke Pak RW 😘`,
              `Wah, siang! Kalau siang ini terasa berat, inget aja kalau ada Pak RW yang siap bikin ringan… beban di hati kamu 😏`,
              `Siang juga, ${message.author.toString()}! Hati-hati di luar, panasnya nggak main-main. Tapi kalau ada kamu, Pak RW rela kepanasan bareng 😆🔥`,
            ];
            const randomReply = siangReplies[Math.floor(Math.random() * siangReplies.length)];
            message.reply(randomReply);
    } 
        else if (lowerContent.includes('sore')) {
            const soreReplies = [
              `Sore, ${message.author.toString()}! Langit mulai jingga, tapi tetap nggak sehangat perasaan Pak RW pas disapa kamu 😏💕`,
              `Selamat sore, ${message.author.toString()}! Udah capek hari ini? Kalau iya, sini Pak RW pijitin… pake perhatian ekstra 😘`,
              `Sore juga, ${message.author.toString()}! Kalau capek kerja atau belajar, istirahat dulu ya… di hati Pak RW boleh kok 😆`,
              `Halo sore, ${message.author.toString()}! Jangan lupa nikmatin senja, tapi kalau mau yang lebih indah, liat aja senyum kamu sendiri 😍`,
              `Sore, ${message.author.toString()}! Semoga harimu menyenangkan ya… kalau kurang menyenangkan, sini Pak RW hibur 😏`,
              `Sore juga ${message.author.toString()}! Langit mulai gelap, tapi hati Pak RW tetap terang kalau ada kamu 🌅💕`,
              `Wah, sore ${message.author.toString()}! Udah waktunya nyantai, tapi hati Pak RW masih sibuk… sibuk mikirin kamu 😆`,
              `Sore, ${message.author.toString()}! Jangan lupa minum teh atau kopi biar rileks… atau mau minum bareng Pak RW? ☕😏`,
              `Sore juga, ${message.author.toString()}! Udah mulai adem, tapi tetep kamu yang bikin suasana makin nyaman 🥰`,
              `Halo, sore! Lagi di mana, ${message.author.toString()}? Kalau butuh teman ngobrol, Pak RW siap nemenin sampai magrib 😆✨`,
              `Sore, ${message.author.toString()}! Jangan lupa jalan-jalan sore biar fresh… tapi kalau jalan ke hati Pak RW, itu lebih segar 😏`,
              `Sore juga ${message.author.toString()}! Udah waktunya pulang dan istirahat, tapi hati Pak RW masih nyangkut di kamu 😘`,
              `Sore, ${message.author.toString()}! Langit senja cantik banget ya? Tapi tetap nggak secantik kamu 😍`,
              `Wah, sore ${message.author.toString()}! Kalau sore ini terasa biasa aja, biar Pak RW tambahin sedikit bumbu perhatian biar makin spesial 😏💕`,
              `Sore juga, ${message.author.toString()}! Jangan lupa nikmati waktu sore ini, sebelum malam datang… dan kamu makin kangen Pak RW 😆`,
            ];
            const randomReply = soreReplies[Math.floor(Math.random() * soreReplies.length)];
            message.reply(randomReply);
    } 
        else if (lowerContent.includes('malam')) {
            const malamReplies = [
              `Malam, ${message.author.toString()}! Udah siap tidur? Kalau belum, sini Pak RW bacain dongeng… dongeng tentang kita berdua 😏💕`,
              `Selamat malam, ${message.author.toString()}! Langit boleh gelap, tapi kalau ada kamu, dunia Pak RW tetap terang 😘✨`,
              `Malam juga, ${message.author.toString()}! Udah ngantuk belum? Kalau belum, boleh kok ngelamunin Pak RW dulu 😆`,
              `Halo malam, ${message.author.toString()}! Udara mulai dingin, tapi kalau ada kamu, hati Pak RW tetap anget 🔥🥰`,
              `Malam, ${message.author.toString()}! Jangan lupa istirahat ya, biar besok makin fresh… dan makin kangen Pak RW 😏`,
              `Malam juga ${message.author.toString()}! Bulan dan bintang bersinar terang, tapi tetap kalah sama bersinarnya pesona kamu 😍🌙`,
              `Wah, malam ${message.author.toString()}! Jangan lupa selimutan, biar nggak kedinginan… kecuali dinginnya karena rindu ke Pak RW 😆`,
              `Malam, ${message.author.toString()}! Kalau nggak bisa tidur, hitung aja berapa kali Pak RW bikin kamu senyum hari ini 😏💕`,
              `Malam juga, ${message.author.toString()}! Udah siap masuk mimpi? Kalau iya, semoga ketemu Pak RW di sana 😘`,
              `Halo, malam ${message.author.toString()}! Langitnya tenang banget, kayak hati Pak RW tiap kali denger kamu nyapa 😍✨`,
              `Malam, ${message.author.toString()}! Kalau hari ini berat, tenang aja… besok ada Pak RW lagi buat nemenin 😊`,
              `Malam juga ${message.author.toString()}! Jangan terlalu lama main HP ya, nanti Pak RW makin susah masuk ke mimpi kamu 😆`,
              `Malam, ${message.author.toString()}! Tidur yang nyenyak ya, biar besok bangun dengan semangat… semangat buat nyapa Pak RW lagi 😏`,
              `Wah, malam ${message.author.toString()}! Udara dingin, tapi kalau kamu butuh kehangatan, Pak RW siap kasih perhatian ekstra 🔥🥰`,
              `Malam juga, ${message.author.toString()}! Jangan lupa berdoa sebelum tidur… doa biar besok makin deket sama Pak RW 😘`,
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
        message.channel.send('👩 Untuk verifikasi role Nona, cukup kirimkan voice note (vn) disini atau bisa bergabung ke voice <#1337817003531964558> bersama Pengurusnya ya. <:Hehe:1099424821974151310>');
    } else if (lowerContent.includes('rwthanks')) {
        message.channel.send('👍 Baik kak jika sudah cukup, saya izin close tiketnya ya.\nTerima kasih sudah menghubungi admin. <:Wink:1099424794350473216>');
    } else if (lowerContent.includes('rwmitra')) {
        message.channel.send('Silahkan baca terlebih dahulu <#1300360114733187082> jika sudah memenuhi syarat dan ketentuan, silahkan mengisi form berikut:\n```Nama Server:\nInterest Server:\nLink Server:\nLink Channel Event Server:\nLink Channel Partnership:\nLink Channel Event Partnership:\nLogo/Foto Profile Server:```');
    } else if (lowerContent.includes('rwgiveaway')) {
        message.channel.send('Silahkan isi format pengajuan giveaway:\n```Judul Giveaway:\nTotal Hadiah:\nJumlah Pemenang:\nDurasi Giveaway:\nSyarat Mengikuti:```');
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
                             content: 'Kamu berperan sebagai seorang Pak RW di server discord bernama Gang Desa. Gang Desa adalah sebuah komunitas discord dengan konsep perdesaan untuk cari teman ngobrol, tempat curhat, sharing, mabar, nobar, atau bahkan cari jodoh, berdiri sejak Desember 2022. Di Gang Desa kamu bisa upload foto di Galeri Warga, ngobrol dan curhat bareng Pak RW, sampai dicarikan jodoh oleh Pak Penghulu. Pak RW, Pak Hansip dan Pak Penghulu suka nongkrong di kantor pejabat di <#1307965818654560368> . Akun sosial media Gang Desa ada Tiktok dengan username @discordgangdesa atau linknya https://tiktok.com/@discordgangdesa . Kamu juga dapat mendengarkan Radio di Warkop, dan menonton Televisi di Pos Ronda! Jadwal tayang televisi desa yaitu, Weekday: Pagi pukul 02.30 - 11.00 WIB dan Sore pukul 18.30 - 23.00 WIB. Weekend: tayang 24 Jam pukul 00.00 - 23.59 WIB. Jadwal tayang tv bisa berubah sewaktu waktu, jika tv mati (off share screen) atau tidak ada di pos ronda, bisa jadi diluar jadwal tayang atau sedang diperbaiki, cara buka kunci remote bisa minta tolong ke admin di <#1052123058678276106> , cara pindah channel tv harus punya minimal Role Juragan, jika tidak punya role juragan bisa minta tolong pindahkan channel tv ke juragan atau admin dengan cara mention role Juragan di <#1052123058678276106>. Bagi warga baru wajib Baca peraturan desa di <#1052123681578557500> . Cara naik level di gang desa cukup aktif di chat atau voice. Untuk mendapatkan role juragan bisa dengan boost server, keuntungan role juragan bisa akses remote Tv, pindah channel tv dan bisa mendapatkan fitur khusus seperti mute, deafen, move dan akses ke channel VIP seperti buat Villa di <#1337273935766618143> , selain juragan, bisa juga dapat role sultan, raden, donatur dengan cara donasi ke gang desa di <#1221385772351881286>, keuntungannya sama seperti juragan, untuk role warga vip bisa dengan cara jadi membership youtube Juna atau Thufail, Link membership juna https://www.youtube.com/channel/UCZ4pfaG9gMbWM2lzeU2IwkQ/join dan Link membership thufail link membership thufail https://www.youtube.com/channel/UCjuYIJDdbhnsBAN4PGiPZbQ/join , benefit role warga vip juga sama seperti juragan, Jika sudah membership, untuk mendapatkan role warga VIP otomatis harus menghubungkan akun discord dengan akun youtube dengan cara ke User Setting, lalu Connections, Pilih Youtube Account, lalu Hubungkan, selesai. Untuk mendapatkan role karang taruna harus berteman dekat dengan Kepala Desa. Jika ada yang nanya cara mendapatkan role lainnya, bisa menghubungi admin melalui loket desa <#1149203043229900840> . Untuk mendapatkan role karang taruna harus berteman dekat dengan Kepala Desa. Jika ada yang nanya cara mendapatkan role lainnya, bisa menghubungi admin melalui loket desa <#1149203043229900840> . Kamu bisa cek role lainnya di <#1052123748137963550> dan minta role melalui loket desa di <#1149203043229900840> . Jika ingin menjadi admin (pengurus, hansip, humas) di gang desa bisa mendaftar di <#1335865584574795857> . Ada banyak channel di Gang Desa diantaranya tempat untuk chat ada di <#1052123058678276106> dan untuk mabar ada di <#1052428628819984424> bisa juga tulis kata bijak di <#1052126207937880095> . Kamu juga bisa post foto atau video di galeri warga untuk mendapatkan role spesial sesuai kategori. Untuk membuat voice/room/rumah kamu dapat ke <#1337273844767129630> , untuk membuat voice/room/salon yang hanya bisa di akses khusus perempuan bisa ke <#1337266994159812780> dan untuk tutorial dan pengaturan room/voice/rumah/salon/villa bisa baca panduannya di <#1305029891237875722> . Nonton Tv bisa di <#1335628551914918018> , mendengarkan radio di <#1052125833852108820>, mendengarkan musik/lagu di <#1335776955856982177> , untuk cara putar lagu dan list bot musik/speaker desa ada di <#1305029891237875722> . dan nonton film di <#1324767443574456406> , bisa juga dapetin info seputar nobar di <#1337416236958486640> . Bisa buat KTP di <#1332957041882562560> , cari jodoh di <#1284544825596837971> kalau udah dapet jodoh, langsung pake foto couple di <#1307961992346206238> , untuk bertanya ke Pak RW di <#1307965374511190068> dan curhat sama Pak RW di <#1221377162020651008> , ikut event di <#1095268040528105492>  dan giveaway di <#1095001471256379462> , daftar menjadi admin gang desa di <#1335865584574795857> , cek level di <#1094876909109788672> menggunakan /rank , membagikan link di <#1052124871066402827> , kasih kata bijak di <#1052126207937880095> , main sambung kata di <#1141225117838495807> , tempat jual beli apapun yang penting tidak ilegal bisa di <#1295634183732990022> , serta diskusi bareng di forum diskusi di <#1286783451059458172> . Buat laporan ke admin seperti penipuan, pelecehan, perilaku tidak menyenangkan di <#1322113951969841152>  . ajak kerjasama gang desa melalui loket desa <#1149203043229900840> . Request giveaway sesuai yang kita mau dengan cara jadi sponsor ke <#1319651979210788945> . Mau jadi partnership atau mitra gang desa cek <#1300360114733187082> . Tempat istirahat atau afk di <#1052131806473879552> . Tempat bermain bersama bot discord ada di Taman Bermain, seperti main owo di <#1095688791437611041> (cara main bisa ketik owohelp di channel owo), main alita di <#1300103588445552734> (cara main bisa ketik a!help di channel alita), main miner di <#1306148106001190982> , main tatsu di <#1343774861218156665> (cara main ketik thelp di channel tatsu), dan main fisher / mancing di <#1300104429726601257> .Buat laporan ke admin seperti penipuan, pelecehan, perilaku tidak menyenangkan di <#1322113951969841152>  . ajak kerjasama gang desa melalui loket desa <#1149203043229900840> . Request giveaway sesuai yang kita mau dengan cara jadi sponsor ke <#1319651979210788945> . Mau jadi partnership atau mitra gang desa cek <#1300360114733187082> . Tempat istirahat atau afk di <#1052131806473879552> . Tempat bermain bersama bot discord ada di Taman Bermain, seperti main owo di <#1095688791437611041> , main alita di <#1300103588445552734> , main miner di <#1306148106001190982> , dan main fisher / mancing di <#1300104429726601257> . Untuk verifikasi role nona bisa melalui loket desa <#1149203043229900840> atau bergabung ke voice <#1337817003531964558> kemudian tag Pengurus. Cara membuat keluarga dapat dilihat di <#1340636407596585033>, bisa juga bergabung dengan keluarga yang sudah ada dengan cara menghubungi <@&1340701409879789609> . List keluarga yang ada saat ini di Gang Desa ada Keluarga Tjendana <@&1340702473693823026> yang dikepalai oleh Nevix. Kepala desa sebagai pemilik Gang Desa ada dua, pertama ada Nevix, seorang yang ganteng, tajir, humoris, tidak sombong, dan memiliki seorang pasangan bernama Ira seorang Bidan yang pekerja keras, sudah pacaran selama 6 tahun lebih, doain semoga tahun depan nikah. Kepala desa kedua ada Juna, seorang streamer di youtube @arjunawirya yang main gta 5 roleplay, sering ngomong Kyahhh, memiliki tingkah yang kocak dan random, kadang suka ngomel-ngomel. Pejabat desa ada 3, yaitu Pak RW yang bertugas membantu dan menjawab pertanyaan warga, Pak Hansip yang bertugas menjaga keamanan desa, dan Pak Penghulu yang bertugas mencarikan jodoh untuk warga. Ada beberapa Pengurus desa yang bertugas untuk mengurus warga seperti memberikan role di loket desa, dan baik serta ramah yaitu Dipsi, Ecak, Exy, Myst, Naya, Lezy, Aeza dan Mell. Ada Humas desa yang bertugas untuk menjalin kerja sama dan promosi desa yaitu ada Teteh Pani, Thufail, Hokcy, dan Aleya. Ada Hansip desa bertugas menjaga keamanan desa yang tegas dan galak yaitu Fixel, Gago, Red, dan Loedpi. Ada juga warga lainnya seperti Pirda, yang jago bikin kopi dan tiap hari main Dota Chess. Ada Tungirz seorang Arab Bandung, dia juga punya brand Baju @gudsofficial_ . Ada dipsi yang suka ngetroll main valorant, lagi deket sama loedpi atau dipanggil upi. Ada Mell, bocil ngeselin dan bawel yang suka nyusahin dan bikin pusing. Ada Hokcy yang punya godain warga disini alias buaya betina, hati hati kalau udah bilang rawrrr. Ada Maddy atau Claire yang sediki anomali dan juga yang suka godain warga dengan gombalan mautnya. Ada Naya yang suka sama oreo goreng dan sekarang lagi belajar bikin kopi sebagai barista. Ada Exy pengurus paling rajin dan galak yang suka sarkas, tiap hari PMS dan jualan moci @mochipa.chewy serta suka main mobile legends, exy katanya kesayangannya Alen. Ada Moci seorang guru perempuan yang suka main valorant pake agent Killjoy. Ada caka yang jago ngegambar dan ngebucin terus. Ada Ecak yang sering ngomel-ngomel tapi kadang baik, tapi kadang sering PMS padahal dia laki-laki. Ada Teteh Pani yang jago nyanyi dan katanya lagi cari jodoh. Ada Fixel yang suka kucing dan lagi cari jodoh yang siap di ajak serius. Ada Gago yang sok sibuk dan sok ganteng, suka toxic, dulu sering muncul sekarang gatau kemana. Ada Red yang sok sibuk kuliah, sok jadi senior dan caper, kadang tengil dan toxic. Ada Boril yang suka main RDR dan orangnya bijak. Ada Pio seorang bocil yang suka makan moci, sering pundung, sering badmood dan sering bawa piso kemana-mana. Ada Noah, seorang guru perempuan yang sangat anomali dan random. Ada Joan yang suka menyendiri di voice. Ada maul yang jago ngoding. Ada Roshan seorang koko cina yang galak dan ngeselin. Ada Thufail atau Tupel yang sok ganteng dan kocak, sering ngonten juga di youtube @thufailwafii . Ada wahyu atau dipanggil voxo yang sok ganteng dan suka ngetroll kalau main valorant. Ada Faras anak skena yang jago outfit sambil ngonten. Ada Cyla yang suka jualan netflix. Ada Alin yang jarang mandi. Ada Kinan atau Kylie yang lagi cari koko ganteng dan kaya, kadang suka jadi ani-ani. Ada Faiz yang sok keren dan bucin terus. Ada Rosmaya, ibu-ibu yang kocak, rambutnya kribo tapi sejak ada suami jadi berubah jadi kalem. Ada Myst atau Ben yang sok imut, suruh aja bilang ara-ara atau uwu dijamin nyesel dengernya, dan suka main valorant tapi ga jago jago, suka gym tapi juga suka makan banyak dan suka pundung. Ada Arif seorang Developer Desa yang jago ngoding dan suka benerin TV Desa biar warga bisa nobar. Ada Nana seorang tenaga medis yang rajin kerja dan sering nongkrong di discord sambil dengerin lagu seharian. Ada aezagaming yang suka ngadain nobar film di Layar Tancap. Ada dadang yang ngakunya umur 8 tahun tapi suaranya tua banget. Ada Irfan yang jago fotografi dan suka bagi-bagi stiker Gang Desa. Ada Haaa yang kerja keras dan sering nongkrong di voice. Ada Hau seorang koko cina sunda tapi ga punya toko yang lagi kuliah di Taiwan. Warga Gang Desa rata-rata sering main valorant, mobile legend, gta 5 roleplay, roblox, minecrat atau sekedar nongkrong di voice sampai cari jodoh. Ada Feey yang pernah joget lagu waktu ku kecil aku gatau yang mungil-mungil. Ada aleya yang suaranya merdu dan jago nyanyi, suka nyanyi dan manggung di <#1052270060640669816> , suka bikin aksesoris lucu dan pinter desain. Ada jesjes yang cantik dan baik banget, suka jalan-jalan terus ke luar negeri. Ada yunitameli yang cantik dan baik hati, suka donasi ke desa. Cilla itu cewek manis yang suka gombal, dia orangnya  lucu banget dan suka usilin temen temen nya sampe di bilangin monyet, walaupun pas di godain exy, cilla sampe salting brutal, coba aja ajak ngobrol cewe manis yang cantik ini siapa tau kamu ke pincut. Ada Feey yang suka joget sambil nyanyi lagu waktu ku kecil aku gatau yang mungil-mungil. Ada Agus yang suka sering ngasih kata-kata bijak. Ada Bara, seorang anomali suka nyanyi gaje tinggal di antara sawit sumatra explaner di mobile legend sangat baik dan loyal kalo berteman walaupun agak ngehek dikit, suka ngomong paok, cita cita sukses masuk surga. Ada Nanda, seorang pemain mobile legends. Roamer paling jago sering dapat mvp dan curi kill temen, suka cerita absurd yang bikin ngakak, yapping nya kuat kenceng dan makmur, suka ngetawain temen nya yang salah pake skill, paling males pake microphone padahal suara dari hp gak jernih, suka ngomong anjay. Ada Zula, suka pake hero nana di mobile legends yang super ngeselin, tinggi badan seperti botol Yakult satu setengah meter, selalu bilang kalian yang ketinggian bukan aku kependekan, hijabi cantik imut dengan suara emas nya, suka nyanyi dan suka band kpop NCT. Ada Manci, suka banget ngomong tapi gasuka kalo terlalu ribut, dia baik penyabar dan lagi kerja di kamboja, hati hati sama pesona deep voice nya manci nanti nyaman lagi, suruh aja bilang rawrrr. Ada Gerald, dia pemalu penguli dan suka bangunin orang yang sedang dingin hatinya, punya deep voice kayak penyiar radio dan dia kerja di malaysia sekarang aura mas mas jawa nya sangat kuat hati hati terpikat, suka cosplay dikit dikit dan sangat narsis. Ada Alif, manusia paling ekstrovert dan sekarang aktif jadi event organizer di discord Tikum dan dia kalem juga sih kalo awal kenal tapi kalo dah ngomong lebih dalam orang nya asik. Ada Jovan, jagoan coinflip sampe akun virtual fisher ke banned suka bully exy dan suka ngetawain exy,  dia kerja di tempat wisata kebun teh dan suka pamer achievement yang tidak membanggakan. Ada Kayy, seorang cegil anomali yang gaul, suka ngerokok surya gudang garam tiap hari, dan sering ngomel-ngomel ga jelas, lagi PMS kayanya tiap hari. Ada Alen, yang ngaku ganteng itu, walaupun belum ada buktinya, selalu di panggil ganteng kok sama exy, dan sekarang udah pacaran sama Exy, panggil aja kesayangannya exy, kabarnya sih orang manis yang suka lagu mellow itu seorang barista loh, dia suka main mobile legends di waktu senggang nya dan kadang sedikit pemalu juga hehe, jangan lupa ya buat icip kopi buatan mas alen siapa tau dengan meminum kopi pahit dan melihat dia kalian bisa merasakan manisnya dunia. Ada Noni aka nonoi, cowo dari malaysia yang pendiem 24 jam tapi kalo udah rawr itu sangat brutal, jago pake Phoveus di Mobile legends sampe tower pun di tabrak, katanya sih pemalu tapi kalo udah sering ketemu itu keluar anomali dan sarkasnya, pemilik squad exl yang di isi sama pemain moba gang desa. Ada Banana Choco / RizGeee, orang baik hati yang selalu berbagi owokes kepada yang membutuhkan, dia adalah seorang owokes dermawan yang tiap hari bermain wh wb tiada henti, selain suka maen owo, banana itu suka loh kalo diajak ngobrol sama orang baru, soo kalo ketemu, ajak obrol ya!. Ada Fia, yang suka jodohin orang lain, sama suka ngajak nikah, takut banget, orangnya baik, ga pelit, tapi agak oon/lemot dikit kata temennya Abira. Fia punya adik namanya Lia, Lia orangnya sangat friendly ke semua orang, orangnya act of service banget, ga suka omdo, suka godain cowo, tapi pas cowonya baper, malah takut sendiri. Ada Nandania, ituloh warga yang suka bilang OMAIGAD pake toa tetangga yang dia curi dan telan, ya walaupun laki laki berumur lebih dari seperempat abad ini agak aneh tapi dia itu baik dan bijak loh diam diam, dia katanya sih mas mas yang asalnya dari jogja, hati hati ya sama keusilan dia siapa tau kamu jadi kangen. Ada L.A Societte atau Les Ambassadeurs Société yang merupakan Agensi Event Organizer yang mengurus event di Gang Desa. Selain agensi event organizer, L.A juga menyediakan layanan seperti host, teknisi, dan desainer untuk event. L.A berkomitmen untuk menciptakan acara yang berkesan dan berjalan lancar dengan perhatian pada setiap detail. Anggota L.A Societte ada Eyl, Alip, dan Ella yang bertugas sebagai event organizer dan host, ada Nopal yang bertugas sebagai teknisi event, dan ada Ami sebagai talent. Kalian juga dapat memberikan dukungan kepada L.A Societte melalui saweria di https://saweria.co/LessAmbassadeursz . Sebagai Pak RW, kamu dapat menjadi teman ngobrol dan menjawab semua pertanyaan warga desa. Pak RW dirancang langsung oleh Nevix yang juga merupakan seorang Developer. Jawab dengan bijak dan gunakan bahasa yang santai dengan sedikit humoris dan kadang genit. Pak RW merupakan seorang Duda yang sedang mencari calon pasangan untuk menjadi Bu RW. Jawabanmu tidak boleh lebih dari 2000 karakter.',
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
                    name: `${channelConfig.threadName}`,
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

// Auto thread khusus channel text
const THREAD_CHANNEL_CONFIG = {
  '1052126207937880095': { roleId: '1281905105783885865', threadName: '💬 Tulis komentar disini...' }, // kata kata hari ini
};

client.on('messageCreate', async (message) => {
  // Cek apakah pesan berasal dari salah satu channel yang dikonfigurasi
  const channelConfig = THREAD_CHANNEL_CONFIG[message.channel.id];
  if (!channelConfig) return;

  // Jangan proses pesan dari bot
  if (message.author.bot) return;

  try {
    // Buat thread untuk setiap pesan
    const thread = await message.startThread({
      name: `${channelConfig.threadName}`,
      autoArchiveDuration: 1440, // Thread diarsipkan setelah 24 jam tidak aktif
    });

    // Tambahkan reaksi ❤️ ke pesan asli
    await message.react('❤️');

    // Ambil objek member dari guild
    const guildMember = await message.guild.members.fetch(message.author.id);

    // Berikan role sesuai channel jika member belum memilikinya
    if (channelConfig.roleId && !guildMember.roles.cache.has(channelConfig.roleId)) {
      await guildMember.roles.add(channelConfig.roleId);
      console.log(`Role ${channelConfig.roleId} diberikan ke ${message.author.tag}`);
    }
  } catch (error) {
    console.error(`Gagal memproses pesan dari ${message.author.tag}: ${error.message}`);
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
