import { Client, GatewayIntentBits, Partials } from "discord.js";

console.log("BOOT: index.js started");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.once("ready", () => {
  console.log(`READY AS ${client.user.tag}`);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  console.log("HEARD:", message.content);
  message.reply("I hear you.");
});

client.login(process.env.DISCORD_TOKEN);

