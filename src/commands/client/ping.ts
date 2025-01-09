import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/index";

export const command: Command = {
    data: new SlashCommandBuilder().setName('ping').setDescription('Comprueba tu conexión')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(client, interaction) {
        const delay = Date.now() - interaction.createdAt.getTime()

        const embedResponse = new EmbedBuilder().setTitle('Pong!').setDescription(`Tu latencia es de  \`${delay}ms\``).setColor('Blue')
        await interaction.reply({ embeds: [embedResponse]})
    }
}