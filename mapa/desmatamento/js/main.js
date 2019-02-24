var areas = {
    "AC": {
        "current": 0.0,
        "total": 152581.0
    },
    "AP": {
        "current": 0.0,
        "total": 142815.0
    },
    "AM": {
        "current": 0.0,
        "total": 1571000.0
    },
    "MA": {
        "current": 0.0,
        "total": 331983.0
    },
    "MT": {
        "current": 0.0,
        "total": 903357.0
    },
    "PA": {
        "current": 0.0,
        "total": 1248000.0
    },
    "RO": {
        "current": 0.0,
        "total": 237576.0
    },
    "RR": {
        "current": 0.0,
        "total": 224299.0
    },
    "TO": {
        "current": 0.0,
        "total": 277621.0
    }
}

const numberFormatter = (number, fractionDigits = 0, thousandSeperator = ",", fractionSeperator = ".") => {
    if (number!==0 && !number || !Number.isFinite(number)) return number
    const frDigits = Number.isFinite(fractionDigits)? Math.min(Math.max(fractionDigits, 0), 7) : 0
    const num = number.toFixed(frDigits).toString()

    const parts = num.split(".")
    let digits = parts[0].split("").reverse()
    let sign = ""
    if (num < 0) {sign = digits.pop()}
    let final = []
    let pos = 0

    while (digits.length > 1) {
        final.push(digits.shift())
        pos++
        if (pos % 3 === 0) {final.push(thousandSeperator)}
    }
    final.push(digits.shift())
    return `${sign}${final.reverse().join("")}${frDigits > 0 ? fractionSeperator : ""}${frDigits > 0 && parts[1] ? parts[1] : ""}`
}

var mapDiv = document.getElementById("map"),
    width = mapDiv.clientWidth,
    height = mapDiv.clientHeight;

var selecting = false;

var colors = d3.scaleQuantize()
    .domain([0, 100])
    .range(["#00ff00", "#ffff00", "#ff0000"]);

var radius = d3.scaleLinear()
    .domain([0, 20000])
    .range([3, 30]);


var projection = d3.geoMercator();
var path = d3.geoPath().projection(projection);

var map = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

var amazon,
    states,
    marks;

var zoomFactor = 0,
    loaded = false;

var userAlreadyInteracted = false;

d3.json("data/limite_amz_legal.json").then(function(geojson) {
    amazon = topojson.feature(geojson, geojson.objects.limite_amz_legal);
    draw();
});
d3.json("data/limite_estados_br.json").then(function(geojson) {
    states = topojson.feature(geojson, geojson.objects.limite_estados_br);
    draw();
});
d3.json("data/pontos_municipios_destamatamento.geojson").then(function(geojson) {
    marks = geojson;
    draw();
});


