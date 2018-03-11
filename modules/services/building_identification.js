import _throttle from 'lodash-es/throttle';
import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    request as d3_request,
    json as d3_json
} from 'd3-request';

import {
    select as d3_select,
    selectAll as d3_selectAll
} from 'd3-selection';

import {
    actionAddEntity,
    actionAddMidpoint,
    actionAddVertex
} from '../actions';

import { osmNode, osmWay } from '../osm';
import { modeDrawArea } from '../modes/index';

function actionClose(wayId) {
    return function (graph) {
        return graph.replace(graph.entity(wayId).close());
    };
}

import { d3geoTile as d3_geoTile } from '../lib/d3.geo.tile';
import { utilRebind } from '../util';


var apibase =  window.location.hostname === 'localhost'?'http://localhost:5000/':'http://34.214.185.174/api/',
    dispatch = d3_dispatch('loadedTiles', 'redraw')

function getTiles(projection) {
    var s = projection.scale() * 2 * Math.PI,
        z = Math.min(Math.floor(Math.max(Math.log(s) / Math.log(2) - 8, 0)), 16)

    return d3_geoTile()
        .scaleExtent([z, z])
        .scale(s)
        .size(projection.clipExtent()[1])
        .translate(projection.translate())()
}

function stringify(tile){
    return tile.join(',')
}

function parse(tilestr){
    return tilestr.split(',').map(i => parseInt(i, 10))
}

function tile2deg(x,y,zoom){
    var n = Math.pow(2,zoom);
    var lon = x / n * 360 - 180;
    var lat_rad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y /n)));
    var lat = lat_rad * (180 / Math.PI);
    return [lon, lat]
}


var lastAllTiles = [];
var hovered;
var selected;

var service = {
    tiles : [],
    cache : {},
    pending : {},
    loadTiles(projection){
        var allTiles = getTiles(projection)
        var tiles = allTiles.filter(tile => 
            tile && !service.cache[stringify(tile)] && !service.pending[stringify(tile)]
        );
        tiles.forEach(tile => {
            service.pending[stringify(tile)] = 1;
        })
        if(tiles.length) d3_json(apibase+'pred_tiles', function(e, resTiles){
            Object.keys(resTiles).forEach(tilestr => {
                delete service.pending[tilestr];
                var tile = parse(tilestr)
                var childTiles = resTiles[tilestr];
                service.cache[tilestr] = Object.values(childTiles)
                // .map(tile => {
                //     return {
                //         id : stringify(tile),
                //         coords : tile
                //     }
                // });
            })
            service.tiles = []
            allTiles.forEach(tile => {
                service.tiles = service.tiles.concat(service.cache[stringify(tile)])
            })
            dispatch.call('loadedTiles')
        })
        .header("Content-Type", "application/json")
        .send("POST", JSON.stringify(tiles))
        else if(lastAllTiles !== allTiles+''){
            service.tiles = []
            allTiles.forEach(tile => {
                service.tiles = service.tiles.concat(service.cache[stringify(tile)])
            })
            dispatch.call('loadedTiles')
        }
        lastAllTiles = allTiles+''
    },
    hover(tile, context){
        if(arguments.length){
            if(hovered !== tile){
                hovered = tile;
                dispatch.call('redraw');
            }   
        }else return hovered;
    },
    select(tile, context){
        if(arguments.length){
            var match = service.tiles.filter(t => t.id === tile)
            if(!match.length) tile = null;
            else tile = match[0]

            if(selected !== tile){
                selected = tile;
                dispatch.call('redraw');
            }   
            context.ui().tileInspector.select(tile)
        }else return selected;
    },
    predict(coords, context){
        d3_json(`${apibase}contours/${coords[0]}/${coords[1]}`, function(e, buildings){
            buildings.forEach(building => {
                var way = osmWay({ tags: { area: 'yes' , building: "yes"}});
                var nodes = building.map(loc => osmNode({loc}))
                context.perform(
                    ...nodes.map(node => actionAddEntity(node)),
                    actionAddEntity(way),
                    ...nodes.map(node => actionAddVertex(way.id, node.id)),
                    actionClose(way.id)
                );
            })
        })
    }
}

export default utilRebind(service, dispatch, 'on')

    