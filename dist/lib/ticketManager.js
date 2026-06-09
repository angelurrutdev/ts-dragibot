"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.saveConfig = saveConfig;
exports.getTicket = getTicket;
exports.saveTicket = saveTicket;
exports.deleteTicket = deleteTicket;
exports.getUserOpenTicket = getUserOpenTicket;
exports.createTicketChannel = createTicketChannel;
exports.claimTicket = claimTicket;
exports.closeTicket = closeTicket;
exports.generateTranscript = generateTranscript;
exports.buildPanelEmbed = buildPanelEmbed;
exports.buildPanelRow = buildPanelRow;
const discord_js_1 = require("discord.js");
const fs = require("fs");
const path = require("path");
const DATA_PATH = path.join(process.cwd(), "tickets-data.json");
function loadData() {
    if (!fs.existsSync(DATA_PATH))
        return { configs: {}, tickets: {} };
    try {
        return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    }
    catch {
        return { configs: {}, tickets: {} };
    }
}
function saveData(data) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}
function getConfig(guildId) {
    return loadData().configs[guildId] ?? null;
}
function saveConfig(config) {
    const data = loadData();
    data.configs[config.guildId] = config;
    saveData(data);
}
function getTicket(channelId) {
    return loadData().tickets[channelId] ?? null;
}
function saveTicket(ticket) {
    const data = loadData();
    data.tickets[ticket.channelId] = ticket;
    saveData(data);
}
function deleteTicket(channelId) {
    const data = loadData();
    delete data.tickets[channelId];
    saveData(data);
}
function getUserOpenTicket(guildId, userId) {
    const data = loadData();
    return Object.values(data.tickets).find(t => t.guildId === guildId && t.userId === userId) ?? null;
}
async function createTicketChannel(guild, member, subject, description, config) {
    config.ticketCount++;
    saveConfig(config);
    const num = String(config.ticketCount).padStart(4, "0");
    const channelName = `ticket-${member.user.username}-${num}`;
    const permissionOverwrites = [
        {
            id: guild.roles.everyone.id,
            deny: [discord_js_1.PermissionFlagsBits.ViewChannel],
            type: discord_js_1.OverwriteType.Role,
        },
        {
            id: member.id,
            allow: [
                discord_js_1.PermissionFlagsBits.ViewChannel,
                discord_js_1.PermissionFlagsBits.SendMessages,
                discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                discord_js_1.PermissionFlagsBits.AttachFiles,
            ],
            type: discord_js_1.OverwriteType.Member,
        },
    ];
    for (const roleId of config.supportRoleIds) {
        permissionOverwrites.push({
            id: roleId,
            allow: [
                discord_js_1.PermissionFlagsBits.ViewChannel,
                discord_js_1.PermissionFlagsBits.SendMessages,
                discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                discord_js_1.PermissionFlagsBits.ManageMessages,
                discord_js_1.PermissionFlagsBits.AttachFiles,
            ],
            type: discord_js_1.OverwriteType.Role,
        });
    }
    const channel = await guild.channels.create({
        name: channelName,
        parent: config.categoryId,
        permissionOverwrites,
        topic: `Ticket #${num} | ${subject} | ${member.user.username}`,
    });
    const ticketData = {
        channelId: channel.id,
        guildId: guild.id,
        userId: member.id,
        username: member.user.username,
        subject,
        description,
        createdAt: Date.now(),
        number: config.ticketCount,
    };
    saveTicket(ticketData);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🎫 Ticket #${num} — ${subject}`)
        .setDescription(description)
        .addFields({ name: "👤 Abierto por", value: `<@${member.id}>`, inline: true }, { name: "📅 Fecha", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }, { name: "🔖 Estado", value: "🟢 Abierto", inline: true })
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .setFooter({ text: "El equipo de soporte llegará pronto." });
    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId("ticket_claim")
        .setLabel("Reclamar")
        .setEmoji("🙋")
        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
        .setCustomId("ticket_transcript")
        .setLabel("Transcript")
        .setEmoji("📄")
        .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId("ticket_close")
        .setLabel("Cerrar ticket")
        .setEmoji("🔒")
        .setStyle(discord_js_1.ButtonStyle.Danger));
    await channel.send({
        content: `<@${member.id}> ${config.supportRoleIds.map(r => `<@&${r}>`).join(" ")}`,
        embeds: [embed],
        components: [row],
    });
    return channel;
}
async function claimTicket(channel, staffMember, ticketData) {
    ticketData.claimedBy = staffMember.id;
    saveTicket(ticketData);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0xFEE75C)
        .setDescription(`### 🙋 Ticket reclamado\n**${staffMember.user.username}** se hizo cargo de este ticket.`)
        .setThumbnail(staffMember.user.displayAvatarURL());
    await channel.send({ embeds: [embed] });
}
async function closeTicket(channel, closedBy, ticketData, config) {
    const logChannel = channel.guild.channels.cache.get(config.logChannelId);
    const transcript = await generateTranscript(channel, ticketData);
    const embedClose = new discord_js_1.EmbedBuilder()
        .setColor(0xED4245)
        .setTitle("🔒 Ticket cerrado")
        .setDescription(`Cerrado por **${closedBy.user.username}**.\nEste canal se eliminará en **5 segundos**.`)
        .setTimestamp();
    await channel.send({ embeds: [embedClose] });
    if (logChannel) {
        const embedLog = new discord_js_1.EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`📄 Transcript — Ticket #${String(ticketData.number).padStart(4, "0")}`)
            .addFields({ name: "👤 Usuario", value: `<@${ticketData.userId}>`, inline: true }, { name: "🙋 Atendido por", value: ticketData.claimedBy ? `<@${ticketData.claimedBy}>` : "*Sin reclamar*", inline: true }, { name: "📌 Asunto", value: ticketData.subject, inline: false }, { name: "🕐 Duración", value: formatDuration(Date.now() - ticketData.createdAt), inline: true }, { name: "🔒 Cerrado por", value: closedBy.user.username, inline: true })
            .setTimestamp();
        await logChannel.send({
            embeds: [embedLog],
            files: [{ attachment: Buffer.from(transcript, "utf-8"), name: `ticket-${ticketData.number}.txt` }],
        });
    }
    try {
        const user = await channel.guild.members.fetch(ticketData.userId);
        const dmEmbed = new discord_js_1.EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`📄 Tu ticket #${String(ticketData.number).padStart(4, "0")} fue cerrado`)
            .setDescription(`**Asunto:** ${ticketData.subject}\n**Servidor:** ${channel.guild.name}\n\nSe adjunta el transcript de la conversación.`);
        await user.send({
            embeds: [dmEmbed],
            files: [{ attachment: Buffer.from(transcript, "utf-8"), name: `ticket-${ticketData.number}.txt` }],
        });
    }
    catch { /* DMs cerrados */ }
    deleteTicket(channel.id);
    setTimeout(async () => {
        try {
            await channel.delete();
        }
        catch { /* ya eliminado */ }
    }, 5000);
}
async function generateTranscript(channel, ticketData) {
    const messages = [];
    let lastId;
    while (true) {
        const batch = await channel.messages.fetch({ limit: 100, before: lastId });
        if (batch.size === 0)
            break;
        messages.push(...batch.values());
        lastId = batch.last()?.id;
        if (batch.size < 100)
            break;
    }
    messages.reverse();
    const lines = [
        `═══════════════════════════════════════════`,
        `  TRANSCRIPT — Ticket #${String(ticketData.number).padStart(4, "0")}`,
        `  Asunto  : ${ticketData.subject}`,
        `  Usuario : ${ticketData.username} (${ticketData.userId})`,
        `  Servidor: ${channel.guild.name}`,
        `  Abierto : ${new Date(ticketData.createdAt).toLocaleString("es")}`,
        `  Cerrado : ${new Date().toLocaleString("es")}`,
        `═══════════════════════════════════════════`,
        "",
    ];
    for (const msg of messages) {
        if (msg.author.bot && msg.embeds.length > 0) {
            const embed = msg.embeds[0];
            lines.push(`[${formatTime(msg.createdAt)}] [BOT] ${embed.title ?? ""} ${embed.description ?? ""}`.trim());
        }
        else if (!msg.author.bot) {
            const content = msg.content || (msg.attachments.size > 0 ? "[Archivo adjunto]" : "[Sin contenido]");
            lines.push(`[${formatTime(msg.createdAt)}] ${msg.author.username}: ${content}`);
        }
    }
    return lines.join("\n");
}
function formatTime(date) {
    return date.toLocaleString("es", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
}
function formatDuration(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0)
        return `${h}h ${m % 60}m`;
    if (m > 0)
        return `${m}m ${s % 60}s`;
    return `${s}s`;
}
function buildPanelEmbed() {
    return new discord_js_1.EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🎫 Sistema de Tickets")
        .setDescription("¿Necesitas ayuda o te banearon del Canal de Twitch?\n" +
        "Haz clic en el botón de abajo para abrir un ticket.\n\n" +
        "**Antes de abrir un ticket:**\n" +
        "・Describe tu problema con detalle\n" +
        "・Coloca tu nombre de Twitch\n" +
        "・Adjunta capturas si es necesario\n" +
        "・No abras tickets duplicados")
        .setFooter({ text: "El equipo de soporte te atenderá lo antes posible." });
}
function buildPanelRow() {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId("ticket_open")
        .setLabel("Abrir Ticket")
        .setEmoji("🎫")
        .setStyle(discord_js_1.ButtonStyle.Primary));
}
