import * as api from "./api";
import { renderUI } from "./ui";

if(typeof window.RrctProgressWidgetConfig !== "object") {
    throw "No configuration was found for RRCT Progress Widget!";
}

var config = window.RrctProgressWidgetConfig;

if(!config.container) {
    throw "No DOM container was specified!";
}

if(!config.baseUrl) {
    throw "RRCT base url was not set!";
}

api.setRrctBaseUrl(config.baseUrl);

function simpleCompare(value1, value2) {
    if(value1 == value2) return 0;
    if(value1 > value2) return -1;
    return 1;
}

api.getCandidates()
    .then(function(candidates) {
        window._candidates = candidates;
        var includedCandidates = Ext.Array.filter(candidates, function(item) {
            return item.Included;
        });
        var latestIncludedCandidate = Ext.Array.sort(includedCandidates, function(item1, item2) {
            return simpleCompare(
                Ext.Date.parse(item1.Screening.DateConsidered, "Y-m-dTH:i:s"),
                Ext.Date.parse(item2.Screening.DateConsidered, "Y-m-dTH:i:s"));
        })[0];

        api.getUnit(latestIncludedCandidate.Screening.UnitId).then(function(unit) {
            var model = {
                numIncluded: includedCandidates.length,
                latestIncludedUnitName: unit.UnitName,
                latestInclusionDate: latestIncludedCandidate.Screening.DateConsidered
            }
    
            renderUI(model, config.container);
        });
    }, function(error) {
        console.error("An error occurred.");
        console.error(error);
    });
