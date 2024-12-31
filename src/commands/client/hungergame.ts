import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder, ComponentType, ChatInputCommandInteraction, Message, TextChannel, DMChannel, NewsChannel, ThreadChannel } from "discord.js";
import type { Command } from "../../types/index";

interface Evento {
    descripcion: string;
    impacto?: (players: Set<string>, context: { channel: TextChannel | DMChannel | NewsChannel | ThreadChannel }) => void;
}

let events_game: Evento[] = [
    { descripcion: "Un rayo cae cerca de algunos tributos.", impacto: (players, { channel }) => {
        const playersArray = Array.from(players);
        if (playersArray.length > 0) {
            const victimIndex = Math.floor(Math.random() * playersArray.length);
            const victim = playersArray[victimIndex];
            channel.send(`<@${victim}> fue alcanzado por un rayo!`);
            players.delete(victim);
        }
    }},
    { descripcion: "Se encuentran suministros médicos.", impacto: (players, { channel }) => channel.send("Algunos tributos se curan.")},
    { descripcion: "Una estampida asusta a los tributos.", impacto: (players, { channel }) => {
        const playersArray = Array.from(players);
        if (playersArray.length > 1) {
            const victimsIndexes: number[] = [];
            for(let i = 0; i < 2 && i < playersArray.length; i++){
                let randomIndex = Math.floor(Math.random() * playersArray.length);
                while(victimsIndexes.includes(randomIndex)){
                    randomIndex = Math.floor(Math.random() * playersArray.length);
                }
                victimsIndexes.push(randomIndex);
            }
            const victim1 = playersArray[victimsIndexes[0]];
            const victim2 = playersArray[victimsIndexes[1]];
            channel.send(`<@${victim1}> y <@${victim2}> se lastimaron en la estampida!`);
        } else if (playersArray.length == 1){
            const victim = playersArray[0];
            channel.send(`<@${victim}> se lastimo en la estampida`);
        }
    }},
    { descripcion: "Un tributo encuentra un arma.", impacto: (players, { channel }) => {
        const playersArray = Array.from(players);
        if(playersArray.length > 0){
            const luckyPlayer = playersArray[Math.floor(Math.random() * playersArray.length)];
            channel.send(`<@${luckyPlayer}> encontro un arma!`);
        }
    }},
    { descripcion: "No pasa nada.", impacto: (players, { channel }) => {}}
];

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('hunger-game')
        .setDescription('Juega a los juegos del hambre')
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

        const embed = new EmbedBuilder()
            .setTitle('Juegos del Hambre')
            .setDescription('Haz click en el botón para participar en los juegos del hambre.')
            .setColor('Random');

        const message = await interaction.reply({ embeds: [embed], components: [row] }) as unknown as Message;

        const collector = message.createMessageComponentCollector({
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

                embed.setDescription(`Participa en los juegos del hambre actualmente hay ${players.size} Jugadores.`);
                await message.edit({ embeds: [embed] });
            }
        });

        collector.on('end', async collected => {

            if (players.size < 2) {
                embed.setDescription('No hay suficientes jugadores para comenzar los Juegos del Hambre.');
                await message.edit({ embeds: [embed], components: [] });
                return;
            }

            let channel = interaction.channel;

            if (channel && (channel instanceof TextChannel || channel instanceof DMChannel || channel instanceof NewsChannel || channel instanceof ThreadChannel)) {
                let ronda = 1;
                while (players.size > 1) { // Cambiado a > 1 para que haya un ganador
                    channel.send(`\n--- RONDA ${ronda} ---`);
                    const numEventos = Math.floor(Math.random() * 3) + 1;
                    for (let i = 0; i < numEventos; i++) {
                        const eventoAleatorio = events_game[Math.floor(Math.random() * events_game.length)];
                        channel.send(eventoAleatorio.descripcion);
                        if (eventoAleatorio.impacto) {
                            eventoAleatorio.impacto(players, { channel });
                        }
                    }
                    channel.send(`Jugadores restantes: ${Array.from(players).map(p => `<@${p}>`).join(', ')}`);

                    // Mover la comprobación del ganador DENTRO del bucle
                    if (players.size === 1) {
                        const winner = Array.from(players)[0];
                        channel.send(`El ganador de los juegos del hambre es: <@${winner}>`);
                        break; // Importante: salir del bucle una vez que hay un ganador
                    }
                    ronda++;
                }

                if (players.size > 1) { // Comprobar si no hubo un ganador
                    channel.send("Nadie gano los juegos del hambre");
                }


            } else {
                console.error("El canal no es un tipo válido para enviar mensajes.");
                if(interaction.replied || interaction.deferred){
                    interaction.followUp("No se pudo iniciar el juego en este canal.")
                } else {
                    interaction.reply("No se pudo iniciar el juego en este canal.")
                }
            }
        });
    }
};