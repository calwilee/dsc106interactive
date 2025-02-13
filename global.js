let data = [];
const width = 1000;
const height = 600;
let xScale;
let yScale;

// loads data from csv
async function loadData(){
    data = await d3.csv('file1.csv', (row) => ({
        ...row,
        time: Number(row.time),
        Temperature: Number(row.Temperature)
    }));

}

// runs functions in doc
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    createScatterplot()
    console.log(data);

});

// builds scatterplot
function createScatterplot(){
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    
    const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

    // scales 
    xScale = d3
    .scaleLinear()
    .domain([0, 1400])
    .range([0, width])

    yScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.Temperature))
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

    

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale)


    // Add X axis
    svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

    // Add Y axis
    svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);
    
    const line = d3.line()
        .x(d => xScale(d.time))  // Use x scale for data mapping
        .y(d => yScale(d.Temperature));  // Use y scale for data mapping

    // Append line path to the SVG
    svg
    .append('path')
    .data([data])  // Bind the data to the path element
    .attr('class', 'line')  // Optional for styling
    .attr('d', line)  // Draw the line based on the line generator
    .style('fill', 'none')
    .style('stroke', 'steelblue')
    .style('stroke-width', 2);

    
}