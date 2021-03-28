import Phaser from 'phaser'

import SwordAttackScene from './scenes/SwordAttackScene'

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	width: 400,
	height: 300,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 0 },
			debug: true
		}
	},
	scene: [SwordAttackScene],
	scale: {
		zoom: 1.5
	}
}

export default new Phaser.Game(config)
