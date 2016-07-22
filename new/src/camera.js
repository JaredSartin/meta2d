"use strict";

meta.Camera = function(x, y, width, height)
{
	this.volume = new meta.AABB(0, 0, 0, 0);
	this.create();
};

meta.Camera.prototype = 
{
	create: function(x, y, width, height)
	{
		this.volume.set(x, y, width, height);
	},

	remove: function()
	{

	},

	activate: function()
	{

	},

	update: function()
	{
		this.emit("camera-move", this);
	},

	updateZoom: function()
	{

	},

	onResize: function()
	{
		this.volume.resize(meta.engine.width, meta.engine.height);
	},

	//
	volume: null,
	
	$zoom: 1.0,
	zoomPrev: 1.0,
	zoomRatio: 1.0,
	$zoomAuto: false
};


// meta.Camera = function()
// {
// 	this.volume = new meta.AABBext(0, 0, 0, 0);
// 	this.zoomBounds = null;

// 	this._wasResized = false;
// 	this._autoZoom = false;
// 	this._zoom = 1.0;
// 	this.prevZoom = 1.0;
// 	this.zoomRatio = 1.0;
	
// 	this._draggable = false;
// 	this._dragging = false;
// 	this._moved = false;

// 	this._center = false;
// 	this._centerX = true;
// 	this._centerY = true;
// 	this._worldBounds = false;

// 	this._followEntity = null;

// 	//
// 	this.onResize = meta.createChannel(meta.Event.CAMERA_RESIZE);
// 	this.onMove = meta.createChannel(meta.Event.CAMERA_MOVE);

// 	//
// 	this.init();
// };

// meta.Camera.prototype =
// {
// 	init: function()
// 	{
// 		meta.engine.onResize.add(this._onResize, this);
// 		meta.subscribe(meta.Event.WORLD_RESIZE, this._onWorldResize, this);

// 		this.zoomBounds = {
// 			width: -1, height: -1,
// 			minWidth: -1, minHeight: -1,
// 			maxWidth: -1, maxHeight: -1
// 		};
// 	},

// 	/**
// 	 * Destructor.
// 	 */
// 	release: function() 
// 	{
// 		this.onMove.release();
// 		meta.engine.onResize.remove(this);
// 		meta.world.onResize.remove(this);
// 	},

// 	update: function(tDelta)
// 	{
// 		if(!this._followEntity) { return; }

// 		var entityVolume = this._followEntity.volume;
// 		var cameraX = (Math.floor(entityVolume.x) - Math.floor(this.volume.width / 2));
// 		var cameraY = (Math.floor(entityVolume.y) - Math.floor(this.volume.height / 2));
// 		this.position(cameraX, cameraY);
// 	},

// 	/** Update camera view. */
// 	updateView: function()
// 	{
// 		if(this._autoZoom) {
// 			this.updateAutoZoom();
// 		}
// 		else {
// 			this.updateZoom();
// 		}

// 		var world = meta.world;

// 		/* Initial position */
// 		if(!this._moved)
// 		{
// 			var moveX = 0;
// 			var moveY = 0;

// 			if(this._center)
// 			{
// 				if(this._centerX) {
// 					moveX = Math.floor((this.volume.width - world.width) / 2);
// 				}
// 				else {
// 					moveX = 0;
// 				}

// 				if(this._centerY) {
// 					moveY = Math.floor((this.volume.height - world.height) / 2);
// 				}
// 				else {
// 					moveY = 0;
// 				}
// 			}
// 			else {
// 				moveX = 0;
// 				moveY = 0;
// 			}

// 			this.volume.move(moveX, moveY);
// 		}
		
// 		if(this._wasResized) {
// 			this.onResize.emit(this, meta.Event.CAMERA_RESIZE);
// 			this._wasResized = false;
// 		}
// 		this.onMove.emit(this, meta.Event.CAMERA_MOVE);
// 	},

// 	updateZoom: function() 
// 	{
// 		if(this.prevZoom !== this._zoom) 
// 		{
// 			this.zoomRatio = 1.0 / this._zoom;		
// 			this.volume.scale(this.zoomRatio, this.zoomRatio);

// 			this._wasResized = true;
// 		}	
// 	},

// 	updateAutoZoom: function() 
// 	{
// 		var engine = meta.engine;
// 		var width = this.zoomBounds.width;
// 		var height = this.zoomBounds.height;
// 		var diffX = engine.width / width;
// 		var diffY = engine.height / height;

// 		this.prevZoom = this._zoom;
// 		this._zoom = diffX;
// 		if(diffY < diffX) { 
// 			this._zoom = diffY;
// 		}	
		
// 		if(engine.adaptResolution()) 
// 		{
// 			width = this.zoomBounds.width;
// 			height = this.zoomBounds.height;
// 			diffX = (engine.width / width);
// 			diffY = (engine.height / height);

// 			this._zoom = diffX;
// 			if(diffY < diffX) { 
// 				this._zoom = diffY;
// 			}

// 			this.volume.resize(engine.width, engine.height);		
// 		}

// 		this.updateZoom();
// 	},


// 	bounds: function(width, height)
// 	{
// 		this._autoZoom = true;
// 		this._wasResized = true;
// 		this.zoomBounds.width = width;
// 		this.zoomBounds.height = height;
		
// 		if(this.volume.width !== 0 || this.volume.height !== 0) {
// 			this.updateView();		
// 		}
// 	},

// 	minBounds: function(width, height)
// 	{
// 		this._autoZoom = true;
// 		this._wasResized = true;
// 		this.zoomBounds.minWidth = width;
// 		this.zoomBounds.minHeight = height;
// 		this.updateView();
// 	},

