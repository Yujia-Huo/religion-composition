//set up width and height
const width =1300;
const height = 900;


const plot = d3.select("#viz");

const svg= plot.append("svg")
    .attr("width", width)
    .attr("height", height)


let pack = d3.pack()
.size([width, height])
.padding(1.5);


    function Parsed(d){
        return {
            Year: +d.Year,
            Region: d.Region,
            Christians: +d.Christians.replace(/,/g, ""),
            Muslims: +d.Muslims.replace(/,/g, ""),
            Unaffiliated: +d.Unaffiliated.replace(/,/g, ""),
            Hindus: +d.Hindus.replace(/,/g, ""),
            Buddhists: +d.Buddhists.replace(/,/g, ""),
            FolkReligions: +d["Folk Religions"].replace(/,/g, ""),
            OtherReligions: +d["Other Religions"].replace(/,/g, ""),
            Jews: +d.Jews.replace(/,/g, ""),
        };
    }

    let filtered_data = [];
d3.csv("./data/religion_comp.csv", Parsed).then(function(data){

    // let color = d3.scaleOrdinal(d3.schemeCategory10);

    
// Prepare the data
    function prepareData(data) {
        let flattenedData = [];
        data.forEach(function(d) {
        Object.keys(d).forEach(function(key) {
            if (key !== 'Year' && key !== 'Region') {
            flattenedData.push({
                year: d.Year,
                region: d.Region,
                group: key,
                value: +d[key]
            });
            }
        });
        });
        return flattenedData;
    }


    let flattenedData = prepareData(data);

    filtered_data = flattenedData.filter(function(d) {
        return d.year === 2010;
      });

    const color = d3.scaleOrdinal()
    .domain([...new Set(flattenedData.map(d => d.group))])
    .range(d3.schemeCategory10);


    // First, get a list of all unique regions
    let regions = [...new Set(filtered_data.map(d => d.region))];

    const x = d3.scalePoint()
    .domain(regions)
    .range([200, width - 100]); 

    // Initialize the simulations and node groups for each region
    let simulations = {};
    let nodeGroups = {};

// Iterate over each unique region
    regions.forEach((region, i) => {
  // Filter the data for the current region
    let regionData = filtered_data.filter(d => d.region === region);

  // Create the nodes for the current region
    let nodes = [];
    regionData.forEach(d => {
    let circleCount = Math.round(d.value / 6000000);
        for (let i = 0; i < circleCount; i++) {
            nodes.push({
            radius: 5,
            group: d.group
            });
        }
    });

  // Create the node group for the current region
    let nodeGroup = svg.append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr('class',d=>d.group )
    .attr('r', d => d.radius)
    .style("fill", d => color(d.group))
    .style("fill-opacity", 0.8)
    .attr("stroke", "black")
    .style("stroke-width", 1);


    svg.append("text")
    .attr("x", x(region))
    .attr("y", 50)  // adjust this value as needed
    .style("text-anchor", "middle")
    .style("font-size", "20px") // adjust this value as needed
    .style("fill", "black")
    .text(region);

  // Initialize the simulation for the current region
    let simulation = d3.forceSimulation(nodes)
    .force("x", d3.forceX().strength(1).x((i + 1) * (width / (regions.length + 0.5)))) // Adjust the x-position based on the region index
    .force("y", d3.forceY().strength(0.1).y(height / 2))
    .force("center", d3.forceCenter().x((i + 1) * (width / (regions.length + 0.5))).y(height / 2)) // Adjust the center position based on the region index
    .force("charge", d3.forceManyBody().strength(8))
    .force("collide", d3.forceCollide().strength(.1).radius(8).iterations(1));

  // Store the simulation and node group for the current region
  simulations[region] = simulation;
  nodeGroups[region] = nodeGroup;
});

// Set up the tick function for each simulation
Object.values(simulations).forEach(simulation => {
simulation.on("tick", () => {
    Object.values(nodeGroups).forEach(nodeGroup => {
    nodeGroup
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    });
});
});




    // Create a list of all unique groups in your data
let uniqueGroups = [...new Set(flattenedData.map(d => d.group))];

// Create a group for all the legend elements
let legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + (width-200) + "," + (height - 20 * uniqueGroups.length) + ")");

// Add one dot in the legend for each unique group
legend.selectAll(null)
    .data(uniqueGroups)
    .enter()
    .append("circle")
    .attr("cy", function(d, i) { return i * 20; }) // 20 is the line height
    .attr("r", 7)
    .style("fill", d => color(d));

// Add labels for each dot
legend.selectAll(null)
    .data(uniqueGroups)
    .enter()
    .append("text")
    .attr("x", 10)
    .attr("y", function(d, i) { return i * 20; }) // 20 is line height
    .text(d => d)
    .style("alignment-baseline", "middle");



    function update() {
        const checkedGroups = [];
        d3.selectAll(".option").each(function(d) {
          const cb = d3.select(this);
          const grp = cb.property("value");
      
          if (cb.property("checked")) {
            checkedGroups.push(grp);
            svg.selectAll("." + grp).transition().duration(1000).style("fill-opacity", 1);
          } else {
            svg.selectAll("." + grp).transition().duration(1000).style("fill-opacity", function(d) {
              return checkedGroups.includes(d.group) ? 1 : 0;
            });
          }
        });
      }
      


    function selectAll() {
        d3.selectAll(".option").property("checked", true);
        update();
      }
      
      function deselectAll() {
        d3.selectAll(".option").property("checked", false);
        update();
      }


      d3.select("#select-all-btn")
  .on("click", selectAll);

// Add Deselect All button
d3.select("#deselect-all-btn")
  .on("click", deselectAll);



    d3.selectAll(".option").on("change",update);
    update()

    d3.select("#year-select").on("change", function() {
        // Get the selected year
        const selectedYear = +d3.select(this).property("value");
      
        // Filter the data based on the selected year
        filtered_data = flattenedData.filter(function(d) {
          return d.year === selectedYear;
        });
      
        // Remove all existing circles
        svg.selectAll("circle").remove();
      
        // Iterate over each unique region
        regions.forEach((region, i) => {
          // Filter the data for the current region
          let regionData = filtered_data.filter(d => d.region === region);
      
          // Create the nodes for the current region
          let nodes = [];
          regionData.forEach(d => {
            let circleCount = Math.round(d.value / 6000000);
            for (let i = 0; i < circleCount; i++) {
              nodes.push({
                radius: 5,
                group: d.group
              });
            }
          });
      
          // Create the node group for the current region
          let nodeGroup = svg.append("g")
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr('class', d => d.group)
            .attr('r', d => d.radius)
            .style("fill", d => color(d.group))
            // .style("fill-opacity", 0.8)
            .attr("stroke", "black")
            .style("stroke-width", 1);
      
          // Initialize the simulation for the current region
          let simulation = d3.forceSimulation(nodes)
            .force("x", d3.forceX().strength(1.5).x((i + 1) * (width / (regions.length + 0.5)))) // Adjust the x-position based on the region index
            .force("y", d3.forceY().strength(0.1).y(height / 2))
            .force("center", d3.forceCenter().x((i + 1) * (width / (regions.length + 0.5))).y(height / 2)) // Adjust the center position based on the region index
            .force("charge", d3.forceManyBody().strength(8))
            .force("collide", d3.forceCollide().strength(.1).radius(8).iterations(1));
      
          // Store the simulation and node group for the current region
          simulations[region] = simulation;
          nodeGroups[region] = nodeGroup;
        });
      
        // Set up the tick function for each simulation
        Object.values(simulations).forEach(simulation => {
          simulation.on("tick", () => {
            Object.values(nodeGroups).forEach(nodeGroup => {
              nodeGroup
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
            });
          });
        });
        update()
      });
      
})