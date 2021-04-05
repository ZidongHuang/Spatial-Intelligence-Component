var data = JSON.parse(document.getElementById('data').innerHTML);
var vis_width = 1366; // outer width
var vis_height = 650; // outer height
var params = {store_display: 'All', min_date: "2021-2-1", max_date: "2021-2-28"}; // parameters to customize the chart

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
        .range([10,1000])
        // The '_.' indicates an Underscore function. Here we use it to extract a column from the JSON table and calulate the min and max
        .domain([_.min(data.map(function(d) { return d['male_number'];})),
                 _.max(data.map(function(d) { return d['male_number'];}))]);

    // A line generator function. We'll use this later to draw the curves connected movies belonging to the same franchise
    var line = d3.line()
                 .x(function(d) { return xScale(new Date(d['date'])); })
                 .y(function(d) { return yScale(d['male_percent']); })
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
    var storeName = d3.set(data.map(function(d) { return d['name'];})).values();
    var i;

    for (i = 0; i < storeName.length; i++) {
        var storeName_filt = storeName[i];
        var data_filt = _.filter(data, function(element){ return element.name && [element.name].indexOf(storeName_filt) != -1;});
            data_filt = data_filt.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()); //sort by time

        // Draw a curve connecting the movies belonging to the same franchise
        svg.append('path')
            .datum(data_filt)
            //Because this is a datum, to find out if this curve needs to be highlighted we need to look in d[0]['highlight'], not d['highlight']!
            .attr('class', function(d) {return d[0]['highlight'] == 1 ? 'curve line_' + i + ' line_highlight': 'curve line_' + i;})
            .attr('d', line) // call the line generator function defined earlier
            .style('fill', 'none')
            .style('stroke','#005b96')
            .style('stroke-width', 2)
            // If 'All' franchises are selected (default view), only the highlighed curves should be visible.
            // Otherise, only the curve for the selected franchise should be visible.
            .style('opacity', function(d) {
              if (params['store_display'] === 'All') {
                return d[0]['highlight'] == 1 ? 0.7 : 0;
              } else {
                return d[0]['floor'] == params['store_display'] ? 1 :0;
              };})
    };

    // Then add the bubbles to the chart (one for each store in each eay)
    for (i = 0; i < storeName.length; i++) {

        var storeName_filt = storeName[i];
        var data_filt = _.filter(data, function(element){return element.name && [element.name].indexOf(storeName_filt) != -1;})

        svg.selectAll('.circle_' + i)
          .data(data)
        .enter().append('circle')
          .attr('class', function(d) {return d['highlight'] == 1 ? 'dot circle_' + i + ' circle_highlight' : 'dot circle_' + i;})
          .attr('cx', function(d) { return xScale(new Date(d['date']));})
          .attr('cy', function(d) { return yScale(parseFloat(d['male_percent']));})
          .attr('r', function(d) { return Math.sqrt((bubbleScale(parseFloat(d['male_number'])))/Math.PI);})
          .style('stroke-width', 0)
          .style('stroke', 'black')
          .style('fill', function(d) {
            // If 'All' franchises are selected (default view), only the bubbles for highlighted franchises should be in dark blue.
            // Otherwise, only the bubbles of the selected franchise should be in dark blue.
            if (params['store_display'] === 'All') { return d['highlight'] == 1 ? '#005b96' : '#b3cde0';} else
            {return d['floor'] == params['store_display'] ? '#005b96' : '#b3cde0';};
          })
          .style('opacity', function(d) {
            // If 'All' franchises are selected (default view), al bubbles should be slightly opaque.
            // Otherwise, only the bubbles of the selected franchise should be solid, while the others remian slighlty opaque.
            if (params['store_display'] === 'All') {return 0.7;} else
            {return d['floor'] == params['store_display'] ? 1 : 0.7;};
          })


          // Hovering over a bubble while 'All' store are selected should
          // * Show the curve for the corresponding store
          // * Turn this and all other bubbles solid and dark blue
          // * Display a tooltip with details about the store
          // * Hide all other curves
          // * Hide the labels of the default highlighted stores

          // Hovering over a bubble while a specific store is selected (from the dropdown menu) should
          // * do nothing unless the bubble corresponds to a movie belonging to the selected franchise
          // * only show a tooltip if the movie belongs to the selected franchise
          .on('mouseover', function(d) {
            if (params['store_display'] === 'All') {
                d3.selectAll('.dot')
                  .style('fill', '#b3cde0')
                d3.selectAll('.curve')
                  .style('opacity', 0)
                var this_class = d3.select(this).attr('class')
                var this_index = this_class.split(' ')[1].split('_')[1]
                d3.selectAll('.circle_' + this_index)
                  .style('fill', '#005b96')
                d3.selectAll('.line_' + this_index)
                  .style('opacity', 1)
                  .moveToFront(); //bring to front
                d3.selectAll('.circle_' + this_index)
                  .style('opacity', 1)
                  .moveToFront(); //bring to front
                d3.select(this)
                  .style('stroke-width', 2)
                  .moveToFront(); //bring to front;
                d3.selectAll('.show_label')
                  .style('opacity', 0)

                var label = d['name'] + '<br/>' +
                            'floor: ' + d['floor'] + '<br/>' +
                            'percentage: ' + d['male_percent'] + '%' + '<br/>' +
                            'male_number: ' + Math.round(d['male_number']);
                return showDetails(label,this)
            }

            // Specify the contents of the tooltip
            if (d['name'] === params['store_display']) {
                var label = d['name'] + '<br/>' +
                            'floor: ' + d['floor'] + '<br/>' +
                            'percentage: ' + d['male_percent'] + '%' + '<br/>' +
                            'male_number: ' + Math.round(d['male_number']);
                return showDetails(label,this);
            }
          })
          // Moving the cursor out of a bubble when 'All' franchises are selected should
          // * restore the default view
          // * hide the tooltip
          // Moving the cursor out of a bubble when a franchises has been selected (from the dropdown menu) should
          // * remove the tooltip
          // * nothing else, the selected franchise should remain highlighted
          .on('mouseout', function(d) {
            if (params['store_display'] === 'All') {
                d3.selectAll('.dot')
                  .style('fill', '#b3cde0')
                  .style('stroke-width', 0);
                var this_class = d3.select(this).attr('class');
                var this_index = this_class.split(' ')[1].split('_')[1];
                d3.selectAll('.line_' + this_index)
                  .style('opacity', 0)
                d3.selectAll('.show_label')
                  .style('opacity', 0.7)
                d3.selectAll('.line_highlight')
                  .style('opacity', 0.7)
                d3.selectAll('.circle_highlight')
                  .style('fill', '#005b96')
                  .style('opacity', 0.7)
            }

            return hideDetails();}) // hides the tooltip
    };

    // If a specific franhchises was selected, we want to make its curve and bubbles solid
    // and bring both to the front of the page (so there is no overlap with other objects)
    if (params['store_display'] !== 'All'){
      var this_index = franchises.indexOf(params['store_display'])

      d3.selectAll('.line_' + this_index)
        .style('opacity', 1)
        .moveToFront(); //bring to front
      d3.selectAll('.circle_' + this_index)
        .style('opacity', 1)
        .moveToFront(); //bring to front
    }

    // A table defining the text and placement for the highlighted franchises
    var show_labels = [{franchise: 'King Kong', date: '1955-01-01', rating: 50},
                       {franchise: 'Terminator', date: '1993-01-01', rating: 85},
                       {franchise: 'TMNT', date: '2004-01-01', rating: 28},
                       {franchise: 'Mission: Impossible', date: '2013-01-01', rating: 97}];

    // Add these labels to the chart
    svg.selectAll('.show_label')
        .data(show_labels)
      .enter().append('text')
        .attr('class', 'show_label')
        .attr('x', function(d) {return xScale(new Date(d['date']));})
        .attr('y', function(d) {return yScale(d['rating']);})
        .style('fill', '#005b96')
        .style('font-size','14px')
        .style('text-anchor','middle')
        .style('opacity', params['store_display'] === 'All' ? 1 : 0)
        .text(function(d) {return d['floor']})

    // The next couple of blocks add a legend for the bubble size
    // Start by defining a table with values and text labels
    var data_legend = [{area: 2000000000, text: '$2B'},
                       {area: 1000000000, text: '$1B'},
                       {area:  500000000, text: '$500M'}];

    // Add circles to the bubble size legend
    svg.selectAll('.circle_label')
        .data(data_legend)
      .enter().append('circle')
        .attr('class', 'circle_legend')
        .attr('cx', function(d) {return xScale(new Date(params['min_date'] )) + 50;})
        .attr('cy', function(d, i) {return yScale(10) - 30*i;})
        // We are scaling the SIZE of the bubble based on gross revenue, not the radius!
        // Since D3 expects a radius attribute, we need to convert the mapped size to a radius here!
        .attr('r', function(d) {return Math.sqrt((bubbleScale(d['area']))/Math.PI)})
        .style('stroke-size', 2)
        .style('stroke','#8FA2AC')

    // Add text labels to the bubble size legend
    svg.selectAll('.circle_text')
        .data(data_legend)
      .enter().append('text')
        .attr('class', 'circle_text')
        .attr('x', function(d) {return xScale(new Date(params['min_date'] )) + 70;})
        .attr('y', function(d,i) {return yScale(10) - 30*i + 4;})
        .style('font-size','12px')
        .text(function(d) {return d['text'];})

    // Add a description to the bubble size legend
    // Since we're using two rows here, we define it as a table and use the .data().enter() method
    legend_label_data = [{text: 'Area = Box Office'},
                         {text: '(worldwide)'}]
   // Add the bubble size legend description to the chart
    svg.selectAll('.legend_label')
        .data(legend_label_data)
      .enter().append('text')
        .attr('class', 'legend_label')
        .attr('x', function(d) { return xScale(new Date(params['min_date'] )) + 50;})
        .attr('y', function(d,i) { return yScale(5) + Math.sqrt((bubbleScale(50))/Math.PI) + i*12;})
        .style('font-size','12px')
        .style('text-anchor','middle')
        .text(function(d) { return d['text']})
}






















