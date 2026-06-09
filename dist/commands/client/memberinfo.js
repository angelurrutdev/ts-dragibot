"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Ve la información de un usuario')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addUserOption(opt => opt.setName('target').setDescription('Selecciona un usuario').setRequired(true)),
    async execute(client, interaction) {
        const target = (interaction.options.getMember('target') || interaction.member);
        await interaction.deferReply({ ephemeral: true });
        const fetchedMember = await target.fetch();
        return interaction.editReply({ embeds: [new discord_js_1.EmbedBuilder()
                    .setColor(fetchedMember.user.accentColor || "Green")
                    .setAuthor({ name: `${fetchedMember.user.tag} profile`, iconURL: fetchedMember.user.displayAvatarURL() })
                    .setDescription(`__**Información del Usuario**__\n` +
                    `**ID:** ${fetchedMember.id}\n` +
                    `**Nickname:** \`${fetchedMember.nickname || fetchedMember.user.username}\`\n` +
                    `**Roles:** (${fetchedMember.roles.cache.size - 1}): ${fetchedMember.roles.cache.filter(r => r.id !== fetchedMember.guild.roles.everyone.id).map(r => r.toString()).join(', ') || 'None'}\n` +
                    `**Admin:** \`${fetchedMember.permissions.has(discord_js_1.PermissionFlagsBits.Administrator) ? 'Si' : 'No'}\`\n` +
                    `**Bot:** ${fetchedMember.user.bot ? 'Si' : 'No'}\n` +
                    `**Cuenta Creada:** <t:${(fetchedMember.user.createdTimestamp / 1000).toFixed(0)}:D>\n` +
                    `**Se ha unido:** <t:${(fetchedMember.joinedTimestamp / 1000).toFixed(0)}:D>`)
            ] });
    }
};
