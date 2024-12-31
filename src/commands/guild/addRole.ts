import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/index";

export const command: Command = {
    data: new SlashCommandBuilder()
    .setName('añadir-rol')
    .setDescription('Añade un rol a un usuario')
    .setDMPermission(false)
    // Manejar permisos 
     .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(opt => opt.setName('usuario').setDescription('El usuario a añadir el rol').setRequired(true))
    .addRoleOption(opt => opt.setName('rol').setDescription('El rol a añadir').setRequired(true)),


    async execute(client, interaction) {
        const member = interaction.options.getMember('usuario')!
        const role = interaction.options.getRole('rol', true)

        if(Array.isArray(member.roles)) return
        await member.roles.add(role.id)

        await interaction.reply({ content: `El rol ${role} ha sido añadido correctamente al usuario ${member}.`, ephemeral: true })
    },
}