import {
    select as d3_select,
    selectAll as d3_selectAll
} from 'd3-selection';

import _throttle from 'lodash-es/throttle';
import { services } from '../services';
import { svgIcon } from '../svg';
import { tooltip } from '../util/tooltip';

function tile2deg(x,y,zoom){
    var n = Math.pow(2,zoom);
    var lon = x / n * 360 - 180;
    var lat_rad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y /n)));
    var lat = lat_rad * (180 / Math.PI);
    return [lon, lat]
}

export function uiTileInspector(context) {
		var service = services.buildingIdentification;

		function tileUrl(x, y, z){
			return `https://b.tiles.mapbox.com/styles/v1/openstreetmap/cj8gojt0i1eau2rnn7q4mdgu7/tiles/256/${z}/${x}/${y}?access_token=pk.eyJ1Ijoib3BlbnN0cmVldG1hcCIsImEiOiJhNVlHd29ZIn0.ti6wATGDWOmCnCYen-Ip7Q`
			//return 'https://a.tiles.mapbox.com/v4/digitalglobe.316c9a2e/'+z+'/'+x+'/'+y+'.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqOGRmNXltOTBucm0yd3BtY3E5czl6NmYifQ.qJJsPgCjyzMCm3YG3YWQBQ'
		}

		function keyVal(data){
			return function(selection){
				var keyval = selection.selectAll('.keyVal').data(data, d => d.key+d.val)

				var enter = keyval.enter()
					.append('div')
					.attr('class', 'keyVal')

				enter
					.append('div')
					.attr('class', 'key')

				enter
					.append('div')
					.attr('class', 'val')

				var update = enter.merge(keyval)
				
				update.selectAll('.key').text(d => d.key)
				update.selectAll('.val').text(d => d.val)

				keyval.exit().remove()

			}
		}

		var inspectorUpdate;
		var footer;
		var wrapper;
		var selected;

    function tileInspector(selection) {
    	wrapper = selection;
			//enter
			var header = selection.selectAll('.header').data([0]);
			
			var headerEnter = header.enter()
				.append('div')
				.attr('class', 'header fillL cf');

			headerEnter.append('button')
				.attr('class', 'fr preset-close')
				.on('click', () => service.select(null, context))
				.call(svgIcon('#icon-close'));
			
			headerEnter
				.append('h3')
				.text('Building Identification')

			var inspector = selection.selectAll('.inspector').data([0]);

			var inspectorEnter = inspector.enter()
				.append('div')
				.attr('class', 'inspector');

			var panels = inspectorEnter
				.append('div')
				.attr('class', 'inspector-horiz')

			var imgPanel = panels
				.append('div')
				.attr('class', 'inspector-panel image')

			imgPanel
				.append('img')
				.attr('class', 'statusImg')

			var actionPanel = panels
				.append('div')
				.attr('class', 'inspector-panel action')

	  	footer = inspectorEnter
	  		.append('div')
	  		.attr('class', 'tile-footer')

			//update
			inspectorUpdate = inspector
				.merge(inspectorEnter)

			//exit
			inspector.exit()
				.remove()
    }

    function button(key, icon, text, color, tooltipText, callback){
    	return function(selection){
    		var button = selection.selectAll('.'+key).data([0])

    		var buttonEnter = button.enter()
    			.append('div')
	  			.attr('class', 'tbutton '+key)

	  		if(text) buttonEnter
	  			.append('span')
	  			.style('margin-left', '5px')

	  		buttonUpdate = buttonEnter.merge(button)
		  		.call(svgIcon('#icon-'+icon))
		  		.style('background', color||'')
		  		.on('click', callback)

		  	if(tooltipText)
		  		buttonUpdate.call(tooltip()
	            .title(tooltipText)
	            .placement('top')
	        );

		  	if(text) buttonUpdate.select('span').text(text)
    	}
    }

    tileInspector.select = function(tile){
    	if(tile){
    		inspectorUpdate.selectAll('.statusImg')
    			.attr('src', tile && tileUrl(tile.coords[0], tile.coords[1], tile.coords[2]))

    		inspectorUpdate.selectAll('.action')
    			.call(keyVal([
    				{key : 'Tile', val : '('+tile.coords[0]+', '+tile.coords[1]+')'},
    				{key : 'Model', val : tile.model||'Simple'},
    				{key : 'Prediction', val : 'Has Building'},
    				{key : 'Status', val : tile.completed?'Completed':tile.incorrect?'Incorrect':'Unverified'}
    			]))

    			
    			footer.call(button('zoomto', 'geolocate', 'Zoom to Tile', null, null, () => {
    				var loc = tile2deg(selected.coords[0]+0.5, selected.coords[1]+0.5, selected.coords[2]);
    				context.map().centerZoom(loc, selected.coords[2]+1)
    			}))

    			footer.call(button('find', 'area', 'Find Buildings', null, null, () => {
    				service.predict(tile.coords, context)
    			}))
    		
    	}
    	
    	d3_selectAll('#sidebar').classed('lessHeight', !!tile)
    	wrapper.classed('hasheight', !!tile)
    	selected = tile;
    }

    return tileInspector;
}
