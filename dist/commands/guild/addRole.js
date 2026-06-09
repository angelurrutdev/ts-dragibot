"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('añadir-rol')
        .setDescription('Añade un rol a un usuario o a todos los miembros del server')
        .setDMPermission(false)
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageRoles)
        .addSubcommand(sub => sub
        .setName('usuario')
        .setDescription('Añade un rol a un usuario específico')
        .addUserOption(opt => opt.setName('usuario').setDescription('El usuario a añadir el rol').setRequired(true))
        .addRoleOption(opt => opt.setName('rol').setDescription('El rol a añadir').setRequired(true)))
        .addSubcommand(sub => sub
        .setName('todos')
        .setDescription('Añade un rol a TODOS los miembros del server (operación única)')
        .addRoleOption(opt => opt.setName('rol').setDescription('El rol a asignar a todos').setRequired(true))),
    async execute(client, interaction) {
        const sub = interaction.options.getSubcommand();
        if (sub === 'usuario') {
            const member = interaction.options.getMember('usuario');
            const role = interaction.options.getRole('rol', true);
            if (Array.isArray(member.roles))
                return;
            await member.roles.add(role.id);
            await interaction.reply({ content: `El rol ${role} ha sido añadido correctamente al usuario ${member}.`, ephemeral: true });
        }
        else if (sub === 'todos') {
            const role = interaction.options.getRole('rol', true);
            const guild = interaction.guild;
            await interaction.deferReply({ ephemeral: true });
            // Verificar jerarquía: el rol del bot debe estar por encima del rol objetivo
            const botMember = guild.members.me;
            if (role.position >= botMember.roles.highest.position) {
                return interaction.editReply({
                    content: `❌ No puedo asignar ${role} porque está por encima o al mismo nivel que mi rol más alto (${botMember.roles.highest}). Sube mi rol en la jerarquía.`
                });
            }
            // Fetch de todos los miembros del guild
            const members = await guild.members.fetch();
            let asignados = 0;
            let omitidos = 0;
            let errores = 0;
            for (const [, member] of members) {
                if (member.user.bot)
                    continue; // Saltar bots
                if (member.roles.cache.has(role.id)) {
                    omitidos++;
                    continue;
                } // Ya tiene el rol
                try {
                    await member.roles.add(role.id);
                    asignados++;
                }
                catch {
                    errores++;
                }
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('✅ Rol asignado masivamente')
                .setColor('Green')
                .addFields({ name: 'Rol', value: `${role}`, inline: true }, { name: 'Asignados', value: `${asignados}`, inline: true }, { name: 'Ya tenían el rol', value: `${omitidos}`, inline: true }, { name: 'Errores', value: `${errores}`, inline: true })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        }
    },
};
