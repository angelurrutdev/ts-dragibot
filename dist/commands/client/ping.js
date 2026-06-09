"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
exports.command = {
    data: new discord_js_1.SlashCommandBuilder().setName('ping').setDescription('Comprueba tu conexión')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(client, interaction) {
        const delay = Date.now() - interaction.createdAt.getTime();
        const embedResponse = new discord_js_1.EmbedBuilder().setTitle('Pong!').setDescription(`Tu latencia es de  \`${delay}ms\``).setColor('Blue');
        await interaction.reply({ embeds: [embedResponse] });
    }
};
