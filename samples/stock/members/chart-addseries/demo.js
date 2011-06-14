$(function() {
	var chart = new Highcharts.StockChart({
	    
	    chart: {
	        renderTo: 'container'
	    },
	    
	    rangeSelector: {
	    	selected: 1
	    }
	});
	
	$('#button').click(function() {
		var i = chart.series.length,
			optionsSets = [{
				name: 'MSFT',
				data: MSFT
			}, {
				name: 'ADBE',
				data: ADBE
			}, {
				name: 'GOOGL',
				data: GOOGL
			}];
		
		if (i < 3) {
			chart.addSeries(optionsSets[i]);
		}
	});
});