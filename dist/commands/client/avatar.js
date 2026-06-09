"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("avatar")
        .setDescription("Muestra el avatar de un usuario")
        .setDMPermission(false)
        .addUserOption(opt => opt
        .setName("usuario")
        .setDescription("El usuario del que quieres ver el avatar (deja vacío para verte a ti)")
        .setRequired(false)),
    async execute(client, interaction) {
        const target = interaction.options.getMember("usuario")
            ?? interaction.member;
        const user = target.user;
        const avatarGlobal = user.displayAvatarURL({ size: 4096, extension: "png" });
        const avatarServidor = target.avatarURL({ size: 4096, extension: "png" });
        const opciones = [
            {
                label: "Avatar global",
                description: "El avatar que el usuario tiene en todos los servidores",
                value: "global",
                emoji: "🌐",
            }
        ];
        if (avatarServidor) {
            opciones.unshift({
                label: "Avatar del servidor",
                description: "Avatar personalizado con Nitro en este servidor",
                value: "servidor",
                emoji: "✨",
            });
        }
        const select = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId(`avatar_select_${user.id}`)
            .setPlaceholder("¿Qué avatar quieres ver?")
            .addOptions(opciones);
        const row = new discord_js_1.ActionRowBuilder().addComponents(select);
        const embedPrev = new discord_js_1.EmbedBuilder()
            .setColor(target.displayColor || 0x5865F2)
            .setDescription(`### 🖼️ Avatar de **${target.displayName}**\n` +
            (avatarServidor
                ? "✨ Este usuario tiene avatar personalizado en el servidor."
                : "Este usuario no tiene avatar de servidor."))
            .setThumbnail(avatarServidor ?? avatarGlobal);
        await interaction.reply({ embeds: [embedPrev], components: [row] });
    }
};
