import {
    Guild, TextChannel, CategoryChannel, PermissionFlagsBits,
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
    GuildMember, OverwriteType, Message
} from "discord.js";
import * as fs from "fs";
import * as path from "path";
import { TicketConfig, TicketData } from "../types/tickets";

const DATA_PATH = path.join(process.cwd(), "tickets-data.json");

interface PersistedData {
    configs: Record<string, TicketConfig>;
    tickets: Record<string, TicketData>;
}

function loadData(): PersistedData {
    if (!fs.existsSync(DATA_PATH)) return { configs: {}, tickets: {} };
    try {
        return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    } catch {
        return { configs: {}, tickets: {} };
    }
}

function saveData(data: PersistedData): void {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

export function getConfig(guildId: string): TicketConfig | null {
    return loadData().configs[guildId] ?? null;
}

export function saveConfig(config: TicketConfig): void {
    const data = loadData();
    data.configs[config.guildId] = config;
    saveData(data);
}

export function getTicket(channelId: string): TicketData | null {
    return loadData().tickets[channelId] ?? null;
}

export function saveTicket(ticket: TicketData): void {
    const data = loadData();
    data.tickets[ticket.channelId] = ticket;
    saveData(data);
}

export function deleteTicket(channelId: string): void {
    const data = loadData();
    delete data.tickets[channelId];
    saveData(data);
}

export function getUserOpenTicket(guildId: string, userId: string): TicketData | null {
    const data = loadData();
    return Object.values(data.tickets).find(
        t => t.guildId === guildId && t.userId === userId
    ) ?? null;
}

export async function createTicketChannel(
    guild: Guild,
    member: GuildMember,
    subject: string,
    description: string,
    config: TicketConfig
): Promise<TextChannel> {
    config.ticketCount++;
    saveConfig(config);

    const num = String(config.ticketCount).padStart(4, "0");
    const channelName = `ticket-${member.user.username}-${num}`;

    const permissionOverwrites: any[] = [
        {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
            type: OverwriteType.Role,
        },
        {
            id: member.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles,
            ],
            type: OverwriteType.Member,
        },
    ];

    for (const roleId of config.supportRoleIds) {
        permissionOverwrites.push({
            id: roleId,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.AttachFiles,
            ],
            type: OverwriteType.Role,
        });
    }

    const channel = await guild.channels.create({
        name: channelName,
        parent: config.categoryId,
        permissionOverwrites,
        topic: `Ticket #${num} | ${subject} | ${member.user.username}`,
    }) as TextChannel;

    const ticketData: TicketData = {
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

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🎫 Ticket #${num} — ${subject}`)
        .setDescription(description)
        .addFields(
            { name: "👤 Abierto por", value: `<@${member.id}>`, inline: true },
            { name: "📅 Fecha", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
            { name: "🔖 Estado", value: "🟢 Abierto", inline: true },
        )
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .setFooter({ text: "El equipo de soporte llegará pronto." });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId("ticket_claim")
            .setLabel("Reclamar")
            .setEmoji("🙋")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId("ticket_transcript")
            .setLabel("Transcript")
            .setEmoji("📄")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId("ticket_close")
            .setLabel("Cerrar ticket")
            .setEmoji("🔒")
            .setStyle(ButtonStyle.Danger),
    );

    await channel.send({
        content: `<@${member.id}> ${config.supportRoleIds.map(r => `<@&${r}>`).join(" ")}`,
        embeds: [embed],
        components: [row],
    });

    return channel;
}

export async function claimTicket(
    channel: TextChannel,
    staffMember: GuildMember,
    ticketData: TicketData
): Promise<void> {
    ticketData.claimedBy = staffMember.id;
    saveTicket(ticketData);

    const embed = new EmbedBuilder()
        .setColor(0xFEE75C)
        .setDescription(`### 🙋 Ticket reclamado\n**${staffMember.user.username}** se hizo cargo de este ticket.`)
        .setThumbnail(staffMember.user.displayAvatarURL());

    await channel.send({ embeds: [embed] });
}

