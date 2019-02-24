var states = {
    "11": "Rondônia",
    "12": "Acre",
    "13": "Amazonas",
    "14": "Roraima",
    "15": "Pará",
    "16": "Amapá",
    "17": "Tocantins",
    "21": "Maranhão",
    "22": "Piauí",
    "23": "Ceará",
    "24": "Rio Grande do Norte",
    "25": "Paraíba",
    "26": "Pernambuco",
    "27": "Alagoas",
    "28": "Sergipe",
    "29": "Bahia",
    "31": "Minas Gerais",
    "32": "Espírito Santo",
    "33": "Rio de Janeiro",
    "35": "São Paulo",
    "41": "Paraná",
    "42": "Santa Catarina",
    "43": "Rio Grande do Sul",
    "50": "Mato Grosso do Sul",
    "51": "Mato Grosso",
    "52": "Goiás",
    "53": "Distrito Federal"
}

var mapDiv = document.getElementById("map"),
    width = mapDiv.clientWidth,
    height = mapDiv.clientHeight;

var heatColors = d3.scaleOrdinal()
    .domain([3,100,251,514,1036])
    .range([0.2, 0.4, 0.6, 0.8, 1])

var projection = d3.geoMercator();
var path = d3.geoPath().projection(projection);

var map = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

var tolltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

var cities,
    heatmap;

var zoomFactor = 0,
    loaded = false;

d3.json("data/limite_municipios.geojson").then(function(geojson) {
    cities = geojson;
    draw();
});
d3.json("data/heatmap_polygons.geojson").then(function(geojson) {
    heatmap = geojson;
    draw();
});

function draw() {
    if (loaded == false && cities != undefined && heatmap != undefined) {
        loaded = true;
        document.querySelector("#loading").style.opacity = 0;
    }
    if (!loaded) return;
    map.selectAll("path").remove();

    width = mapDiv.clientWidth;
    height = mapDiv.clientHeight;

    projection.fitExtent([
        [width * 0.05 - zoomFactor, width * 0.05 - zoomFactor],
        [width - (width * 0.05) + zoomFactor, height - (height * 0.05) + zoomFactor]
    ], heatmap);

    map = d3.select("#map svg")
        .attr("width", width)
        .attr("height", height);

    map.selectAll("path")
        .data(heatmap.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "red")
        .attr("fill-opacity", function (d) { return heatColors(d.properties.DN) });

    map.selectAll("path")
        .data(cities.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill-opacity", 0)
        .attr("stroke", "#fff")
        .attr("stroke-opacity", 0.1)
        .on("mouseover", function(d) {

            let state = states[d.properties.GEOCODIGO.substring(0, 2)];

            tolltip.transition()
                .duration(200)
                .style("opacity", .9);
            tolltip.html("<h4>" + d.properties.NOME +"</h4><h5>" + state + "</h5><span>" + d.properties.NUMPOINTS + "</span> áreas embargadas" )
                .style("left", (d3.event.pageX - 67) + "px")
                .style("top", (d3.event.pageY - 95) + "px");
        }).on("mousemove", function(d) {
            tolltip
                .style("left", (d3.event.pageX - 67) + "px")
                .style("top", (d3.event.pageY - 95) + "px");
        }).on("mouseout", function(d) {
            tolltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
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
