import { DMChannel, NewsChannel, TextChannel, ThreadChannel } from "discord.js";

interface Evento {
    descripcion: string;
    impacto?: (players: Set<string>, context: { channel: TextChannel | DMChannel | NewsChannel | ThreadChannel }) => void;
}

export const events_game: Evento[] = [
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

    { descripcion: "Unos venados intentan atacar.", impacto: (players, { channel }) => {
        const playersArray = Array.from(players);
        if(playersArray.length > 0){
            const luckyPlayer = playersArray[Math.floor(Math.random() * playersArray.length)];
            channel.send(`<@${luckyPlayer}> Fue atacado por un grupo de venados`);
        }
    } },

    { descripcion: "Un tributo encuentra un arma.", impacto: (players, { channel }) => {
        const playersArray = Array.from(players);
        if(playersArray.length > 0){
            const luckyPlayer = playersArray[Math.floor(Math.random() * playersArray.length)];
            channel.send(`<@${luckyPlayer}> encontro un arma!`);
        }
    }},
    { descripcion: "Se veria una densa niebla", impacto: (players, { channel }) => channel.send("La visibilidad se reduce drásticamente.") },
    { descripcion: "Malandros", impacto: (players, { channel }) => {
        const playersArray = Array.from(players);
        if (playersArray.length > 0) {
            const numVictims = Math.floor(Math.random() * Math.min(3, playersArray.length)) + 1; // Hasta 3 víctimas
            const victims: string[] = [];
            for (let i = 0; i < numVictims; i++) {
                let randomIndex = Math.floor(Math.random() * playersArray.length);
                while (victims.includes(playersArray[randomIndex])) {
                    randomIndex = Math.floor(Math.random() * playersArray.length);
                }
                victims.push(playersArray[randomIndex]);
            }
            channel.send(`${victims.map(v => `<@${v}>`).join(", ")} fueron picados por un enjambre de avispas!`);
        }
    }},
    { descripcion: "Se escucha un fuerte estruendo a lo lejos.", impacto: (players, { channel }) => channel.send("Algo grande acaba de suceder...") },
    { descripcion: "Un tributo cae en una trampa mortifera.", impacto: (players, { channel }) => {
        const playersArray = Array.from(players);
        if (playersArray.length > 0) {
            const victim = playersArray[Math.floor(Math.random() * playersArray.length)];
            channel.send(`<@${victim}> cayó en una trampa!`);
            players.delete(victim); // Eliminar al jugador de la lista
        }
    }},
    { descripcion: "Llueve torrencialmente.", impacto: (players, { channel }) => channel.send("Una fuerte lluvia inunda la arena.") },
    { descripcion: "Un incendio forestal se propaga rápidamente.", impacto: (players, { channel }) => {
        const playersArray = Array.from(players);
        if (playersArray.length > 0) {
            const numAffected = Math.floor(Math.random() * playersArray.length);
            const affectedPlayers = playersArray.slice(0, numAffected);
            if (affectedPlayers.length > 0) {
                channel.send(`${affectedPlayers.map(p => `<@${p}>`).join(", ")} fueron alcanzados por el fuego!`);
            } else {
                channel.send("El fuego no alcanzó a ningún tributo directamente.");
            }
        }
    }},
    { descripcion: "Un tributo encuentra un refugio seguro.", impacto: (players, { channel }) => {
        const playersArray = Array.from(players);
        if (playersArray.length > 0) {
            const luckyPlayer = playersArray[Math.floor(Math.random() * playersArray.length)];
            channel.send(`<@${luckyPlayer}> encontró un refugio seguro para pasar la noche.`);
        }
    }},
    { descripcion: "Un temblor sacude la tierra.", impacto: (players, { channel }) => channel.send("La tierra tiembla bajo los pies de los tributos.") },
    { descripcion: "Un tributo se alía con otro.", impacto: (players, { channel }) => {
        const playersArray = Array.from(players);
        if (playersArray.length > 1) {
            const player1 = playersArray[Math.floor(Math.random() * playersArray.length)];
            let player2Index = Math.floor(Math.random() * playersArray.length);
            while (playersArray[player2Index] === player1) {
                player2Index = Math.floor(Math.random() * playersArray.length);
            }
            const player2 = playersArray[player2Index];
            channel.send(`<@${player1}> y <@${player2}> forman una alianza!`);
        }
    }},
    { descripcion: "Un tributo traiciona a su aliado.", impacto: (players, { channel }) => {
        const playersArray = Array.from(players);
        if (playersArray.length > 1) {
            const player1 = playersArray[Math.floor(Math.random() * playersArray.length)];
            let player2Index = Math.floor(Math.random() * playersArray.length);
            while (playersArray[player2Index] === player1) {
                player2Index = Math.floor(Math.random() * playersArray.length);
            }
            const player2 = playersArray[player2Index];
            channel.send(`<@${player1}> traicionó a <@${player2}>!`);
        }
    }},
];