map.on("mousedown touchstart", function() {
    var p = d3.mouse(this);
    if (!selecting) {
        map.selectAll("rect.selection").remove();
        map.selectAll(".mark").classed("selected", false);
    };
    selecting = true;
    userAlreadyInteracted = true;

    map.append("rect")
        .attr("class", "selection")
        .attr("x", p[0])
        .attr("y", p[1])
        .attr("width", 0)
        .attr("height", 0);
    Object.keys(areas).forEach((key) =>{
        areas[key].current = parseFloat(0.0).toFixed(2);
    });

    if (width <= 1250) {
        d3.selectAll("#map-keys,#instructions,#zoom-control,#title").classed("hide", true);
    }

}).on("mousemove touchmove", function() {
    d3.event.preventDefault();
    var s = map.select("rect.selection");

    if( !s.empty() && selecting) {
        var p = d3.mouse(this),
            x = s.attr("x"),
            y = s.attr("y"),
            selectionwidth = s.attr("width"),
            selectionheight = s.attr("height"),
            movex = p[0] - x,
            movey = p[1] - y;

        if (movex < 1 || (movex*2<selectionwidth)) {
            x = p[0];
            selectionwidth -= movex;
        } else {
            selectionwidth = movex;
        }

        if( movey < 1 || (movey*2<selectionheight)) {
            y = p[1];
            selectionheight -= movey;
        } else {
            selectionheight = movey;
        }

        s.attr("x", x)
            .attr("y", y)
            .attr("width", selectionwidth)
            .attr("height", selectionheight);

        map.selectAll(".mark").classed("selected", function (d) {
            var t = d3.select(this).attr("transform"),
                translate = t.substring(t.indexOf("(")+1, t.indexOf(")")).split(","),
                markX = parseFloat(translate[0]),
                markY = parseFloat(translate[1]);

            var selection = map.select("rect.selection"),
                selectionXStart = parseInt(selection.attr("x")),
                selectionYStart = parseInt(selection.attr("y")),
                selectionXEnd = selectionXStart + parseInt(selection.attr("width")),
                selectionYEnd = selectionYStart + parseInt(selection.attr("height"));

            if (
                selectionXStart <= markX && selectionXEnd >= markX &&
                selectionYStart <= markY && selectionYEnd >= markY
            ) return true
        });

        Object.keys(areas).forEach((key) =>{
            areas[key].current = parseFloat(0.0).toFixed(2);
        });
        map.selectAll(".mark.selected").each(function (d) {
            result = parseFloat(areas[d.properties.Uf].current) + parseFloat(d.properties.Desm2016);
            areas[d.properties.Uf].current = result.toFixed(2);
        });

        if (d3.event.type == "mousemove") {
            Object.keys(areas).forEach((key) =>{
                percentage = parseFloat(areas[key].current) / areas[key].total * 100;
                document.querySelector("#" + key + " .progress").style.width = percentage.toFixed(2) + "%";
                document.querySelector("#" + key + " .percentage").innerHTML = percentage.toFixed(0);
                document.querySelector("#" + key + " .value").innerHTML = numberFormatter(parseFloat(areas[key].current), 2, ".", ",");
            });
        }

    }
}).on("mouseup touchend", () => {
    d3.event.stopPropagation();
    selecting = false;
    if (width > 1250) {
        d3.selectAll("#map-keys,#instructions,#zoom-control,#title").classed("hide", false);
    }
    Object.keys(areas).forEach((key) =>{
        percentage = parseFloat(areas[key].current) / areas[key].total * 100;
        document.querySelector("#" + key + " .progress").style.width = percentage.toFixed(2) + "%";
        document.querySelector("#" + key + " .percentage").innerHTML = percentage.toFixed(0);
        document.querySelector("#" + key + " .value").innerHTML = numberFormatter(parseFloat(areas[key].current), 2, ".", ",");
    });
    if ((d3.event.type == "touchend" || width <= 1250) && map.selectAll(".mark.selected").size() > 0) {
        document.querySelector("#graph").style.visibility = 'visible';
        document.querySelector("#graph").style.opacity = 1;
    } else {
        d3.selectAll("#map-keys,#instructions,#zoom-control,#title").classed("hide", false);
    }
});

d3.select("#graph").on("touchstart mousedown orientationchange", () => {
    d3.event.preventDefault();
    d3.event.stopPropagation();
    selecting = false;
    document.querySelector("#graph").style.opacity = 0;
    document.querySelector("#graph").style.visibility = 'hidden';
    map.selectAll(".mark").classed("selected", false);
    map.select("rect.selection").remove();

    if (width <= 1250) {
        d3.selectAll("#map-keys,#instructions,#zoom-control,#title").classed("hide", false);
    }
    Object.keys(areas).forEach((key) =>{
        areas[key].current = parseFloat(0.0).toFixed(2);
        percentage = parseFloat(areas[key].current) / areas[key].total * 100;
        document.querySelector("#" + key + " .progress").style.width = percentage.toFixed(2) + "%";
        document.querySelector("#" + key + " .percentage").innerHTML = percentage.toFixed(0);
        document.querySelector("#" + key + " .value").innerHTML = numberFormatter(parseFloat(areas[key].current), 2, ".", ",");
    });
    draw();
});