// 	maxBounds: function(width, height)
// 	{
// 		this._autoZoom = true;
// 		this._wasResized = true;
// 		this.zoomBounds.maxWidth = width;
// 		this.zoomBounds.maxHeight = height;
// 		this.updateView();
// 	},

// 	_onInput: function(data, event)
// 	{
// 		var inputEvent = Input.Event;

// 		if(event === inputEvent.MOVE) {
// 			this._drag(data);
// 		}
// 		else if(event === inputEvent.DOWN)
// 		{
// 			if(data.keyCode === Input.Key.BUTTON_LEFT) {
// 				this._startDrag(data);
// 			}
// 		}
// 		else if(event === inputEvent.UP)
// 		{
// 			if(data.keyCode === Input.Key.BUTTON_LEFT) {
// 				this._endDrag(data);
// 			}
// 		}
// 	},

// 	_onResize: function(data, event)
// 	{
// 		this.volume.resize(data.width, data.height);
// 		this._wasResized = true;
		
// 		this.updateView();
// 	},

// 	_onWorldResize: function(data, event) {
// 		this.updateView();
// 	},

// 	_startDrag: function(data)
// 	{
// 		if(!this._draggable) { return; }
// 		this._dragging = true;
// 	},

// 	_endDrag: function(data) {
// 		this._dragging = false;
// 	},

// 	_drag: function(data)
// 	{
// 		if(!this._dragging) { return; }

// 		var scope = meta;
// 		var diffX = (data.screenX - data.prevScreenX) * this.zoomRatio;
// 		var diffY = (data.screenY - data.prevScreenY) * this.zoomRatio;

// 		this._moved = true;

// 		if(this._worldBounds) 
// 		{
// 			var worldVolume = scope.world.volume;
// 			var newX = this.volume.minX - diffX; 
// 			var newY = this.volume.minY - diffY;

// 			if(newX < worldVolume.minX) {
// 				diffX -= worldVolume.minX - newX;
// 			}
// 			else if(newX + this.volume.width > worldVolume.maxX) {
// 				diffX = this.volume.maxX - worldVolume.maxX;
// 			}

// 			if(newY < worldVolume.minY) {
// 				diffY -= worldVolume.minY - newY;
// 			}
// 			else if(newY + this.volume.height > worldVolume.maxY) {
// 				diffY = this.volume.maxY - worldVolume.maxY;
// 			}
// 		}
		
// 		this.volume.move(-diffX, -diffY);

// 		this.onMove.emit(this, scope.Event.CAMERA_MOVE);
// 	},

// 	position: function(x, y)
// 	{
// 		if(this.volume.x === x && this.volume.y === y) { return; }

// 		this.volume.position(x, y);
// 		this._moved = true;
// 		this.updateView();
// 	},

// 	follow: function(entity)
// 	{
// 		if(!(entity instanceof Entity.Geometry)) {
// 			console.warn("(meta.Camera.follow): Invalid entity - should be part of Entity.Geometry");
// 			return;
// 		}

// 		this._followEntity = entity;
// 	},

// 	set x(value)
// 	{
// 		if(this.volume.x === value) { return; }

// 		this.volume.position(value, this.volume.y);
// 		this._moved = true;
// 		this.updateView();
// 	},

// 	set y(value)
// 	{
// 		if(this.volume.y === value) { return; }

// 		this.volume.position(this.volume.x, value);
// 		this._moved = true;
// 		this.updateView();
// 	},

// 	get x() { return this.volume.x; },
// 	get y() { return this.volume.y; },

// 	get width() { return this.volume.width; },
// 	get height() { return this.volume.height; },

// 	set zoom(value)
// 	{
// 		if(this._zoom === value) { return; }

// 		this.prevZoom = this._zoom;
// 		this._zoom = value;
// 		this.updateView();
// 	},

// 	get zoom() { return this._zoom; },


// 	set enableBorderIgnore(value) {
// 		this._enableBorderIgnore = value;
// 		this.updateView();
// 	},

// 	get enableBorderIgnore() { return this._enableBorderIgnore; },

// 	set draggable(value)
// 	{
// 		if(this._draggable === value) { return; }

// 		this._draggable = value;

// 		var events = [ Input.Event.DOWN, Input.Event.UP, Input.Event.MOVE ];

// 		if(value) {
// 			meta.subscribe(events, this._onInput, this);
// 		}
// 		else {
// 			meta.unsubscribe(events, this);
// 			this._dragging = false;
// 		}
// 	},

// 	get draggable() { return this._draggable; },

// 	set autoZoom(value) 
// 	{
// 		if(this._autoZoom === value) { return; }
// 		this._autoZoom = value;
// 		this._wasResized = true;

// 		this.updateView();
// 	},

// 	get autoZoom() { return this._autoZoom; },

// 	set worldBounds(value) 
// 	{
// 		if(this._worldBounds === value) { return; }
// 		this._worldBounds = value;
// 		this._wasResized = true;

// 		this.updateView();
// 	},

// 	get worldBounds() { return this._worldBounds; },

// 	/* Enable centering */
// 	set center(value) {
// 		this._center = value;
// 		this.updateView();
// 	},

// 	set centerX(value) {
// 		this._centerX = value;
// 		this.updateView();
// 	},

// 	set centerY(value) {
// 		this._centerY = value;
// 		this.updateView();
// 	},

// 	get center() { return this._center; },
// 	get centerX() { return this._centerX; },
// 	get centerY() { return this._centerY; }
// };