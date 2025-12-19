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

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  console.log("HEARD:", message.content);

  if (message.content.toLowerCase().includes("hello")) {
    message.reply("I hear you. Loud and clear.");
  }
});

client.login(process.env.DISCORD_TOKEN);

