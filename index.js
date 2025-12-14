import "dotenv/config";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } from "@discordjs/voice";
import { OpenAI } from "openai";
import { scanDriveForMP3s } from "./drivescanner.js";
import { charliepersonality } from "./charliepersonality.js";
import fs from "fs";
import path from "path";

const config = JSON.parse(
  fs.readFileSync(path.resolve("config.json"), "utf8")
 );


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY 
});  

 
// Discord client setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// Music player state
let playlist = [];
let currentTrackIndex = null;
let audioPlayer = createAudioPlayer({
  behaviors: {
    noSubscriber: NoSubscriberBehavior.Stop
  }
});
let voiceConnection = null;

// Pick random Charlie sass
const randomLine = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Load playlist on startup
async function loadPlaylist() {
  playlist = await scanDriveForMP3s();
  if (playlist.length) {
    console.log("🎸 Old Charlie: Playlist loaded.");
  } else {
    console.log("⚠️ Old Charlie found no tracks.");
  }
}

// TEXT PARSER — Decide if a user is talking to Charlie
function shouldCharlieRespond(message) {
  const lower = message.content.toLowerCase();
  return (
    lower.startsWith("charlie") ||
    lower.startsWith("old charlie") ||
    lower.includes("charlie,") ||
    lower.includes("old charlie,")
  );
}

// NATURAL LANGUAGE INTERPRETER
async function interpretMessage(message) {
  try {
    const response = await openai.chat.completions.create({
      model: config.modelMini, 
      messages: [
        {
          role: "system",
          content: `
You are Old Charlie, a grumpy ghost roadie + burnt-out studio engineer.
Your job is to interpret what the user wants:
- If they want music, output: "ACTION:play <song>"
- If they want random: "ACTION:random"
- If they want skip: "ACTION:skip"
- If they want stop: "ACTION:stop"
- If they want join: "ACTION:join"
- If they want leave: "ACTION:leave"
- If they ask a question, output: "ACTION:talk <text>"
Respond ONLY with ACTION format.`
        },
        { role: "user", content: message.content }
      ]
    });

    return response.choices[0].message.content.trim();

  } catch (err) {
    console.error("AI ERROR:", err.message);
    return "ACTION:talk I'm having trouble thinking right now… ghost brain fog.";
  }
}

// JOIN VOICE CHANNEL
function joinChannel(message) {
  if (!message.member?.voice?.channel) {
    message.reply("You ain't even in a voice channel, kid.");
    return;
  }

  voiceConnection = joinVoiceChannel({
    channelId: message.member.voice.channel.id,
    guildId: message.guild.id,
    adapterCreator: message.guild.voiceAdapterCreator
  });

  message.reply(randomLine(charliepersonality.joiningVoice));
}

// PLAY A SPECIFIC TRACK
function playSpecific(message, songName) {
  if (!playlist.length) return message.reply("I ain't got no tracks, partner.");

  const match = playlist.find(t =>
    t.title.toLowerCase().includes(songName.toLowerCase())
  );

  if (!match) {
    return message.reply("I don't see that one… maybe spell it right?");
  }

  currentTrackIndex = playlist.indexOf(match);

  const resource = createAudioResource(match.url);
  audioPlayer.play(resource);

  if (voiceConnection) voiceConnection.subscribe(audioPlayer);

  message.reply(`${randomLine(charliepersonality.playingSpecific)} **${match.title}**`);
}

// PLAY RANDOM TRACK
function playRandom(message) {
  if (!playlist.length) return message.reply("No tracks found… add some MP3s first.");

  currentTrackIndex = Math.floor(Math.random() * playlist.length);

  const track = playlist[currentTrackIndex];
  const resource = createAudioResource(track.url);
  audioPlayer.play(resource);

  if (voiceConnection) voiceConnection.subscribe(audioPlayer);

  message.reply(`${randomLine(charliepersonality.randomPlay)} **${track.title}**`);
}

// SKIP
function skipTrack(message) {
  audioPlayer.stop();
  message.reply(randomLine(charliepersonality.skipping));
}

// STOP
function stopMusic(message) {
  audioPlayer.stop();
  message.reply(randomLine(charliepersonality.stopping));
}

// LEAVE
function leaveChannel(message) {
  if (voiceConnection) {
    voiceConnection.destroy();
    voiceConnection = null;
    message.reply(randomLine(charliepersonality.leavingVoice));
  }
}

// MAIN MESSAGE HANDLER
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (!shouldCharlieRespond(message)) return;

  // Natural language interpretation
  const output = await interpretMessage(message);

  if (output.startsWith("ACTION:play")) {
    const song = output.replace("ACTION:play", "").trim();
    joinChannel(message);
    setTimeout(() => playSpecific(message, song), 500);

    client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});
client.login(process.env.DISCORD_BOT_TOKEN);
  }  
 });