// Display a tooltip message, above and to the right of the selected object
// Here element serves as selector of the bubble that we hovered over
var showDetails = function(data, element) {
  pos = $(element).position()
  $('#chart-tooltip').html(data)
  width = $('#chart-tooltip').width()
  height = $('#chart-tooltip').height()
  // display the tooltip above and to the right of the selected object
  $('#chart-tooltip').css('top', (pos.top-height*1.5)+'px').css('left', (pos.left-width/2.0)+'px')
  $('#chart-tooltip').show()
};
// Hide the tooltip whenever we move the mouse back out of a bubble
var hideDetails = function() {
  $('#chart-tooltip').hide()
};

// Helper fucntion to move objects to the front of the draw queue. This means no other objects will overlap with it.
d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
    this.parentNode.appendChild(this);
    });
};

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
    var franchises = d3.set(data.map(function(d) { return d['floor'];})).values();
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
      $('#toolbar').append("<div class='form-group'><label for='"+dim+"-var'>"+label+":</label><select class='form-control' id='"+dim+"-var'><option value = All selected>All</option></select></div>")
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

          // The order of operation matters here. If 'All' franchises are selected,
          // we want to return to the default view.
          // If a specific franchise is selected, we want to highlight only that franchise.
          if (newVar === 'All') {
            d3.selectAll('.dot')
              .style('fill', '#b3cde0')
            d3.selectAll('.curve')
              .style('opacity', 0)

            d3.selectAll('.show_label')
              .style('opacity', function() {return newVar === 'All' ? 1 : 0;})
            d3.selectAll('.line_highlight')
                .style('opacity', function() {return newVar === 'All' ? 0.7 : 0;})
            d3.selectAll('.circle_highlight')
                .style('fill', function() {return newVar === 'All' ? '#005b96' : '#b3cde0';})
          } else {
            d3.selectAll('.show_label')
              .style('opacity', function() {return newVar === 'All' ? 1 : 0;})
              .moveToFront(); //bring to front
            d3.selectAll('.line_highlight')
                .style('opacity', function() {return newVar === 'All' ? 0.7 : 0;})
            d3.selectAll('.circle_highlight')
                .style('fill', function() {return newVar === 'All' ? '#005b96' : '#b3cde0';})

            d3.selectAll('.dot')
              .style('fill', '#b3cde0')
            d3.selectAll('.curve')
              .style('opacity', 0)

            var this_index = franchises.indexOf(newVar)

            d3.selectAll('.circle_' + this_index)
                .style('fill', '#005b96')
                .style('opacity', 1)
                .moveToFront(); //bring to front
            d3.selectAll('.line_' + this_index)
                .style('opacity', 1)
                .moveToFront(); //bring to front
          }

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
