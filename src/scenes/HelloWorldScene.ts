import Phaser from 'phaser'
import StateMachine from '../statemachine/StateMachine'

export default class HelloWorldScene extends Phaser.Scene
{
	private knight!: Phaser.Physics.Arcade.Sprite
	private knightStateMachine!: StateMachine

	private box!: Phaser.GameObjects.Rectangle
	private boxStateMachine!: StateMachine

	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

	private swordHitBox!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody
	private hpText!: Phaser.GameObjects.Text
	private boxHp = 100

	constructor()
	{
		super('hello-world')
	}

	init()
	{
		this.cursors = this.input.keyboard.createCursorKeys()
	}

	preload()
    {
        this.load.atlas('knight', 'knight.png', 'knight.json')
    }

    create()
    {
		const { width, height } = this.scale
        this.knight = this.physics.add.sprite(width * 0.5, height * 0.5, 'knight', 'Idle (1).png')
		this.knight.setBodySize(this.knight.width * 0.4, this.knight.height * 0.85)
		this.knight.setCollideWorldBounds(true)

		this.createAnimations()

		this.knightStateMachine = new StateMachine(this, 'knight')
			.addState('idle', {
				onEnter: this.knightIdleEnter,
				onUpdate: this.knightIdleUpdate
			})
			.addState('run', {
				onEnter: this.knightOnEnter,
				onUpdate: this.knightRunUpdate
			})
			.addState('attack', {
				onEnter: this.knightAttackEnter,
				onUpdate: this.knightAttackUpdate
			})

		this.knightStateMachine.setState('idle')

		this.box = this.add.rectangle(width * 0.75, height * 0.5, 64, 128, 0xffffff)
		this.physics.add.existing(this.box, true)

		this.boxStateMachine = new StateMachine(this, 'box')
			.addState('idle', {
				onEnter: this.boxIdleEnter
			})
			.addState('damage', {
				onEnter: this.boxDamageEnter
			})

		this.boxStateMachine.setState('idle')

		this.hpText = this.add.text(this.box.x, this.box.y - 90, `HP: ${this.boxHp}`)
			.setOrigin(0.5)

		this.swordHitBox = this.add.rectangle(0, 0, 32, 64, 0xff0000, 0.5) as unknown as Phaser.Types.Physics.Arcade.ImageWithDynamicBody
		this.physics.add.existing(this.swordHitBox)
		this.swordHitBox.body.enable = false
		this.swordHitBox.visible = false
		this.physics.world.remove(this.swordHitBox.body)

		this.physics.add.collider(this.knight, this.box)
		this.physics.add.overlap(this.swordHitBox, this.box, this.handleCollide, undefined, this)
    }

	update(t: number, dt: number)
	{
		this.knightStateMachine.update(dt)
	}

	private handleCollide(hitBox: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject)
	{
		this.boxStateMachine.setState('damage')
	}

	private boxIdleEnter()
	{
		this.box.fillColor = 0xffffff
	}

	private boxDamageEnter()
	{
		this.box.fillColor = 0xff0000

		this.boxHp -= 10
		this.hpText.text = `HP: ${this.boxHp}`

		this.time.delayedCall(500, () => {
			this.boxStateMachine.setState('idle')
		})
	}

	private knightIdleEnter()
	{
		this.knight.play('idle')
		this.knight.setVelocityX(0)
	}

	private knightIdleUpdate()
	{
		if (this.cursors.left.isDown || this.cursors.right.isDown)
		{
			this.knightStateMachine.setState('run')
		}
		else if (this.cursors.space.isDown)
		{
			this.knightStateMachine.setState('attack')
		}
	}

	private knightOnEnter()
	{
		this.knight.play('run')
	}

	private knightRunUpdate()
	{
		if (this.cursors.space.isDown)
		{
			this.knightStateMachine.setState('attack')
		}
		else if (this.cursors.left.isDown)
		{
			this.knight.setVelocityX(-300)
			this.knight.flipX = true
		}
		else if (this.cursors.right.isDown)
		{
			this.knight.flipX = false
			this.knight.setVelocityX(300)
		}
		else
		{
			this.knightStateMachine.setState('idle')
		}
	}

	private knightAttackEnter()
	{
		this.knight.play('attack')
		this.knight.setVelocityX(0)

		const startHit = (anim: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
			if (frame.index >= 5)
			{
				this.knight.off(Phaser.Animations.Events.ANIMATION_UPDATE, startHit)
				this.physics.world.add(this.swordHitBox.body)
				this.swordHitBox.body.enable = true
				this.swordHitBox.visible = true

				const offsetX = !this.knight.flipX
					? this.knight.width * 0.25
					: -(this.knight.width * 0.25)

				this.swordHitBox.x = this.knight.x + offsetX
				this.swordHitBox.y = this.knight.y + (this.knight.height * 0.2)
			}
		}

		this.knight.on(Phaser.Animations.Events.ANIMATION_UPDATE, startHit)

		this.knight.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + 'attack', () => {
			this.knightStateMachine.setState('idle')
			this.swordHitBox.body.enable = false
			this.swordHitBox.visible = false
			this.physics.world.remove(this.swordHitBox.body)
		})
	}

	private knightAttackUpdate()
	{

	}

	private createAnimations()
	{
		this.knight.anims.create({
			key: 'idle',
			frames: this.knight.anims.generateFrameNames(
				'knight',
				{
					start: 1,
					end: 10,
					prefix: 'Idle (',
					suffix: ').png'
				}
			),
			frameRate: 10,
			repeat: -1
		})

		this.knight.anims.create({
			key: 'run',
			frames: this.knight.anims.generateFrameNames(
				'knight',
				{
					start: 1,
					end: 10,
					prefix: 'Run (',
					suffix: ').png'
				}
			),
			frameRate: 20,
			repeat: -1
		})

		this.knight.anims.create({
			key: 'attack',
			frames: this.knight.anims.generateFrameNames(
				'knight',
				{
					start: 1,
					end: 10,
					prefix: 'Attack (',
					suffix: ').png'
				}
			),
			frameRate: 20
		})
	}
}
