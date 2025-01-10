import { 
    SlashCommandBuilder, 
    ChatInputCommandInteraction, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder,
    TextChannel,
    User
} from 'discord.js';
import type { Command, GlobClient } from '../../types/index';

export interface Tributo {
    id: string;
    username: string;
    nombre?: string; 
    vivo: boolean;
    vida: number;
    inventario: [];
    avatar: string;
}

export async function ejecutarEvento(
    tributo1: [string, Tributo],
    tributo2: [string, Tributo] | undefined,
    resultado: number,
    tributos: { [key: string]: Tributo },
    interaction: ChatInputCommandInteraction
) {
    let mensajeEvento = "";
    let danio = 0;

    const aplicarDanio = (tributo: [string, Tributo], cantidad: number) => {
        tributos[tributo[0]].vida -= cantidad;
        if (tributos[tributo[0]].vida <= 0) {
            tributos[tributo[0]].vivo = false;
            return ` ¡${tributo[1].nombre} ha muerto!`;
        }
        return "";
    };

    if (resultado < 0.15) {
        danio = Math.floor(Math.random() * 8) + 4;
        mensajeEvento = `¡${tributo1[1].nombre} tendió una emboscada y dañó a ${tributo2 ? tributo2[1].nombre : "nadie"} por ${danio / 2} corazones!` + (tributo2 ? aplicarDanio(tributo2, danio) : "");
    } else if (resultado < 0.30) {
        mensajeEvento = `¡${tributo1[1].nombre} y ${tributo2 ? tributo2[1].nombre : "un animal"} se encontraron en una tregua temporal y compartieron provisiones!`;
    } else if (resultado < 0.45) {
        mensajeEvento = `¡${tributo1[1].nombre} tropezó con una trampa, pero logró escapar ileso!`;
    } else if (resultado < 0.60 && tributo2) {
        mensajeEvento = `¡${tributo2[1].nombre} encontró un refugio seguro para pasar la noche!`;
    } else if (resultado < 0.75 && tributo2) {
        danio = Math.floor(Math.random() * 4) + 2;
        mensajeEvento = `¡${tributo1[1].nombre} y ${tributo2[1].nombre} se enfrentaron en una dura batalla y ambos sufrieron ${danio / 2} corazones de daño!` + aplicarDanio(tributo1, danio) + aplicarDanio(tributo2, danio);
    } else if (resultado < 0.85) {
        tributos[tributo1[0]].vida = Math.min(tributos[tributo1[0]].vida + 4, 20);
        mensajeEvento = `¡${tributo1[1].nombre} encontró un kit de primeros auxilios! Se ha curado 2 corazones.`;
    } else {
        danio = Math.floor(Math.random() * 6) + 3;
        mensajeEvento = `¡${tributo2 ? tributo2[1].nombre : "un oso"} fue atacado por un enjambre de avispas y sufrió ${danio / 2} corazones de daño!` + (tributo2 ? aplicarDanio(tributo2, danio) : "");
    }

    const embedEvento = new EmbedBuilder()
        .setColor("Red")
        .setDescription(mensajeEvento);

    if (tributo1[1].avatar) {
        embedEvento.setThumbnail(tributo1[1].avatar);
    }
    if (tributo2 && tributo2[1].avatar) {
        embedEvento.setImage(tributo2[1].avatar);
    }

    if (interaction.channel instanceof TextChannel) {
        await interaction.channel.send({ embeds: [embedEvento] });
    } else {
        console.error("No se pudo enviar el mensaje. El canal no es un canal de texto.");
    }
}

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
            // Puedes añadir más opciones para tributos si lo necesitas
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

            // Obtener los tributos añadidos manualmente
            const tributosManuales = [
                interaction.options.getUser('tributo1'),
                interaction.options.getUser('tributo2'),
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
                    vida: 20,
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
                .setDescription("Haz clic en el botón de abajo para registrarte como tributo. Tienes 60 segundos para registrarte.");

            const mensajeInicio = await interaction.reply({ embeds: [embedInicio], components: [row] });

            juegoEnCurso = true;

            const collector = mensajeInicio.createMessageComponentCollector({ time: 5000 }); 

            collector.on('collect', async i => {
                if (i.customId === 'registrar_tributo') {
                    if (tributos[i.user.id]) {
                        return i.reply({ content: "Ya estás registrado como tributo.", ephemeral: true });
                    }

                    const avatarURL = i.user.displayAvatarURL({ size: 1024 });

                    tributos[i.user.id] = {
                        id: i.user.id,
                        username: i.user.username,
                        nombre: i.user.username,
                        vivo: true,
                        vida: 20,
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
                    .setTitle("¡Los Juegos del Hambre han terminado!")
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
                    const resultado = Math.random();
                    eventos.push({ tributo1, tributo2, resultado });
                }

                const ejecutarEventosConCooldown = async (eventos: any[], index: number = 0) => {
                    if (index < eventos.length) {
                        await ejecutarEvento(eventos[index].tributo1, eventos[index].tributo2, eventos[index].resultado, tributos, interaction);
                        setTimeout(() => ejecutarEventosConCooldown(eventos, index + 1), 5000);
                    } else {
                        // Mostrar vidas al final de todos los eventos
                        let mensajeVidas = "**Vidas restantes al final de la ronda:**\n";
                        for (const [id, tributo] of Object.entries(tributos)) {
                            mensajeVidas += `${tributo.nombre}: ${tributo.vida} ❤️ ${tributo.vivo ? "" : "(Muerto)"}\n`;
                        }
                        const embedVidas = new EmbedBuilder()
                            .setColor("Purple")
                            .setDescription(mensajeVidas);
                        await interaction.followUp({ embeds: [embedVidas] });

                        ronda++;
                        if (tributosVivos.length > 1) {
                            setTimeout(() => iniciarRonda(client, interaction, tributos), 5000 * ronda); // cooldown de 5 segundos por ronda
                        }
                    }
                };

                ejecutarEventosConCooldown(eventos); 
            } 
        }
    }
};