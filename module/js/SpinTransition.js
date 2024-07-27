class SpinTransition {
	static _MODULE_ID = "spin-transition";
	static _SOCKET_ID = `module.${this._MODULE_ID}`;
	static _SETTINGS_KEY_DURATION = "duration";
	static _SETTINGS_KEY_STEPS = "steps";

	static _eleBoard = null;
	static _pendingSpinOut = null;

	/* -------------------------------------------- */

	static async init () {
		this._initSocket();
		this._initHooks();
		this._initConfig();
		this._initApi();

		this._eleBoard = document.getElementById("board");
	}

	static _initSocket () { game.socket.on(this._SOCKET_ID, evt => this._doSocketReceive(evt)); }

	static _initHooks () {
		Hooks.on("getSceneNavigationContext", ($html, options) => {
			const ixActivate = options.findIndex(it => it.name === "SCENES.Activate");

			const toAdd = {
				name: "Spin Transition",
				icon: `<i class="fas fa-fw fa-sync"></i>`,
				condition: li => game.user.isGM && !game.scenes.get(li.data("sceneId")).active,
				callback: async $li => {
					await this.doTransition({sceneId: $li.data("sceneId")});
				},
			};

			if (~ixActivate) options.splice(ixActivate + 1, 0, toAdd);
			else options.push(toAdd);

			return options;
		});

		Hooks.on("canvasReady", () => this._doAnimateSpinOut());
	}

	static _initConfig () {
		game.settings.register(
			this._MODULE_ID,
			SpinTransition._SETTINGS_KEY_DURATION,
			{
				name: "Transition duration (ms)",
				hint: "Duration of the spin transition, in milliseconds.",
				scope: "world",
				config: true,
				type: Number,
				default: 500,
				range: {
					min: 100,
					max: 5000,
					step: 100,
				},
			},
		);

		game.settings.register(
			this._MODULE_ID,
			SpinTransition._SETTINGS_KEY_STEPS,
			{
				name: "Animation steps",
				hint: "The number of spins done during the transition.",
				scope: "world",
				config: true,
				type: Number,
				default: 6,
				range: {
					min: 1,
					max: 30,
					step: 1,
				},
			},
		);
	}

	static _initApi () {
		game.modules.get(this._MODULE_ID).api = {
			transition ({sceneId, duration, steps}) {
				return SpinTransition.doTransition({sceneId, duration, steps});
			},
		};
	}

	/* -------------------------------------------- */

	static async doTransition ({sceneId, duration = null, steps = null}) {
		const gmUserId = game.user.isGM ? null : this._doTransition_getGmId();
		if (!game.user.isGM && !gmUserId) return ui.notifications.warn(`No active GM user!`);

		await this._doSocketSend(
			{
				type: "spin",
				duration: duration ?? game.settings.get(this._MODULE_ID, SpinTransition._SETTINGS_KEY_DURATION),
				steps: steps ?? game.settings.get(this._MODULE_ID, SpinTransition._SETTINGS_KEY_STEPS),
				sceneId,
			},
			{
				isRunOnSelf: true,
			},
		);
		const scene = game.scenes.get(sceneId);

		if (game.user.isGM) return scene.activate();

		await this._doSocketSend({
			type: "gm-activate-scene",
			userId: gmUserId,
			sceneId,
		});
	}

	static _doTransition_getGmId () {
		// Use the first active GM in the list
		const gmUserIds = game.users
			.filter(user => user.active && user.isGM)
			.map(user => user.id)
			.sort();
		return gmUserIds[0];
	}

	static async _doAnimateSpinIn ({duration, steps, sceneId}) {
		this._pendingSpinOut = {duration, steps};
		this._eleBoard.animate(this._getKeyframes({steps}), this._getAnimOptions({duration}));
		const isSameScene = sceneId === canvas.scene?.id;
		await this._doWaitForAnimation({duration});
		this._eleBoard.style.transform = "scale(0.0001)";
		if (isSameScene) await this._doAnimateSpinOut();
	}

	static async _doAnimateSpinOut () {
		if (!this._pendingSpinOut) return;
		const {duration, steps} = this._pendingSpinOut;
		this._pendingSpinOut = null;
		this._eleBoard.animate(this._getKeyframes({steps}).reverse(), this._getAnimOptions({duration}));
		await this._doWaitForAnimation({duration});
		this._eleBoard.style.transform = "";
	}

	static async _doSocketSend (evt, {isRunOnSelf = false} = {}) {
		await game.socket.emit(this._SOCKET_ID, evt);
		if (isRunOnSelf) await this._doSocketReceive(evt);
	}

	static async _doSocketReceive ({type, ...rest}) {
		switch (type) {
			case "spin": return this._doAnimateSpinIn({...rest});
			case "gm-activate-scene": return this._doGmActivateScene({...rest});
		}
	}

	static _getKeyframes ({steps}) {
		return [...new Array(steps + 1)].map((_, i) => ({
			transform: `rotate(${i * 360}deg) scale(${((steps - i) / steps).toFixed(3)})`,
			filter: `brightness(${((steps - i) / steps).toFixed(3)})`,
		}));
	}

	static _getAnimOptions ({duration}) { return {duration, iterations: 1}; }

	static async _doWaitForAnimation ({duration}) { await new Promise(resolve => setTimeout(() => resolve(), duration - 15)); }

	static _doGmActivateScene ({userId, sceneId}) {
		if (userId !== game.user.id) return;

		game.scenes.get(sceneId).activate().then(null);
	}
}

Hooks.on("ready", () => SpinTransition.init());
