/**
 * Constructor for the TileChart
 */
function TileChart(){

    var self = this;
    self.init();
};
    
/**
 * Initializes the svg elements required to lay the tiles
 * and to populate the legend.
 */
TileChart.prototype.init = function(){
    var self = this;

    //Gets access to the div element created for this chart and legend element from HTML
    var divTileChart = d3.select("#tiles").classed("content", true);
    var legend = d3.select("#legend").classed("content",true);
    self.margin = {top: 30, right: 20, bottom: 30, left: 50};

    var svgBounds = divTileChart.node().getBoundingClientRect();
    self.svgWidth = svgBounds.width - self.margin.left - self.margin.right;
    self.svgHeight = self.svgWidth/1.5;
    var legendHeight = 150;

    //creates svg elements within the div
    self.legendSvg = legend.append("svg")
        .attr("width",self.svgWidth)
        .attr("height",legendHeight)
        .attr("transform", "translate(" + (self.margin.left-5) + ",0)");

    self.svg = divTileChart.append("svg")
                        .attr("width",self.svgWidth)
                        .attr("height",self.svgHeight)
                        .attr("transform", "translate(" + self.margin.left + ",0)")
                        .style("bgcolor","green");
    
    self.svg.append("g")
        .attr("id", "tileGroup");
    self.svg.append("g")
        .attr("id", "stateAbbreviations");
    self.svg.append("g")
        .attr("id", "stateEVText");
};

/**
 * Returns the class that needs to be assigned to an element.
 *
 * @param party an ID for the party that is being referred to.
 */
TileChart.prototype.chooseClass = function (party) {
    var self = this;
    if (party == "R"){
        return "republican";
    }
    else if (party== "D"){
        return "democrat";
    }
    else if (party == "I"){
        return "independent";
    }
}

/**
 * Renders the HTML content for tool tip.
 *
 * @param tooltip_data information that needs to be populated in the tool tip
 * @return text HTML content for tool tip
 */
TileChart.prototype.tooltip_render = function (tooltip_data) {
    var self = this;
    var text = "<h2 class ="  + self.chooseClass(tooltip_data.winner) + " >" + tooltip_data.state + "</h2>";
    text +=  "Electoral Votes: " + tooltip_data.electoralVotes;
    text += "<ul>"
    tooltip_data.result.forEach(function(row){
        text += "<li class = " + self.chooseClass(row.party)+ ">" + row.nominee+":\t\t"+row.votecount+"("+row.percentage+"%)" + "</li>"
    });
    text += "</ul>";
    return text;
}

/**
 * Creates tiles and tool tip for each state, legend for encoding the color scale information.
 *
 * @param electionResult election data for the year selected
 * @param colorScale global quantile scale based on the winning margin between republicans and democrats
 */
