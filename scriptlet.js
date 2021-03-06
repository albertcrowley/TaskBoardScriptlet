

function startChart () {
    var table = jQuery("#issuetable").first();
    var people = [];
    categories = ['NotReady', 'ReadyForDev', 'PeerReview', 'QA', 'Done'];
    series = [];
    ASSIGNED = 0;
    UNASSIGNED = 1;
    COLORS = [[205, 82, 217],[109, 179, 50],[118, 108, 204],[196, 146, 58],[185, 81, 166],[211, 73, 115],[77, 162, 150],[213, 75, 51],[117, 159, 209],[151, 81, 55],[77, 87, 122],[76, 94, 43],[201, 138, 176],[126, 59, 93],[205, 82, 217],[109, 179, 50],[118, 108, 204],[196, 146, 58],[185, 81, 166],[103, 163, 88],[211, 73, 115],[77, 162, 150],[213, 75, 51],[117, 159, 209],[151, 81, 55],[77, 87, 122],[76, 94, 43],[201, 138, 176],[126, 59, 93]  ];


    rows = jQuery(table).find("tr.issuerow");

    report = [];

    jQuery.each(rows, function (idx, row) {
        var rowdata = {};
        rowdata.summary = jQuery(row).find(".summary").text().trim();
        rowdata.status = jQuery(row).find(".status").text().trim();
        rowdata.assignee = jQuery(row).find(".assignee").text().trim();
        rowdata.timeoriginalestimate = jQuery(row).find(".timeoriginalestimate").text().trim();
        rowdata.issuekey = jQuery(row).find(".issuekey").text().trim();
        report.push(rowdata);
    });

    buckets = {};
    buckets.NotReady = [];
    buckets.ReadyForDev = [];
    buckets.PeerReview = [];
    buckets.QA = [];
    buckets.Done = [];



    stati = [];

    jQuery.each(report, function (idx, row) {
        stati.push(row.status);


        /* check to see if any special conditions will set this row to a different category than the status would suggest */

        row = checkForSpecialCase(row);

            switch (row.status) {
                case "Open":
                case "Ready for Development":
                case "Development in Progress":
                case "Tech Review in Progress":
                case "Needs More Work":
                    addToBucket(row, buckets, "ReadyForDev", series, people);
                    break;
                case "Ready for Code Review":
                case "Code Review in Progress":
                    addToBucket(row, buckets, "PeerReview", series, people);
                    break;
                case "Ready for QA Review":
                case "QA Review in Progress":
                    addToBucket(row, buckets, "QA", series, people);
                    break;
                case "Ready for Security Audit":
                case "Ready for UAT Review":
                case "Ready for Data QA":
                case "Data QA in Progress":
                case "Ready for Production":
                case "Ready for Customer Review":
                case "In Production":
                case "Closed":
                    addToBucket(row, buckets, "Done", series, people);
                    buckets.Done.push(row);
                    break;
                case "On Hold":
                case "Needs Elaboration":
                case "Elaboration in Progress":
                default:
                    addToBucket(row, buckets, "NotReady", series, people);
                    break;
            }
    });


    /*
    console.log(categories);
    console.log(series);
    console.log(people);
    */

    drawChart(categories, series);

};

function addToBucket(row, buckets, category, series, people) {
    if (_.indexOf(people, row.assignee) == -1) {
        people.push(row.assignee);
    }
    var colorTripple = COLORS[_.indexOf(people, row.assignee)];
    var colorString = rgbToHex(colorTripple[0], colorTripple[1], colorTripple[2]);
    buckets[category].push(row);
    var stack =  (row.assignee.toLowerCase() == 'unassigned') ? "unassigned" : "assigned";
    var data = [null,null,null,null,null];

    data[_.indexOf(categories, category)] += convertTime(row.timeoriginalestimate);
    series.push({ name: row.summary, data: data, stack: stack, assignee: row.assignee, status: row.status, issuekey: row.issuekey, color: colorString });

    //console.log("setting " + row.issuekey + " to category "+ category +".  It has status " + row.status);
};


function checkForSpecialCase(row) {
    var who = row.assignee.toLowerCase();
    if (who.indexOf("jose") > -1 || who.indexOf("tsitsi") > -1) {
        //console.log("fixing category for oddball element");
        row.status = "Assigned to a Non-Developer";
    }

    return row;

}

function convertTime(time_string) {
    var time = parseInt(time_string);
    if (time == 0) {
        time = 1; //set to min of 1 so it shows in the graph
    }
    return time;
};

function drawChart(categories, series) {
    //console.log(series);
	jQuery("body").prepend("<div id='report'></div>");
        jQuery('div#report').highcharts({
            chart: {
                type: 'column'
            },
            title: {
                text: 'Agile Task Board'
            },
            xAxis: {
                categories: categories
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Number of Hours'
                },
                stackLabels: {
                    enabled: true,
                    style: {
                        fontWeight: 'bold',
                        color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                    }
                }
            },
            legend: { enabled: false},
            tooltip: {
                headerFormat: '<b>{point.x}</b><br/>',
                formatter:  function() {
                    return "Title:<b>" + this.series.name + "</b><br/>Ticket#: " + series[this.series._i].issuekey + "<br/>Assigned: " + series[this.series._i].assignee + "<br>Status: " + series[this.series._i].status;
                }
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
                        /* don't think I want this ....but not sure ,formatter: function () { return "custom label for each block";} */
                    }
                },
                series: {
                    cursor: 'pointer',
                    stacking: 'normal',
                    events: {
                        click: function () { window.open("/jira/browse/" + this.options.issuekey, '_blank'); }
                    }
                }
            },
            series: series
        });

}


function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function addControls() {
	var click= 'jQuery("div#report").remove(); jQuery("a#report").remove(); ';
	jQuery("div#report").after("<div><a id='report' onClick='" + click + "'>Close Task Board</a></div>")

	click = 'var height = jQuery("div#report").height() + 200; jQuery("div#report").height(height); setTimeout (function() {var chart = jQuery("div#report").highcharts(); chart.reflow();}, 100);'
	jQuery("div#report").after("<div><a id='report' onClick='" + click + "'>Enlarge Task Board</a></div>")
}

jQuery.getScript("https://code.highcharts.com/highcharts.js", function() {
	jQuery.getScript("https://code.highcharts.com/modules/exporting.js", function() {
		jQuery.getScript("https://code.highcharts.com/modules/offline-exporting.js", function() {
			startChart();
			addControls();
		});
	});
});