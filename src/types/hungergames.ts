import { ChatInputCommandInteraction, EmbedBuilder, TextChannel } from "discord.js";

export interface Tributo {
    id: string;
    username: string;
    nombre?: string; 
    vivo: boolean;
    vida: number;
    inventario: String[];
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
            return ` ¡**${tributo[1].nombre}** ha muerto!`; 
        }
        return "";
    };

    if (resultado < 0.20) { 
        // Encontrar armas (20% de probabilidad)
        const armas = ["hacha 🪓", "ballesta 🏹", "espada rota 🗡️", "cuchillo afilado 🔪", "lanza improvisada", "garrote", "arco improvisado"];
        const arma = armas[Math.floor(Math.random() * armas.length)];
        tributos[tributo1[0]].inventario.push(arma);
        mensajeEvento = `¡**${tributo1[1].nombre}** encontró un ${arma}!`;
    } else if (resultado < 0.40 && tributo2) {
        // Intentar robar arma (20% de probabilidad)
        if (tributos[tributo2[0]].inventario.length > 0) {
            const armaRobada = tributos[tributo2[0]].inventario.splice(Math.floor(Math.random() * tributos[tributo2[0]].inventario.length), 1)[0];
            tributos[tributo1[0]].inventario.push(armaRobada);
            mensajeEvento = `¡**${tributo1[1].nombre}** le robó un ${armaRobada} a **${tributo2[1].nombre}**!`;
        } else {
            mensajeEvento = `¡**${tributo1[1].nombre}** intentó robarle un arma a **${tributo2[1].nombre}**, pero no tenía ninguna!`;
        }
    } else if (resultado < 0.60 && tributo2) {
        // Pelea con armas (20% de probabilidad)
        if (tributos[tributo1[0]].inventario.length > 0 && tributos[tributo2[0]].inventario.length > 0) {
            danio = Math.floor(Math.random() * 10) + 5;
            mensajeEvento = `¡**${tributo1[1].nombre}** y **${tributo2[1].nombre}** se enfrentaron en una batalla! ⚔️\n` 
                + `**${tributo1[1].nombre}** usó su ${tributos[tributo1[0]].inventario[0]} y **${tributo2[1].nombre}** usó su ${tributos[tributo2[0]].inventario[0]}!\n`
                + `Ambos sufrieron ${danio / 2} ❤️ de daño!` 
                + aplicarDanio(tributo1, danio) + aplicarDanio(tributo2, danio);
        } else {
            mensajeEvento = `¡**${tributo1[1].nombre}** y **${tributo2[1].nombre}** intentaron pelear, pero uno de ellos no tenía un arma!`;
        }
    } else if (resultado < 0.80 && tributo2) {
        // Formar una alianza (20% de probabilidad)
        mensajeEvento = `¡**${tributo1[1].nombre}** y **${tributo2[1].nombre}** decidieron formar una alianza!🤝`;
    } else { 
        // Traicionar a un aliado (20% de probabilidad)
        if (tributo2) {
            danio = Math.floor(Math.random() * 8) + 4;
            mensajeEvento = `¡**${tributo1[1].nombre}** traicionó a **${tributo2[1].nombre}** y lo atacó por la espalda! 🔪\n`
                + `**${tributo2[1].nombre}** sufrió ${danio} ❤️ de daño!`
                + aplicarDanio(tributo2, danio);
        } else {
            const nuevoResultado = Math.random(); 
            ejecutarEvento(tributo1, tributo2, nuevoResultado, tributos, interaction); 
        }
    }

    const embedEvento = new EmbedBuilder()
        .setColor("Random")
        .setDescription(mensajeEvento);

    if (tributo2) { 
        embedEvento.setThumbnail(tributo1[1].avatar);
        embedEvento.setImage(tributo2[1].avatar);
    } else { 
        embedEvento.setImage(tributo1[1].avatar); 
        embedEvento.setThumbnail(interaction.client.user?.displayAvatarURL() || "");
    }

    if (interaction.channel instanceof TextChannel) {
        await interaction.channel.send({ embeds: [embedEvento] });
    } else {
        console.error("No se pudo enviar el mensaje. El canal no es un canal de texto.");
    }
    
}