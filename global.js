let data = [];
const width = 1000;
const height = 600;
let xScale;
let yScale;

async function loadData(){
    data = await d3.csv('fem_data.csv', (row) => ({
        ...row,
        time: Number(row.time),
        temperature: Number(row.temperature)
    }));
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    createScatterplot();
    console.log(data);
});

function createScatterplot(){
    const margin = { top: 10, right: 10, bottom: 50, left: 50 };
    
    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    xScale = d3
        .scaleTime()
        .domain([new Date(0, 0, 0, 0, 0), new Date(0, 0, 0, 23, 55)])  // 0-287 intervals, 24 hours
        .range([0, width]);

    yScale = d3
        .scaleLinear()
        .domain([35, 39])
        .range([height, 0]);

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    const xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat("%I:%M %p")); // Format as Time
    const yAxis = d3.axisLeft(yScale);

    const xGrid = d3.axisBottom(xScale)
        .tickSize(-usableArea.height)  // Extend ticks across the chart
        .tickFormat("");  // Remove labels

    const yGrid = d3.axisLeft(yScale)
        .tickSize(-usableArea.width) 
        .tickFormat("");  

    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0, ${usableArea.bottom})`)
        .call(xGrid);
    
    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(${usableArea.left}, 0)`)
        .call(yGrid);

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", usableArea.left + usableArea.width / 2)
        .attr("y", height) // Move further below the x-axis
        .text("Time of Day")
        .style("font-size", "16px")
        .style("font-weight", "bold");

    svg.append("text")  
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)") // Rotate for vertical orientation
        .attr("x", -usableArea.top - usableArea.height / 2)
        .attr("y", -0) // Move further left from the y-axis
        .text("Temperature (°C)")
        .style("font-size", "16px")
        .style("font-weight", "bold");


    svg.append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis);

    svg.append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);

    const estrusGroups = d3.group(data, d => d.gender); // Group by estrus status
    const colorScale = d3.scaleOrdinal()
        .domain(estrusGroups.keys())
        .range(["#e85193", "#607D8B"]);

    const line = d3.line()
        .x(d => {
            const timeInMinutes = d.time * 5;  // Convert to actual minutes
            return xScale(new Date(0, 0, 0, Math.floor(timeInMinutes / 60), timeInMinutes % 60)); // Map to Date object
        })
        .y(d => yScale(d.temperature));

    estrusGroups.forEach((values, estrusStatus) => {
        svg.append('path')
            .datum(values)
            .attr('class', `line line-${estrusStatus}`)
            .attr('d', line)
            .style('fill', 'none')
            .style('stroke', colorScale(estrusStatus))
            .style('stroke-width', 4);
    });

    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 110}, ${margin.top + 15})`); // Position legend to the right
    
    const legendItems = legend.selectAll(".legend-item")
        .data(estrusGroups.keys()) // Get unique group names
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 30})`); // Adjust vertical spacing

    legendItems.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 10)
        .style("fill", d => colorScale(d));
    
    legendItems.append("text")
        .attr("x", 15) // Position text next to the circle
        .attr("y", 5)
        .style("font-size", "16px")
        .text(d => d);
    
    
    const verticalLine = svg.append('line')
        .attr('stroke', 'black')
        .attr('stroke-width', 3)
        .style('stroke-dasharray', '4')
        .style('pointer-events', 'none') // Make sure it doesn't interfere with other interactions
        .attr('y1', usableArea.top) // Top of the chart
        .attr('y2', usableArea.bottom) // Bottom of the chart
        .style('opacity', 0);

    svg.on("mousemove", (event) => {
        updateVerticalLinePosition(event);
        updateTooltipContentBasedOnMouse(event);
    });

    svg.on("mouseleave", () => {
        updateTooltipVisibility(false);
        verticalLine.style('opacity', 0); // Hide the vertical line as well
    });

    function updateVerticalLinePosition(event) {
        const [mouseX, mouseY] = d3.pointer(event); // Get mouse position relative to the SVG
        const time = xScale.invert(mouseX); // This is now a Date object
    
        // Ensure the time is within the valid range
        const minTime = new Date(0, 0, 0, 0, 0);
        const maxTime = new Date(0, 0, 0, 23, 55);
    
        if (time >= minTime && time <= maxTime) {
            verticalLine.attr('x1', mouseX).attr('x2', mouseX)
            .style('opacity', 1);;
        }
    }
    
    function updateTooltipContentBasedOnMouse(event) {
        const [mouseX, mouseY] = d3.pointer(event);
        const time = xScale.invert(mouseX); // Now a Date object
    
        const temperature = getEstrusNonEstrusValuesAtTime(time); // Function updated to get estrus and non-estrus data
    
        if (temperature) {
            updateTooltipContent({
                time: d3.timeFormat("%I:%M %p")(time), // Format time properly
                estrus: temperature.estrus ? temperature.estrus.temperature : "N/A",
                nonestrus: temperature.nonestrus ? temperature.nonestrus.temperature : "N/A"
            });
        }
    }
};

function getEstrusNonEstrusValuesAtTime(time) {
    const estrusData = data.filter(d => d.gender === 'Estrus');
    const nonEstrusData = data.filter(d => d.gender === 'Non-estrus');

    // Function to find the closest data point to a given time
    function findClosestDataPoint(estrusStatusData, targetTime) {
        return estrusStatusData.reduce((closest, d) => {
            const dataTime = parseTime(d);
            return Math.abs(dataTime - targetTime) < Math.abs(parseTime(closest) - targetTime) ? d : closest;
        }, estrusStatusData[0]); // Default to the first item
    }

    // Convert dataset time values to Date objects
    function parseTime(d) {
        const timeInMinutes = d.time * 5; // Convert stored time units to actual minutes
        return new Date(0, 0, 0, Math.floor(timeInMinutes / 60), timeInMinutes % 60);
    }

    return {
        estrus: estrusData.length ? findClosestDataPoint(estrusData, time) : null,
        nonestrus: nonEstrusData.length ? findClosestDataPoint(nonEstrusData, time) : null
    };
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.visibility = isVisible ? 'visible' : 'hidden';
}

function updateTooltipContent(d) {
    const tooltip = document.getElementById('commit-tooltip');
    if (d.time && d.estrus && d.nonestrus) {
        tooltip.innerHTML = `Time: ${d.time}<br>Estrus Temperature: ${d.estrus ? d.estrus.toFixed(2) : 'N/A'} ºC<br>Non-Estrus Temperature: ${d.nonestrus ? d.nonestrus.toFixed(2) : 'N/A'} ºC`;
        updateTooltipVisibility(true); // Show the tooltip when content is updated
    }
}
