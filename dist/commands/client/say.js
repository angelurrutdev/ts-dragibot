"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('say')
        .setDescription('El bot envía un mensaje por ti.')
        .setDMPermission(false)
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption(option => option.setName('mensaje')
        .setDescription('El mensaje que se enviará.')
        .setRequired(true)),
    async execute(client, interaction) {
        const messageOption = interaction.options.getString('mensaje', true);
        if (!messageOption) {
            return interaction.reply({ content: 'Por favor, proporciona un mensaje para enviar.', ephemeral: true });
        }
        if (interaction.channel && (interaction.channel instanceof discord_js_1.TextChannel ||
            interaction.channel instanceof discord_js_1.DMChannel ||
            interaction.channel instanceof discord_js_1.NewsChannel ||
            interaction.channel instanceof discord_js_1.ThreadChannel)) {
            try {
                await interaction.channel.send(messageOption);
                await interaction.reply({ content: "Tu mensaje se ha enviado correctamente.", ephemeral: true });
            }
            catch (error) {
                console.error('Error al enviar el mensaje:', error);
                await interaction.reply({ content: 'Hubo un error al enviar el mensaje.', ephemeral: true });
            }
        }
        else {
            console.error('El canal de la interacción no es un canal de texto válido.');
            return interaction.reply({ content: 'No se pudo enviar el mensaje en este canal.', ephemeral: true });
        }
    },
};
