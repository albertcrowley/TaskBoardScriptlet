jQuery("document").ready(function () {
    var table = jQuery("#issuetable").first();

    rows = jQuery(table).find("tr.issuerow");

    report = [];

    jQuery.each(rows, function (idx, row) {
        var rowdata = {};
        rowdata.summary = jQuery(row).find(".summary").text().trim();
        rowdata.status = jQuery(row).find(".status").text().trim();
        rowdata.assignee = jQuery(row).find(".assignee").text().trim();
        rowdata.timeoriginalestimate = jQuery(row).find(".timeoriginalestimate").text().trim();
        report.push(rowdata);
    });

    buckets = {};
    buckets.NotReady = [];
    buckets.ReadyForDev = [];
    buckets.PeerReview = [];
    buckets.QA = [];
    buckets.Done = [];

    categories = ['NotReady', 'ReadyForDev', 'PeerReview', 'QA', 'Done'];
    series = [{ name: 'Assigned', data: [0, 0, 0, 0, 0] }, { name: 'Unassigned', data: [0, 0, 0, 0, 0] }];
    ASSIGNED = 0;
    UNASSIGNED = 1;


    stati = [];

    jQuery.each(report, function (idx, row) {
        stati.push(row.status);


        if (!checkForSpecialCase(row, buckets)) {  // only do the switch if this is not a special case
            switch (row.status) {
                case "Open":
                case "Ready for Development":
                case "Development in Progress":
                    addToBucket(row, buckets, "ReadyForDev", series);
                    break;
                case "Ready for Code Review":
                case "Code Review in Progress":
                    addToBucket(row, buckets, "PeerReview", series);
                    break;
                case "Ready for QA Review":
                case "QA Review in Progress":
                    addToBucket(row, buckets, "QA", series);
                    break;
                case "Ready for Security Audit":
                    addToBucket(row, buckets, "Done", series);
                    buckets.done.push(row);
                    break;
                default:
                    addToBucket(row, buckets, "NotReady", series);
                    break;
            }
        }
    });




    drawChart(categories, series);

});

function addToBucket(row, buckets, category, series) {
    buckets[category].push(row);
    if (row.assignee.toLowerCase() == 'unassigned') {
        series[UNASSIGNED].data[_.indexOf(categories, category)] += convertTime(row.timeoriginalestimate);
    } else {
        series[ASSIGNED].data[_.indexOf(categories, category)] += convertTime(row.timeoriginalestimate);
    }
};


function checkForSpecialCase(row, buckets) {
    var who = row.assignee.toLowerCase();
    if (who.indexOf("jose") > -1 || who.indexOf("tsitsi") > -1) {
        // In general, this one is not ready for work no matter what the state because it's assigned to the RA team
        console.log(row);
        buckets.NotReady.push(row);
            series[ASSIGNED].data[_.indexOf(categories, "NotReady")] += convertTime(row.timeoriginalestimate);
    }

}

function convertTime(time_string) {
    return parseInt(time_string);

};

function drawChart(categories, series) {
        jQuery('div#report').highcharts({
            chart: {
                type: 'column'
            },
            title: {
                text: 'Stacked column chart'
            },
            xAxis: {
                categories: categories
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Total fruit consumption'
                },
                stackLabels: {
                    enabled: true,
                    style: {
                        fontWeight: 'bold',
                        color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                    }
                }
            },
            legend: {
                align: 'right',
                x: -30,
                verticalAlign: 'top',
                y: 25,
                floating: true,
                backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
                borderColor: '#CCC',
                borderWidth: 1,
                shadow: false
            },
            tooltip: {
                headerFormat: '<b>{point.x}</b><br/>',
                pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
            },
            plotOptions: {
                column: {
                    stacking: 'normal',
                    dataLabels: {
                        enabled: true,
                        color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white',
                        style: {
                            textShadow: '0 0 3px black'
                        }
                    }
                }
            },
            series: series
        });

}
