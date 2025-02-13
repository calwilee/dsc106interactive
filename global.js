let data = [];
const width = 1000;
const height = 600;
let xScale;
let yScale;


function loadData(){

}

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    createScatterplot();
    updateTooltipVisibility(false);
    brushSelector();
});