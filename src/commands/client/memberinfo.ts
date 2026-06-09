import { EmbedBuilder, GuildMember, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/index";

export const command: Command = {
    data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Ve la información de un usuario')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt => opt.setName('target').setDescription('Selecciona un usuario').setRequired(true)),

    

    async execute(client, interaction) {
        const target = (interaction.options.getMember('target') || interaction.member) as GuildMember 
        await interaction.deferReply({ ephemeral: true })

        const fetchedMember = await target.fetch()

        return interaction.editReply({ embeds: [new EmbedBuilder()
            .setColor(fetchedMember.user.accentColor || "Green")
            .setAuthor({ name: `${fetchedMember.user.tag} profile`, iconURL: fetchedMember.user.displayAvatarURL() })
            .setDescription(
                `__**Información del Usuario**__\n` +
                `**ID:** ${fetchedMember.id}\n` +
                `**Nickname:** \`${fetchedMember.nickname || fetchedMember.user.username}\`\n` +
                `**Roles:** (${fetchedMember.roles.cache.size - 1}): ${fetchedMember.roles.cache.filter(r => r.id !== fetchedMember.guild.roles.everyone.id).map(r => r.toString()).join(', ') || 'None'}\n` +
                `**Admin:** \`${fetchedMember.permissions.has(PermissionFlagsBits.Administrator) ? 'Si' : 'No'}\`\n` +
                `**Bot:** ${fetchedMember.user.bot ? 'Si' : 'No'}\n` +
                `**Cuenta Creada:** <t:${(fetchedMember.user.createdTimestamp / 1000).toFixed(0)}:D>\n` +
                `**Se ha unido:** <t:${(fetchedMember.joinedTimestamp! / 1000).toFixed(0)}:D>`
            )
        ]})
}}


