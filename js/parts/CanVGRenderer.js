/* ****************************************************************************
 *                                                                            *
 * START OF ANDROID < 3 SPECIFIC CODE. THIS CAN BE REMOVED IF YOU'RE NOT      *
 * TARGETING THAT SYSTEM.                                                     *
 *                                                                            *
 *****************************************************************************/
var CanVGRenderer;
if (useCanVG) {
	
CanVGRenderer = function(container) {
	var contStyle = container.style,
		canvas;
	
	this.init.apply(this, arguments);
			
	// add the canvas above it
	canvas = createElement('canvas', {
		width: container.offsetWidth,
		height: container.offsetHeight
	}, {
		position: RELATIVE,
		left: contStyle.left,
		top: contStyle.top
	}, container.parentNode);
	
	// hide the container
	css(container, {
		position: ABSOLUTE,
		visibility: HIDDEN
	});
	
	this.container = container;
	this.canvas = canvas;

	// Keep all deferred canvases here until we can render them
	this.deferred = [];

	// Start the download of canvg library
	this.download('http://highcharts.com/js/canvg.js');
};

CanVGRenderer.prototype = merge( SVGRenderer.prototype, { // inherit SVGRenderer

	/**
	 * Draw the dummy SVG on the canvas
	 */
	draw: function() {
		var renderer = this;
		
		if (win.canvg) {
			canvg(renderer.canvas, renderer.container.innerHTML);
		} else {
			renderer.deferred.push(function() {
				renderer.draw();
			});
		}
	},
	
	download: function(scriptLocation) {
		var renderer = this,
			head = doc.getElementsByTagName('head')[0],
			scriptAttributes = {
				type: 'text/javascript',
				src: scriptLocation,
				onload: function() {
					renderer.drawDeferred();
				}
			};

		createElement('script', scriptAttributes, null, head);
	},

	drawDeferred: function() {
		var renderer = this;

		each(renderer.deferred, function(fn) {
			fn();
			erase(renderer.deferred, fn);
		});
	}
});

} // end CanVGRenderer
/* **************************************************************************** 
 *                                                                            * 
 * END OF ANDROID < 3 SPECIFIC CODE                                           *
 *                                                                            *
 *****************************************************************************/
	

/**
 * General renderer
 */
Renderer = VMLRenderer || CanVGRenderer || SVGRenderer;