function draw() {
    if (loaded == false && amazon != undefined && states != undefined && marks != undefined) {
        loaded = true;
        document.querySelector("#loading").style.opacity = 0;
    }
    if (!loaded) return;
    selecting = false;
    map.selectAll(".mark").classed("selected", false);
    map.select("rect.selection").remove();
    map.selectAll("path, .mark").remove();
    Object.keys(areas).forEach((key) => {
        areas[key].current = parseFloat(0.0).toFixed(2);
        percentage = parseFloat(areas[key].current) / areas[key].total * 100;
        document.querySelector("#" + key + " .progress").style.width = percentage.toFixed(2) + "%";
        document.querySelector("#" + key + " .percentage").innerHTML = percentage.toFixed(0);
        document.querySelector("#" + key + " .value").innerHTML = numberFormatter(parseFloat(areas[key].current), 2, ".", ",");
    });

    width = mapDiv.clientWidth;
    height = mapDiv.clientHeight;

    d3.selectAll("#map-keys,#instructions,#zoom-control,#title").classed("hide", false);

    if (width > 1250) {
        document.querySelector("#graph").style.opacity = 1;
        document.querySelector("#graph").style.visibility = 'visible';
    } else {
        document.querySelector("#graph").style.opacity = 0;
        document.querySelector("#graph").style.visibility = 'hidden';
    }

    projection.fitExtent([
        [width * 0.35 - zoomFactor, width * 0.1 - zoomFactor],
        [width - (width * 0.1) + zoomFactor, height - (height * 0.1) + zoomFactor]
    ], marks);

    map = d3.select("#map svg")
        .attr("width", width)
        .attr("height", height);

    map.selectAll("path")
        .data(amazon.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "#0a0e1e")
        .attr("fill-opacity", 1);

    map.selectAll("path")
        .data(states.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "#101530")
        .attr("fill-opacity", 0)
        .attr("stroke", "#303757");

    map.selectAll(".mark")
        .data(marks.features)
        .enter()
        .append("circle")
        .attr("class","mark")
        .attr("r", function (d) { return radius(d.properties.Desm2016); })
        .style("fill", function(d) { return colors(d.properties.desmat_percent); })
        .attr("fill-opacity", 0.25)
        .attr("transform", function(d) {
            return "translate(" + projection([d.geometry.coordinates[0], d.geometry.coordinates[1]]) + ")";
        });
    init();
}

window.addEventListener("resize", draw);

function zoomIn() {
    zoomFactor += 50;
    if (zoomFactor > 300) zoomFactor = 300;
    draw();
}
function zoomOut() {
    zoomFactor -= 50;
    if (zoomFactor < -100) zoomFactor = -100;
    draw();
}

d3.select("#zoom-control .zoom-in").on("touchstart click", () => {
    d3.event.preventDefault();
    d3.event.stopPropagation();
    zoomIn();
});

d3.select("#zoom-control .zoom-out").on("touchstart click", () => {
    d3.event.preventDefault();
    d3.event.stopPropagation();
    zoomOut();
});

function init() {
    if (userAlreadyInteracted) return;
    map.selectAll(".mark").classed("selected", true);
    map.selectAll(".mark.selected").each(function (d) {
        result = parseFloat(areas[d.properties.Uf].current) + parseFloat(d.properties.Desm2016);
        areas[d.properties.Uf].current = result.toFixed(2);
    });
    Object.keys(areas).forEach((key) => {
        percentage = parseFloat(areas[key].current) / areas[key].total * 100;
        document.querySelector("#" + key + " .progress").style.width = percentage.toFixed(2) + "%";
        document.querySelector("#" + key + " .percentage").innerHTML = percentage.toFixed(0);
        document.querySelector("#" + key + " .value").innerHTML = numberFormatter(parseFloat(areas[key].current), 2, ".", ",");
    });
}