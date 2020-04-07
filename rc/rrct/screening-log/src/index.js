import { define as defineModel } from "./model";
import { get as getStore } from "./store";
import { renderUI } from "./grid";
import { flattenCandidates } from "./utils";
import * as api from "./api";

if(typeof window.RrctScreeningLogConfig !== "object") {
    throw "No configuration was found for RRCT Screening Log!";
}

var config = window.RrctScreeningLogConfig;

if(!config.Container) {
    throw "No DOM container was specified!";
}

if(!config.BaseUrl) {
    throw "RRCT base url was not set!";
}

defineModel();
api.setRrctBaseUrl(config.BaseUrl);

Ext.Promise.all([api.getCandidates(), api.getUnits()]).then(function(result) {
    var flattenedData = flattenCandidates(result[0], result[1]);
    var store = getStore(flattenedData);
    renderUI(store, config.Container);
}, function(error) {
    console.error("An error occurred.");
    console.error(error);
});        
