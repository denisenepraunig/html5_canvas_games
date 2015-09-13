/*globals document, $, window, clearTimeout */

// requestAnimationFrame polyfill
(function() {
    var lastTime = 0,
        vendors = ['ms', 'moz', 'webkit', 'o'],
        x,
        length,
        currTime,
        timeToCall;

    for(x = 0, length = vendors.length; x < length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback) {
            currTime = new Date().getTime();
            timeToCall = Math.max(0, 16 - (currTime - lastTime));
            lastTime = currTime + timeToCall;
            return window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
        };
	}

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
	}
}());


/**
 * @typedef Size
 * @type Object
 * @property {Number} w - width
 * @property {Number} h - height
 */

/**
 * @typedef Speed
 * @type Object
 * @property {Number} vX - velocity X
 * @property {Number} vY - velocity Y
 */

/**
 * @typedef Postion
 * @type Object
 * @property {Number} x - x postion
 * @property {Number} y - y postion
 */

$(document).ready(function documentReady() {

	// ---------------------------------------------------------------- globals
	var canvas = $("#gameCanvas");
	var ctx = canvas[0].getContext("2d");

	/**
	 * @namespace - game object settings
	 * @property {Object} game
	 * @property {Number} game.w - width
	 * @property {Number} game.h - height
	 * @property {Number} game.centerX
	 * @property {Number} game.border - inner border
	 * @property {Boolean} game.play - play animation loop
	 */
	var game = {
		w: canvas.width(),
		h: canvas.height(),
		centerX: canvas.width() / 2,
		centerY: canvas.height() / 2,
		border: 4,
		play: true
	};

	var buttons = {
		start: $("#startButton"),
		stop: $("#stopButton"),
		restart: $("#restartButton")
	};

	var player, 
		enemies;
	
	var then = Date.now(),
		deltaFactor = 0;

	/**
	 * @namespace - default settings
	 * @property {Object} defaults
	 * 
	 * @property {Object} defaults.player 
	 * @property {Number} defaults.player.w - width
	 * @property {Number} defaults.player.h - height
	 * @property {String} defaults.player.color
	 * @property {Object} defaults.player.speed
	 * @property {Number} defaults.player.speed.min
	 * @property {Number} defaults.player.speed.max
	 * 
	 * @property {Object} defaults.enemy
	 * @property {String} defaults.enemy.color
	 * @property {Object} defaults.enemy.speed
	 * @property {Number} defaults.enemy.speed.min
	 * @property {Number} defaults.enemy.speed.max
	 * @property {Object} defaults.enemy.size
	 * @property {Number} defaults.enemy.size.min
	 * @property {Number} defaults.enemy.size.max
	 * @property {Number} defaults.enemy.size.factor
	 * 
	 * @property {Object} defaults.game.speed
	 * @property {Number} defaults.game.speed.min
	 * @property {Number} defaults.game.speed.max
	 */
	var defaults = {
		player: {
			w: 16,
			h: 16,
			color: "#EFC9FF",
			safetyZone: {
				w: 32,
				h: 32
			},
			speed: {
				min: 50,
				max: 100
			}
		},
		enemy: {
			color: "#EFC9FF",
			speed: {
				min: 25,
				max: 75
			},
			size: {
				min: 2,
				max: 8,
				factor: 4
			}
		},
		game: {
			speed: {
				min: 25,
				max: 75
			},
			enemies: 10
		}
	};

	// ----------------------------------------------------------- game objects

	/**
	 * GameObject
	 * 
	 * @class
	 * @this GameObject
	 * 
	 * @property {Number} this.x - x postion
	 * @property {Number} this.y - y postion
	 * @property {Number} this.vX - velocity X
	 * @property {Number} this.vY - velocity Y
	 * @property {String} this.color - color
	 * 
	 * @param {Number} x - x position
	 * @param {Number} y - y position
	 * @param {Number} w - width
	 * @param {Number} h - height
	 * @param {String} [color="FFFFFF"] - color
	 */
	function GameObject(x, y, w, h, color, speed) {

		speed = speed || getRandomSpeed();
		this.vX = speed.vX;
		this.vY = speed.vY;

		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;

		this.color = color || "#FFFFFF";
	}

	/**
	 * Player
	 * 
	 * @class
	 * @augments GameObject
	 * @inheritdoc
	 */
	function Player(x, y, w, h, color) {

		var minSpeed = defaults.player.speed.min,
			maxSpeed = defaults.player.speed.max;

		var speed = getRandomSpeed(minSpeed, maxSpeed);

		color = color || defaults.player.color;

		GameObject.call(this, x, y, w, h, color, speed);
	}

	Player.prototype = Object.create(GameObject.prototype);
	Player.prototype.constructor = Player;

	/**
	 * Enemy
	 * 
	 * @class
	 * @augments GameObject
	 * @inheritdoc
	 */
	function Enemy(x, y, w, h, color) {

		var minSpeed = defaults.enemy.speed.min,
			maxSpeed = defaults.enemy.speed.max;

		var speed = getRandomSpeed(minSpeed, maxSpeed);

		color = color || defaults.enemy.color;

		GameObject.call(this, x, y, w, h, color, speed);
	}

	Enemy.prototype = Object.create(GameObject.prototype);
	Enemy.prototype.constructor = Enemy;

	// ----------------------------------------------------------- inital setup

	setupGame();

	// -------------------------------------------------------- setup functions
	/**
	 * Setup the game
	 */
	function setupGame() {

		buttons.start.hide();

		player = createPlayer();
		enemies = createEnemies(10);

		animationLoop();
	}

	// --------------------------------------------------------- button handler
	/**
	 * Start Button click handler
	 */
	function onStart() {

		$(this).hide();
		buttons.stop.show();

		game.play = true;
		animationLoop();
	}

	/**
	 * Stop Button click handler
	 */
	function onStop() {

		$(this).hide();
		buttons.start.show();

		game.play = false;
	}

	/**
	 * Restart Button click handler
	 */
	function onRestart() {

		resetEnemies();
		resetPlayer();

		clearCanvas();

		drawPlayer();
		drawPlayerInfo();
		drawEnemies();
	}

	buttons.start.click(onStart);
	buttons.stop.click(onStop);
	buttons.restart.click(onRestart);

	// --------------------------------------------------------- animation loop
	/**
	 * The main animation frame is retriggered
	 * with requestAnimationFrame
	 */
	function animationLoop() {

		var now = Date.now(),
			delta = now - then;

		deltaFactor = delta / 1000;
		then = now;

		if (game.play) {
			// update
			updateGameObjects();

			// clear
			clearCanvas();

			// draw
			drawGameObjects();
			window.requestAnimationFrame(animationLoop);
		}

	}

	// ------------------------------------------------------- update functions

	/**
	 * Update the game objects
	 */
	function updateGameObjects() {

		updatePlayer();
		updateEnmies();
	}

	/**
	 * Border checking between an postion object (obj)
	 * and the borders of the game.
	 * When a border is crossed, the object
	 * will appear on the opposite border.
	 * @param {Postion} obj - the postion object to be modifed
	 */
	function checkBordersMoveThrough(obj) {

		// right
		if (obj.x > game.w && obj.vX > 0) {
			obj.x = 0 - obj.w;
		}

		// left
		if (obj.x < (0 - obj.w) && obj.vX < 0) {
			obj.x = game.w;
		}

		// bottom
		if (obj.y > game.h && obj.vY > 0) {
			obj.y = 0 - obj.h;
		}

		// top
		if (obj.y < (0 - obj.h) && obj.vY < 0) {
			obj.y = game.h;
		}
	}

	/**
	 * Update the position of the enmies
	 */
	function updateEnmies() {

		enemies.forEach(function (enemy) {

			enemy.x += enemy.vX * deltaFactor;
			enemy.y += enemy.vY * deltaFactor;

			checkBordersMoveThrough(enemy);
		});
	}

	/**
	 * Update the position of the player
	 */
	function updatePlayer() {

		player.x += player.vX * deltaFactor;
		player.y += player.vY * deltaFactor;

		checkBordersMoveThrough(player);
	}

	// -------------------------------------------------------- clear functions
	/**
	 * Clears the canvas
	 */
	function clearCanvas() {

		ctx.clearRect(0, 0, game.w, game.h);
	}

	// --------------------------------------------------------- draw functions
	/**
	 * Draw all the game objects
	 */
	function drawGameObjects() {

		drawPlayer();
		drawPlayerInfo();
		drawEnemies();
	}

	/**
	 * Draw the player
	 */
	function drawPlayer() {

		ctx.fillStyle = player.color;
		ctx.fillRect(player.x, player.y, player.w, player.h);
	}

	/**
	 * Draw information about the player
	 */
	function drawPlayerInfo() {

		document.getElementById("vX").innerHTML = "vX: " + player.vX;
		document.getElementById("vY").innerHTML = "vY: " + player.vY;
	}

	/**
	 * Draw all the enemies
	 */
	function drawEnemies() {

		for (var i = 0; i < enemies.length; i++) {
			drawEnemy(enemies[i]);
		}
	}

	/**
	 * Draw a certain enemy
	 * @param {Enemy} enemy - the enemy to be drawn
	 */
	function drawEnemy(enemy) {

		ctx.strokeStyle = enemy.color;
		ctx.strokeRect(enemy.x, enemy.y, enemy.w, enemy.h);
	}

	// ------------------------------------------------------- create functions
	/**
	 * Creates a new player object
	 * @returns {Player} a new player object
	 */
	function createPlayer() {

		var playerSize = {
			w: defaults.player.w,
			h: defaults.player.h
		};

		var pos = centerObject(playerSize);

		return new Player(pos.x, pos.y, playerSize.w, playerSize.h);
	}

	/**
	 * Creates a certain amount (num) of new enemies
	 * @param   {Number} [num=defaults.game.enemies] - number of enemies
	 * @returns {Array.<Enemy>} an array of enemies
	 */
	function createEnemies(num) {

		num = num || defaults.game.enemies;

		var pos = {},
			size = {},
			enemies = [];

		for (var i = 0; i < num; i++) {

			size = getRandomEnemySize();
			pos = getRandomSafetyPostion(size);

			enemies.push(new Enemy(pos.x, pos.y, size.w, size.h));
		}

		return enemies;
	}

	// -------------------------------------------------------- reset functions
	/**
	 * Resets the player and its values
	 */
	function resetPlayer() {

		var minSpeed = defaults.player.speed.min,
			maxSpeed = defaults.player.speed.max;

		var pos = centerObject(player),
			speed = getRandomSpeed(minSpeed, maxSpeed);

		player.x = pos.x;
		player.y = pos.y;

		player.vX = speed.vX;
		player.vY = speed.vY;

	}

	/**
	 * Resets the enemies array and generates
	 * new values for each enemy
	 */
	function resetEnemies() {

		var pos = {},
			size = {},
			speed = {};

		var minSpeed = defaults.enemy.speed.min,
			maxSpeed = defaults.enemy.speed.max;

		enemies.forEach(function (enemy) {

			size = getRandomEnemySize();
			enemy.w = size.w;
			enemy.h = size.h;

			pos = getRandomSafetyPostion(size);
			enemy.x = pos.x;
			enemy.y = pos.y;

			speed = getRandomSpeed(minSpeed, maxSpeed);
			enemy.vX = speed.vX;
			enemy.vY = speed.vY;
		});
	}

	// --------------------------------------------------------- util functions

	/**
	 * Calculate the x and y postion
	 * for a certain object in the
	 * center of the game
	 * @param   {Size} obj - a size object
	 * @returns {Postion}    a position
	 */
	function centerObject(obj) {

		return {
			x: game.w / 2 - obj.w / 2,
			y: game.h / 2 - obj.h / 2
		};
	}

	/**
	 * Creates a random size object for enemies
	 * @param   {Number} [w=defaults.enemy.size.min]         - width
	 * @param   {Number} [h=defaults.enemy.size.max]         - height
	 * @param   {Number} [factor=defaults.enemy.size.factor] - factor
	 * @returns {Size}   a size object
	 */
	function getRandomEnemySize(w, h, factor) {

		w = w || defaults.enemy.size.min;
		h = h || defaults.enemy.size.max;
		factor = factor || defaults.enemy.size.factor;

		return {
			w: getRandomInt(w, h) * factor,
			h: getRandomInt(w, h) * factor
		};
	}

	/**
	 * Creates a random speed oject
	 * @param   {Number} [minSpeed=defaults.game.speed.min] - minimum speed
	 * @param   {Number} [maxSpeed=defaults.game.speed.max] - maximum speed
	 * @returns {Speed}  a speed object
	 */
	function getRandomSpeed(minSpeed, maxSpeed) {

		minSpeed = minSpeed || defaults.game.speed.min;
		maxSpeed = maxSpeed || defaults.game.speed.max;

		return {
			vX: getRandomSign(getRandomFloat(minSpeed, maxSpeed)),
			vY: getRandomSign(getRandomFloat(minSpeed, maxSpeed))
		};
	}

	/**
	 * Create a random positon which is
	 * placed in a certain distance from
	 * the player (the x and y postion
	 * will never be in the same postion
	 * as the player).
	 * @param   {Size}    size - a size object
	 * @returns {Postion} a position object
	 */
	function getRandomSafetyPostion(size) {

		var minX, maxX, minY, maxY;

		var safetyZone = {
			w: defaults.player.safetyZone.w,
			h: defaults.player.safetyZone.h
		};

		if (Math.random() > 0.5) {
			// left
			minX = game.border;
			maxX = game.centerX - safetyZone.w - size.w;
		} else {
			// right
			minX = game.centerX + safetyZone.w;
			maxX = game.w - game.border - size.w;
		}

		if (Math.random() > 0.5) {
			// top
			minY = game.border;
			maxY = game.centerY - safetyZone.h - size.h;
		} else {
			// bottom
			minY = game.centerY + safetyZone.h;
			maxY = game.h - game.border - size.h;
		}

		return {
			x: getRandomInt(minX, maxX),
			y: getRandomInt(minY, maxY)
		};
	}

	/**
	 * Generate a random integer between
	 * min (inclusive) and max (inclusive)
	 * @param   {Number} min - minimum number (inclusive)
	 * @param   {Number} max - maximum number (inclusive)
	 * @returns {Number} a number between min and max
	 */
	function getRandomInt(min, max) {

		return Math.floor(getRandomFloat(min, max));
	}

	/**
	 * Generate a random float between
	 * min (inclusive) and max (inclusive)
	 * @param   {Number} min - minimum number (inclusive)
	 * @param   {Number} max - maximum number (inclusive)
	 * @returns {Number} a float number between min and max
	 */
	function getRandomFloat(min, max) {

		return Math.random() * (max - min) + min;
	}

	/**
	 * Generate a random sign for a number
	 * @param   {Number} num - the number
	 * @returns {Number} number with random sign
	 */
	function getRandomSign(num) {

		if (Math.random() > 0.5) {
			return num;
		} else {
			return -num;
		}
	}
});