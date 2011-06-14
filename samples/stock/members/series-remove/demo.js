$(function() {
	var chart = new Highcharts.StockChart({
	    
	    chart: {
	        renderTo: 'container'
	    },
	    
	    rangeSelector: {
	    	selected: 1
	    },
	    
	    series: [{
	        name: 'USD to EUR',
	        data: usdeur
	    }]
	});
	
	$('#button').click(function() {
		if (chart.series.length) {
			chart.series[0].remove();
		}
	});
});