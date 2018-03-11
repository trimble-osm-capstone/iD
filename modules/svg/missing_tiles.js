import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';
import { svgPath, svgPointTransform } from './index';
import { services } from '../services';
import * as d3 from 'd3';

function tile2deg(x,y,zoom){
    var n = Math.pow(2,zoom);
    var lon = x / n * 360 - 180;
    var lat_rad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y /n)));
    var lat = lat_rad * (180 / Math.PI);
    return [lon, lat]
}

function deg2tile(lon, lat, zoom){
    return [(Math.floor((lon+180)/360*Math.pow(2,zoom))), (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)))]
}


export function svgMissingTiles(projection, context, dispatch) {
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 300);
    var layer = d3_select(null);
    var service = services.buildingIdentification;

    service.on('loadedTiles', throttledRedraw);
    service.on('redraw', () => dispatch.call('change')); //no throttle

    function getTilePath(tile, path){
        var loc = tile2deg(tile.coords[0],tile.coords[1],tile.coords[2]);
        var loc2 = tile2deg(tile.coords[0]+1,tile.coords[1]+1,tile.coords[2]);
        var geojson = {
          "type": "Feature",
          "properties": {},
          "geometry": {
            "type": "Polygon",
            "coordinates": [
              [
                loc, [loc[0], loc2[1]], loc2, [loc2[0], loc[1]], loc
              ]
            ]
          }
        }
        return path({id: tile.id, asGeoJSON : _ => geojson})
    }

    function drawTiles(selection) {
        var enabled = svgMissingTiles.enabled;
        var hovered = service.hover();
        var selected = service.select();

        var s = projection.scale() * 2 * Math.PI,
            z = Math.floor(Math.max(Math.log(s) / Math.log(2) - 8, 0))

        layer = selection.selectAll('.layer-missing-tiles')
            .data(enabled ? [0] : []);

        layer.exit()
            .remove();

        var layerEnter = layer.enter()
            .append('g')
            .attr('class', 'layer-missing-tiles')

        layer = layerEnter
            .merge(layer);

        var path = svgPath(projection, null, true)

        var tiles = layer.selectAll('.mtile')
            .data(service.tiles, tile => tile.id);

        tiles.exit()
            .remove();

        tilesEnter = tiles.enter()
            .append('path')
            .attr('class', 'mtile')

        tiles = tilesEnter
            .merge(tiles)
            .attr('d', d => getTilePath(d, path));

        var tileBorders = layer.selectAll('.mtile-border')
            .data(service.tiles, tile => tile.id);

        tileBorders.exit()
            .remove();


        tileBorders = tileBorders.enter()
            .append('path')
            .attr('class', 'mtile-border')
            .merge(tileBorders)
            .attr('d', d => getTilePath(d, path))
            .style('display', d => z > 14 && d.coords[2] == 17?'block':'none')
            .classed('isSelected', d => (selected && selected.id)==d.id)

        var map = d3_select('.layer-data').on('mousemove', function(){
            const point = projection.invert(d3.mouse(this));
            const selTile = deg2tile(point[0],point[1], 17)
            service.hover([...selTile, 17]+'', context)
        });
        var map = d3_select('.layer-data').on('click', function(){
            const point = projection.invert(d3.mouse(this));
            const selTile = deg2tile(point[0],point[1], 17)
            service.select([...selTile, 17]+'', context)
        });


        service.loadTiles(projection)
    }


    drawTiles.enabled = function(_) {
        if (!arguments.length) return svgMissingTiles.enabled;
        svgMissingTiles.enabled = _;
        dispatch.call('change');
        return this;
    };


    drawTiles.supported = function() {
        return true;
    };

    drawTiles.enabled(true)

    return drawTiles;
}
