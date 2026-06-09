"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("banner")
        .setDescription("Muestra el banner de un usuario")
        .setDMPermission(false)
        .addUserOption(opt => opt
        .setName("usuario")
        .setDescription("El usuario del que quieres ver el banner (deja vacío para verte a ti)")
        .setRequired(false)),
    async execute(client, interaction) {
        const target = interaction.options.getMember("usuario")
            ?? interaction.member;
        await interaction.deferReply();
        // Fetch forzado para traer bannerHash global
        const user = await target.user.fetch(true);
        // Fetch del member via REST para obtener el banner de servidor
        const memberData = await client.rest.get(`/guilds/${interaction.guildId}/members/${target.id}`);
        const bannerGlobal = user.bannerURL({ size: 4096, extension: "png" });
        const bannerServidorHash = memberData?.banner;
        const bannerServidor = bannerServidorHash
            ? `https://cdn.discordapp.com/guilds/${interaction.guildId}/users/${target.id}/banners/${bannerServidorHash}.${bannerServidorHash.startsWith("a_") ? "gif" : "png"}?size=4096`
            : null;
        if (!bannerGlobal && !bannerServidor) {
            return interaction.editReply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor(0xED4245)
                        .setDescription(`### 🖼️ ${target.displayName} no tiene banner\nNecesita Nitro para establecer un banner de perfil.`)
                        .setThumbnail(target.displayAvatarURL({ size: 256 }))
                ]
            });
        }
        const opciones = [];
        if (bannerServidor) {
            opciones.push({
                label: "Banner del servidor",
                description: "Banner personalizado en este servidor (Nitro)",
                value: "servidor",
                emoji: "✨",
            });
        }
        if (bannerGlobal) {
            opciones.push({
                label: "Banner global",
                description: "El banner que el usuario tiene en todos los servidores",
                value: "global",
                emoji: "🌐",
            });
        }
        const select = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId(`banner_select_${target.id}_${interaction.guildId}`)
            .setPlaceholder("¿Qué banner quieres ver?")
            .addOptions(opciones);
        const row = new discord_js_1.ActionRowBuilder().addComponents(select);
        const tieneAmbos = bannerGlobal && bannerServidor;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(target.displayColor || 0x5865F2)
            .setDescription(`### 🖼️ Banner de **${target.displayName}**\n` +
            (tieneAmbos
                ? "✨ Tiene banner de servidor y banner global. Selecciona cuál ver."
                : bannerServidor
                    ? "✨ Tiene banner personalizado en este servidor."
                    : "🌐 Tiene banner global."))
            .setThumbnail(target.displayAvatarURL({ size: 256 }));
        return interaction.editReply({ embeds: [embed], components: [row] });
    }
};
