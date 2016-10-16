

// Requires: Degree values that are multiples of 90
// Effects: returns a pixel location right relative to its current orientation in degrees
function moveRight(pixel, deg)
{
	if (deg % 360) // absolute up right orientation 
		pixel.x + 1;
	else if (deg % 450 == 0 || deg % 450 == 90) // rotated 90deg cw
		pixel.y - 1;
	else if (deg % 540 || deg % 540 == 180) // rotated 180 deg cw
		pixel.x - 1;
	else // rotated 270deg cw
		pixel.y + 1; 
	return pixel;
}

function moveUp(pixel, deg)
{
	if (deg % 360) // absolute up right orientation 
		pixel.y + 1;
	else if (deg % 450 == 0 || deg % 450 == 90) // rotated 90deg cw
		pixel.x + 1;
	else if (deg % 540 || deg % 540 == 180) // rotated 180 deg cw
		pixel.y - 1;
	else // rotated 270deg cw
		pixel.x - 1; 
	return pixel;
}

function moveLeft(pixel, deg)
{
	if (deg % 360) // absolute up right orientation 
		pixel.x - 1;
	else if (deg % 450 == 0 || deg % 450 == 90) // rotated 90deg cw
		pixel.y + 1;
	else if (deg % 540 || deg % 540 == 180) // rotated 180 deg cw
		pixel.x + 1;
	else // rotated 270deg cw
		pixel.y - 1; 
	return pixel;
}


class Pixel 
{
	constructor(inX, inY, inImgData)
	{
		this.x = inX;
		this.y = inY;
		this.imgData = inImgData;
	}

	getHex()
	{
		var idx = (this.y * this.imgData.width + this.x) * 4;
		return rgbToHex(this.imgData[idx], this.imgData[idx+1], this.imgData[idx+2]);
	}

	// Thanks to TIm Down on stackoverflow
	componentToHex(c) 
	{
		var hex = c.toString(16);
		return hex.length == 1 ? "0" + hex : hex;
	}
	rgbToHex(r, g, b) 
	{
		return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
	}
}



// Effects: Finds the perimiter of each grid cell and defines the coordinates
function findAndDefine()
{
	// Alg: assumes left to right approach will be easiest, considering the polygon coords need to be stored starting at top left
	// 1. start at top left of polygon (cell)
	// 2. check an area that of the grid width (ie look in this box of pixes)
	// 3. move to nearest pixel 
	// store 

	// step 2 optimization: if following polygon with right turns, you only check the pixel area of down and to the right (relative)


	var c = document.getElementById("myCanvas");
	var ctx = c.getContext("2d");
	var img = document.getElementById("grid");
	ctx.drawImage(img, 0, 0);
	var imgData = ctx.getImageData(0, 0, c.width, c.height);
	var startPixel = Pixel(1, 1, imgData); //start pixel is top left of cell, where UpPixelCheck == true
	var pixel = startPixel;
	var criteria = "#00ff00"; //rgb values are not equal (ie are a color not black-white);
	var cellCoords = [];
	var movedUp = false;
	var curDeg = 0;

	do
	{
		var rightPixelCheck = moveRight(pixel);
		var upPixelCheck = moveUp(pixel);
		var leftPixelCheck = moveLeft(pixel);
		var color_rightPixelCheck = rightPixelCheck.getHex();
		var color_upPixelCheck = upPixelCheck.getHex();
		var color_leftPixelCheck = leftPixelCheck.getHex();

		// Move right 1 pixel
		if (color_rightPixelCheck != criteria && color_upPixelCheck == criteria)
		{
			pixel = moveRight(pixel, curDeg);
			if (movedUp == true) // store pixel after going up then right
			{
				cellCoords.push(pixel.x);
				cellCoords.push(pixel.y);
				movedUp = false; // reset
			}
			continue;
		}

		// Move up 1 pixel
		if (color_upPixelCheck != criteria)
		{
			pixel = moveUp(pixel, curDeg);
			movedUp = true;
			continue;
		}

		// Hit corner, rotate
		if (color_upPixelCheck == criteria  && color_rightPixelCheck == criteria)
		{	
			curDeg += 90; //rotate 90deg cw
			cellCoords.push(pixel.x);
			cellCoords.push(pixel.y);
			continue;
		}

		// Starting to move off curve, curve changed, rotate
		if (color_upPixelCheck != critera && color_leftPixelCheck != criteria)
		{	
			curDeg -= 90; // rotate 90deg ccw
			continue;
		}
	}
	while (pixel != startPixel);
	alert(0);
	var c2 = document.getElementById('results').getContext('2d');
	c2.fillStyle = '#f00';
	c2.beginPath();
	c2.moveTo(startPixel.x, startPixel.y);
	for (var i = 0; i < cellsCoords.length - 1; ++i)
	{
		c2.lineTo(cellsCoords[i], cellCoords[i+1]);
	}
	c2.closePath();
	c2.fill();
}

findAndDefine();