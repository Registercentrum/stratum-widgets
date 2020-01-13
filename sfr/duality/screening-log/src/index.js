import { define as defineModel } from "../../../_shared/models/rrct.screening-log.model";
import * as api from "../../../_shared/api";
import { flattenCandidates } from "../../../_shared/utils";
import { get as getStore } from "../../../_shared/stores/rrct.screening-log.store";
import { renderUI } from "../../../_shared/ui/rrct.screening-log.grid";
import { getBaseUrl } from "./config";

defineModel();
api.setRrctBaseUrl(getBaseUrl());

Ext.Promise.all([api.getCandidates(), api.getUnits()]).then(function(result) {
    var flattenedData = flattenCandidates(result[0], result[1]);
    var store = getStore(flattenedData);
    renderUI(store, "sw-duality-screening-log");
}, function(error) {
    console.error("An error occurred.");
    console.error(error);
});        
