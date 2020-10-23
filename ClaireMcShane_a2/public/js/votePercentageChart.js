/**
 * Constructor for the Vote Percentage Chart
 */
function VotePercentageChart(){

    var self = this;
    self.init();
};

/**
 * Initializes the svg elements required for this chart
 */
VotePercentageChart.prototype.init = function(){
    var self = this;
    self.margin = {top: 30, right: 20, bottom: 30, left: 50};
    var divvotesPercentage = d3.select("#votes-percentage").classed("content", true);

    //Gets access to the div element created for this chart from HTML
    self.svgBounds = divvotesPercentage.node().getBoundingClientRect();
    self.svgWidth = self.svgBounds.width - self.margin.left - self.margin.right;
    self.svgHeight = 200;

    //creates svg element within the div
    self.svg = divvotesPercentage.append("svg")
        .attr("width",self.svgWidth)
        .attr("height",self.svgHeight)
    
    //Just above midpoint, display the text mentioning details about this mark on top of this bar
    //HINT: Use .votesPercentageNote class to style this text element
    self.svg.append("text")
        .attr("class", "votesPercentageNote")
        .attr("x", self.svgWidth/2)
        .attr("y", 50)
        .attr("display", "none")
        .text("Popular Vote (50%)");
    self.svg.append("g")
        .attr("id", "percentLabels");
    self.svg.append("g")
        .attr("id", "candidateLabels");
};

/**
 * Returns the class that needs to be assigned to an element.
 *
 * @param party an ID for the party that is being referred to.
 */
