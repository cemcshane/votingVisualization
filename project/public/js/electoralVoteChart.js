
/**
 * Constructor for the ElectoralVoteChart
 *
 * @param brushSelection an instance of the BrushSelection class
 */
function ElectoralVoteChart(brushSelection){

    var self = this;
    self.brushSelection = brushSelection;
    self.init();
};

/**
 * Initializes the svg elements required for this chart
 */
ElectoralVoteChart.prototype.init = function(){
    var self = this;
    self.margin = {top: 30, right: 20, bottom: 30, left: 50};

    //Gets access to the div element created for this chart from HTML
    var divelectoralVotes = d3.select("#electoral-vote").classed("content", true);
    self.svgBounds = divelectoralVotes.node().getBoundingClientRect();
    self.svgWidth = self.svgBounds.width - self.margin.left - self.margin.right;
    self.svgHeight = 150;

    //creates svg element within the div
    self.svg = divelectoralVotes.append("svg")
        .attr("width",self.svgWidth)
        .attr("height",self.svgHeight)
};

/**
 * Returns the class that needs to be assigned to an element.
 *
 * @param party an ID for the party that is being referred to.
 */
ElectoralVoteChart.prototype.chooseClass = function (party) {
    var self = this;
    if (party == "R"){
        return "republican";
    }
    else if (party == "D"){
        return "democrat";
    }
    else if (party == "I"){
        return "independent";
    }
}


/**
 * Creates the stacked bar chart, text content and tool tips for electoral vote chart
 *
 * @param electionResult election data for the year selected
 * @param colorScale global quantile scale based on the winning margin between republicans and democrats
 */

