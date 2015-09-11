/*globals document */

(function () {

	var canvas = document.getElementById("gameCanvas");
	var ctx = canvas.getContext("2d");
	ctx.fillStyle = "white";
	ctx.strokeStyle = "white";

	ctx.fillRect(100, 100, 24, 24);
	ctx.strokeRect(200, 200, 24, 24);

} ());