export async function closeTicket(
    channel: TextChannel,
    closedBy: GuildMember,
    ticketData: TicketData,
    config: TicketConfig
): Promise<void> {
    const logChannel = channel.guild.channels.cache.get(config.logChannelId) as TextChannel | null;

    const transcript = await generateTranscript(channel, ticketData);

    const embedClose = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle("🔒 Ticket cerrado")
        .setDescription(`Cerrado por **${closedBy.user.username}**.\nEste canal se eliminará en **5 segundos**.`)
        .setTimestamp();

    await channel.send({ embeds: [embedClose] });

    if (logChannel) {
        const embedLog = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`📄 Transcript — Ticket #${String(ticketData.number).padStart(4, "0")}`)
            .addFields(
                { name: "👤 Usuario", value: `<@${ticketData.userId}>`, inline: true },
                { name: "🙋 Atendido por", value: ticketData.claimedBy ? `<@${ticketData.claimedBy}>` : "*Sin reclamar*", inline: true },
                { name: "📌 Asunto", value: ticketData.subject, inline: false },
                { name: "🕐 Duración", value: formatDuration(Date.now() - ticketData.createdAt), inline: true },
                { name: "🔒 Cerrado por", value: closedBy.user.username, inline: true },
            )
            .setTimestamp();

        await logChannel.send({
            embeds: [embedLog],
            files: [{ attachment: Buffer.from(transcript, "utf-8"), name: `ticket-${ticketData.number}.txt` }],
        });
    }

    try {
        const user = await channel.guild.members.fetch(ticketData.userId);
        const dmEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`📄 Tu ticket #${String(ticketData.number).padStart(4, "0")} fue cerrado`)
            .setDescription(`**Asunto:** ${ticketData.subject}\n**Servidor:** ${channel.guild.name}\n\nSe adjunta el transcript de la conversación.`);

        await user.send({
            embeds: [dmEmbed],
            files: [{ attachment: Buffer.from(transcript, "utf-8"), name: `ticket-${ticketData.number}.txt` }],
        });
    } catch { /* DMs cerrados */ }

    deleteTicket(channel.id);

    setTimeout(async () => {
        try { await channel.delete(); } catch { /* ya eliminado */ }
    }, 5000);
}

export async function generateTranscript(channel: TextChannel, ticketData: TicketData): Promise<string> {
    const messages: Message[] = [];
    let lastId: string | undefined;

    while (true) {
        const batch = await channel.messages.fetch({ limit: 100, before: lastId });
        if (batch.size === 0) break;
        messages.push(...batch.values());
        lastId = batch.last()?.id;
        if (batch.size < 100) break;
    }

    messages.reverse();

    const lines: string[] = [
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
        } else if (!msg.author.bot) {
            const content = msg.content || (msg.attachments.size > 0 ? "[Archivo adjunto]" : "[Sin contenido]");
            lines.push(`[${formatTime(msg.createdAt)}] ${msg.author.username}: ${content}`);
        }
    }

    return lines.join("\n");
}

function formatTime(date: Date): string {
    return date.toLocaleString("es", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDuration(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}

export function buildPanelEmbed(): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🎫 Sistema de Tickets")
        .setDescription(
            "¿Necesitas ayuda o te banearon del Canal de Twitch?\n" +
            "Haz clic en el botón de abajo para abrir un ticket.\n\n" +
            "**Antes de abrir un ticket:**\n" +
            "・Describe tu problema con detalle\n" +
            "・Coloca tu nombre de Twitch\n" +
            "・Adjunta capturas si es necesario\n" +
            "・No abras tickets duplicados"
        )
        .setFooter({ text: "El equipo de soporte te atenderá lo antes posible." });
}

export function buildPanelRow(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId("ticket_open")
            .setLabel("Abrir Ticket")
            .setEmoji("🎫")
            .setStyle(ButtonStyle.Primary)
    );
}