ElectoralVoteChart.prototype.update = function(electionResult, colorScale){
    var self = this;

    self.brushSelection.update([]);

    //Group the states based on the winning party for the state
    let dStates = electionResult.filter(function (d) {
        return d3.max([d.D_Votes, d.R_Votes, d.I_Votes]) == d.D_Votes;
    });
    let rStates = electionResult.filter(function (d) {
        return (d3.max([d.D_Votes, d.R_Votes, d.I_Votes]) == d.R_Votes)&&(!dStates.includes(d));
    });
    let iStates = electionResult.filter(function (d) {
        return d3.max([d.D_Votes, d.R_Votes, d.I_Votes]) == d.I_Votes&&!(dStates.includes(d)||rStates.includes(d));
    });

    //then sort them based on the margin of victory
    let winMargin = function(stateData) {
        let rankedParties = [stateData.R_Percentage, stateData.D_Percentage, stateData.I_Percentage];
        rankedParties.sort(function(a, b) {
            return b - a;
        })
        return rankedParties[0] - rankedParties[1];
    };
    let marginSort = function(a, b) {
        return winMargin(b) - winMargin(a);
    };
    let rMarginSort = function(a, b) {
        return winMargin(a) - winMargin(b);
    };
    dStates.sort(marginSort);
    rStates.sort(rMarginSort);
    iStates.sort(marginSort);
    
    //Get total EV for the year
    let totalEV = 0;
    for(let m = 0; m < electionResult.length; ++m) {
        totalEV += electionResult[m].Total_EV;
    }

    //Create rectangle width scale
    let widthScale = d3.scaleLinear()
        .domain([0, totalEV])
        .range([0, self.svgWidth-electionResult.length+1]);

    //Create the stacked bar chart.
    let barLength = 0;
    self.svg.selectAll("g")
        .remove()
    self.svg.selectAll("line")
        .remove();
    self.svg.selectAll(".electoralVotesNote")
        .remove();

    self.svg.append("g")
        .attr("id", "iGroup")
        .selectAll("rect")
        .data(iStates)
        .enter()
        .append("rect")
        .attr("class", function() {
            return self.chooseClass("I");
        })
        .attr("width", function(d) {
            return widthScale(d.Total_EV);
        })
        .attr("height", 20)
        .attr("x", function(d) {
            let currentLength = barLength;
            barLength += 1+widthScale(d.Total_EV);
            return currentLength;
        })
        .attr("y", 50)

    let dStartX = barLength;
    self.svg.append("g")
        .attr("id", "dGroup")
        .selectAll("rect")
        .data(dStates)
        .enter()
        .append("rect")
        .attr("class", function() {
            return self.chooseClass("D");
        })
        .attr("width", function(d) {
            return widthScale(d.Total_EV);
        })
        .attr("height", 20)
        .attr("x", function(d) {
            let currentLength = barLength;
            barLength += 1+widthScale(d.Total_EV);
            return currentLength;
        })
        .attr("y", 50)
        .style("fill", function(d) {
            return colorScale(-1*winMargin(d));
        });
    
    self.svg.append("g")
        .attr("id", "rGroup")
        .selectAll("rect")
        .data(rStates)
        .enter()
        .append("rect")
        .attr("class", function() {
            return self.chooseClass("R");
        })
        .attr("width", function(d) {
            return widthScale(d.Total_EV);
        })
        .attr("height", 20)
        .attr("x", function(d) {
            let currentLength = barLength;
            barLength += 1+widthScale(d.Total_EV);
            return currentLength;
        })
        .attr("y", 50)
        .style("fill", function(d) {
            return colorScale(winMargin(d));
        });

    //Display total count of electoral votes won by the Democrat and Republican party
    //on top of the corresponding groups of bars.
    let iVotes = dVotes = rVotes = 0;
    for(let i=0; i < iStates.length; ++i){
        iVotes += iStates[i].Total_EV;
    }
    for(let j=0; j < dStates.length; ++j){
        dVotes += dStates[j].Total_EV;
    }
    for(let k=0; k < rStates.length; ++k){
        rVotes += rStates[k].Total_EV;
    }
    if(iVotes > 0) {
        self.svg.select("#iGroup")
            .append("text")
            .attr("x", 0)
            .attr("y", 40)
            .attr("class", function() {
                return "electoralVoteText " + self.chooseClass("I");
            })
            .text(iVotes)
    }
    self.svg.select("#dGroup")
        .append("text")
        .attr("x", dStartX)
        .attr("y", 40)
        .attr("class", function() {
            return "electoralVoteText " + self.chooseClass("D");
        })
        .text(dVotes)
    
    self.svg.select("#rGroup")
        .append("text")
        .attr("x", barLength-1)
        .attr("y", 40)
        .attr("class", function() {
            return "electoralVoteText " + self.chooseClass("R");
        })
        .text(rVotes)

    //Display a bar with minimal width in the center of the bar chart to indicate the 50% mark
    self.svg.append("line")
        .attr("x1", self.svgWidth/2)
        .attr("y1", 47)
        .attr("x2", self.svgWidth/2)
        .attr("y2", 73)
        .attr("class", "middlePoint");
    
    //Just above this, display the text mentioning the total number of electoral votes required
    // to win the elections throughout the country
    let winNum;
    if(totalEV%2 != 0) {
        winNum = Math.ceil(totalEV/2);
    }
    else{
        winNum = totalEV/2 + 1;
    }
    self.svg.append("text")
        .attr("class", "electoralVotesNote")
        .attr("x", self.svgWidth/2)
        .attr("y", 40)
        .text("Electoral Votes (" + winNum + " needed to win)");

    //Implement brush on the bar chart created above.
    self.svg.append("g")
        .attr("class", "brush");

    const isBrushed = function(selection, x1, x2) {
        return selection[0] <= x1 && selection[1] >= x2;
    }
    
    let brushed = function(event) {
        let selection = event.selection;
        let selectedElements = [];
        //Code from https://www.d3-graph-gallery.com/graph/interactivity_brush.html and https://stackoverflow.com/questions/27405377/iterate-over-already-created-nodes-in-d3js
        d3.select("#iGroup")
            .selectAll("rect")
            .each(function(d){
                let x1 = +this.getAttribute("x");
                let x2 = x1 + +this.getAttribute("width");
                if(isBrushed(selection, x1, x2)) {   
                    selectedElements.push(d.State);
                }
            });
        d3.select("#dGroup")
            .selectAll("rect")
            .each(function(d){
                let x1 = +this.getAttribute("x");
                let x2 = x1 + +this.getAttribute("width");
                if(isBrushed(selection, x1, x2)) {   
                    selectedElements.push(d.State);
                }
            });
        d3.select("#rGroup")
            .selectAll("rect")
            .each(function(d){
                let x1 = +this.getAttribute("x");
                let x2 = x1 + +this.getAttribute("width");
                if(isBrushed(selection, x1, x2)) {   
                    selectedElements.push(d.State);
                }
            });
        self.brushSelection.update(selectedElements);
    }

    const brush = d3.brushX()
        .extent([[0,43],[self.svgWidth,77]])
        .on("end", brushed);

    self.svg.select(".brush")
        .call(brush);

};
