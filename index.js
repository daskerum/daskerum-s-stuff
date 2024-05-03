// index.js
import express from 'express';
import fs from 'fs';
import ws from 'ws';
import expressWs from 'express-ws';
import { job } from './keep_alive.js';
import { OpenAIOperations } from './openai_operations.js';
import { TwitchBot } from './twitch_bot.js';

// Environment and default values setup
let GPT_MODE = process.env.GPT_MODE || "CHAT";
let HISTORY_LENGTH = parseInt(process.env.HISTORY_LENGTH || "5");
let OPENAI_API_KEY = process.env.OPENAI_API_KEY;
let MODEL_NAME = process.env.MODEL_NAME || "gpt-3.5-turbo";
let TWITCH_USER = process.env.TWITCH_USER || "oSetinhasBot";
let TWITCH_AUTH = process.env.TWITCH_AUTH || "oauth:vgvx55j6qzz1lkt3cwggxki1lv53c2";
let COMMAND_NAME = (process.env.COMMAND_NAME || "!gpt").split(",").map(x => x.trim().toLowerCase());
let CHANNELS = (process.env.CHANNELS || "oSetinhas,jones88").split(",").map(x => x.trim());
let SEND_USERNAME = process.env.SEND_USERNAME !== "false";
let ENABLE_TTS = process.env.ENABLE_TTS === "true";
let ENABLE_CHANNEL_POINTS = process.env.ENABLE_CHANNEL_POINTS === "true";
let BOT_PROMPT = process.env.BOT_PROMPT || "Korsan gibi davran, dini ve politik konulara girme, saygılı ol.";
let RANDOM_INT = parseInt(process.env.RANDOM_INT || "50");

const app = express();
const expressWsInstance = expressWs(app);
app.set('view engine', 'ejs');
app.use(express.json({ extended: true, limit: '1mb' }));
app.use('/public', express.static('public'));

const openai_ops = new OpenAIOperations(BOT_PROMPT, OPENAI_API_KEY, MODEL_NAME, HISTORY_LENGTH, RANDOM_INT);
const bot = new TwitchBot(TWITCH_USER, TWITCH_AUTH, CHANNELS, OPENAI_API_KEY, ENABLE_TTS);

job.start();
console.log('Environment Variables:', process.env);

bot.onConnected((addr, port) => {
    console.log(`* Connected to ${addr}:${port}`);
    CHANNELS.forEach(channel => console.log(`* Joining ${channel}`));
});

bot.onDisconnected(reason => console.log(`Disconnected: ${reason}`));

bot.connect(() => console.log("Bot connected!"), error => console.log("Bot couldn't connect:", error));

bot.onMessage(async (channel, user, message, self) => {
    if (self) return;  // Ignore messages from the bot itself

    const randomResponse = openai_ops.randomInteraction();
    if (randomResponse) bot.say(channel, randomResponse);

    if (ENABLE_CHANNEL_POINTS && user["msg-id"] === "highlighted-message") {
        const response = await openai_ops.make_openai_call(message);
        bot.say(channel, response);
    }

    if (message.toLowerCase().startsWith(COMMAND_NAME[0])) {
        let text = message.slice(COMMAND_NAME[0].length).trim();
        if (SEND_USERNAME) text = `Message from user ${user.username}: ${text}`;

        const response = await openai_ops.make_openai_call(text);
        response.match(new RegExp(`.{1,${399}}`, "g")).forEach((msg, index) => {
            setTimeout(() => bot.say(channel, msg), 1000 * index);
        });

        if (ENABLE_TTS) {
            try {
                const ttsAudioUrl = await bot.sayTTS(channel, response, user.userstate);
                notifyFileChange(ttsAudioUrl);
            } catch (error) {
                console.error('TTS error:', error);
            }
        }
    }
});

app.ws('/check-for-updates', (ws, req) => {
    ws.on('message', message => console.log("WebSocket message received:", message));
});

app.all('/', (req, res) => res.render('pages/index'));

const server = app.listen 3000, () => console.log('Server running on port 3000'));
const wss = expressWsInstance.getWss();

function notifyFileChange(url) {
    wss.clients.forEach(client => {
        if (client.readyState === ws.OPEN) client.send(JSON.stringify({ updated: true, url }));
    });
}
