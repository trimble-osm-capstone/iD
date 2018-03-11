import serviceMapillary from './mapillary';
import serviceBuildingIdentification from './building_identification';
import serviceNominatim from './nominatim';
import serviceOpenstreetcam from './openstreetcam';
import serviceOsm from './osm';
import serviceTaginfo from './taginfo';
import serviceWikidata from './wikidata';
import serviceWikipedia from './wikipedia';

export var services = {
    geocoder: serviceNominatim,
    mapillary: serviceMapillary,
    openstreetcam: serviceOpenstreetcam,
    osm: serviceOsm,
    taginfo: serviceTaginfo,
    wikidata: serviceWikidata,
    wikipedia: serviceWikipedia,
    buildingIdentification : serviceBuildingIdentification
};

export {
    serviceMapillary,
    serviceNominatim,
    serviceOpenstreetcam,
    serviceOsm,
    serviceTaginfo,
    serviceWikidata,
    serviceWikipedia,
    serviceBuildingIdentification
};
