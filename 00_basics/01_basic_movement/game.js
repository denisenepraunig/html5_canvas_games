/*globals document, $, setTimeout */

$(document).ready(function documentReady() {
	
	// ------------------------------------------------------ globals
	var canvas = $("#gameCanvas");
	var ctx = canvas[0].getContext("2d");
	
	var canvasWidth = canvas.width(); 
	var canvasHeight = canvas.height();

	var playAnimation = true;
	
	var startButton = $("#startButton");
	var stopButton = $("#stopButton");
	var resetButton = $("#resetButton");
	
	var playerWidth = 16;
	var playerHeigth = 16;
	var playerInitalX = canvasWidth / 2 - playerWidth / 2;
	var playerInitalY = canvasHeight / 2 - playerHeigth / 2;

	
	var playerDefaultColor = "#EFC9FF";
	var enemyDefaultColor = "#EFC9FF";
	
	var player;
	var enemies;
	
	// ----------------------------------------------------- game objects
	function GameObject(x, y, w, h) {
		
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}
	
	function Player(x, y, w, h, color) {
		
		GameObject.call(this, x, y, w, h);
		this.color = color || playerDefaultColor;
	}
	
	Player.prototype = Object.create(GameObject.prototype);
	Player.prototype.constructor = Player;
	
	function Enemy(x, y, w, h, color) {
		
		GameObject.call(this, x, y, w, h);
		this.color = color || enemyDefaultColor;
	}
	
	Enemy.prototype = Object.create(GameObject.prototype);
	Enemy.prototype.constructor = Enemy;
	
	// -------------------------------------------------- inital setup
	
	setup();
	
	// ------------------------------------------------ button handler
	function buttonStartClick() {
		
		$(this).hide();
		stopButton.show();
		
		playAnimation = true;
		animate();
	}
	
	function buttonStopClick() {
		
		$(this).hide();
		startButton.show();
		
		playAnimation = false;
	}
	
	function buttonResetClick() {
		
		resetPlayer();
		drawEnemies();
	}
	
	startButton.click(buttonStartClick);
	stopButton.click(buttonStopClick);
	resetButton.click(buttonResetClick);
	
	// ----------------------------------------------- animation loop
	function animate(ms) {
		
		ms = ms || 33;
		
		// update
		updateGameObjects();
		
		// clear
		clearCanvas();
		
		// draw
		drawGameObjects();
		
		if (playAnimation) {
			setTimeout(animate, ms);
		}
	}
	
	function clearCanvas() {
		
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	}
	
	function updateGameObjects() {
		
		updatePlayer();
	}
	
	function updatePlayer() {
		
		player.x++;
	}
	
	function drawGameObjects() {
		
		drawPlayer();
		drawEnemies();
	}
	
	function drawPlayer() {
		
		ctx.fillStyle = player.color;
		ctx.fillRect(player.x, player.y, player.w, player.h);
	}
	
	function drawEnemies() {
		
		for (var i = 0; i < enemies.length; i++) {
			drawEnemy(enemies[i]);	
		}
	}
	
	function drawEnemy(enemy) {
		
		ctx.strokeStyle = enemy.color;
		ctx.strokeRect(enemy.x, enemy.y, enemy.w, enemy.h);
	}
	
	function createPlayer() {
		
		return new Player(playerInitalX, playerInitalY, 
							playerWidth, playerHeigth);
	}
	
	function resetPlayer() {
		
		player.x = playerInitalX;
		player.y = playerInitalY;
		
		clearCanvas();
		drawPlayer();
	}
	
	function createEnemies(num) {
		
		num = num || 10;
		var pos;
		var size;
		var enemies = [];
		
		for (var i = 0; i < num; i++) {
			
			pos = randomPosition();
			size = randomSize(32);
			
			enemies.push(new Enemy(pos.x, pos.y, size.w, size.h));
		}
		
		return enemies;
	}
	
	function randomPosition(size) {
		
		size = size || 24;
		return {
			x: size + Math.floor(Math.random() * (canvasWidth - 2 * size)),
			y: size + Math.floor(Math.random() * (canvasHeight - 2 * size))
		};
	}
	
	function randomSize(w, h) {
		
		w = w || 24;
		h = h || w;
		
		return {
			w : Math.floor(Math.random() * w) + 5,
			h : Math.floor(Math.random() * h) + 5
		};
	}
	
	/**
	 * Generate a random integer between
	 * min (inklusive) and max (inklusive)
	 * @param   {Number} min minimum number (inklusive)
	 * @param   {Number} max maximum number (inklusive)
	 * @returns {Number} a number between min and max 
	 */
	function getRandomInt(min, max) {
		
		return Math.floor(Math.random() * (max - min + 1) + min);
	}
	
	function setup() {
		
		startButton.hide();
		
		player = createPlayer();
		enemies = createEnemies(10);
		
		animate();
	}
	

	
});
