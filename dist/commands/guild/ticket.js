"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
const ticketManager_1 = require("../../lib/ticketManager");
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Gestión del sistema de tickets")
        .setDMPermission(false)
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub
        .setName("setup")
        .setDescription("Configura el sistema de tickets en este servidor")
        .addChannelOption(opt => opt
        .setName("categoria")
        .setDescription("Categoría donde se crearán los canales de ticket")
        .setRequired(true))
        .addChannelOption(opt => opt
        .setName("logs")
        .setDescription("Canal donde se enviarán los transcripts y logs")
        .setRequired(true))
        .addRoleOption(opt => opt
        .setName("rol_soporte")
        .setDescription("Rol principal de soporte")
        .setRequired(true))
        .addRoleOption(opt => opt
        .setName("rol_soporte_2")
        .setDescription("Segundo rol de soporte (opcional)")
        .setRequired(false))
        .addRoleOption(opt => opt
        .setName("rol_soporte_3")
        .setDescription("Tercer rol de soporte (opcional)")
        .setRequired(false)))
        .addSubcommand(sub => sub
        .setName("panel")
        .setDescription("Publica el panel de tickets en un canal")
        .addChannelOption(opt => opt
        .setName("canal")
        .setDescription("Canal donde se publicará el panel")
        .setRequired(true)))
        .addSubcommand(sub => sub
        .setName("info")
        .setDescription("Muestra la configuración actual del sistema de tickets")),
    async execute(client, interaction) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guildId;
        if (sub === "setup") {
            const categoria = interaction.options.getChannel("categoria", true);
            const logs = interaction.options.getChannel("logs", true);
            const rol1 = interaction.options.getRole("rol_soporte", true);
            const rol2 = interaction.options.getRole("rol_soporte_2");
            const rol3 = interaction.options.getRole("rol_soporte_3");
            if (categoria.type !== 4) {
                return interaction.reply({
                    content: "❌ El canal de **categoría** debe ser una categoría de Discord, no un canal de texto.",
                    ephemeral: true,
                });
            }
            if (logs.type !== 0) {
                return interaction.reply({
                    content: "❌ El canal de **logs** debe ser un canal de texto.",
                    ephemeral: true,
                });
            }
            const supportRoles = [rol1.id];
            if (rol2)
                supportRoles.push(rol2.id);
            if (rol3)
                supportRoles.push(rol3.id);
            const existing = (0, ticketManager_1.getConfig)(guildId);
            (0, ticketManager_1.saveConfig)({
                guildId,
                categoryId: categoria.id,
                logChannelId: logs.id,
                supportRoleIds: supportRoles,
                ticketCount: existing?.ticketCount ?? 0,
                panelChannelId: existing?.panelChannelId,
                panelMessageId: existing?.panelMessageId,
            });
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x57F287)
                .setTitle("✅ Sistema de tickets configurado")
                .addFields({ name: "📁 Categoría", value: `<#${categoria.id}>`, inline: true }, { name: "📋 Canal de logs", value: `<#${logs.id}>`, inline: true }, { name: "🛡️ Roles de soporte", value: supportRoles.map(r => `<@&${r}>`).join(", "), inline: false }, { name: "🎫 Tickets hasta ahora", value: `${existing?.ticketCount ?? 0}`, inline: true })
                .setFooter({ text: "Usa /ticket panel para publicar el botón de apertura." });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        if (sub === "panel") {
            const config = (0, ticketManager_1.getConfig)(guildId);
            if (!config) {
                return interaction.reply({
                    content: "❌ Primero configura el sistema con `/ticket setup`.",
                    ephemeral: true,
                });
            }
            const canal = interaction.options.getChannel("canal", true);
            if (canal.type !== 0) {
                return interaction.reply({ content: "❌ El canal debe ser un canal de texto.", ephemeral: true });
            }
            const textChannel = interaction.guild.channels.cache.get(canal.id);
            // Borrar panel anterior si existe
            if (config.panelChannelId && config.panelMessageId) {
                try {
                    const oldCh = interaction.guild.channels.cache.get(config.panelChannelId);
                    const oldMsg = await oldCh.messages.fetch(config.panelMessageId);
                    await oldMsg.delete();
                }
                catch { /* ya no existe */ }
            }
            const msg = await textChannel.send({
                embeds: [(0, ticketManager_1.buildPanelEmbed)()],
                components: [(0, ticketManager_1.buildPanelRow)()],
            });
            config.panelChannelId = canal.id;
            config.panelMessageId = msg.id;
            (0, ticketManager_1.saveConfig)(config);
            return interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor(0x57F287)
                        .setDescription(`✅ Panel publicado en <#${canal.id}>`)
                ],
                ephemeral: true,
            });
        }
        if (sub === "info") {
            const config = (0, ticketManager_1.getConfig)(guildId);
            if (!config) {
                return interaction.reply({
                    content: "❌ El sistema de tickets no está configurado. Usa `/ticket setup`.",
                    ephemeral: true,
                });
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle("🎫 Configuración de Tickets")
                .addFields({ name: "📁 Categoría", value: `<#${config.categoryId}>`, inline: true }, { name: "📋 Logs", value: `<#${config.logChannelId}>`, inline: true }, { name: "🛡️ Roles de soporte", value: config.supportRoleIds.map(r => `<@&${r}>`).join(", ") || "*Ninguno*", inline: false }, { name: "📌 Panel activo", value: config.panelChannelId ? `<#${config.panelChannelId}>` : "*Sin panel*", inline: true }, { name: "🎟️ Total tickets", value: `${config.ticketCount}`, inline: true });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
