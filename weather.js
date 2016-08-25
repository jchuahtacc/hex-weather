var map = null;
var mode = "#edit";
// next button onClick event
//
// Creates the next state with a call to map.next()
// The new state is loaded into the HexMap.
// Additionally, it is output to the HTML textarea.
function next() {
    var nextState = map.next();
    map.fromJson(nextState);
    d3.select("#json").html(JSON.stringify(nextState, null, "\t"));
}

// load button onClick event
function load() {
    // Get the textaera contents, strip all whitespace
    var dump = document.getElementById("json").value.trim().replace(/\s/g, ""); 
    // Parse the text area contents as a Json
    this.map.fromJson(JSON.parse(dump)); 
}

// Set editor mode upon tab click
function attachTabListener() {
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        mode = $(e.target).attr("href"); 
    });
}

// When document finishes loading, initialize the Hex Map
document.addEventListener("DOMContentLoaded", function(event) {
    attachTabListener();

    const columns = 6;
    const rows = 4;
    const radius = Math.min(document.body.clientWidth * 0.6 / columns / 2, document.body.clientHeight * 1.0 / rows / 2);
    const edge = 10;

    // properties initializer object
    var properties = { 
        radius : radius,
        edge : edge,
        hex : WeatherHex,
        constructors : { "WeatherHex" : WeatherHex }
    };
    map = new HexMap("#hexmap", properties); 
    map.buildRect(columns, rows);
    map.draw();
});
