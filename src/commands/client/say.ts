import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, DMChannel, NewsChannel, ThreadChannel } from 'discord.js';
import type { Command } from '../../types/index';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('El bot envía un mensaje por ti.')
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName('mensaje')
                .setDescription('El mensaje que se enviará.')
                .setRequired(true)
        ),

    async execute(client, interaction: ChatInputCommandInteraction) {
        const messageOption = interaction.options.getString('mensaje', true);

        if (!messageOption) {
            return interaction.reply({ content: 'Por favor, proporciona un mensaje para enviar.', ephemeral: true });
        }

        if (interaction.channel && (
            interaction.channel instanceof TextChannel ||
            interaction.channel instanceof DMChannel ||
            interaction.channel instanceof NewsChannel ||
            interaction.channel instanceof ThreadChannel
        )) {
            try {
                await interaction.channel.send(messageOption);
                await interaction.reply({ content: "Tu mensaje se ha enviado correctamente.", ephemeral: true });
            } catch (error) {
                console.error('Error al enviar el mensaje:', error);
                await interaction.reply({ content: 'Hubo un error al enviar el mensaje.', ephemeral: true });
            }
        } else {
            console.error('El canal de la interacción no es un canal de texto válido.');
            return interaction.reply({ content: 'No se pudo enviar el mensaje en este canal.', ephemeral: true });
        }
    },
};