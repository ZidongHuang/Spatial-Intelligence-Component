var data = JSON.parse(document.getElementById('data').innerHTML);
var vis_width = 1366; // outer width
var vis_height = 650; // outer height
var params = {num:'youth_number', rate:'youth_rate',store_display: 'male', min_date: "2021-2-1", max_date: "2021-2-28"}; // parameters to customize the chart
var type_color = {accessories: 1, consumer_electronics: 2, fashions: 3, kids_babies: 4, facilities: 5, jewelry: 6, food: 7};
var floor_color = {B1: 1, B2: 2, L1: 3, L2: 4, L3: 5, L4: 6, L5: 7, L6: 8}

draw = function(data, vis_width, vis_height, params) {
    // Define margins between the outer chart and the inner chart (the actual plotting area)
    // This creates space for axes, labels and tooltips
    var margin = {top: 30, right: 50, bottom: 30, left: 50};
    var width = vis_width - margin.left - margin.right, // inner width
        height = vis_height - margin.top - margin.bottom; // inner height

    // Set the dimensions of the outer chart
    d3.select('.chart-outer')
      .attr('width', vis_width)
      .attr('height', vis_height);

    // Translate the inner chart to the left and down to create margins.
    // Any new object that we append to 'g' will automatically inherit these translations
    var svg = d3.select('.chart').append('svg')
          .attr('width', vis_width)
          .attr('height', vis_height)
        .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var xScale = d3.scaleTime()
            // The data range will come from the slider
            .domain([new Date(params['min_date']),new Date(params['max_date'])])
            .range([0, width])

    var yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    var bubbleScale = d3.scaleLinear()
        // This controls the minimum and maximum size of the bubbles
        .range([10,100])
        // The '_.' indicates an Underscore function. Here we use it to extract a column from the JSON table and calulate the min and max
        .domain([_.min(data.map(function(d) { return d[params['num']];})),
                 _.max(data.map(function(d) { return d[params['num']];}))]);

    // A line generator function. We'll use this later to draw the curves connected movies belonging to the same franchise
    var line = d3.line()
                 .x(function(d) { return xScale(new Date(d['date'])); })
                 .y(function(d) { return yScale(d[params['rate']]); })
                 .curve(d3.curveMonotoneX) // smooth

    // Add a Y-axis to the chart, put it on the right side of the plot
    var yAxis = d3.axisRight(yScale) // puts the tick labels to the right side of the axis
                  .tickSize(20);

    svg.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + width + ',' + 0 + ')') // translates the axis to the right side of the plot
        .call(yAxis);

    // Add a title to the Y axis
    svg.append("text")
          .attr("class", "axis_title")
          .attr("text-anchor", "middle") // Anchor the text to its center. This is the point we will translate and rotate about
                                         // Translate and rotate the axis title to get it in the right position
          .attr("transform", "translate("+ (width + 50) + "," + (height/2) + ") rotate(-90)")
          .text("Customer Percentage");

    // Define a table of day. We'll add a vertical marker line at each of these days.
    var date_labels = [{date: '2021-2-1'},
                       {date: '2021-2-4'},
                       {date: '2021-2-7'},
                       {date: '2021-2-10'},
                       {date: '2021-2-13'},
                       {date: '2021-2-16'},
                       {date: '2021-2-19'},
                       {date: '2021-2-22'},
                       {date: '2021-2-25'},
                       {date: '2021-2-28'}];

    // Add a marker line for each row in the date_labels table
    svg.selectAll('.date_marker')
        .data(date_labels)
        .enter()
        .append('line')
        .attr('class', 'date_marker')
        .attr('y1', yScale(0))
        .attr('x1', function(d) {return xScale(new Date(d['date'] ));})
        .attr('x2', function(d) {return xScale(new Date(d['date'] ));})
        .attr('y2', yScale(100))
        .style('stroke', '#E3E9ED')

    // Add a label at the top of the date markers
    svg.selectAll('.date_label_top')
        .data(date_labels)
      .enter().append('text')
        .attr('class', 'date_label_top')
        .attr('x', function(d) {return xScale(new Date(d['date'] ));})
        .attr('y', yScale(100) - 10)
        .text(function(d) {return d['date'].slice(5,10)})

    // Add a label at the bottom of the date markers
    svg.selectAll('.date_label_bottom')
        .data(date_labels)
      .enter().append('text')
        .attr('class', 'date_label_bottom')
        .attr('x', function(d) {return xScale(new Date(d['date'] ));})
        .attr('y', yScale(0) + 20)
        .text(function(d) {return d['date'].slice(5,10)})

    // Add the curves to the chart (one for each specific store). Draw curves first to be underneath bubbles
    var storeName = d3.set(data.map(function(d) { return d['store_name'];})).values();

    for (var i = 0; i < storeName.length; i++) {
        var storeName_filt = storeName[i];
        var data_filt = _.filter(data, function(element){ return element.store_name && [element.store_name].indexOf(storeName_filt) != -1;});
            data_filt = data_filt.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()); //sort by time
        if(i == 1){
                console.log(data_filt)
                svg.append('path')
                    .datum(data_filt)
                    //Because this is a datum, to find out if this curve needs to be highlighted we need to look in d[0]['highlight'], not d['highlight']!
                    .attr('class', function(d) {return "curve_" + d[0]['store_name']})
                    .attr('d', line) // call the line generator function defined earlier
                    .style('fill', 'none')
                    .style('stroke', d => d3.schemeTableau10[type_color[d[0].type]])
                    .style('stroke-width', 2)
                    .style('stroke-opacity', 0.2)
        }


    };

    // Then add the bubbles to the chart (one for each store in each eay)
    for (i = 0; i < storeName.length; i++) {
        var storeName_filt = storeName[i];
        var data_filt = _.filter(data, function(element){return element.store_name && [element.store_name].indexOf(storeName_filt) != -1;})
        //if (i==1){console.log(data_filt)}
        svg.selectAll('.circle_' + i)
          .data(data)
        .enter().append('circle')
          .attr('class', function(d) {return d['store_name']})
          .attr('cx', function(d) { return xScale(new Date(d['date']));})
          .attr('cy', function(d) { return yScale(parseFloat(d[params['rate']]));})
          .attr('r', function(d) { return Math.sqrt((bubbleScale(parseFloat(d[params['num']])))/Math.PI);})
          .style('stroke-width', 0)
          .style('fill', d => d3.schemeTableau10[type_color[d.type]])
          .style('fill-opacity', 0.2)
          // .on('mouseover', function(event){
          //      console.log(event);
          // })
          // .on('mouseout', function(d,i){
          //     d3.select(this)
          //       .attr({opacity: 0.2})
          // })
        }
}




