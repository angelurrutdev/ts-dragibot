import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder, ComponentType, TextChannel, DMChannel, NewsChannel, ThreadChannel, PermissionFlagsBits } from "discord.js";
import type { Command } from "../../types/index";
import { events_game } from "../../types/hungergames";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('hunger-game')
    .setDescription('Juega a los juegos del hambre')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('rol')
        .setDescription('Añade un rol que solo pueda jugar')
        .setRequired(false)
    ),

  async execute(client, interaction) {
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('register_member')
          .setLabel('Participar')
          .setStyle(ButtonStyle.Primary)
      );

    const embedInicial = new EmbedBuilder()
      .setTitle('Juegos del Hambre')
      .setDescription('Haz click en el botón para participar en los juegos del hambre.')
      .setColor('Random');

    let initialReply;
    try {
      initialReply = await interaction.reply({ embeds: [embedInicial], components: [row], fetchReply: true });
    } catch (error) {
      console.error("Error al enviar el mensaje inicial:", error);
      return;
    }

    const collector = initialReply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000
    });

    const players = new Set<string>();

    collector.on('collect', async i => {
      if (i.customId === 'register_member') {
        if (players.has(i.user.id)) {
          return i.reply({ content: 'Ya estás participando.', ephemeral: true });
        }

        players.add(i.user.id);
        await i.reply({ content: 'Te has registrado para los Juegos del Hambre.', ephemeral: true });

        embedInicial.setDescription(`Participa en los juegos del hambre actualmente hay ${players.size} Jugadores.`);
        try {
          await interaction.editReply({ embeds: [embedInicial] });
        } catch (error) {
          console.error("Error al editar el mensaje de participantes:", error);
        }
      }
    });

    collector.on('end', async () => {
        try {
            await interaction.editReply({ components: [] }); // Remover botones
        } catch (error) {
            console.error("Error al quitar los botones:", error);
        }

        if (players.size < 2) {
            embedInicial.setDescription('No hay suficientes jugadores para comenzar los Juegos del Hambre.');
            try {
                await interaction.editReply({ embeds: [embedInicial] });
            } catch (error) {
                console.error("Error al editar el mensaje de no suficientes jugadores:", error);
            }
            return;
        }

        let channel = interaction.channel;

        if (channel && (channel instanceof TextChannel || channel instanceof DMChannel || channel instanceof NewsChannel || channel instanceof ThreadChannel)) {
            let ronda = 1;

            while (players.size > 1) {
                let roundEmbed = new EmbedBuilder()
                    .setTitle(`Juegos del Hambre - Ronda ${ronda}`)
                    .setColor('Random');
                roundEmbed.setFields([]);
                roundEmbed.setTitle(`Juegos del Hambre - Ronda ${ronda}`);

                const numEventos = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < numEventos; i++) {
                    const eventoAleatorio = events_game[Math.floor(Math.random() * events_game.length)];
                    roundEmbed.addFields({ name: `Evento ${i + 1}`, value: eventoAleatorio.descripcion });
                    if (eventoAleatorio.impacto) {
                        eventoAleatorio.impacto(players, { channel });
                    }
                }

                const jugadoresRestantes = Array.from(players).map(p => `<@${p}>`).join(', ');
                roundEmbed.addFields({ name: "Jugadores Restantes", value: jugadoresRestantes || "Ninguno" });

                try {
                    await interaction.editReply({ embeds: [roundEmbed] });
                } catch (error) {
                    console.error("Error al editar el mensaje de ronda:", error);
                    await interaction.followUp({ embeds: [roundEmbed] });
                }

                if (players.size === 1) {
                    const winner = Array.from(players)[0];
                    const winnerEmbed = new EmbedBuilder()
                        .setTitle('¡Tenemos un Ganador!')
                        .setDescription(`El ganador de los juegos del hambre es: <@${winner}>`)
                        .setColor('Green');
                    await interaction.followUp({ embeds: [winnerEmbed] });
                    break;
                }
                ronda++;
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

            if (players.size > 1) {
                const noWinnerEmbed = new EmbedBuilder()
                    .setTitle("Juegos del Hambre")
                    .setDescription("Nadie ganó los juegos del hambre.")
                    .setColor('Red');
                await interaction.followUp({ embeds: [noWinnerEmbed] });
            }
        } else {
            console.error("El canal no es un tipo válido para enviar mensajes.");
            const invalidChannelEmbed = new EmbedBuilder()
                .setTitle("Error")
                .setDescription("No se pudo iniciar el juego en este canal.")
                .setColor('Red');
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [invalidChannelEmbed] });
            } else {
                await interaction.reply({ embeds: [invalidChannelEmbed] });
            }
        }
    });
  }
};