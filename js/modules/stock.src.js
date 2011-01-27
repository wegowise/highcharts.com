/** 
 * @license Highcharts JS (work in progress)
 * Stock module
 * 
 * (c) 2011 Torstein Hønsi
 * 
 * License: www.highcharts.com/license
 */


(function() { // encapsulate

// create shortcuts
var HC = Highcharts, 
	addEvent = HC.addEvent,
	defaultOptions = HC.getOptions(),
	defaultPlotOptions = defaultOptions.plotOptions,
	seriesTypes = HC.seriesTypes,
	extend = HC.extend,
	each = HC.each,
	map = HC.map,
	merge = HC.merge,
	pick = HC.pick,
	math = Math,
	mathMin = math.min,
	mathMax = math.max,
	mathRound = math.round;
	
	
/* ****************************************************************************
 * Start OHLC series code                                                     *
 *****************************************************************************/
	
// 1 - Set default options
defaultPlotOptions.OHLC = merge(defaultPlotOptions.column, {
	lineWidth: 1,
	states: {
		hover: {
			lineWidth: 3
		}
	}
});

// 2- Create the OHLCPoint object
var OHLCPoint = Highcharts.extendClass(Highcharts.Point, {
	/**
	 * Apply the options containing the x and OHLC data and possible some extra properties.
	 * This is called on point init or from point.update. Extends base Point by adding
	 * multiple y-like values.
	 * 
	 * @param {Object} options
	 */
	applyOptions: function(options) {
		var point = this,
			series = point.series,
			n, 
			i = 0;
	
		
		// object input for example:
		// { x: Date(2010, 0, 1), open: 7.88, high: 7.99, low: 7.02, close: 7.65 } 
		if (typeof options == 'object' && typeof options.length != 'number') {
			
			// copy options directly to point
			extend(point, options);
			
			point.options = options;
		}
		
		// array 
		else if (options.length) {
			// with leading x value
			if (options.length == 5) {
				if (typeof options[0] == 'string') {
					point.name = options[0];
				} else if (typeof options[0] == 'number') {
					point.x = options[0];
				}
				i++;
			}
			point.open = options[i++];
			point.high = options[i++];
			point.low = options[i++];
			point.close = options[i++];
		}
		
		/* 
		 * If no x is set by now, get auto incremented value. All points must have an
		 * x value, however the y value can be null to create a gap in the series
		 */
		point.y = point.high;
		if (point.x === undefined) {
			point.x = series.autoIncrement();
		}
		
	},
	
	/**
	 * A specific OHLC tooltip formatter
	 */
	tooltipFormatter: function(useHeader) {
		var point = this,
			series = point.series;
				
		return ['<span style="color:'+ series.color +';font-weight:bold">', (point.name || series.name), '</span><br/> ',
			'Open: ', point.open, '<br/>',
			'High: ', point.high, '<br/>',
			'Low: ', point.low, '<br/>',
			'Close: ', point.close].join('');
		
	}
	
});
	
// 3 - Create the OHLCSeries object
var OHLCSeries = Highcharts.extendClass(seriesTypes.column, {
	type: 'OHLC',
	pointClass: OHLCPoint,
	
	pointAttrToOptions: { // mapping between SVG attributes and the corresponding options
		stroke: 'color',
		'stroke-width': 'lineWidth'
	},
	
	
	/**
	 * Translate data points from raw values x and y to plotX and plotY
	 */
	translate: function() {
		var chart = this.chart, 
			series = this, 
			categories = series.xAxis.categories,
			yAxis = series.yAxis,
			stack = yAxis.stacks[series.type];
			
		seriesTypes.column.prototype.translate.apply(series);	
			
		// do the translation
		each(this.data, function(point) {
			// the graphics
			point.plotOpen = yAxis.translate(point.open, 0, 1);
			point.plotClose = yAxis.translate(point.close, 0, 1);
			
		});
	},
	
	/**
	 * Draw the data points
	 */
	drawPoints: function() {
		var series = this,  //state = series.state,
			//layer = series.stateLayers[state], 
			seriesOptions = series.options, 
			seriesStateAttr = series.stateAttr,
			data = series.data, 
			chart = series.chart,
			pointAttr,
			pointOpen,
			pointClose,
			crispCorr,
			halfWidth,
			path,
			graphic,
			crispX;
		
				
		each(data, function(point) {
			
			if (point.plotY !== undefined && 
					point.plotX >= 0 && point.plotX <= chart.plotSizeX &&
					point.plotY >= 0 && point.plotY <= chart.plotSizeY) {
				
				graphic = point.graphic;
				pointAttr = point.pointAttr[point.selected ? 'selected' : ''];
				
				// crisp vector coordinates				
				crispCorr = (pointAttr['stroke-width'] % 2) / 2;
				crispX = mathRound(point.plotX) + crispCorr;
				plotOpen = mathRound(point.plotOpen) + crispCorr;
				plotClose = mathRound(point.plotClose) + crispCorr;
				halfWidth = mathRound(point.barW / 2);
				
					
				path = [
					'M',
					crispX, mathRound(point.yBottom),
					'L', 
					crispX, mathRound(point.plotY),
					'M',
					crispX, plotOpen,
					'L',
					crispX - halfWidth, plotOpen,
					'M',
					crispX, plotClose,
					'L',
					crispX + halfWidth, plotClose,
					'Z'
				];
				
				
				if (graphic) {
					graphic.animate({ d: path });
				} else {
					point.graphic = chart.renderer.path(path)
						.attr(pointAttr)
						.add(series.group);
				}
				
			}
			
			
		});

	}
	
	
});
seriesTypes.OHLC = OHLCSeries;
/* ****************************************************************************
 * End OHLC series code                                                       *
 *****************************************************************************/


/* ****************************************************************************
 * Start Candlestick series code                                              *
 *****************************************************************************/

// 1 - set default options
defaultPlotOptions.candlestick = merge(defaultPlotOptions.column, {
	lineColor: 'black',
	lineWidth: 1,
	upColor: 'white',
	states: {
		hover: {
			lineWidth: 2
		}
	}
});

// 3 - Create the CandlestickSeries object
var CandlestickSeries = Highcharts.extendClass(OHLCSeries, {
	type: 'candlestick',
	
	/**
	 * One-to-one mapping from options to SVG attributes
	 */
	pointAttrToOptions: { // mapping between SVG attributes and the corresponding options
		fill: 'color',
		stroke: 'lineColor',
		'stroke-width': 'lineWidth'
	},
	
	/**
	 * Postprocess mapping between options and SVG attributes
	 */
	getAttribs: function() {
		OHLCSeries.prototype.getAttribs.apply(this, arguments);
		var series = this, 
			options = series.options,
			stateOptions = options.states,
			upColor = options.upColor,
			seriesDownPointAttr = merge(series.pointAttr);
			
		seriesDownPointAttr[''].fill = upColor;
		seriesDownPointAttr.hover.fill = stateOptions.hover.upColor || upColor;
		seriesDownPointAttr.select.fill = stateOptions.select.upColor || upColor;
		
		each(series.data, function(point) {
			if (point.open < point.close) {
				point.pointAttr = seriesDownPointAttr;
			}
		});
	},
	
	/**
	 * Draw the data points
	 */
	drawPoints: function() {
		var series = this,  //state = series.state,
			//layer = series.stateLayers[state], 
			seriesOptions = series.options, 
			seriesStateAttr = series.stateAttr,
			data = series.data, 
			chart = series.chart,
			pointAttr,
			pointOpen,
			pointClose,
			topBox,
			bottomBox,
			crispCorr,
			crispX,
			graphic,
			path,
			halfWidth;
		
				
		each(data, function(point) {
			
			if (point.plotY !== undefined && 
					point.plotX >= 0 && point.plotX <= chart.plotSizeX &&
					point.plotY >= 0 && point.plotY <= chart.plotSizeY) {
				
				graphic = point.graphic;
				pointAttr = point.pointAttr[point.selected ? 'selected' : ''];
				
				// crisp vector coordinates				
				crispCorr = (pointAttr['stroke-width'] % 2) / 2;
				crispX = mathRound(point.plotX) + crispCorr;
				plotOpen = mathRound(point.plotOpen) + crispCorr;
				plotClose = mathRound(point.plotClose) + crispCorr;
				topBox = math.min(plotOpen, plotClose);
				bottomBox = math.max(plotOpen, plotClose);
				halfWidth = mathRound(point.barW / 2);
				
				// create the path
				path = [
					'M',
					crispX - halfWidth, bottomBox,
					'L',
					crispX - halfWidth, topBox,
					'L',
					crispX + halfWidth, topBox,
					'L',
					crispX + halfWidth, bottomBox,
					'L',
					crispX - halfWidth, bottomBox,
					'M',
					crispX, bottomBox,
					'L',
					crispX, mathRound(point.yBottom),
					'M',
					crispX, topBox,
					'L',
					crispX, mathRound(point.plotY),
					'Z'
				];
				
				if (graphic) {
					graphic.animate({ d: path });
				} else {
					point.graphic = chart.renderer.path(path)
						.attr(pointAttr)
						.add(series.group);
				}
				
			}
			
		});

	}
	
	
});

seriesTypes.candlestick = CandlestickSeries;

/* ****************************************************************************
 * End Candlestick series code                                                *
 *****************************************************************************/

/* ****************************************************************************
 * Start Scroller code                                                        *
 *****************************************************************************/
// test: http://jsfiddle.net/highcharts/95zsD/
defaultOptions.scroller = {
	enabled: true,
	height: 40,
	margin: 10,
	maskFill: 'rgba(255, 255, 255, 0.75)',
	outlineColor: '#444',
	outlineWidth: 1,
	handles: {
		backgroundColor: '#FFF',
		borderColor: '#666'
	},
	series: {
		type: 'area',
		color: '#4572A7',
		fillOpacity: 0.5
	}
};

var Scroller = function(chart) {
	
	var scroller = this,
		renderer = chart.renderer,
		options = defaultOptions.scroller,
		grabbedLeft,
		grabbedRight,
		grabbedCenter,
		otherHandlePos,
		dragOffset,
		hasDragged,
		xAxis,
		yAxis,
		zoomedMin,
		zoomedMax,
		range,
		
		bodyStyle = document.body.style,
		defaultBodyCursor,
		
		handlesOptions = options.handles,
		outlineWidth = options.outlineWidth,
		height = options.height,
		top = chart.chartHeight - height - chart.options.chart.spacingBottom,
		halfOutline = outlineWidth / 2;
		
	
	function render(min, max, pxMin, pxMax) {
			
		pxMin = pick(pxMin, xAxis.translate(min));
		pxMax = pick(pxMax, xAxis.translate(max));
		outlineTop = top + halfOutline;
		plotLeft = chart.plotLeft;
		plotWidth = chart.plotWidth;
		
		// handles are allowed to cross
		zoomedMin = mathMin(pxMin, pxMax);
		zoomedMax = mathMax(pxMin, pxMax);
		range = zoomedMax - zoomedMin;
			
		// the left shade
		var leftShadeShape = {
			x: plotLeft,
			y: top,
			width: zoomedMin,
			height: height
		};
		if (scroller.leftShade) {
			scroller.leftShade.attr(leftShadeShape);
		} else {
			scroller.leftShade = renderer.rect(leftShadeShape)
				.attr({
					fill: options.maskFill,
					zIndex: 3
				}).add();
		}
		
		// the right shade
		var rightShadeShape = {
			x: plotLeft + zoomedMax,
			y: top,
			width: plotLeft + plotWidth - zoomedMax,
			height: height
		};
		if (scroller.rightShade) {
			scroller.rightShade.attr(rightShadeShape);
		} else {
			scroller.rightShade = renderer.rect(rightShadeShape)
				.attr({
					fill: options.maskFill,
					zIndex: 3
				}).add();
		}
		
		// the outline path
		var outlinePath = [
			'M', 
			plotLeft, 
			outlineTop,
			'L', 
			plotLeft + zoomedMin - halfOutline,
			outlineTop,
			plotLeft + zoomedMin - halfOutline,
			outlineTop + height - outlineWidth,
			plotLeft + zoomedMax + halfOutline,
			outlineTop + height - outlineWidth,
			plotLeft + zoomedMax + halfOutline,
			outlineTop,
			plotLeft + plotWidth,
			outlineTop
		];
		
		if (scroller.outline) {
			scroller.outline.attr({ d: outlinePath });
		} else {
			scroller.outline = renderer.path(outlinePath)
				.attr({ 
					'stroke-width': outlineWidth,
					stroke: options.outlineColor,
					zIndex: 3
				})
				.add();
		}
		 
		// draw handles
		drawHandle(zoomedMin - halfOutline, 'leftHandle');
		drawHandle(zoomedMax + halfOutline, 'rightHandle'); 
	}
	
	
	function drawHandle(x, name) {
			
		x += plotLeft;
		
		var handleAttr = {
				fill: handlesOptions.backgroundColor,
				stroke: handlesOptions.borderColor,
				'stroke-width': 1,
				zIndex: 3
			},
			rectName = name +'Rect',
			pathName = name +'Path',					
			middleY = top + height / 2,
			rectX = x - 4.5,
			rectY = middleY - 8,
			path = [
				'M',
				x - 1,
				middleY - 4,
				'L',
				x - 1,
				middleY + 4,
				'M',
				x + 1,
				middleY - 4,
				'L',
				x + 1,
				middleY + 4
			];
		
		if (scroller[rectName]) {
			scroller[rectName].attr({
				x: rectX,
				y: rectY
			});
		} else {
			scroller[rectName] = renderer.rect(rectX, rectY, 9, 16, 3, 1)
				.attr(handleAttr)
				.css({ cursor: 'ew-resize' })
				.add();
		}
			
		if (scroller[pathName]) {
			scroller[pathName].attr({ d: path });
		} else {
			scroller[pathName] = renderer.path(path)
				.attr(handleAttr)
				.css({ cursor: 'ew-resize' })
				.add();
		}
	}
	
	// Run scroller
		
	chart.initSeries(merge(chart.series[0].options, options.series, {
		//color: 'green',
		//threshold: 0.5, // todo: allow threshold: null to display area charts here
		clip: false,
		enableMouseTracking: false, // todo: ignore shared tooltip when mouse tracking disabled
		xAxis: 1,
		yAxis: 1 // todo: dynamic index or id or axis object itself
	}));
	
	xAxis = new chart.Axis({
		isX: true,
		type: 'datetime',
		index: 1
	});
	yAxis = new chart.Axis({
    	isX: false,
		absolutePosition: top,
		//alignTicks: false, // todo: implement this for individual axis
    	length: height,
		startOnTick: false,
		endOnTick: false,
		min: 0.6, // todo: remove this once a null threshold for area is established
		minPadding: 0.1,
		maxPadding: 0.1,
		labels: {
			enabled: false
		},
		title: {
			text: null
		},
		tickWidth: 0,
    	offset: 0, // todo: option for other axes to ignore this, or just remove all ink
		index: 1 // todo: set the index dynamically in new chart.Axis
	});
	
	
	// set up mouse events
	addEvent(chart.container, 'mousedown', function(e) {
		e = chart.tracker.normalizeMouseEvent(e);
		var chartX = e.chartX,
			chartY = e.chartY,
			left;
		
		if (chartY > top && chartY < top + height) { // we're vertically inside the navigator
			
			// grab the left handle
			if (math.abs(chartX - zoomedMin - plotLeft) < 7) {
				grabbedLeft = chartX;
				otherHandlePos = zoomedMax;
			}
			
			// grab the right handle
			else if (math.abs(chartX - zoomedMax - plotLeft) < 7) {
				grabbedRight = chartX;
				otherHandlePos = zoomedMin;
			}
			
			// grab the zoomed range
			else if (chartX > plotLeft + zoomedMin && chartX < plotLeft + zoomedMax) { 
				grabbedCenter = chartX;
				defaultBodyCursor = bodyStyle.cursor;
				bodyStyle.cursor = 'ew-resize';
				
				dragOffset = chartX - zoomedMin;
			}
			
			// click on the shaded areas
			else if (chartX > plotLeft && chartX < plotLeft + plotWidth) {
						
				left = chartX - plotLeft - range / 2;
				if (left < 0) {
					left = 0;
				} else if (left + range > plotWidth) {
					left = plotWidth - range; 
				}
				chart.xAxis[1].setExtremes(
					xAxis.translate(left, true),
					xAxis.translate(left + range, true)
				);
			}			
		}
		if (e.preventDefault) { // tries to drag object when clicking on the shades
			e.preventDefault();
		}
	});
	
	addEvent(chart.container, 'mousemove', function(e) {
		e = chart.tracker.normalizeMouseEvent(e);
		var chartX = e.chartX;
		
		// validation for handle dragging
		if (chartX < plotLeft) {
			chartX = plotLeft;
		} else if (chartX > plotLeft + plotWidth) {
			chartX = plotLeft + plotWidth;
		}
		
		if (grabbedLeft) {
			hasDragged = true;
			render(0, 0, chartX - plotLeft, otherHandlePos);
				
		} else if (grabbedRight) {
			hasDragged = true;
			render(0, 0, otherHandlePos, chartX - plotLeft);
				
		} else if (grabbedCenter) {
			hasDragged = true;
			if (chartX < dragOffset) {
				chartX = dragOffset;
			} else if (chartX > plotWidth + dragOffset - range) {
				chartX = plotWidth - range + dragOffset;
			}
		
			render(0, 0, chartX - dragOffset, chartX - dragOffset + range);
		}
	});
	
	addEvent(document, 'mouseup', function() {
		if (hasDragged) {
			chart.xAxis[1].setExtremes(
				xAxis.translate(zoomedMin, true),
				xAxis.translate(zoomedMax, true)
			);
		}
		grabbedLeft = grabbedRight = grabbedCenter = hasDragged = dragOffset = null;
		bodyStyle.cursor = defaultBodyCursor;	
	});
	
	// Expose
	return {
		render: render
	}
	
};

HC.addEvent(HC.Chart.prototype, 'beforeRender', function(e) {
	var chart = e.target;
	if (chart.options.scroller.enabled) {
		chart.scroller = Scroller(chart);
	}
});

HC.Chart.prototype.callbacks.push(function(chart) {
	var extremes,
		scroller = chart.scroller;
	if (scroller) {
		
		// redraw the scroller on setExtremes
		addEvent(chart.xAxis[1], 'setExtremes', function(e) {
			scroller.render(e.min, e.max);
		});
	
		extremes = chart.xAxis[1].getExtremes();
		scroller.render(extremes.min, extremes.max);
	}	
});

})();
