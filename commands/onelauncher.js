module.exports = {
	name: "onelauncher",
	description: "Get a link to June Stepp's OneLauncher - An enhanced launcher for DDO & LOTRO.",
	cooldown: 1000,
	async run( interaction, client ) {
		interaction.reply( { content: 'Check out <@586647088268443697>\'s OneLauncher: <https://github.com/JuneStepp/OneLauncher>', ephemeral: interaction.inGuild() } );
	}
}
