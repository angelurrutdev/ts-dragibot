import {
    SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder,
    TextChannel, ColorResolvable
} from 'discord.js';
import type { Command } from '../../types/index';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('anuncio')
        .setDescription('Crea un embed con editor de texto completo (soporta saltos de línea y Markdown)')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(opt => opt
            .setName('canal')
            .setDescription('Canal donde se enviará el embed')
            .setRequired(true)
            .addChannelTypes(0)
        )
        .addStringOption(opt => opt
            .setName('color')
            .setDescription('Color del borde del embed')
            .setRequired(false)
            .setChoices(
                { name: '🟢 Verde',    value: '#57F287' },
                { name: '🔴 Rojo',     value: '#ED4245' },
                { name: '🔵 Azul',     value: '#5865F2' },
                { name: '🟡 Amarillo', value: '#FEE75C' },
                { name: '🟠 Naranja',  value: '#E67E22' },
                { name: '⚪ Blanco',   value: '#FFFFFF' },
                { name: '⬛ Oscuro',   value: '#2B2D31' },
            )
        ),

    async execute(client, interaction) {
        const canal = interaction.options.getChannel('canal', true);
        const color = interaction.options.getString('color') ?? '#5865F2';

        const modal = new ModalBuilder()
            .setCustomId(`anuncio_modal_${canal.id}_${color.replace('#', '')}`)
            .setTitle('Crear embed');

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('anuncio_titulo')
                    .setLabel('Título (opcional)')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(256)
                    .setRequired(false)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('anuncio_descripcion')
                    .setLabel('Descripción (Markdown soportado)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(4000)
                    .setRequired(true)
                    .setPlaceholder(
                        '✅ **Título en negrita**\nTexto normal\n\n> Cita\n\n`código`'
                    )
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('anuncio_footer')
                    .setLabel('Footer (opcional)')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(256)
                    .setRequired(false)
            ),
        );

        return interaction.showModal(modal);
    }
};