VotePercentageChart.prototype.chooseClass = function (party) {
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
 * Renders the HTML content for tool tip
 *
 * @param tooltip_data information that needs to be populated in the tool tip
 * @return text HTML content for toop tip
 */
VotePercentageChart.prototype.tooltip_render = function (tooltip_data) {
    var self = this;
    var text = "<ul>";
    tooltip_data.result.forEach(function(row){
        text += "<li class = " + self.chooseClass(row.party)+ ">" + row.nominee+":\t\t"+row.votecount+"("+row.percentage+"%)" + "</li>"
    });

    return text;
}

/**
 * Creates the stacked bar chart, text content and tool tips for Vote Percentage chart
 *
 * @param electionResult election data for the year selected
 */
VotePercentageChart.prototype.update = function(electionResult){
    var self = this;
    let dVotes = rVotes = iVotes = 0;
    for(let i=0; i < electionResult.length; ++i) {
        dVotes += electionResult[i].D_Votes;
        rVotes += electionResult[i].R_Votes;
        iVotes += electionResult[i].I_Votes;
    }
    let totalVotes = dVotes + rVotes + iVotes;
    let rawData = [{votes: iVotes, party: "I", percent: iVotes/totalVotes, candidate: electionResult[0].I_Nominee, position: 0}, 
        {votes: dVotes, party: "D", percent: dVotes/totalVotes, candidate: electionResult[0].D_Nominee, position: 0}, 
        {votes: rVotes, party: "R", percent: rVotes/totalVotes, candidate: electionResult[0].R_Nominee, position: 0}];
    let data = rawData.filter(function(d){
        return d.votes != 0;
    })
    //for reference:https://github.com/Caged/d3-tip
    //Use this tool tip element to handle any hover over the chart
    tip = d3.tip().attr('class', 'd3-tip')     
        .direction('s')
        .offset(function() {
            return [0, 200-this.getBBox().width/2];
        })
        .html(function(d) {
            //populate data in the following format
            tooltip_data = {
              "result":[
              {"nominee": electionResult[0].D_Nominee,"votecount": dVotes,"percentage": (dVotes/totalVotes*100).toFixed(1),"party":"D"} ,
              {"nominee": electionResult[0].R_Nominee,"votecount": rVotes,"percentage": (rVotes/totalVotes*100).toFixed(1),"party":"R"} ,
              {"nominee": electionResult[0].I_Nominee,"votecount": iVotes,"percentage": (iVotes/totalVotes*100).toFixed(1),"party":"I"}
              ]
            }
            tooltip_data.result = tooltip_data.result.filter(function(d){
                return d.votecount != 0;
            })
            //   pass this as an argument to the tooltip_render function then,
            //   return the HTML content returned from that method.
            return self.tooltip_render(tooltip_data);
        });

    // ******* TODO: PART III *******
    //populate data in the following format

    let widthScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, self.svgWidth-data.length+1]);   

    //Create the stacked bar chart.
    //Use the global color scale to color code the rectangles.
    //HINT: Use .votesPercentage class to style your bars.    
    let barLength = 0;
    self.svg.call(tip);
    let selection = self.svg.selectAll("rect").data(data);
    let barNumber = 1;
    selection
        .attr("class", function(d) {
            return "votesPercentage " + self.chooseClass(d.party);
        })
        .attr("x", function(d) {
            let currentLength = barLength;
            barLength += 1+widthScale(d.percent);
            if(barNumber == 1) {
                d.position = currentLength;           
            }
            else if (barNumber == data.length) {
                d.position = barLength;
            }
            else {
                d.position = currentLength + widthScale(d.percent)/2;
            }
            ++barNumber;
            return currentLength;
        })
        .attr("y", 60)
        .attr("height", 20)
        .attr("width", function(d) {
            return widthScale(d.percent);
        })          
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

    selection
        .enter()
        .append("rect")
        .attr("class", function(d) {
            return "votesPercentage " + self.chooseClass(d.party);
        })
        .attr("x", function(d) {
            let currentLength = barLength;
            barLength += 1+widthScale(d.percent);
            if(barNumber == 1) {
                d.position = currentLength;
            }
            else if (barNumber == data.length) {
                d.position = barLength;
            }
            else {
                d.position = currentLength + widthScale(d.percent)/2;
            }
            ++barNumber;
            return currentLength;
        })
        .attr("y", 60)
        .attr("height", 20)
        .attr("width", function(d) {
            return widthScale(d.percent);
        })      
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

    selection.exit().remove();

    //Display a bar with minimal width in the center of the bar chart to indicate the 50% mark
    //HINT: Use .middlePoint class to style this bar.
    self.svg.selectAll("line").remove();
    self.svg.append("line")
        .attr("x1", self.svgWidth/2)
        .attr("y1", 57)
        .attr("x2", self.svgWidth/2)
        .attr("y2", 83)
        .attr("class", "middlePoint");
    //Just above this, display the text mentioning details about this mark on top of this bar
    //HINT: Use .votesPercentageNote class to style this text element
    self.svg.select(".votesPercentageNote")
        .attr("display", "visible");
    //Display the total percentage of votes won by each party
    //on top of the corresponding groups of bars.
    //HINT: Use the .votesPercentageText class to style your text elements;  Use this in combination with
    // chooseClass to get a color based on the party wherever necessary
    let percentLabelSelection = self.svg.select("#percentLabels").selectAll("text").data(data);
    percentLabelSelection
        .style("text-anchor", function(d) {
            if(data.length > 2 && d.party == "D") {
                return "middle"
            }
            return;
        })
        .attr("x", function(d) {
            return d.position;
        })
        .attr("y", 50)
        .attr("class", function(d) {
            return "votesPercentageText " + self.chooseClass(d.party);
        })
        .text(function(d) {
            return (d.percent*100).toFixed(1) + "%";
        })

    percentLabelSelection
        .enter()
        .append("text")
        .style("text-anchor", function(d) {
            if(data.length > 2 && d.party == "D") {
                return "middle"
            }
            return;
        })
        .attr("x", function(d) {
            return d.position;
        })
        .attr("y", 50)
        .attr("class", function(d) {
            return "votesPercentageText " + self.chooseClass(d.party);
        })
        .text(function(d) {
            return (d.percent*100).toFixed(1) + "%";
        })
    
    percentLabelSelection.exit().remove();

    let candidateLabelSelection = self.svg.select("#candidateLabels").selectAll("text").data(data);
    candidateLabelSelection
        .style("text-anchor", function(d) {
            if(data.length > 2 && d.party == "D") {
                return "middle"
            }
            return;
        })
        .attr("x", function(d) {
            return d.position;
        })
        .attr("y", 30)
        .attr("class", function(d) {
            return "votesPercentageText " + self.chooseClass(d.party);
        })
        .text(function(d) {
            return d.candidate;
        })

    candidateLabelSelection
        .enter()
        .append("text")
        .style("text-anchor", function(d) {
            if(data.length > 2 && d.party == "D") {
                return "middle"
            }
            return;
        })
        .attr("x", function(d) {
            return d.position;
        })
        .attr("y", 30)
        .attr("class", function(d) {
            return "votesPercentageText " + self.chooseClass(d.party);
        })
        .text(function(d) {
            return d.candidate;
        })
    
    candidateLabelSelection.exit().remove();

    //Call the tool tip on hover over the bars to display stateName, count of electoral votes.
    //then, vote percentage and number of votes won by each party.

};
