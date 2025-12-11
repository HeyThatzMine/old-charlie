export const data = {
  name: "play",
  description: "Play a specific track by name."
};

export async function execute(interaction, playlist, playSpecific, joinChannel) {
  const songName = interaction.options.getString("song");

  if (!songName) {
    return interaction.reply("You gotta tell me *what* to play, kid.");
  }

  joinChannel(interaction);
  setTimeout(() => playSpecific(interaction, songName), 500);
}