// Create the range slider
var createSlider = function(data, params) {

  // Set the width and left offset of the slider, such that it aligns with the start and end of our X scale
  $('#slider-container')
      .width(1266 + 20) // = vis_width - left.margin - right.margin (+ 20px to align the slider handles)
      .offset({left: 50 - 10}); // = left.margin (- 10px to align the slider handles)

  // Create a new range slider
  // See http://ionden.com/a/plugins/ion.rangeSlider/index.html for documentation
  var slider = $("#slider").ionRangeSlider({
    type: 'double', // make a range slider (use 'single' for a basic slider)
    skin: 'round', // select a default style
    min: 01, // min of the range
    max: 28, // max of the range
    from: 01, // min of the default selected range
    to: 28, // max of the default selected range
    prettify_enabled: false, // turn off formatting of the labels (otherwise '2020' would be displayed as '2 020')
    prefix: '2021-2-',
    // When we move the slider we want to
    // * redraw the chart for the selected date range
    // * any highlighted franchises should stay the highlighted ('All' or a specific franchise selected from the dropdown menu)
    onChange: function(newRange){
        // Before redrawing the chart, we need to remove its current contents
        d3.selectAll('text').remove()
        d3.selectAll('circle').remove()
        d3.selectAll('line').remove()
        d3.selectAll('path').remove()

        // Read the new range values and store them in the 'parameters' object
        params['min_date'] = `2021-02-${newRange['from']}`;
        params['max_date'] = `2021-02-${newRange['to']}`

        // Redraw the chart. The new X scale will read from params to set its new range!
        draw(data,vis_width,vis_height,params);
      }
  });
}

// Create a dropdown menu allowing users to select a specific franchise or return to the default view ('All')
var createToolbar = function(data, params) {
  // an array of the franchise names in the input data
  var franchises = d3.set(data.map(function(d) { return d['dropdown'];})).values();
  // create pickers for both the franchise title
  var dimensions = ['franchise'];
  var toolbar_labels = ['Label of Customer']; // This will be displayed to the left of the dropdown menu

  // We don't need a for-loop here, since we're only adding a single dropdown menu,
  // but this code is handy to have if you ever need to add multiple dropdowns, so I'm keeping it in.
  for(var i_dim in dimensions) {
    var dim = dimensions[i_dim];
    var label = toolbar_labels[i_dim];
    //console.log(i_dim);

    // create the <select></select> dropdown menu
    $('#toolbar').append("<div class='form-group'><label for='"+dim+"-var'>"+label+":</label><select class='form-control' id='"+dim+"-var'></select></div>")
    // populate the dropdown with the movie franchise options (<option></option>)
    for(i_franchise in franchises) {
      franchise_name = franchises[i_franchise];
      $('#'+dim+'-var').append("<option value='"+franchise_name+"'>"+franchise_name+"</option>");
    }
    // set picker to saved param values
    $('#'+dim+'-var').val(params[dim+'axis']);

    // handle change to select, wrap in anonymous function so the pickers don't clash
    $('#'+dim+'-var').change(function(dim) {
      return function() {
        var newVar = $('#'+dim+'-var').val();
        params[dim+'axis'] = newVar;
        params[dim+'axislabel'] = newVar;
        params['num'] = $("#franchise-var").val().replace("rate", "number");
        params['rate'] = $("#franchise-var").val();
        console.log(params['num'],params['rate'])

        // The order of operation matters here. If 'All' franchises are selected,
        // we want to return to the default view.
        // If a specific franchise is selected, we want to highlight only that franchise.

        d3.selectAll('.line_highlight')
            .style('opacity', function() {return newVar === 'All' ? 0.7 : 0;})
        d3.selectAll('.circle_highlight')
            .style('fill', function() {return newVar === 'All' ? '#005b96' : '#b3cde0';})
            
        d3.selectAll('.dot')
          .style('fill', '#b3cde0')
        d3.selectAll('.curve')
          .style('opacity', 0)
        
        var this_index = franchises.indexOf(newVar)

      
        draw(data,vis_width,vis_height,params);
      }
    }(dim));
  }
}

// Execute the se functions to actually build the chart
createSlider(data, params);
createToolbar(data, params);
draw(data,vis_width,vis_height,params);

// Append a div container to the #vis div containter. This container will hold our tooltips.
$('#vis').append("<div class='tooltip' id='chart-tooltip'></div>");
// Hide the tooltips by default, we'll display them only when the user hovers over a bubble.
$('#chart-tooltip').hide();
