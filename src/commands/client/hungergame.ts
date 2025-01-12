import { 
    SlashCommandBuilder, 
    ChatInputCommandInteraction, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder,
    User,
    Role,
    GuildMemberRoleManager
} from 'discord.js';
import type { Command, GlobClient } from '../../types/index';
import { Tributo, ejecutarEvento } from '../../types/hungergames';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('hungergames')
        .setDescription('Juega a los juegos del hambre')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('iniciar')
                .setDescription('Inicia los Juegos del Hambre')
                .addRoleOption(option =>
                    option.setName('rol')
                    .setDescription('El rol que puede participar en los juegos')
                    .setRequired(false)
                )
                .addUserOption(option => 
                    option.setName('tributo1')
                    .setDescription('Añade un tributo')
                    .setRequired(false)
                )
                .addUserOption(option => 
                    option.setName('tributo2')
                    .setDescription('Añade otro tributo')
                    .setRequired(false)
                ) 
                .addUserOption(option => 
                    option.setName('tributo3')
                    .setDescription('Añade otro tributo')
                    .setRequired(false)
                )
                .addUserOption(option => 
                    option.setName('tributo4')
                    .setDescription('Añade otro tributo')
                    .setRequired(false)
                )
                
        ),

    async execute(client: GlobClient, interaction: ChatInputCommandInteraction) {
        let tributos: { [key: string]: Tributo } = {};
        let juegoEnCurso = false;
        let ronda = 0;

        if (interaction.options.getSubcommand() === "iniciar") {
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: "Solo los administradores pueden iniciar los juegos.", ephemeral: true });
            }

            if (juegoEnCurso) {
                return interaction.reply({ content: "¡Los juegos ya están en curso!", ephemeral: true });
            }

            const rolMencionado = interaction.options.getRole('rol') as Role | null;

            // Obtener los tributos añadidos manualmente
            const tributosManuales = [
                interaction.options.getUser('tributo1'),
                interaction.options.getUser('tributo2'),
                interaction.options.getUser('tributo3'),
                interaction.options.getUser('tributo4'),
                // ... más tributos si se añaden opciones
            ].filter(tributo => tributo !== null) as User[]; 

            // Añadir los tributos manuales al objeto tributos
            for (const tributo of tributosManuales) {
                const avatarURL = tributo.displayAvatarURL({ size: 1024 });
                tributos[tributo.id] = {
                    id: tributo.id,
                    username: tributo.username,
                    nombre: tributo.username,
                    vivo: true,
                    refugio: false,
                    vida: 20,
                    hambre: 0,
                    sed: 0,
                    inventario: [],
                    avatar: avatarURL
                };
            }

            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('registrar_tributo')
                        .setLabel('Registrarme como Tributo')
                        .setStyle(ButtonStyle.Primary)
                );


            const embedInicio = new EmbedBuilder()
                .setColor("Orange")
                .setTitle("¡Los Juegos del Hambre están por comenzar!")
                .setDescription(`Haz clic en el botón de abajo para registrarte como tributo. Tienes 60 segundos para registrarte.${rolMencionado ? `**\nSolo los miembros del rol ${rolMencionado.name} pueden participar.**` : ""}`);

            const mensajeInicio = await interaction.reply({ embeds: [embedInicio], components: [row] });

            juegoEnCurso = true;

            const collector = mensajeInicio.createMessageComponentCollector({ time: 60000 }); // Tiempo de espera

            collector.on('collect', async i => {
                if (i.customId === 'registrar_tributo') {
                    if (tributos[i.user.id]) {
                        return i.reply({ content: "Ya estás registrado como tributo.", ephemeral: true });
                    }

                    // Verificar si se mencionó un rol y si el usuario lo tiene
                    if (rolMencionado && i.member) {
                        if (i.member.roles instanceof GuildMemberRoleManager) {
                            if (!i.member.roles.cache.has(rolMencionado.id)) {
                                return i.reply({ content: `Solo los miembros del rol ${rolMencionado.name} pueden participar.`, ephemeral: true });
                            }
                        } else { // i.member.roles es un string[]
                            if (!i.member.roles.includes(rolMencionado.id)) {
                                return i.reply({ content: `Solo los miembros del rol ${rolMencionado.name} pueden participar.`, ephemeral: true });
                            }
                        }
                    }

                    const avatarURL = i.user.displayAvatarURL({ size: 1024 });

                    tributos[i.user.id] = {
                        id: i.user.id,
                        username: i.user.username,
                        nombre: i.user.username,
                        vivo: true,
                        vida: 20,
                        refugio: false,
                        hambre: 0,
                        sed: 0,
                        inventario: [],
                        avatar: avatarURL
                    };

                    await i.reply({ content: `Te has registrado como tributo, ${i.user.username}!`, ephemeral: true });
                }
            });

            collector.on('end', async collected => {
                juegoEnCurso = false;

                if (Object.keys(tributos).length < 2) {
                    return interaction.followUp({ content: "No hay suficientes tributos para iniciar los juegos. Se necesitan al menos 2.", ephemeral: true });
                }

                ronda = 1;
                iniciarRonda(client, interaction, tributos); 
            });
        }

        async function iniciarRonda(client: GlobClient, interaction: ChatInputCommandInteraction, tributos: { [key: string]: Tributo }) {
            const tributosVivos = Object.entries(tributos).filter(([, t]) => t.vivo);

            if (tributosVivos.length <= 0) {
                juegoEnCurso = false;
                return interaction.followUp("¡No hubo sobrevivientes!"); 
            } else if (tributosVivos.length === 1) {
                const ganador = tributosVivos[0][1]; 
                juegoEnCurso = false;
                const embedGanador = new EmbedBuilder()
                    .setColor("Gold")
                    .setTitle("# ¡Los Juegos del Hambre han terminado!")
                    .setDescription(`¡${ganador.nombre} ha sobrevivido y es el ganador!`);
                return interaction.followUp({ embeds: [embedGanador] }); 
            }

            const embedRonda = new EmbedBuilder()
                .setColor("Blue")
                .setTitle(`Comienza la Ronda ${ronda}`)
                .setDescription("Los tributos se enfrentan a nuevos peligros...");
            await interaction.followUp({ embeds: [embedRonda] }); 

            if (tributosVivos.length >= 2) {
                // Ejecutar eventos con cooldown
                const eventos = []; 
                for (let i = 0; i < tributosVivos.length; i++) {
                    const tributo1 = tributosVivos[i];
                    let tributo2;
                    if (tributosVivos.length > 1) {
                        do {
                            tributo2 = tributosVivos[Math.floor(Math.random() * tributosVivos.length)];
                        } while (tributo1[0] === tributo2[0]);
                    } else {
                        tributo2 = undefined;
                    }
                    eventos.push({ tributo1, tributo2 });
                }

                const ejecutarEventosConCooldown = async (eventos: any[], index: number = 0) => {
                    if (index < eventos.length) {
                        await ejecutarEvento(eventos[index].tributo1, eventos[index].tributo2, tributos, interaction);
                        setTimeout(() => ejecutarEventosConCooldown(eventos, index + 1), 5000);
                    } else {
                        // Mostrar vidas al final de todos los eventos
                        let mensajeVidas = "## Vidas restantes al final de la ronda:\n";
                        for (const [id, tributo] of Object.entries(tributos)) {
                            mensajeVidas += `${tributo.nombre}: ${tributo.vida} ❤️ ${tributo.vivo ? "" : "(Muerto)"}\n`;
                        }
                        const embedVidas = new EmbedBuilder()
                            .setColor("Purple")
                            .setDescription(mensajeVidas);
                        await interaction.followUp({ embeds: [embedVidas] });

                        ronda++;
                        if (tributosVivos.length > 1) {
                            setTimeout(() => iniciarRonda(client, interaction, tributos), 2000 * ronda); // cooldown de 5 segundos por ronda
                        }
                    }
                };

                ejecutarEventosConCooldown(eventos); 
            } 
        }
    }
};