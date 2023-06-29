//set up width and height
const width = 1500;
const height = 900;



const svg = d3.select("#viz")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("preserveAspectRatio", "xMidYMid meet");


//paese data
function Parsed(d) {
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
d3.csv("./data/religion_comp.csv", Parsed).then(function (data) {

  // let color = d3.scaleOrdinal(d3.schemeCategory10);


  // Prepare the data
  function prepareData(data) {
    let flattenedData = [];

    data.forEach(function (d) {
      Object.keys(d).forEach(function (key) {
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


  //filter data by year
  filtered_data = flattenedData.filter(function (d) {
    return d.year === 2010;
  });

  let totalByRegion = {};


  filtered_data.forEach(d => {
    if (!totalByRegion[d.region]) {
      totalByRegion[d.region] = 0;
    }
    totalByRegion[d.region] += d.value;
  });

  console.log(totalByRegion);


  const color = d3.scaleOrdinal()
    .domain([...new Set(flattenedData.map(d => d.group))])
    .range(d3.schemeTableau10);


  // First, get a list of all unique regions
  let regions = [...new Set(filtered_data.map(d => d.region))];

  const x = d3.scalePoint()
    .domain(regions)
    .range([100, width - 210]);

  // Initialize the simulations and node groups for each region
  let simulations = {};
  let nodeGroups = {};
  let centroids = {};
  // Iterate over each unique region
  regions.forEach((region, i) => {
    // Filter the data for the current region
    let regionData = filtered_data.filter(d => d.region === region);

    console.log(regionData);

    // Create the nodes for the current region
    let nodes = [];
    regionData.forEach(d => {
      let circleCount = Math.round(d.value / 5000000);
      for (let i = 0; i < circleCount; i++) {
        nodes.push({
          radius: 4,
          group: d.group,
          region: d.region
        });
      }
    });

    // Create the node group for the current region

    let nodeGroupG = svg.append("g")

    let rectData = [
      {
        width: '137pt',
        height: '250pt',
        x: x(region) - 90,
        y: 200,
        region: region,
        value1: regionData[0].value // assuming region is a variable in your code
      }
    ];

    // console.log(rectData.value1)


    let nodeGroup = nodeGroupG
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr('class', d => `clusterCircle ${d.group}`)
      .attr('r', d => d.radius)
      .style("fill", d => color(d.group))
      .style("fill-opacity", 0.8)
      .attr("stroke", "black")
      .style("stroke-width", 0.3);


    console.log(nodeGroup);
    let rect = nodeGroupG.selectAll('.bg')
      .data(rectData)
      .join('rect')
      .attr('width', d => d.width)
      .attr('height', d => d.height)
      .attr('class', d => `bg ${d.region}`)
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .style('fill', 'transparent');

    rect
      .on('mouseover', (event, d) => {
        let region = d.region;
        const format = d3.format(",");
        let totalText = svg.append("text")
          .attr("class", "hover-text") // add a class to remove later
          .attr("x", (x(region)))
          .attr("y", 600) // adjust this value as needed
          .style("text-anchor", "start")
          .style("font-size", "16px") // adjust this value as needed
          .style("fill", "black")
          .style("font-weight", "bold")
          .text("Total: ");

        totalText.append("tspan")
          .style("font-weight", "normal")
          .text(format(totalByRegion[region]));


        console.log(selectedReligions);

        selectedReligions.forEach((selectedReligion, i) => {
          let selectedReligionData = regionData.find(religionData => religionData.group === selectedReligion);

          if (selectedReligionData) {
            let religiousText = svg.append("text")
              .attr("class", "hover-text")
              .attr("x", (x(region)))
              .attr("y", 620 + i * 20)
              .style("text-anchor", "start")
              .style("font-size", "16px")
              .style("fill", "black")
              .style("font-weight", "bold")
              .text(`${selectedReligionData.group}:`);

            religiousText.append("tspan")
              .attr("class", "hover-text")
              .style("font-weight", "normal")
              .style("text-anchor", "start")
              .style("font-size", "16px")
              .style("fill", "black")
              .text(` ${format(selectedReligionData.value)}`);
          }
        });



        svg.append("path")
          .attr("class", "hover-line") // add a class to remove later
          .attr("d", `M ${centroids[region].x} ${centroids[region].y} L ${breakPoint.x} ${breakPoint.y} L ${x(region) + 30} 600`) // adjust this value as needed
          .attr("stroke", "black")
          .attr("stroke-width", .5)
          .attr("fill", "none");
      })
      .on("mouseout", function () {
        // Remove the text and line when mouse is moved out
        d3.selectAll('.hover-text').remove();
        d3.selectAll('.hover-line').remove();
      });
    centroids[region] = {
      x: (i + 1) * (width / (regions.length + .4)) - 120,
      y: height / 2

    };

    let breakPoint = {
      x: centroids[region].x,
      y: ((centroids[region].y + 600) / 2) // adjust this value as needed
    };

    // console.log(nodes);
    svg.append("text")
      .attr("x", (x(region)))
      .attr("y", 100)  // adjust this value as needed
      .style("text-anchor", "middle")
      .style("font-size", "20px") // adjust this value as needed
      .style("fill", "black")
      .text(region);


    // Initialize the simulation for the current region

    let simulation = d3.forceSimulation(nodes)
      .force("x", d3.forceX().strength(1).x((i + 1) * (width / (regions.length + .4)) - 120)) // Adjust the x-position based on the region index
      .force("y", d3.forceY().strength(0.1).y(height / 2))
      .force("center", d3.forceCenter().x((i + 1) * (width / (regions.length + .4)) - 120).y(height / 2.5)) // Adjust the center position based on the region index
      .force("charge", d3.forceManyBody().strength(.1))
      .force("collide", d3.forceCollide().strength(.1).radius(10).iterations(1))
      .tick(20)
      .alphaDecay(0.15);

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

  let selectedReligions = [];

  function update() {
    // Start with an empty array
    selectedReligions = [];

    d3.selectAll(".option").each(function (d) {
      const cb = d3.select(this);
      const grp = cb.property("value");

      // Only add to selectedReligions if checkbox is checked
      if (cb.property("checked")) {
        selectedReligions.push(grp);
        svg.selectAll("." + grp).transition().duration(1000).style("fill-opacity", 1);
      } else {
        svg.selectAll("." + grp).transition().duration(1000).style("fill-opacity", 0);
      }
    });
  }
  // console.log(selectedReligion);
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

  // console.log(selectedReligion);


  d3.selectAll(".option").on("change", update);
  update()









  /*********************** */
  d3.select("#year-select").on("change", function () {
    // Get the selected year
    const selectedYear = +d3.select(this).property("value");

    // Filter the data based on the selected year
    filtered_data = flattenedData.filter(function (d) {
      return d.year === selectedYear;
    });

    let totalByRegion = {};


    filtered_data.forEach(d => {
      if (!totalByRegion[d.region]) {
        totalByRegion[d.region] = 0;
      }
      totalByRegion[d.region] += d.value;
    });

    console.log(totalByRegion);


    // Remove all existing circles
    svg.selectAll(".clusterCircle").remove();
    svg.selectAll('.bg').remove();

    // Iterate over each unique region
    regions.forEach((region, i) => {
      // Filter the data for the current region
      let regionData = filtered_data.filter(d => d.region === region);

      console.log(regionData);
      // Create the nodes for the current region
      let nodes = [];
      regionData.forEach(d => {
        let circleCount = Math.round(d.value / 6000000);
        for (let i = 0; i < circleCount; i++) {
          nodes.push({
            radius: 4,
            group: d.group
          });
        }
      });


      // Create the node group for the current region
      let nodeGroupG = svg.append("g")

      let rectData = [
        {
          width: '137pt',
          height: '250pt',
          x: x(region) - 90,
          y: 300,
          region: region // assuming region is a variable in your code
        }
      ];



      let nodeGroup = nodeGroupG
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr('class', d => `clusterCircle ${d.group}`)
        .attr('r', d => d.radius)
        .style("fill", d => color(d.group))
        .style("fill-opacity", 0.8)
        .attr("stroke", "black")
        .style("stroke-width", 0.3);


      let rect = nodeGroupG.selectAll('.bg')
        .data(rectData)
        .join('rect')
        .attr('width', d => d.width)
        .attr('height', d => d.height)
        .attr('class', d => `bg ${d.region}`)
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .style('fill', 'transparent');

      rect
        .on('mouseover', (event, d) => {
          let region = d.region;
          const format = d3.format(",");
          // console.log(region);
          // let populationDataString = regionData.map(religionData => `${religionData.group}: ${format(religionData.value)}`).join('\n');
          // Remaining code...
          let totalText = svg.append("text")
            .attr("class", "hover-text") // add a class to remove later
            .attr("x", (x(region)))
            .attr("y", 600) // adjust this value as needed
            .style("text-anchor", "start")
            .style("font-size", "16px") // adjust this value as needed
            .style("fill", "black")
            .style("font-weight", "bold")
            .text("Total: ");

          totalText.append("tspan")
            .style("font-weight", "normal")
            // .attr("x", (x(region)+50) + svg.select(".hover-text").node().getComputedTextLength())
            .text(format(totalByRegion[region]));


          console.log(selectedReligions);

          selectedReligions.forEach((selectedReligion, i) => {
            let selectedReligionData = regionData.find(religionData => religionData.group === selectedReligion);

            if (selectedReligionData) {
              let religiousText = svg.append("text")
                .attr("class", "hover-text")
                .attr("x", (x(region)))
                .attr("y", 620 + i * 20)
                .style("text-anchor", "start")
                .style("font-size", "16px")
                .style("fill", "black")
                .style("font-weight", "bold")
                .text(`${selectedReligionData.group}:`);

              religiousText.append("tspan")
                .attr("class", "hover-text")
                .style("font-weight", "normal")
                .style("text-anchor", "start")
                .style("font-size", "16px")
                .style("fill", "black")
                .text(` ${format(selectedReligionData.value)}`);
            }
          });


          svg.append("path")
            .attr("class", "hover-line") // add a class to remove later
            .attr("d", `M ${centroids[region].x} ${centroids[region].y} L ${breakPoint.x} ${breakPoint.y} L ${x(region) + 30} 600`) // adjust this value as needed
            .attr("stroke", "black")
            .attr("stroke-width", .5)
            .attr("fill", "none");
        })
        .on("mouseout", function () {
          // Remove the text and line when mouse is moved out
          d3.selectAll('.hover-text').remove();
          d3.selectAll('.hover-line').remove();
        });
      centroids[region] = {
        x: (i + 1) * (width / (regions.length + .4)) - 120,
        y: height / 2

      };

      let breakPoint = {
        x: centroids[region].x,
        y: ((centroids[region].y + 600) / 2) // adjust this value as needed
      };
      // Initialize the simulation for the current region
      let simulation = d3.forceSimulation(nodes)
        .force("x", d3.forceX().strength(1).x((i + 1) * (width / (regions.length + .4)) - 120)) // Adjust the x-position based on the region index
        .force("y", d3.forceY().strength(0.1).y(height / 2.5))
        .force("center", d3.forceCenter().x((i + 1) * (width / (regions.length + .4)) - 120).y(height / 2.5)) // Adjust the center position based on the region index
        .force("charge", d3.forceManyBody().strength(.1))
        .force("collide", d3.forceCollide().strength(.1).radius(10).iterations(1))
        .tick(20)
        .alphaDecay(0.15);


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