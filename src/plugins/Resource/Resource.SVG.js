"use strict";

Resource.SVG = Resource.Texture.extend
({
	/**
	 * Fill texture with color.
	 * @param params {Object} Parameters.
	 * @param [params.x=0] {Number=} Offset from the left.
	 * @param [params.y=0] {Number=} Offset from the top.
	 * @param [params.width=this.width] {Number=} Width of rect to fill. By default will use current texture width.
	 * @param [params.height=this.height] {Number=} Height of rect to fill. By default will use current texture height.
	 * @param [params.color=#000000] {Hex=} Color of the filled rect.
	 * @param [params.drawOver=false] {Boolean=} Flag - draw over previous texture content.
	 * @param height {Number=} Height of the rect.
	 * @param color {String=} Color of the rect.
	 * @function
	 */
	fillRect: function(x, y, width, height) {
		this.ctx.fillRect(x, y, width, height);
		this.loaded = true;
	},


	/**
	 * Tile source texture on top.
	 * @param params {Object} Parameters.
	 * @param params.texture {Resource.Texture|String} Texture object or name of the texture in resources pool.
	 * @param params.x {Number=} Offset on x axis.
	 * @param params.y {Number=} Offset on y axis.
	 * @param params.width {Number=} Width of area to tile.
	 * @param params.height {Number=} Height of area to tile.
	 */
	tile: function(params, height, texture)
	{
		if(typeof(params) === "number") {
			this.tile({ width: params, height: height, texture: texture });
			return;
		}

		if(!params) {
			console.warn("[Resource.Texture.tile]:", "No parameters specified.");
			return;
		}

		if(typeof(params.texture) === "string") {
			params.texture = Resource.ctrl.getTexture(params.texture);
		}

		if(!params.texture) {
			console.warn("[Resource.Texture.tile]:", "Undefined texture.");
			return;
		}

		var texture = params.texture;

		if(texture.textureType === Resource.TextureType.WEBGL) 
		{
			if(texture._canvasCache) {
				texture = texture._canvasCache;
			}
			else
			{
				texture._canvasCache = new Resource.Texture(Resource.TextureType.CANVAS, texture.path);
				texture._canvasCache.load();
				texture = texture._canvasCache;

				this._loadCache = { name: "tile", data: params };
				this.isLoaded = false;
				texture.subscribe(this, this.onTextureCacheEvent);
				return;	
			}		
		}

		// If source texture is not yet loaded. Create chace and wait for it.
		if(!texture._isLoaded) 
		{
			if(!texture._isLoading) {
				texture.load();
			}

			this._loadCache = { name: "tile", data: params };
			this.isLoaded = false;
			texture.subscribe(this, this.onTextureCacheEvent);
			return;
		}

		var scope = meta;
		params.x = params.x || 0;
		params.y = params.y || 0;
		params.width = params.width || texture.fullWidth;
		params.height = params.height || texture.fullHeight;
		params.width *= scope.unitSize;
		params.height *= scope.unitSize;

		this.resize(params.width, params.height);

		if(params.center) {
			params.x += (this.trueFullWidth & (texture.trueFullWidth - 1)) / 2;
			params.y += (this.trueFullHeight & (texture.trueFullHeight - 1)) / 2;		
		}

		var ctx = this.ctx;
		if(this.textureType) {
			this._createCachedImg();
			ctx = this._cachedCtx;
		}

		var posX = params.x;
		var posY = params.y;
		var numX = Math.ceil(this.trueFullWidth / texture.trueFullWidth) || 1;
		var numY = Math.ceil(this.trueFullHeight/ texture.trueFullHeight) || 1;


		if(posX > 0) {
			numX += Math.ceil(posX / texture.trueFullWidth);
			posX -= texture.trueFullWidth;
		}
		if(posY > 0) {
			numY += Math.ceil(posY / texture.trueFullHeight);
			posY -= texture.trueFullHeight;
		}

		var origY = posY;

		for(var x = 0; x < numX; x++)
		{
			for(var y = 0; y < numY; y++) {
				ctx.drawImage(texture.image, posX, posY);
				posY += texture.trueHeight;
			}

			posX += texture.trueWidth;
			posY = origY;
		}

		if(this.textureType) {
			var gl = scope.ctx;
			gl.bindTexture(gl.TEXTURE_2D, this.image);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
		}

		this.isLoaded = true;
	},

	/**
	 * Stroke/fill lines.
	 * @param params {Object} Parameters.
	 * @param params.buffer {Array} Array with line points.
	 * @param params.color {Hex} Fill color.
	 * @param [params.borderColor=#000000] {Hex=} Border color.
	 * @param params.borderWidth {Number} Thickness of border line.
	 * @param [params.lineCap="butt"] {String=} Type of line endings.
	 * @param params.lineDash {Array} Array with sequence for dashing.
	 * @param params.drawOver {Boolean} Flag - draw over previous texture content.
	 * @param params.addWidth {Number} Add to width.
	 * @param params.addHeight {Number} Add to height.	 
	 */
	stroke: function(params)
	{
		if(!params) {
			console.warn("[Resource.Texture.stroke]:", "No parameters specified.");
			return;
		}

		if(!params.buffer) {
			console.warn("[Resource.Texture.stroke]:", "No buffer defined.");
			return;
		}	

		var scope = meta;	
		var unitSize = scope.unitSize;

		// Calculate bounds.
		var minX = Number.POSITIVE_INFINITY, minY = minX, maxX = Number.NEGATIVE_INFINITY, maxY = maxX;

		var item, i, x, y;
		var buffer = params.buffer;
		var numItems = buffer.length;
		for(i = 0; i < numItems; i += 2)
		{
			x = buffer[i] * unitSize | 0; 
			y = buffer[i + 1] * unitSize | 0;

			if(x < minX) { minX = x; }
			if(y < minY) { minY = y; }
			if(x > maxX) { maxX = x; }
			if(y > maxY) { maxY = y; }

			buffer[i] = x;
			buffer[i + 1] = y;
		}

		if(minX > 0) { minX = 0; }
		if(minY > 0) { minY = 0; }

		var ctx = this.ctx;
		params.addWidth = params.addWidth || 0;
		params.addHeight = params.addHeight || 0;
		params.lineWidth = params.lineWidth || 1;
		if(!params.color && !params.fillColor) {
			params.color = "#000000";
		}

		var halfLineWidth = params.lineWidth / 2;
		var offsetX = -minX + halfLineWidth + (params.addWidth * 0.5);
		var offsetY = -minY + halfLineWidth + (params.addHeight * 0.5);
		this.resize((maxX - minX + params.lineWidth + params.addWidth), 
			maxY - minY + params.lineWidth);
		//this.resize(100, 100);

		if(this.textureType) {
			this._createCachedImg();
			ctx = this._cachedCtx;
		}

		ctx.lineWidth = params.lineWidth;
		if(params.lineCap) {
			ctx.lineCap = params.lineCap;
		}
		if(params.lineDash) {
			ctx.setLineDash(params.lineDash);
		}

		ctx.beginPath();
		ctx.moveTo(buffer[0] + offsetX, buffer[1] + offsetY);
		for(i = 2; i < numItems; i += 2) {
			ctx.lineTo(buffer[i] + offsetX, buffer[i + 1] + offsetY);
		}

		if(params.fillColor) {
			ctx.fillStyle = params.fillColor;
			ctx.closePath();
			ctx.fill();
		}

		if(params.color) {
			ctx.strokeStyle = params.color;
			ctx.stroke();
		}

		if(this.textureType === Resource.TextureType.WEBGL) {
			var gl = scope.ctx;
			gl.bindTexture(gl.TEXTURE_2D, this.image);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
		}

		this.isLoaded = true;
	},

	border: function(params)
	{
		if(!params) {
			console.warn("[Resource.Texture.strokeBorder]:", "No parameters specified.");
			return;
		}

		params.width = params.width || this.trueFullWidth;
		params.height = params.height || this.trueFullHeight;

		var lineWidth = 1;
		if(params.borderWidth) {
			lineWidth = params.borderWidth;
		}

		params.buffer = [ 0, 0, params.width - lineWidth, 0, params.width - lineWidth, 
			params.height - lineWidth, 0, params.height - lineWidth, 0, 0 ];

		this.stroke(params);
	},

	/**
	 * Fill texture with arc.
	 * @param params {Object} Parameters.
	 * @param [params.x=0] {Number=} Offset from the left.
	 * @param [params.y=0] {Number=} Offset from the top.
	 * @param params.color {Hex} Color of the filled arc.
	 * @param [params.borderColor="#000000"] {Hex=} Color of the filled rect.
	 * @param params.radius {Number=} Radius of arc.
	 * @param [params.startAngle=0] {Number=} Starting angle from where arch is being drawn from.
	 * @param [params.endAngle=Math.PI*2] {Number=} End angle to where arc form is drawn.
	 * @param [params.borderWidth=1] {Number=} Thickness of the line.
	 * @param [params.drawOver=false] {Boolean=} Flag - draw over previous texture content.
	 */
	arc: function(params)
	{
		if(!params) {
			console.warn("[Resource.Texture.arc]:", "No parameters specified.");
			return;
		}

		var ctx = this.ctx;
		params.x = params.x || 0;
		params.y = params.y || 0;
		params.radius = params.radius || 5;
		params.startAngle = params.startAngle || 0;
		params.endAngle = params.endAngle || (Math.PI * 2);
		params.borderWidth = params.borderWidth || 1;
		if(!params.color && !params.borderColor) {
			params.borderColor = params.borderColor || "#000000";
		}

		if(params.closePath === void(0)) {
			params.closePath = true;
		} else {
			params.closePath = params.closePath;
		}

		var size = params.radius * 2 + params.borderWidth;
		if(!params.drawOver) {
			this.resize(params.x + size + 1, params.y + size + 1);
		}

		if(this.textureType) {
			this._createCachedImg();
			ctx = this._cachedCtx;
		}

		ctx.lineWidth = params.borderWidth;
		
		ctx.clearRect(0, 0, this.trueFullWidth, this.trueFullHeight);
		
		if(params.closePath) 
		{
			ctx.beginPath();
			ctx.arc(
				params.x + params.radius + (params.borderWidth / 2) + 0.5, 
				params.y + params.radius + (params.borderWidth / 2) + 0.5,
				params.radius, params.startAngle, params.endAngle, false);
			ctx.closePath();
		}
		else
		{
			ctx.arc(params.x + params.radius + (params.borderWidth / 2), params.y + params.radius + (params.borderWidth / 2),
				params.radius, params.startAngle, params.endAngle, false);
		}		

		if(params.color) {
			ctx.fillStyle = params.color;
			ctx.fill();
		} 

		if(params.borderColor) {
			ctx.strokeStyle = params.borderColor;
			ctx.stroke();
		}		

		if(this.textureType === Resource.TextureType.WEBGL) {
			var gl = meta.ctx;
			gl.bindTexture(gl.TEXTURE_2D, this.image);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
		}

		this.isLoaded = true;
	},

	rect: function(params, height, color, borderWidth)
	{
		if(typeof(params) !== "object") 
		{
			this.rect({ 
				width: params, height: height,
				color: color,
				borderWidth: borderWidth
			});
			return;
		}
		if(!params) {
			console.warn("[Resource.Texture.rect]:", "No parameters specified.");
			return;
		}

		var ctx = this.ctx;
		var width = params.width || 1;
		var height = params.height || 1;
		params.color = params.color || "#0000000";
		var borderWidth = params.borderWidth || 1;

		if(!params.drawOver) {
			this.resize(width, height);
		}		

		if(this.textureType) {
			this._createCachedImg();
			ctx = this._cachedCtx;
		}

		ctx.strokeStyle = params.color;
		ctx.lineWidth = borderWidth;

		var halfWidth = Math.ceil(borderWidth / 2);

		if(borderWidth % 2 === 1)
		{
			ctx.save();
			ctx.translate(0.5, 0.5);
			ctx.beginPath();
			ctx.moveTo(halfWidth, halfWidth);
			ctx.lineTo(width - halfWidth - 1, halfWidth);
			ctx.lineTo(width - halfWidth - 1, height - halfWidth - 1);
			ctx.lineTo(halfWidth, height - halfWidth - 1);
			ctx.closePath();
			ctx.stroke();
			ctx.restore();
		}
		else 
		{
			ctx.beginPath();
			ctx.moveTo(halfWidth, halfWidth);
			ctx.lineTo(width - halfWidth, halfWidth);
			ctx.lineTo(width - halfWidth, height - halfWidth);
			ctx.lineTo(halfWidth, height - halfWidth);
			ctx.closePath();
			ctx.stroke();	
		}

		if(params.fillColor) {
			ctx.fillStyle = params.fillColor;
			ctx.fill();
		}

		if(this.textureType === Resource.TextureType.WEBGL) {
			var gl = meta.ctx;
			gl.bindTexture(gl.TEXTURE_2D, this.image);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
		}

		this.isLoaded = true;
	},

	/**
	 * Draw a rounded rectangle. 
	 */
	roundRect: function(params, height, radius, color, borderWidth)
	{
		if(typeof(params) !== "object") 
		{
			this.roundRect({ 
				width: params, height: height,
				radius: radius,
				color: color,
				borderWidth: borderWidth
			});
			return;
		}		
		if(!params) {
			console.warn("[Resource.Texture.rect]:", "No parameters specified.");
			return;
		}

		var ctx = this.ctx;
		var width = params.width || 1;
		var height = params.height || 1;
		params.color = params.color || "#0000000";
		var radius = params.radius || 1;
		var borderWidth = params.borderWidth || 3;

		if(!params.drawOver) {
			this.resize(width, height);
		}		

		if(this.textureType) {
			this._createCachedImg();
			ctx = this._cachedCtx;
		}		

		ctx.strokeStyle = params.color;
		ctx.lineWidth = borderWidth;

		var halfWidth = Math.ceil(borderWidth / 2);

		if(borderWidth % 2 === 1)
		{
			ctx.save();
			ctx.translate(0.5, 0.5);
			ctx.beginPath();
			ctx.moveTo(halfWidth + radius, halfWidth);
			ctx.lineTo(width - halfWidth - radius, halfWidth);
			ctx.quadraticCurveTo(width - halfWidth, halfWidth, width - halfWidth, halfWidth + radius);
			ctx.lineTo(width - halfWidth, height - halfWidth - radius);
			ctx.quadraticCurveTo(width - halfWidth, height - halfWidth, width - halfWidth - radius, height - halfWidth);
			ctx.lineTo(halfWidth + radius, height - halfWidth);
			ctx.quadraticCurveTo(halfWidth, height - halfWidth, halfWidth, height - halfWidth - radius);
			ctx.lineTo(halfWidth, radius + halfWidth);
			ctx.quadraticCurveTo(halfWidth, halfWidth, halfWidth + radius, halfWidth);
			ctx.closePath();
			ctx.stroke();
			ctx.restore();
		}
		else 
		{
			ctx.beginPath();
			ctx.moveTo(halfWidth + radius, halfWidth);
			ctx.lineTo(width - halfWidth - radius, halfWidth);
			ctx.quadraticCurveTo(width - halfWidth, halfWidth, width - halfWidth, halfWidth + radius);
			ctx.lineTo(width - halfWidth, height - halfWidth - radius);
			ctx.quadraticCurveTo(width - halfWidth, height - halfWidth, width - halfWidth - radius, height - halfWidth);
			ctx.lineTo(halfWidth + radius, height - halfWidth);
			ctx.quadraticCurveTo(halfWidth, height - halfWidth, halfWidth, height - halfWidth - radius);
			ctx.lineTo(halfWidth, radius + halfWidth);
			ctx.quadraticCurveTo(halfWidth, halfWidth, halfWidth + radius, halfWidth);
			ctx.closePath();
			ctx.stroke();			
		}

		if(params.fillColor) {
			ctx.fillStyle = params.fillColor;
			ctx.fill();
		}

		if(this.textureType === Resource.TextureType.WEBGL) {
			var gl = meta.ctx;
			gl.bindTexture(gl.TEXTURE_2D, this.image);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
		}

		this.isLoaded = true;
	},

	bazier: function(color, path, params)
	{
		this.isLoaded = true;
	},


	gradient: function(data)
	{
		if(!data) {
			console.warn("[Resource.Texture.gradient]:", "No data specified.");
			return;
		}

		if(!data.colors || !data.colors.length) {
			console.warn("[Resource.Texture.gradient]:", "No data.colors specified.");
			return;
		}

		var ctx = this.ctx;
		data.dirX = data.dirX || 0;
		data.dirY = data.dirY || 0;
		data.width = data.width || this.trueFullWidth || 1;
		data.height = data.height || this.trueFullHeight || 1;

		if(!data.drawOver) {
			this.resize(data.width, data.height);
		}

		if(this.textureType) {
			this._createCachedImg();
			ctx = this._cachedCtx;
		}

		var colors = data.colors;
		var numColors = colors.length;

		var x1, x2, y1, y2;
		if(data.dirX < 0) {
			x1 = this.trueFullWidth
			x2 = 0;
		}
		else {
			x1 = 0;
			x2 = this.trueFullWidth * data.dirX;
		}
		if(data.dirY < 0) {
			y1 = this.trueFullHeight;
			y2 = 0;
		}
		else {
			y1 = 0;
			y2 = this.trueFullHeight * data.dirY;
		}

		var gradient = ctx.createLinearGradient(x1, y1, x2, y2);
		for(var i = 0; i < numColors; i++) {
			gradient.addColorStop(colors[i][0], colors[i][1]);
		}

		ctx.fillStyle = gradient;

		ctx.clearRect(0, 0, this.trueFullWidth, this.trueFullHeight);
		ctx.fillRect(0, 0, this.trueFullWidth, this.trueFullHeight);

		if(this.textureType) {
			var gl = meta.ctx;
			gl.bindTexture(gl.TEXTURE_2D, this.image);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
		}

		this.isLoaded = true;
	},

	grid: function(params, cellHeight, numCellsX, numCellsY)
	{
		// Init.
		if(typeof(params) === "number") 
		{
			this.grid({ cellWidth: params, cellHeight: cellHeight, 
				numCellsX: numCellsX, numCellsY: numCellsY
			});
			return;
		}

		if(!params) {
			console.warn("[Resource.Texture.grid]:", "No params specified.");
			return;
		}

		var cellWidth = params.cellWidth || 1;
		var cellHeight = params.cellHeight || 1;
		var numCellsX = params.numCellsX || 1;
		var numCellsY = params.numCellsY || 1;
		params.x = params.x || 0;
		params.y = params.y || 0;
		params.color = params.color || "#000000";
		params.borderWidth = params.borderWidth || 1;
		params.drawOver = params.drawOver || false;

		var width = params.x + (params.cellWidth * params.numCellsX) + 1;
		var height = params.y + (params.cellHeight * params.numCellsY) + 1;	

		if(!params.drawOver) {
			this.resize(width, height);
		}		

		var ctx = this.ctx;	
		if(this.textureType) {
			this._createCachedImg();
			ctx = this._cachedCtx;
		}

		// Rendering.
		ctx.strokeStyle = params.color;
		ctx.lineWidth = params.borderWidth;

		ctx.save();
		ctx.translate(0.5, 0.5);

		for(var x = 0; x < (numCellsX + 1); x++) {
			ctx.moveTo((x * cellHeight), 0);
			ctx.lineTo((x * cellHeight), height);
		}

		for(var y = 0; y < (numCellsY + 1); y++) {
			ctx.moveTo(0, (y * cellHeight));
			ctx.lineTo(width, (y * cellHeight));
		}

		ctx.stroke();
		ctx.restore();

		// Update.
		if(this.textureType) {
			var gl = meta.ctx;
			gl.bindTexture(gl.TEXTURE_2D, this.image);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
		}

		this.isLoaded = true;					
	},


	/**
	 * Callback used if ond to another texture.
	 * @param event {*} Event type.
	 * @param data {*} Event data.
	 */
	onTextureEvent: function(event, data)
	{
		if(event === Resource.Event.LOADED) {
			this.tile(data);
			data.unsubscribe(this);
		}
	},

	set fillStyle(hex) {
		this._fillStyle = hex;
		this.ctx.fillStyle = hex;
	},

	get fillStyle() { return this._fillStyle; },

	//
	_fillStyle: "#000"
});
