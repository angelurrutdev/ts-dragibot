import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, NewsChannel, ThreadChannel, PermissionFlagsBits, EmbedBuilder, ColorResolvable } from 'discord.js';
import type { Command } from '../../types/index';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Envía un mensaje con un embed.')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption((option) => option.setName('canal').setDescription('Canal de texto').setRequired(true).addChannelTypes(0))
        .addStringOption((option) => option.setName('mensaje').setDescription('Mensaje del embed. Se usará como descripción si no se especifica una.').setRequired(true))
        .addStringOption((option) => option.setName('titulo').setDescription('Título'))
        .addStringOption((option) => option.setName('descripcion').setDescription('Descripción'))
        .addStringOption((option) => option.setName('color').setDescription('Color del embed')
            .setChoices(
                { name: 'Gris', value: 'Greyple' },
                { name: 'Verde', value: 'Green' },
                { name: 'Rojo', value: 'Red' },
                { name: 'Amarillo', value: 'Yellow' },
                { name: 'Aqua', value: 'Aqua' },
                { name: 'Morado', value: 'Purple' },
                { name: 'Azul', value: 'Blue' },
                { name: 'Naranja', value: 'Orange' },
                { name: 'Random', value: 'Random' },
            ))
        .addStringOption((option) => option.setName('timestamp').setDescription('Añadir hora')
            .setChoices(
                { name: 'Si', value: 'yes' },
                { name: 'No', value: 'no' },
            ))
        .addStringOption((option) => option.setName('autor').setDescription('Nombre del autor'))
        .addStringOption((option) => option.setName('footer').setDescription('Texto del pie'))
        .addAttachmentOption((option) => option.setName('thumbnail').setDescription('Miniatura'))
        .addAttachmentOption((option) => option.setName('image').setDescription('Imagen')),

    async execute(client, interaction: ChatInputCommandInteraction) {
        const embed = new EmbedBuilder();
        const errorEmbed = new EmbedBuilder().setColor("Red");

        const channel = interaction.options.getChannel('canal');
        const mensaje = interaction.options.getString('mensaje');

        if (!channel || !(channel instanceof TextChannel || channel instanceof NewsChannel || channel instanceof ThreadChannel)) {
            return interaction.reply({ embeds: [errorEmbed.setDescription('Debes seleccionar un canal de texto válido.')], ephemeral: true });
        }

        let description = (interaction.options.getString('descripcion') ?? mensaje)!

        if (description.trim() === "") {
            return interaction.reply({ embeds: [errorEmbed.setDescription('La descripción no puede estar vacía.')], ephemeral: true });
        }

        const title = interaction.options.getString('titulo');
        const timestamp = interaction.options.getString('timestamp');
        let color = interaction.options.getString('color') as ColorResolvable | undefined;
        const autor = interaction.options.getString('autor');
        const footer = interaction.options.getString('footer');
        const thumbnail = interaction.options.getAttachment('thumbnail');
        const image = interaction.options.getAttachment('image');

        if (title) embed.setTitle(title);
        if (description.length > 4096) return interaction.reply({ embeds: [errorEmbed.setDescription('La descripción excede los 4096 caracteres.')], ephemeral: true });
        embed.setDescription(description);
        if (thumbnail) embed.setThumbnail(thumbnail.url);
        if (image) embed.setImage(image.url);
        if (timestamp === 'yes') embed.setTimestamp();
        if (autor) embed.setAuthor({ name: autor });
        if (footer) embed.setFooter({ text: footer });

        if (color) {
            if (color === 'Random') {
                color = Math.floor(Math.random() * 16777215).toString(16) as ColorResolvable;
            }
            embed.setColor(color);
        }

        try {
            await channel.send({ embeds: [embed] });
            await interaction.reply({ content: 'Embed enviado correctamente.', ephemeral: true });
        } catch (error) {
            console.error('Error al enviar el embed:', error);
            await interaction.reply({ embeds: [errorEmbed.setDescription(`Error al enviar el embed. Revisa los permisos del bot en ${channel}. Error: ${error}`)], ephemeral: true });
        }
    },
};