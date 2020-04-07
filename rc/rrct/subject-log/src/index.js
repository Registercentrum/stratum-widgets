import { define as defineModel } from "./model"
import { get as getStore } from "./store";
import { render as renderGrid } from "./grid";
import * as api from "./api";

if(typeof window.RrctSubjectLogConfig !== "object") {
    throw "No configuration was found for RRCT Screening Log!";
}

var config = window.RrctSubjectLogConfig;

if(!config.Container) {
    throw "No DOM container was specified!";
}

if(!config.BaseUrl) {
    throw "RRCT base url was not set!";
}


defineModel();
api.setRrctBaseUrl(config.BaseUrl)

api.getSubjects()
    .then(function(subjects) {
        var store = getStore(subjects);
        renderGrid(store, config.Container);
    }, function(error) {
        console.error("An error occurred.");
        console.error(error);
    });
