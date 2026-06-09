import { Event } from '../../types/index';
import {
    ModalBuilder, TextInputBuilder, TextInputStyle,
    ActionRowBuilder, EmbedBuilder, TextChannel, GuildMember,
    ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder
} from 'discord.js';
import {
    getConfig, getTicket, getUserOpenTicket,
    createTicketChannel, claimTicket, closeTicket, generateTranscript
} from '../../lib/ticketManager';

const CATEGORIAS: Record<string, { label: string; emoji: string; placeholder: string }> = {
    problema_discord: {
        label: "Problema con Discord",
        emoji: "🔵",
        placeholder: "¿Qué pasó? ¿Cuándo ocurrió? Describe el problema con el mayor detalle posible.",
    },
    problema_twitch: {
        label: "Problema con Twitch",
        emoji: "🟣",
        placeholder: "Incluye tu usuario de Twitch y describe qué pasó (baneo, silencio, etc.).",
    },
    otro: {
        label: "Otro problema",
        emoji: "❓",
        placeholder: "⚠️ Sé específico: explica QUÉ pasó y CUÁNDO. Tickets vagos serán cerrados.",
    },
};

export const event: Event<'interactionCreate'> = {
    name: 'interactionCreate',

    async execute(client, interaction) {

        // Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            if (command.developer && !client.config.developers.includes(interaction.user.id)) {
                return await interaction.reply({
                    content: 'Este comando solo está disponible para desarrolladores.',
                    ephemeral: true
                });
            }

            command.execute(client, interaction);
            return;
        }

        // Select Menus
        if (interaction.isStringSelectMenu()) {
            const { customId, guild, user } = interaction;
            if (!guild) return;

            // Avatar
            if (customId.startsWith('avatar_select_')) {
                const targetId = customId.replace('avatar_select_', '');
                const member = await guild.members.fetch(targetId).catch(() => null);
                if (!member) return interaction.reply({ content: '❌ No se pudo encontrar al usuario.', ephemeral: true });

                const opcion = interaction.values[0];
                const avatarGlobal = member.user.displayAvatarURL({ size: 4096, extension: 'png' });
                const avatarServidor = member.avatarURL({ size: 4096, extension: 'png' });
                const esServidor = opcion === 'servidor';
                const url = esServidor ? avatarServidor! : avatarGlobal;

                const embed = new EmbedBuilder()
                    .setColor(member.displayColor || 0x5865F2)
                    .setTitle(`${esServidor ? '✨ Avatar del servidor' : '🌐 Avatar global'} — ${member.displayName}`)
                    .setImage(url)
                    .addFields({ name: '🔗 Link directo', value: `[Abrir en el navegador](${url})`, inline: true });

                return interaction.update({ embeds: [embed], components: [] });
            }

            // Banner
            if (customId.startsWith('banner_select_')) {
                const parts = customId.replace('banner_select_', '').split('_');
                const targetId = parts[0];
                const guildId = parts[1];

                const member = await guild.members.fetch(targetId).catch(() => null);
                if (!member) return interaction.reply({ content: '❌ No se pudo encontrar al usuario.', ephemeral: true });

                const user = await member.user.fetch(true);
                const memberData = await client.rest.get(`/guilds/${guildId}/members/${targetId}`) as any;

                const opcion = interaction.values[0];
                let url: string;

                if (opcion === 'servidor') {
                    const hash = memberData?.banner;
                    url = `https://cdn.discordapp.com/guilds/${guildId}/users/${targetId}/banners/${hash}.${hash.startsWith('a_') ? 'gif' : 'png'}?size=4096`;
                } else {
                    url = user.bannerURL({ size: 4096, extension: 'png' })!;
                }

                const embed = new EmbedBuilder()
                    .setColor(member.displayColor || 0x5865F2)
                    .setTitle(`${opcion === 'servidor' ? '✨ Banner del servidor' : '🌐 Banner global'} — ${member.displayName}`)
                    .setImage(url)
                    .addFields({ name: '🔗 Link directo', value: `[Abrir en el navegador](${url})`, inline: true })
                    .setFooter({ text: opcion === 'servidor' ? 'Banner personalizado en este servidor (Nitro)' : 'Banner global del perfil (Nitro)' });

                return interaction.update({ embeds: [embed], components: [] });
            }

            // Ticket categoria
            if (customId === 'ticket_category_select') {
                const config = getConfig(guild.id);
                if (!config) return interaction.reply({ content: '❌ Sistema de tickets no configurado.', ephemeral: true });

                const existing = getUserOpenTicket(guild.id, user.id);
                if (existing) {
                    return interaction.reply({
                        content: `❌ Ya tienes un ticket abierto: <#${existing.channelId}>\nCiérralo antes de abrir uno nuevo.`,
                        ephemeral: true
                    });
                }

                const categoria = interaction.values[0];
                const categoriaInfo = CATEGORIAS[categoria];

                const modal = new ModalBuilder()
                    .setCustomId(`ticket_modal_${categoria}`)
                    .setTitle(`${categoriaInfo.emoji} ${categoriaInfo.label}`);

                modal.addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                        new TextInputBuilder()
                            .setCustomId('ticket_description')
                            .setLabel('Describe tu situación con detalle')
                            .setPlaceholder(categoriaInfo.placeholder)
                            .setStyle(TextInputStyle.Paragraph)
                            .setMinLength(30)
                            .setMaxLength(1000)
                            .setRequired(true)
                    ),
                );

                return interaction.showModal(modal);
            }

            return;
        }

        // Botones
        if (interaction.isButton()) {
            const { customId, guild, user } = interaction;
            if (!guild) return;

            // Abrir panel de categorías al presionar el botón del panel
            if (customId === 'ticket_open') {
                const config = getConfig(guild.id);
                if (!config) return interaction.reply({ content: '❌ El sistema de tickets no está configurado.', ephemeral: true });

                const existing = getUserOpenTicket(guild.id, user.id);
                if (existing) {
                    return interaction.reply({
                        content: `❌ Ya tienes un ticket abierto: <#${existing.channelId}>\nCiérralo antes de abrir uno nuevo.`,
                        ephemeral: true
                    });
                }

                const select = new StringSelectMenuBuilder()
                    .setCustomId('ticket_category_select')
                    .setPlaceholder('¿Cuál es el motivo de tu ticket?')
                    .addOptions(
                        Object.entries(CATEGORIAS).map(([key, val]) =>
                            new StringSelectMenuOptionBuilder()
                                .setLabel(val.label)
                                .setValue(key)
                                .setEmoji(val.emoji)
                        )
                    );

                const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x5865F2)
                            .setTitle('🎫 Abrir Ticket')
                            .setDescription(
                                '**Selecciona el motivo de tu ticket:**\n\n' +
                                '🔵 **Problema con Discord** — Problemas técnicos, roles, canales, etc.\n' +
                                '🟣 **Problema con Twitch** — Baneos, silenciados, problemas en el canal.\n' +
                                '❓ **Otro problema** — Cualquier otro asunto. **Sé específico.**\n\n' +
                                '> ⚠️ Los tickets sin información clara serán cerrados sin previo aviso.'
                            )
                    ],
                    components: [row],
                    ephemeral: true
                });
            }

            if (customId === 'ticket_claim') {
                const config = getConfig(guild.id);
                if (!config) return;

                const isStaff = config.supportRoleIds.some(r => (interaction.member as GuildMember)?.roles.cache.has(r));
                if (!isStaff) return interaction.reply({ content: '❌ Solo el staff puede reclamar tickets.', ephemeral: true });

                const ticketData = getTicket(interaction.channelId);
                if (!ticketData) return interaction.reply({ content: '❌ Este canal no es un ticket válido.', ephemeral: true });

                if (ticketData.claimedBy) {
                    return interaction.reply({ content: `❌ Ya fue reclamado por <@${ticketData.claimedBy}>.`, ephemeral: true });
                }

                await interaction.deferUpdate();
                await claimTicket(interaction.channel as TextChannel, interaction.member as GuildMember, ticketData);
                return;
            }

            if (customId === 'ticket_transcript') {
                const config = getConfig(guild.id);
                if (!config) return;

                const isStaff = config.supportRoleIds.some(r => (interaction.member as GuildMember)?.roles.cache.has(r));
                if (!isStaff) return interaction.reply({ content: '❌ Solo el staff puede generar transcripts.', ephemeral: true });

                const ticketData = getTicket(interaction.channelId);
                if (!ticketData) return interaction.reply({ content: '❌ Este canal no es un ticket válido.', ephemeral: true });

                await interaction.deferReply({ ephemeral: true });
                const transcript = await generateTranscript(interaction.channel as TextChannel, ticketData);

                return interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription('📄 Transcript generado.')],
                    files: [{ attachment: Buffer.from(transcript, 'utf-8'), name: `ticket-${ticketData.number}.txt` }]
                });
            }

            if (customId === 'ticket_close') {
                const config = getConfig(guild.id);
                if (!config) return;

                const ticketData = getTicket(interaction.channelId);
                if (!ticketData) return interaction.reply({ content: '❌ Este canal no es un ticket válido.', ephemeral: true });

                const isStaff = config.supportRoleIds.some(r => (interaction.member as GuildMember)?.roles.cache.has(r));
                const isOwner = ticketData.userId === user.id;
                if (!isStaff && !isOwner) {
                    return interaction.reply({ content: '❌ Solo el staff o el dueño del ticket pueden cerrarlo.', ephemeral: true });
                }

                const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId('ticket_close_confirm').setLabel('Sí, cerrar').setEmoji('🔒').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('ticket_close_cancel').setLabel('Cancelar').setEmoji('❌').setStyle(ButtonStyle.Secondary),
                );

                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xED4245)
                            .setDescription('### 🔒 ¿Cerrar este ticket?\nSe generará un transcript y el canal se eliminará en 5 segundos.')
                    ],
                    components: [confirmRow],
                    ephemeral: true
                });
            }

            if (customId === 'ticket_close_confirm') {
                const config = getConfig(guild.id);
                if (!config) return;
                const ticketData = getTicket(interaction.channelId);
                if (!ticketData) return;

                await interaction.deferUpdate();
                await closeTicket(
                    interaction.channel as TextChannel,
                    interaction.member as GuildMember,
                    ticketData,
                    config
                );
                return;
            }

            if (customId === 'ticket_close_cancel') {
                return interaction.update({
                    embeds: [new EmbedBuilder().setColor(0x57F287).setDescription('✅ Cierre cancelado.')],
                    components: []
                });
            }

            return;
        }

        // Modales
        if (interaction.isModalSubmit()) {
            const { customId, guild } = interaction;
            if (!guild) return;

            // Anuncio
            if (customId.startsWith('anuncio_modal_')) {
                const sinPrefijo = customId.replace('anuncio_modal_', '');
                // canalId son los primeros 18-19 dígitos, el color es lo que queda después del último _
                const lastUnderscore = sinPrefijo.lastIndexOf('_');
                const canalId = sinPrefijo.substring(0, lastUnderscore);
                const colorHex = `#${sinPrefijo.substring(lastUnderscore + 1)}`;

                const titulo = interaction.fields.getTextInputValue('anuncio_titulo');
                const descripcion = interaction.fields.getTextInputValue('anuncio_descripcion');
                const footer = interaction.fields.getTextInputValue('anuncio_footer');

                const canal = guild.channels.cache.get(canalId) as TextChannel;
                if (!canal) return interaction.reply({ content: '❌ No se encontró el canal.', ephemeral: true });

                const embed = new EmbedBuilder()
                    .setColor(colorHex as any)
                    .setDescription(descripcion);

                if (titulo) embed.setTitle(titulo);
                if (footer) embed.setFooter({ text: footer });

                await canal.send({ embeds: [embed] });
                return interaction.reply({ content: `✅ Embed enviado en <#${canalId}>`, ephemeral: true });
            }

            // Ticket
            if (customId.startsWith('ticket_modal_')) {
                const config = getConfig(guild.id);
                if (!config) return interaction.reply({ content: '❌ Sistema de tickets no configurado.', ephemeral: true });

                const categoriaKey = customId.replace('ticket_modal_', '');
                const categoriaInfo = CATEGORIAS[categoriaKey];
                const description = interaction.fields.getTextInputValue('ticket_description');
                const subject = `${categoriaInfo.emoji} ${categoriaInfo.label}`;

                await interaction.deferReply({ ephemeral: true });

                const member = interaction.member as GuildMember;
                const channel = await createTicketChannel(guild, member, subject, description, config);

                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x57F287)
                            .setDescription(`✅ Tu ticket fue creado: <#${channel.id}>`)
                    ]
                });
            }
        }
    }
};
