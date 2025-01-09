import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, NewsChannel, ThreadChannel, PermissionFlagsBits, EmbedBuilder, ColorResolvable } from 'discord.js';
import type { Command } from '../../types/index';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Envía un mensaje con un embed.')
        .setDMPermission(false) // No disponible en MD
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Requiere permisos de administrador
        .addChannelOption((option) => option
            .setName('canal')
            .setDescription('Canal de texto donde se enviará el embed.')
            .setRequired(true)
            .addChannelTypes(0)) // Solo canales de texto
        .addStringOption((option) => option
            .setName('mensaje')
            .setDescription('Mensaje que se usará como descripción si no se especifica una descripción.'))
        .addStringOption((option) => option
            .setName('titulo')
            .setDescription('Título del embed.'))
        .addStringOption((option) => option
            .setName('descripcion')
            .setDescription('Descripción del embed. Soporta Markdown.')) // Se indica el soporte de Markdown
        .addStringOption((option) => option
            .setName('color')
            .setDescription('Color del embed.')
            .setChoices( // Opciones de color predefinidas
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
        .addBooleanOption((option) => option
            .setName('timestamp')
            .setDescription('Añadir la marca de tiempo actual al embed.'))
        .addStringOption((option) => option
            .setName('autor')
            .setDescription('Nombre del autor del embed.'))
        .addStringOption((option) => option
            .setName('footer')
            .setDescription('Texto del pie de página del embed.'))
        .addAttachmentOption((option) => option
            .setName('thumbnail')
            .setDescription('Imagen para la miniatura del embed.'))
        .addAttachmentOption((option) => option
            .setName('image')
            .setDescription('Imagen principal del embed.')),

    async execute(client, interaction: ChatInputCommandInteraction) {
        const embed = new EmbedBuilder();
        const errorEmbed = new EmbedBuilder().setColor("Red");

        const channel = interaction.options.getChannel('canal');
        const mensaje = interaction.options.getString('mensaje');
        const titulo = interaction.options.getString('titulo');
        let descripcion = interaction.options.getString('descripcion') ?? mensaje ?? ""; // Prioriza 'descripcion', luego 'mensaje', y si ambos son nulos, usa una cadena vacía.
        const timestamp = interaction.options.getBoolean('timestamp');
        let color = interaction.options.getString('color') as ColorResolvable | undefined;
        const autor = interaction.options.getString('autor');
        const footer = interaction.options.getString('footer');
        const thumbnail = interaction.options.getAttachment('thumbnail');
        const image = interaction.options.getAttachment('image');

        // Validación del canal
        if (!channel || !(channel instanceof TextChannel || channel instanceof NewsChannel || channel instanceof ThreadChannel)) {
            return interaction.reply({ embeds: [errorEmbed.setDescription('Debes seleccionar un canal de texto válido.')], ephemeral: true });
        }

        // Validación de descripción vacía
        if (descripcion.trim() === "") {
            return interaction.reply({ embeds: [errorEmbed.setDescription('La descripción no puede estar vacía.')], ephemeral: true });
        }

        // Configuración del embed
        if (titulo) embed.setTitle(titulo);
        if (descripcion.length > 4096) return interaction.reply({ embeds: [errorEmbed.setDescription('La descripción excede los 4096 caracteres.')], ephemeral: true });
        embed.setDescription(descripcion); // Aquí se aplica el Markdown
        if (thumbnail) embed.setThumbnail(thumbnail.url);
        if (image) embed.setImage(image.url);
        if (timestamp) embed.setTimestamp();
        if (autor) embed.setAuthor({ name: autor });
        if (footer) embed.setFooter({ text: footer });

        // Configuración del color
        if (color) {
            if (color === 'Random') {
                color = Math.floor(Math.random() * 16777215).toString(16) as ColorResolvable; // Genera un color hexadecimal aleatorio
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