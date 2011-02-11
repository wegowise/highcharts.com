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
	createElement = HC.createElement,
	dateFormat = HC.dateFormat,
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

var scrollbarGradient = {
		linearGradient: [0, 0, 0, 14],
		stops: [
			[0, '#FFF'],
			[1, '#CCC']
		]
	};

extend(defaultOptions, {
	navigator: {
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
			fillOpacity: 0.4,
			lineWidth: 1
		}
	},
	scrollbar: {
		enabled: true,
		height: 14,
		barBackgroundColor: scrollbarGradient,
		barBorderRadius: 2,
		barBorderWidth: 1,
		barBorderColor: '#666',
		buttonBackgroundColor: scrollbarGradient,
		buttonBorderWidth: 1,
		buttonBorderColor: '#666',
		buttonArrowColor: '#666',
		buttonBorderRadius: 2,
		rifleColor: '#666',
		trackBackgroundColor: {
			linearGradient: [0, 0, 0, 10],
			stops: [
				[0, '#EEE'],
				[1, '#FFF']
			]
		},
		trackBorderWidth: 1,
		trackBorderColor: '#CCC'
	}
});

var Scroller = function(chart) {
	
	var scroller = this,
		renderer = chart.renderer,
		chartOptions = chart.options,
		navigatorOptions = chartOptions.navigator,
		navigatorEnabled = navigatorOptions.enabled,
		scrollbarOptions = chartOptions.scrollbar,
		scrollbarEnabled = scrollbarOptions.enabled, 
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
		
		handlesOptions = navigatorOptions.handles,
		height = navigatorEnabled ? navigatorOptions.height : 0,
		outlineWidth = navigatorOptions.outlineWidth,
		scrollbarHeight = scrollbarEnabled ? scrollbarOptions.height : 0,
		outlineHeight = height + scrollbarHeight,		
		top = chart.chartHeight - height - scrollbarHeight - chartOptions.chart.spacingBottom,
		halfOutline = outlineWidth / 2,
		rendered,
		
		// element wrappers
		leftShade,
		rightShade,
		outline,
		handles = [],
		scrollbarGroup,
		scrollbarTrack,
		scrollbar,
		scrollbarRifles,
		scrollbarButtons = [];
		
	/**
	 * Initiate the Scroller object
	 */
	function init() {
		
		// make room below the chart
		chart.extraBottomMargin = outlineHeight + navigatorOptions.margin;
			
		if (navigatorEnabled) {
			// add the series
			chart.initSeries(merge(chart.series[0].options, navigatorOptions.series, {
				//color: 'green',
				threshold: null,
				clip: false,
				enableMouseTracking: false,
				xAxis: 1,
				yAxis: 1 // todo: dynamic index or id or axis object itself
			}));
		}
			
		// an x axis is required for scrollbar also
		xAxis = new chart.Axis({
			isX: true,
			type: 'datetime',
			index: 1,
			height: height,
			top: top,
			offset: 0,
			offsetLeft: scrollbarHeight,
			offsetRight: -scrollbarHeight,
			tickWidth: 0,
			lineWidth: 0,
			gridLineWidth: 1,
			tickPixelInterval: 200,
			startOnTick: false,
			endOnTick: false,
			minPadding: 0,
			maxPadding: 0,
			labels: {
				align: 'left',
				x: 3,
				y: -4
			}
		});
			
		if (navigatorEnabled) {
			yAxis = new chart.Axis({
		    	//isX: false,
				//alignTicks: false, // todo: implement this for individual axis
		    	height: height,
				top: top,
				startOnTick: false,
				endOnTick: false,
				minPadding: 0.1,
				min: 0.6, // todo: remove this when null threshold is implemented
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
		}
	
			
		
		
		addEvents();
	}
	
	/**
	 * Set up the mouse and touch events for the navigator and scrollbar
	 */
	function addEvents() {
		addEvent(chart.container, 'mousedown', function(e) {
			e = chart.tracker.normalizeMouseEvent(e);
			var chartX = e.chartX,
				chartY = e.chartY,
				left,
				isOnScrollbar;
			
			if (chartY > top && chartY < top + height + scrollbarHeight) { // we're vertically inside the navigator
			
				isOnNavigator = !scrollbarEnabled || chartY < top + height;
				
				// grab the left handle
				if (isOnNavigator && math.abs(chartX - zoomedMin - plotLeft) < 7) {
					grabbedLeft = chartX;
					otherHandlePos = zoomedMax;
				}
				
				// grab the right handle
				else if (isOnNavigator && math.abs(chartX - zoomedMax - plotLeft) < 7) {
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
							
					if (isOnNavigator) { // center around the clicked point
						left = chartX - plotLeft - range / 2;
					} else { // click on scrollbar
						if (chartX < plotLeft + scrollbarHeight) { // click left scrollbar button
							left = zoomedMin - mathMin(10, range);
						} else if (chartX > plotLeft + plotWidth - scrollbarHeight)  {
							left = zoomedMin + mathMin(10, range)
						} else {
							// shift the scrollbar by one range
							left = chartX < plotLeft + zoomedMin ? // on the left
								zoomedMin - range :
								zoomedMax;
						}
					}
					if (left < scrollbarHeight) {
						left = scrollbarHeight;
					} else if (left + range > plotWidth - scrollbarHeight) {
						left = plotWidth - range - scrollbarHeight; 
					}
					chart.xAxis[0].setExtremes(
						xAxis.translate(left, true),
						xAxis.translate(left + range, true),
						true,
						false
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
			if (chartX < plotLeft + scrollbarHeight) {
				chartX = plotLeft + scrollbarHeight;
			} else if (chartX > plotLeft + plotWidth - scrollbarHeight) {
				chartX = plotLeft + plotWidth - scrollbarHeight;
			}
			
			// drag left handle
			if (grabbedLeft) {
				hasDragged = true;
				render(0, 0, chartX - plotLeft, otherHandlePos);
					
			// drag right handle
			} else if (grabbedRight) {
				hasDragged = true;
				render(0, 0, otherHandlePos, chartX - plotLeft);
					
			// drag scrollbar or open area in navigator
			} else if (grabbedCenter) {
				hasDragged = true;
				if (chartX < dragOffset + scrollbarHeight) { // outside left
					chartX = dragOffset + scrollbarHeight;
				} else if (chartX > plotWidth + dragOffset - range - scrollbarHeight) { // outside right
					chartX = plotWidth + dragOffset - range - scrollbarHeight;
				}
			
				render(0, 0, chartX - dragOffset, chartX - dragOffset + range);
			}
		});
		
		addEvent(document, 'mouseup', function() {
			if (hasDragged) {
				chart.xAxis[0].setExtremes(
					xAxis.translate(zoomedMin, true),
					xAxis.translate(zoomedMax, true),
					true,
					false
				);
			}
			grabbedLeft = grabbedRight = grabbedCenter = hasDragged = dragOffset = null;
			bodyStyle.cursor = defaultBodyCursor;	
		});
	}
	
	
	function render(min, max, pxMin, pxMax) {
		
		// set the scroller x axis extremes to reflect the total
		var newExtremes = chart.xAxis[0].getExtremes(),
			oldExtremes = xAxis.getExtremes(),
			barBorderRadius = scrollbarOptions.barBorderRadius;
		if (newExtremes.dataMin != oldExtremes.min || 
				newExtremes.dataMax != oldExtremes.max) {
			xAxis.setExtremes(newExtremes.dataMin, newExtremes.dataMax);
		}
			
		pxMin = pick(pxMin, xAxis.translate(min));
		pxMax = pick(pxMax, xAxis.translate(max));
		outlineTop = top + halfOutline;
		plotLeft = chart.plotLeft;
		plotWidth = chart.plotWidth;
		
		// handles are allowed to cross
		zoomedMin = parseInt(mathMin(pxMin, pxMax), 10);
		zoomedMax = parseInt(mathMax(pxMin, pxMax), 10);
		range = zoomedMax - zoomedMin;
		
		// on first render, create all elements
		if (!rendered) {
			
			if (navigatorEnabled) {
			
				leftShade = renderer.rect()
					.attr({
						fill: navigatorOptions.maskFill,
						zIndex: 3
					}).add();
				rightShade = renderer.rect()
					.attr({
						fill: navigatorOptions.maskFill,
						zIndex: 3
					}).add();
				outline = renderer.path()
					.attr({ 
						'stroke-width': outlineWidth,
						stroke: navigatorOptions.outlineColor,
						zIndex: 3
					})
					.add();
			}
				
			if (scrollbarEnabled) {
				scrollbarGroup = renderer.g().add();
				
				scrollbarTrack = renderer.rect().attr({
					fill: scrollbarOptions.trackBackgroundColor,
					stroke: scrollbarOptions.trackBorderColor,
					'stroke-width': scrollbarOptions.trackBorderWidth,
					height: scrollbarHeight
				}).add(scrollbarGroup);
				
				scrollbar = renderer.rect()
					.attr({
						height: scrollbarHeight,
						fill: scrollbarOptions.barBackgroundColor,
						stroke: scrollbarOptions.barBorderColor,
						'stroke-width': scrollbarOptions.barBorderWidth,
						rx: barBorderRadius,
						ry: barBorderRadius
					})
					.add(scrollbarGroup);
					
				scrollbarRifles = renderer.path()
					.attr({
						stroke: scrollbarOptions.rifleColor,
						'stroke-width': 1
					})
					.add(scrollbarGroup);
			}
		}
		
		// place elements
		if (navigatorEnabled) {
			leftShade.attr({
				x: plotLeft + scrollbarHeight,
				y: top,
				width: zoomedMin - scrollbarHeight,
				height: height
			});
			rightShade.attr({
				x: plotLeft + zoomedMax,
				y: top,
				width: plotWidth - zoomedMax - scrollbarHeight,
				height: height
			});
			outline.attr({ d: [
				'M', 
				plotLeft, 
				outlineTop,
				'L', 
				plotLeft + zoomedMin - halfOutline,
				outlineTop,
				plotLeft + zoomedMin - halfOutline,
				outlineTop + outlineHeight - outlineWidth,
				plotLeft + zoomedMax + halfOutline,
				outlineTop + outlineHeight - outlineWidth,
				plotLeft + zoomedMax + halfOutline,
				outlineTop,
				plotLeft + plotWidth,
				outlineTop
			]});
			
			// draw handles
			drawHandle(zoomedMin - halfOutline, 0);
			drawHandle(zoomedMax + halfOutline, 1);
		}
		
		// draw the scrollbar
		if (scrollbarEnabled) {
			
			// draw the buttons
			drawScrollbarButton(0);
			drawScrollbarButton(1);
			
			scrollbarGroup.translate(plotLeft, outlineTop + height);
				
			scrollbarTrack.attr({
				width: plotWidth
			});
			
			scrollbar.attr({
				x: zoomedMin,
				width: range
			});
			
			var centerBarX = zoomedMin + range / 2 - 0.5;				
			scrollbarRifles.attr({ d: [
				'M',
				centerBarX - 3, scrollbarHeight / 4,
				'L',
				centerBarX - 3, 2 * scrollbarHeight / 3,
				'M',
				centerBarX, scrollbarHeight / 4,
				'L',
				centerBarX, 2 * scrollbarHeight / 3,
				'M',
				centerBarX + 3, scrollbarHeight / 4,
				'L',
				centerBarX + 3, 2 * scrollbarHeight / 3
			]});
		}
		
		rendered = true;
	}
	
	/**
	 * Draw one of the handles on the side of the zoomed range in the navigator
	 * @param {Number} x The x center for the handle
	 * @param {Number} index 0 for left and 1 for right
	 */
	function drawHandle(x, index) {
			
		var attr = {
				fill: handlesOptions.backgroundColor,
				stroke: handlesOptions.borderColor,
				'stroke-width': 1
			};
			
		// create the elements
		if (!rendered) {
			
			// the group
			handles[index] = renderer.g()
				.css({ cursor: 'e-resize' })
				.attr({ zIndex: 3 })
				.add();
			
			// the rectangle
			renderer.rect(-4.5, 0, 9, 16, 3, 1)
				.attr(attr)
				.add(handles[index]);
				
			// the rifles
			renderer.path([
					'M',
					-0.5, 4,
					'L',
					-0.5,	12,
					'M',
					1.5, 4,
					'L',
					1.5, 12
				]).attr(attr)
				.add(handles[index]);
		}
		
		handles[index].translate(plotLeft + parseInt(x, 10), top + height / 2 - 8);
	}
	
	/**
	 * Draw the scrollbar buttons with arrows
	 * @param {Number} index 0 is left, 1 is right
	 */
	function drawScrollbarButton(index) {
		
		if (!rendered) {
			
			scrollbarButtons[index] = renderer.g().add(scrollbarGroup);
			
			renderer.rect(
				0,
				0,
				scrollbarHeight,
				scrollbarHeight,
				scrollbarOptions.buttonBorderRadius,
				scrollbarOptions.buttonBorderWidth
			).attr({
				stroke: scrollbarOptions.buttonBorderColor,
				'stroke-width': scrollbarOptions.buttonBorderWidth,
				fill: scrollbarOptions.buttonBackgroundColor
			}).add(scrollbarButtons[index]);
			
			renderer.path([
				'M',
				scrollbarHeight / 2 + (index ? -1 : 1), scrollbarHeight / 2 - 3,
				'L',
				scrollbarHeight / 2 + (index ? -1 : 1), scrollbarHeight / 2 + 3,
				scrollbarHeight / 2 + (index ? 2 : -2), scrollbarHeight / 2
			]).attr({
				fill: scrollbarOptions.buttonArrowColor
			}).add(scrollbarButtons[index]);
		}
		
		// adjust the right side button to the varying length of the scroll track
		if (index) {
			scrollbarButtons[index].attr({
				translateX: plotWidth - scrollbarHeight
			});
		}
	}
	
	// Run scroller
	init();
	
	// Expose
	return {
		render: render
	}
	
};

/* ****************************************************************************
 * End Scroller code                                                          *
 *****************************************************************************/

/* ****************************************************************************
 * Start Range Selector code                                                  *
 *****************************************************************************/
extend(defaultOptions, {
	rangeSelector: {
		enabled: true
	}
});

function RangeSelector(chart) {
	var renderer = chart.renderer,
		rendered,
		div,
		leftBox,
		rightBox/*,
		leftText,
		rightText*/;
	
	function init() {
		chart.extraTopMargin = 40;	
	}
	
	function render(min, max) {
		
		// create the elements
		if (!rendered) {
			div = createElement('div', null, {
				position: 'absolute',
				top: '20px',
				zIndex: 100
			}, chart.container);
			
			leftBox = drawInput('min');
			rightBox = drawInput('max');
				
			/*var boxStyle = {
				stroke: '#EEE',
				'stroke-width': 1
			};
				
			leftBox = renderer.rect()
				.attr(boxStyle)
				.add();
			
			rightBox = renderer.rect()
				.attr(boxStyle)
				.add();
				
			leftText = renderer.text()
				.add();
			rightText = renderer.text()
				.add();*/
				
		}
		
		leftBox.value = dateFormat('%Y-%m-%d', min);
		rightBox.value = dateFormat('%Y-%m-%d', max);
		
		/*var x = 9.5,
			y = 9.5;*/
		
		
		// update the elements
		/*leftBox.attr({
			x: x,
			y: y,
			width: 90,
			height: 20
		});
		rightBox.attr({
			x: x + 100,
			y: y,
			width: 90,
			height: 20
		});
		leftText.attr({
			x: x + 2.5,
			y: y + 14,
			text: dateFormat('%Y-%m-%d', min)
		});
		rightText.attr({
			x: x + 100 + 2.5,
			y: y + 14,
			text: dateFormat('%Y-%m-%d', max)
		});*/
		
		rendered = true;	
	}
	
	function drawInput(name) {
		var input = createElement('input', {
			name: name,
			type: 'text'
		}, null, div);
		
		input.onmouseover = function() {
			input.style.backgroundColor = '#FFE';
		}
		input.onmouseout = function() {
			input.style.backgroundColor = '';
		}
		
		
		
		return input;
	}
	
	// Run RangeSelector
	init();
	
	// Expose
	return {
		render: render
	}	
}

/* ****************************************************************************
 * End Range Selector code                                                    *
 *****************************************************************************/

HC.addEvent(HC.Chart.prototype, 'beforeRender', function(e) {
	var chart = e.target,
		chartOptions = chart.options;
		
	// initiate the scroller
	if (chartOptions.navigator.enabled || chartOptions.scrollbar.enabled) {
		chart.scroller = Scroller(chart);
	}
	
	// initiate the range selector
	if (chartOptions.rangeSelector.enabled) {
		chart.rangeSelector = RangeSelector(chart);	
	}
});

HC.Chart.prototype.callbacks.push(function(chart) {
	var extremes,
		scroller = chart.scroller,
		rangeSelector = chart.rangeSelector;
		
	if (scroller) {
		
		function render() {
			extremes = chart.xAxis[0].getExtremes();
			scroller.render(extremes.min, extremes.max);
		}
		
		// redraw the scroller on setExtremes
		addEvent(chart.xAxis[0], 'setExtremes', function(e) {
			scroller.render(e.min, e.max);
		});
	
		// redraw the scroller chart resize
		addEvent(chart, 'resize', render);
		
		
		// do it now
		render();
	
	}	
	if (rangeSelector) {
		
		function render2() {
			extremes = chart.xAxis[0].getExtremes();
			rangeSelector.render(extremes.min, extremes.max);
		}
		
		// redraw the scroller on setExtremes
		addEvent(chart.xAxis[0], 'setExtremes', function(e) {
			rangeSelector.render(e.min, e.max);
		});
	
		// redraw the scroller chart resize
		addEvent(chart, 'resize', render2);
		
		
		// do it now
		render2();
	
	}	
});

})();
