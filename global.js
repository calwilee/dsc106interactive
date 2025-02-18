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
        .domain([0, 1500])
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
            .style('stroke-width', 4);
    });
    svg.on("mousemove", (event) => {
        updateVerticalLinePosition(event);
        updateTooltipPosition(event);
        updateTooltipContentBasedOnMouse(event);

    });
    const verticalLine = svg.append('line')
        .attr('stroke', 'black')
        .attr('stroke-width', 3)
        .style('stroke-dasharray', '4')
        .style('pointer-events', 'none') // Make sure it doesn't interfere with other interactions
        .attr('y1', usableArea.top) // Top of the chart
        .attr('y2', usableArea.bottom); // Bottom of the chart

    // Update the vertical line position based on mouse movement
    function updateVerticalLinePosition(event) {
        const [mouseX, mouseY] = d3.pointer(event); // Get mouse position relative to the SVG
        const time = xScale.invert(mouseX);
        if (time >= 0){
            verticalLine.attr('x1', mouseX).attr('x2', mouseX);

        }
        // Update the vertical line's x position
    }
    function updateTooltipContentBasedOnMouse(event) {
        const [mouseX, mouseY] = d3.pointer(event); // Get mouse position relative to the SVG
        const time = xScale.invert(mouseX); // Convert mouse X position to time
        const temperature = getMaleFemaleValuesAtTime(time); // Get male and female temperature values
        
        // Update tooltip with time and temperatures for both genders
        updateTooltipContent({
            time: time.toFixed(2),
            male: temperature.male.temperature,
            female: temperature.female.temperature
        });
    }
    




    
};

// Function to get male and female values for a specific time
function getMaleFemaleValuesAtTime(time) {
    // Find the closest data point for males and females
    const maleData = data.filter((d) => d.gender === 'Male');
    const femaleData = data.filter((d) => d.gender === 'Female');
    console.log(data);
    console.log("Female Data:", femaleData);
    console.log("male Data:", maleData);


    // Function to find the closest data point to a given time
    const findClosestDataPoint = (genderData, time) => {
        let closestPoint = genderData[0];
        let minDiff = Math.abs(time - closestPoint.time);

        genderData.forEach(d => {
            const diff = Math.abs(time - d.time);
            if (diff < minDiff) {
                closestPoint = d;
                minDiff = diff;
            }
        });

        return closestPoint;
    };

    // Get the closest points for male and female
    const closestMale = findClosestDataPoint(maleData, time);
    const closestFemale = findClosestDataPoint(femaleData, time);

    return {
        male: {
            temperature: closestMale.Temperature
        },
        female: {
            temperature: closestFemale.Temperature
        }
    };
}




function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.visibility = isVisible ? 'visible' : 'hidden';
}

function updateTooltipContent(d) {

    const tooltip = document.getElementById('commit-tooltip');
    if (d.time > 0){
        tooltip.innerHTML = `Time: ${d.time}<br>Male Temperature: ${d.male}<br>Female Temperature: ${d.female}`;


    }
}


function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX + 10}px`; // 10px offset for better visibility
    tooltip.style.top = `${event.clientY + 10}px`; // 10px offset for better visibility
}