TileChart.prototype.update = function(electionResult, colorScale){
    var self = this;

    let stateCoords = [["AK", null, null, null, null, null, null, null],
                        [null, null, "WA", "OR", "CA", null, null, "HI"],
                        [null, null, "ID", "NV", "UT", "AZ", null, null],
                        [null, null, "MT", "WY", "CO", "NM", null, null],
                        [null, null, "ND", "SD", "NE", "KS", "OK", "TX"],
                        [null, null, "MN", "IA", "MO", "AR", "LA", null],
                        [null, null, "IL", "IN", "KY", "TN", "MS", null],
                        [null, null, "WI", "OH", "WV", "NC", "AL", null],
                        [null, null, "MI", "PA", "VA", "SC", "GA", null],
                        [null, null, "NY", "NJ", "MD", "DE", null, "FL"],
                        [null, "VT", "RI", "CT", "DC", null, null, null],
                        ["ME", "NH", "MA", null, null, null, null, null]];

    //Assigns data row and space values
    for(let i=0; i < electionResult.length; ++i) {
        let state = electionResult[i].Abbreviation;
        let stateRow, stateCol;
        for(stateCol=0; stateCol < stateCoords.length; ++stateCol) {
            if(stateCoords[stateCol].includes(state)){
                break;
            }
        }
        for(stateRow=0; stateRow < stateCoords[stateCol].length; ++stateRow){
            if (stateCoords[stateCol][stateRow] == state) {
                break;
            }
        }
        electionResult[i].Row = stateRow;
        electionResult[i].Space = stateCol;
    }       

    //Calculates the maximum number of columns to be laid out on the svg
    self.maxColumns = d3.max(electionResult,function(d){
                                return parseInt(d["Space"]);
                            });

    //Calculates the maximum number of rows to be laid out on the svg
    self.maxRows = d3.max(electionResult,function(d){
                                return parseInt(d["Row"]);
                        });

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

    let getWinner = function(d) {
        if(dStates.includes(d)){
            return "D";
        }
        else if(rStates.includes(d)){
            return "R";
        }
        else{
            return "I";
        }
    }

    //for reference:https://github.com/Caged/d3-tip
    //Use this tool tip element to handle any hover over the chart
    tip = d3.tip().attr('class', 'd3-tip')
        .direction('se')
        .offset(function() {
            return [0,0];
        })
        .html(function(event, d) {
            /* populate data in the following format*/
            let winningCandidate;
            if(getWinner(d)=="D") {
                winningCandidate = d.D_Nominee;
            }
            else if (getWinner(d)=="R") {
                winningCandidate = d.R_Nominee;
            }
            else {
                winningCandidate = d.I_Nominee;
            }
            tooltip_data = {
                "state": d.State,
                "winner": winningCandidate,
                "electoralVotes" : d.Total_EV,
                "result":[
                    {"nominee": d.D_Nominee,"votecount": d.D_Votes,"percentage": d.D_Percentage, "party": "D"},
                    {"nominee": d.R_Nominee,"votecount": d.R_Votes,"percentage": d.R_Percentage, "party": "R"},
                    {"nominee": d.I_Nominee,"votecount": d.I_Votes,"percentage": d.I_Percentage, "party": "I"}
                ]
            }
            tooltip_data.result = tooltip_data.result.filter(function(info){
                return info.votecount != 0;
            })
             /* pass this as an argument to the tooltip_render function then,
             * return the HTML content returned from that method.
             * */
            return self.tooltip_render(tooltip_data);
        });

    //Creates a legend element and assigns a scale that needs to be visualized
    self.legendSvg.append("g")
        .attr("class", "legendQuantile")

    var legendQuantile = d3.legendColor()
        .shapeWidth((self.svgWidth/12)-2)
        .cells(10)
        .orient('horizontal')
        .labelWrap((self.svgWidth/12)-2)
        .scale(colorScale);

    // ******* TODO: PART IV *******
    //Transform the legend element to appear in the center and make a call to this element for it to display.
    let legendGroup = d3.select(".legendQuantile");
    legendGroup
        .call(legendQuantile);

    //Reinitialize the scales
    let rowScale = d3.scaleLinear()
        .domain([0, self.maxRows])
        .range([0, self.svgHeight-(2.4*self.svgHeight/self.maxRows)]);

    let colScale = d3.scaleLinear()
        .domain([0, self.maxColumns])
        .range([0, self.svgWidth-(self.svgWidth/self.maxColumns)]);

    let tileHeight = rowScale(1) - 2;
    let tileWidth = colScale(1) - 2;

    //For finding margin of victory
    let winMargin = function(stateData) {
        let rankedParties = [stateData.R_Percentage, stateData.D_Percentage, stateData.I_Percentage];
        rankedParties.sort(function(a, b) {
            return b - a;
        })
        return rankedParties[0] - rankedParties[1];
    };

    //Lay rectangles corresponding to each state according to the 'row' and 'column' information in the data.
    self.svg.select("#tileGroup").call(tip);
    let tileSelection = self.svg.select("#tileGroup").selectAll("rect").data(electionResult);
    tileSelection
        .attr("x", function(d) {
            return colScale(d.Space);
        })
        .attr("y", function(d) {
            return rowScale(d.Row);
        })
        .attr("width", tileWidth)
        .attr("height", tileHeight)
        .attr("fill", function(d) {
            if(getWinner(d)=="D"){
                return(colorScale(-1*winMargin(d)));
            }
            else if(getWinner(d)=="R"){
                return colorScale(winMargin(d));
            }
            else {
                return "#45AD6A";
            }
        })
        .attr("class", function(d) {
            "tile " + self.chooseClass(getWinner(d));
        })
        .attr("id", function(d) {
            return d.Abbreviation;
        })
        .on("mouseover", function(event, d){
            tip.show(event, d);
        })
        .on("mouseout", tip.hide);

    tileSelection.enter()
        .append("rect")
        .attr("x", function(d) {
            return colScale(d.Space);
        })
        .attr("y", function(d) {
            return rowScale(d.Row);
        })
        .attr("width", tileWidth)
        .attr("height", tileHeight)
        .attr("fill", function(d) {
            if(getWinner(d)=="D"){
                return(colorScale(-1*winMargin(d)));
            }
            else if(getWinner(d)=="R"){
                return colorScale(winMargin(d));
            }
            else {
                return "#45AD6A";
            }
        })
        .attr("class", function(d) {
            "tile " + self.chooseClass(getWinner(d));
        })
        .attr("id", function(d) {
            return d.Abbreviation;
        })
        .on("mouseover", function(event, d){
            tip.show(event, d);
        })
        .on("mouseout", tip.hide);

    tileSelection.exit().remove();

    //Display the state abbreviation and number of electoral votes on each of these rectangles
    //HINT: Use .tile class to style your tiles;
    // .tilestext to style the text corresponding to tiles    
    let textSelectionAbbreviations = self.svg.select("#stateAbbreviations").selectAll("text").data(electionResult);
    textSelectionAbbreviations
        .text(function(d) {
            return d.Abbreviation;
        })
        .attr("x", function(d) {
            return colScale(d.Space)+(tileWidth/2);
        })
        .attr("y", function(d) {
            return rowScale(d.Row)+(tileHeight/2);
        })
        .attr("class", "tilestext");

    textSelectionAbbreviations.enter()
        .append("text")
        .text(function(d) {
            return d.Abbreviation;
        }) 
        .attr("x", function(d) {
            return colScale(d.Space)+(tileWidth/2);
        })
        .attr("y", function(d) {
            return rowScale(d.Row)+(tileHeight/2);
        })
        .attr("class", "tilestext");


    textSelectionAbbreviations.exit().remove();

    let textSelectionEV = self.svg.select("#stateEVText").selectAll("text").data(electionResult);
    textSelectionEV
        .attr("x", function(d) {
            return colScale(d.Space)+(tileWidth/2);
        })
        .attr("y", function(d) {
            return rowScale(d.Row)+(3*tileHeight/4)+3;
        })
        .attr("class", "tilestext")
        .text(function(d) {
            return d.Total_EV;
        });

    textSelectionEV.enter()
        .append("text")
        .attr("x", function(d) {
            return colScale(d.Space)+(tileWidth/2);
        })
        .attr("y", function(d) {
            return rowScale(d.Row)+(3*tileHeight/4)+3;
        })
        .attr("class", "tilestext")
        .text(function(d) {
            return d.Total_EV;
        });

    textSelectionEV.exit().remove();

    //Call the tool tip on hover over the tiles to display stateName, count of electoral votes
    //then, vote percentage and number of votes won by each party.
    //HINT: Use the .republican, .democrat and .independent classes to style your elements.
};
