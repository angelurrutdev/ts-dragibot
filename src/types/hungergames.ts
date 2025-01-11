import { ChatInputCommandInteraction, EmbedBuilder, TextChannel } from "discord.js";

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
            return ` ¡**${tributo[1].nombre}** ha muerto!`; 
        }
        return "";
    };

    if (resultado < 0.15) {
        // Emboscada
        danio = Math.floor(Math.random() * 8) + 4;
        mensajeEvento = `¡**${tributo1[1].nombre}** tendió una emboscada y dañó a ${tributo2 ? `**${tributo2[1].nombre}**` : "nadie"} por ${danio / 2} ❤️!` + (tributo2 ? aplicarDanio(tributo2, danio) : ""); 
    } else if (resultado < 0.45) { 
        // Grupo de eventos con mayor probabilidad (30%)
        const eventosPosibles = [
            // Encontrar armas
            `¡**${tributo1[1].nombre}** encontró un hacha oxidada 🪓 en una cabaña abandonada!`,
            `¡**${tributo1[1].nombre}** tropezó con una mochila y encontró una ballesta 🏹 y algunas flechas!`,
            `¡Mientras exploraba, **${tributo1[1].nombre}** descubrió una espada rota 🗡️ clavada en una roca!`,
            `¡**${tributo1[1].nombre}** encontró un cuchillo afilado 🔪 escondido en un tronco hueco!`,

            // Hacer armas
            `¡**${tributo1[1].nombre}** usó su ingenio y algunas ramas para construir un arco improvisado 🏹!`,
            `¡**${tributo1[1].nombre}** afiló una piedra con paciencia y creó una lanza rudimentaria !`,
            `¡Con pedazos de hierro oxidado, **${tributo1[1].nombre}** logró forjar una espada tosca pero efectiva 🗡️!`,
            `¡**${tributo1[1].nombre}** recolectó algunas piedras y las ató a un palo para crear un garrote improvisado!`,

            // Curarse
            `¡**${tributo1[1].nombre}** encontró algunas hierbas medicinales 🌿 y se curó 5 ❤️!`,
            `¡**${tributo1[1].nombre}** descansó en una cueva tranquila y recuperó 3 ❤️!`,
            `¡**${tributo1[1].nombre}** bebió agua de un manantial cristalino y se sintió revitalizado, recuperando 2 ❤️!`,
            `¡Milagrosamente, **${tributo1[1].nombre}** encontró un botiquín de primeros auxilios completo y se curó por completo (20 ❤️)!`,

            // Morir por decisiones arriesgadas
            `¡**${tributo1[1].nombre}** intentó saltar un barranco pero falló, cayendo a su muerte!`,
            `¡**${tributo1[1].nombre}** pensó que era buena idea comer unas bayas desconocidas... y resultó que eran venenosas!`,
            `¡**${tributo1[1].nombre}** se acercó demasiado a un nido de avispas 🐝 y murió por las picaduras!`,

            // Otros eventos
            `¡**${tributo1[1].nombre}** encontró un mapa 🗺️ que podría llevar a un tesoro escondido!`,
            `¡**${tributo1[1].nombre}** se encontró con un anciano ermitaño 🧙‍♂️ que le dio un consejo críptico!`,
            `¡**${tributo1[1].nombre}** escuchó un rugido aterrador en la distancia... ¿Qué será?`,
            `¡**${tributo1[1].nombre}** encontró un río 🏞️ lleno de peces 🐟!`,
        ];
        mensajeEvento = eventosPosibles[Math.floor(Math.random() * eventosPosibles.length)];
    } else if (resultado < 0.60 && tributo2) {
        // Refugio
        mensajeEvento = `¡**${tributo2[1].nombre}** encontró un refugio seguro 🌳 para pasar la noche!`; 
    } else if (resultado < 0.75 && tributo2) {
        // Batalla
        danio = Math.floor(Math.random() * 4) + 2;
        mensajeEvento = `¡**${tributo1[1].nombre}** y **${tributo2[1].nombre}** se enfrentaron en una dura batalla ⚔️ y ambos sufrieron ${danio / 2} ❤️ de daño!` + aplicarDanio(tributo1, danio) + aplicarDanio(tributo2, danio); 
    } else if (resultado < 0.85) {
        // Kit de primeros auxilios
        tributos[tributo1[0]].vida = Math.min(tributos[tributo1[0]].vida + 4, 20);
        mensajeEvento = `¡**${tributo1[1].nombre}** encontró un kit de primeros auxilios ⛑️! Se ha curado 2 ❤️.`; 
    } else {
        // Ataque de avispas
        danio = Math.floor(Math.random() * 6) + 3;
        mensajeEvento = `¡${tributo2 ? `**${tributo2[1].nombre}**` : "un oso"} fue atacado por un enjambre de avispas 🐝 y sufrió ${danio / 2} ❤️ de daño!` + (tributo2 ? aplicarDanio(tributo2, danio) : ""); 
    }

    const embedEvento = new EmbedBuilder()
        .setColor("Red")
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