import { ChatInputCommandInteraction, EmbedBuilder, TextChannel } from "discord.js";

export interface Tributo {
    id: string;
    username: string;
    nombre?: string;
    vivo: boolean;
    vida: number;
    inventario: string[];
    avatar: string;
    refugio: boolean;
    alianza?: string;
    hambre: number; // Nivel de hambre (0-10)
    sed: number; // Nivel de sed (0-10)
}

interface Evento {
    probabilidad: number;
    ejecutar: (tributo1: [string, Tributo], tributo2?: [string, Tributo], esNoche?: boolean) => Promise<string>;
}

let esNoche = false;

export async function ejecutarEvento(
    tributo1: [string, Tributo],
    tributo2: [string, Tributo] | undefined,
    tributos: Record<string, Tributo>,
    interaction: ChatInputCommandInteraction
) {
    const eventos: Evento[] = [
        {   // --- Encontrar ---
            probabilidad: 0.07,
            ejecutar: async (tributo1) => {
                // Encontrar comida
                const comidas = ["manzana ", "bayas silvestres ", "pez", "pan duro", "Zanahoria 🥕", "insecto", "rata 🐀", "Piedra"];
                const comida = comidas[Math.floor(Math.random() * comidas.length)];
                tributos[tributo1[0]].vida += 2;
                tributos[tributo1[0]].hambre -= 3;
                if (tributos[tributo1[0]].hambre < 0) tributos[tributo1[0]].hambre = 0;
                return `¡**${tributo1[1].nombre}** encontró ${comida} y sacio su hambre`;
            }
        },
        {
            probabilidad: 0.07,
            ejecutar: async (tributo1) => {
                // Encontrar agua
                const aguas = ["charco de agua 💧", "río 🏞️", "botella de agua 🧴", "fruto jugoso 🍉", "Coca Coca de piña que probablemente sea pis"];
                const agua = aguas[Math.floor(Math.random() * aguas.length)];
                tributos[tributo1[0]].sed -= 4;

                if (tributos[tributo1[0]].sed < 0) tributos[tributo1[0]].sed = 0;
                return `¡**${tributo1[1].nombre}** encontró ${agua} y calmó su sed!`;
            }
        },
        {
            probabilidad: 0.06,
            ejecutar: async (tributo1) => {
                // Encontrar trampa
                const trampas = ["una trampa para osos 🐻", "Arena Movedizas", "una cuerda trampa"  ];
                const trampa = trampas[Math.floor(Math.random() * trampas.length)];
                const danio = Math.floor(Math.random() * 5) + 2;
                tributos[tributo1[0]].vida -= danio;
                let mensaje = `¡**${tributo1[1].nombre}** cayó en  ${trampa}! 🪤\n`;
                mensaje += `**${tributo1[1].nombre}** sufrió ${danio} ❤️ de daño!`;
                mensaje += aplicarDanio(tributo1, tributos);
                return mensaje;
            }
        },
        { // --- Robar/Atacar ---
            probabilidad: 0.07,
            ejecutar: async (tributo1, tributo2) => {
                // Pelea con armas
                if (!tributo2 || tributos[tributo1[0]].inventario.length === 0 || tributos[tributo2[0]].inventario.length === 0) {
                    return `¡**${tributo1[1].nombre}** y **${tributo2?.[1].nombre || "alguien"}** Se miran fijamente`;
                }
                const danio = Math.floor(Math.random() * 10) + 5;
                tributos[tributo1[0]].vida -= danio / 2;
                tributos[tributo2[0]].vida -= danio / 2;
                let mensaje = `¡**${tributo1[1].nombre}** y **${tributo2[1].nombre}** se enfrentaron en una batalla! ⚔️\n`
                    + `**${tributo1[1].nombre}** usó su ${tributos[tributo1[0]].inventario[0]} y **${tributo2[1].nombre}** usó su ${tributos[tributo2[0]].inventario[0]}!\n`
                    + `Ambos sufrieron ${danio / 2} ❤️ de daño!`;
                mensaje += aplicarDanio(tributo1, tributos);
                mensaje += aplicarDanio(tributo2!, tributos);
                return mensaje;
            }
        },
        {
            probabilidad: 0.07,
            ejecutar: async (tributo1, tributo2) => {
                // Ataque sorpresa
                if (!tributo2) {
                    return `¡**${tributo1[1].nombre}** Piensa a quien atacar por sorpresa, pero no ve a nadie cerca!`;
                }
                const danio = Math.floor(Math.random() * 6) + 3;
                tributos[tributo2[0]].vida -= danio;
                let mensaje = `¡**${tributo1[1].nombre}** atacó por sorpresa a **${tributo2[1].nombre}**! 💥\n`
                    + `**${tributo2[1].nombre}** sufrió ${danio} ❤️ de daño!`;
                mensaje += aplicarDanio(tributo2, tributos);
                return mensaje;
            }
        },
        { // --- Social ---
            probabilidad: 0.05,
            ejecutar: async (tributo1, tributo2, esNoche) => {
                // Formar una alianza (solo de día)
                if (esNoche || !tributo2) {
                    return `¡**${tributo1[1].nombre}** Piensa con quien podria hacer una alianza para esta noche`;
                }

                const nombreAlianza = `Alianza ${tributo1[1].nombre}-${tributo2[1].nombre}`;
                tributos[tributo1[0]].alianza = nombreAlianza;
                tributos[tributo2[0]].alianza = nombreAlianza;
                return `¡**${tributo1[1].nombre}** y **${tributo2[1].nombre}** decidieron formar una alianza!, son panas 🤝`;
            }
        },
        {
            probabilidad: 0.04,
            ejecutar: async (tributo1, tributo2, esNoche) => {
                // Traicionar a un aliado (solo de noche)
                if (!esNoche || !tributo2 || tributos[tributo1[0]].alianza !== tributos[tributo2[0]].alianza) {
                    return `¡**${tributo1[1].nombre}** Penso que era el momento de tracionar a alguien, pero no era el momento adecuado`;
                }
                const danio = Math.floor(Math.random() * 8) + 4;
                tributos[tributo2[0]].vida -= danio;
                let mensaje = `¡**${tributo1[1].nombre}** traicionó a **${tributo2[1].nombre}** y lo atacó por la espalda, como la buena rata que es! 🔪\n`
                    + `**${tributo2[1].nombre}** sufrió ${danio} ❤️ de daño!`;
                mensaje += aplicarDanio(tributo2, tributos);
                return mensaje;
            }
        },
        { // --- Fabricar/Curar ---
            probabilidad: 0.06,
            ejecutar: async (tributo1) => {
                // Encontrar un kit de primeros auxilios
                const curacion = Math.floor(Math.random() * 5) + 3;
                tributos[tributo1[0]].vida += curacion;
                return `¡**${tributo1[1].nombre}** encontró un kit de primeros auxilios y recuperó ${curacion} ❤️!`;
            }
        },
        {
            probabilidad: 0.06,
            ejecutar: async (tributo1) => {
                // Descansar y recuperar vida
                const curacion = Math.floor(Math.random() * 3) + 1;
                tributos[tributo1[0]].vida += curacion;
        
                // Array de posibles mensajes
                const mensajesDescanso = [
                    `¡**${tributo1[1].nombre}** descansó un rato y recuperó ${curacion} ❤️!`,
                    `¡**${tributo1[1].nombre}** tomó una siesta y recuperó ${curacion} ❤️!`,
                    `¡**${tributo1[1].nombre}** se relajó un momento y recuperó ${curacion} ❤️!`,
                    `¡**${tributo1[1].nombre}** se sento debajo de un arbol, debajo de un arbol de mango, sentado se puso a pensar: que cuanto me tengo que curar ${curacion} ❤️!`
                ];
        
                // Seleccionar un mensaje aleatorio
                const mensaje = mensajesDescanso[Math.floor(Math.random() * mensajesDescanso.length)];
        
                return mensaje;
            }
        },
        { // --- Refugio ---
            probabilidad: 0.06,
            ejecutar: async (tributo1) => {
                // Encontrar un refugio seguro
                if (tributos[tributo1[0]].refugio) {
                    return `¡**${tributo1[1].nombre}** ya tiene un refugio seguro!`;
                }
                tributos[tributo1[0]].refugio = true;
                return `¡**${tributo1[1].nombre}** encontró un refugio seguro para pasar la noche! 🏠`;
            }
        },
        { // --- Evento negativo (solo de noche y sin refugio) ---
            probabilidad: 0.15,
            ejecutar: async (tributo1, tributo2, esNoche) => {
                if (!esNoche || tributos[tributo1[0]].refugio) {
                    return "";
                }
                const eventosNegativos = [
                    () => {
                        const danio = Math.floor(Math.random() * 8) + 5;
                        tributos[tributo1[0]].vida -= danio;
                        let mensaje = `¡**${tributo1[1].nombre}** fue atacado por un tigre salvajes! 🐺\n`;
                        mensaje += `**${tributo1[1].nombre}** sufrió ${danio} ❤️ de daño!`;
                        mensaje += aplicarDanio(tributo1, tributos);
                        return mensaje;
                    },
                    () => {
                        tributos[tributo1[0]].vida = 1;
                        return `¡**${tributo1[1].nombre}** se enfermó gravemente! 🤒`;
                    },
                    () => {
                        tributos[tributo1[0]].inventario = [];
                        return `¡**${tributo1[1].nombre}** Grita como niñita y se esconde`;
                    },
                    () => {
                        const danio = Math.floor(Math.random() * 6) + 3;
                        tributos[tributo1[0]].vida -= danio;
                        let mensaje = `¡**${tributo1[1].nombre}** se lesionó mientras exploraba! 🤕\n`;
                        mensaje += `**${tributo1[1].nombre}** sufrió ${danio} ❤️ de daño!`;
                        mensaje += aplicarDanio(tributo1, tributos);
                        return mensaje;
                    },
                    () => {
                        tributos[tributo1[0]].inventario = [];
                        return `¡**${tributo1[1].nombre}** Se mea en los pantalones y se esconde`;
                    },
                ];
                const evento = eventosNegativos[Math.floor(Math.random() * eventosNegativos.length)];
                return evento();
            }
        },
        { // --- Encontrar armas ---
            probabilidad: 0.15,
            ejecutar: async (tributo1) => {
                const armas = ["cuchillo 🔪", "hacha 🪓", "arco y flechas 🏹", "lanza afilada", "piedra afilada 🪨", "rama", "rin de carro"];
                const arma = armas[Math.floor(Math.random() * armas.length)];
                tributos[tributo1[0]].inventario.push(arma);
                return `¡**${tributo1[1].nombre}** encontró un ${arma}!`;
            }
        },
        { // --- Fabricar armas ---
            probabilidad: 0.07,
            ejecutar: async (tributo1) => {
                if (tributos[tributo1[0]].inventario.includes("piedra afilada 🪨") && tributos[tributo1[0]].inventario.includes("rama gruesa 🌳")) {
                    // Eliminar los materiales del inventario
                    tributos[tributo1[0]].inventario = tributos[tributo1[0]].inventario.filter(item => item !== "piedra afilada 🪨" && item !== "rama gruesa 🌳");
                    tributos[tributo1[0]].inventario.push("lanza improvisada 🌿");
                    return `¡**${tributo1[1].nombre}** fabricó una lanza improvisada!`;
                } else {
                    return `¡**${tributo1[1].nombre}** Quiere fabricar un arma pero no sabe como`;
                }
            }
        }
    ];

    // Cambiar el ciclo día/noche cada 5 ejecuciones de ejecutarEvento
    if (Math.random() < 0.2) {
        esNoche = !esNoche;
        const mensajeDiaNoche = esNoche ? "## ¡Ha llegado la noche!" : "## ☀️ ¡Ha amanecido!";
        if (interaction.channel instanceof TextChannel) {
            await interaction.channel.send(mensajeDiaNoche);
        }
    }

    // Aumentar hambre y sed cada vez que se ejecuta un evento
    tributos[tributo1[0]].hambre++;
    tributos[tributo1[0]].sed++;
    if (tributos[tributo1[0]].hambre > 10) tributos[tributo1[0]].hambre = 10;
    if (tributos[tributo1[0]].sed > 10) tributos[tributo1[0]].sed = 10;

    let probabilidadAcumulada = 0;
    const random = Math.random();

    for (const evento of eventos) {
        probabilidadAcumulada += evento.probabilidad;
        if (random <= probabilidadAcumulada) {
            const mensajeEvento = await evento.ejecutar(tributo1, tributo2, esNoche);
            if (mensajeEvento) {
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
            break;
        }
    }
}

const aplicarDanio = (tributo: [string, Tributo], tributos: Record<string, Tributo>) => {
    if (tributos[tributo[0]].vida <= 0) {
        tributos[tributo[0]].vivo = false;
        return ` ¡**${tributo[1].nombre}** ha muerto!`;
    }
    return "";
};