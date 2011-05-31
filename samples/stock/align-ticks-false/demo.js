var chart = new Highcharts.StockChart({
    chart: {
        renderTo: 'container',
        alignTicks: false
    },
    yAxis: [{
        title: {
            text: 'GOOGL'
        }
    }, {
        title: {
            text: 'MSFT'
        },
        gridLineWidth: 0,
        opposite: true
    }],
    series: [{
        name: 'GOOGL',
        data: GOOGL
    }, {
        name: 'MSFT',
        data: MSFT,
        yAxis: 1
    }]
});