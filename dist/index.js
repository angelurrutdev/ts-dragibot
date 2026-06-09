"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const events_1 = require("./handlers/events");
const consts_1 = require("./consts");
const client = new discord_js_1.Client({
    intents: ['Guilds', 'GuildMessages', 'MessageContent', 'GuildMembers']
});
client.config = consts_1.CONFIG;
client.events = new discord_js_1.Collection();
client.commands = new discord_js_1.Collection();
(0, events_1.handleevents)(client);
client.on('ready', () => {
    client.user.setPresence({
        activities: [{
                name: 'Viendo a ShowAm1',
                type: discord_js_1.ActivityType.Streaming,
                url: 'https://www.twitch.tv/showam1'
            }],
        status: 'online',
    });
});
client.login(process.env.DISCORD_TOKEN);
