let data = [];
const width = 1000;
const height = 600;
let xScale;
let yScale;

async function loadData(){
    data = await d3.csv('file1.csv', (row) => ({
        ...row,
        time: Number(row.time),
        Temperature: Number(row.Temperature)
    }));

}

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    createScatterplot()
    console.log(data);

    });


function createScatterplot(){
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    
    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    xScale = d3
        .scaleLinear()
        .domain([-100, 1500])
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

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    svg.append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis);

    svg.append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);

    const genderGroups = d3.group(data, d => d.gender);


    const colorScale = d3.scaleOrdinal()
        .domain(genderGroups.keys())
        .range(["steelblue", "crimson"]);

    const line = d3.line()
        .x(d => xScale(d.time))
        .y(d => yScale(d.Temperature));

    genderGroups.forEach((values, gender) => {
        svg.append('path')
            .datum(values)
            .attr('class', `line line-${gender}`)
            .attr('d', line)
            .style('fill', 'none')
            .style('stroke', colorScale(gender))
            .style('stroke-width', 2);
    })
};