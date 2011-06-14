$(function() {
	var chart = new Highcharts.StockChart({
	    
	    chart: {
	        renderTo: 'container',
	        margin: 0,
	        borderWidth: 1
	    },
	    
	    rangeSelector: {
	    	selected: 1
	    },
	    
	    yAxis: {
	    },
	    
	    series: [{
	        name: 'USD to EUR',
	        data: usdeur
	    }]
	});
});