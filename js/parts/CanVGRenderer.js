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
			deferredCanvases.push(function() {
				renderer.draw();
			});
		}
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
