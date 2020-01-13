import { define as defineModel } from "../../../_shared/models/rrct.subject-log.model"
import { get as getStore } from "../../../_shared/stores/rrct.subject-log.store";
import { render as renderGrid } from "../../../_shared/ui/rrct.subject-log.grid";
import * as api from "../../../_shared/api";
import { getBaseUrl } from "./config";

defineModel();
api.setRrctBaseUrl(getBaseUrl())

api.getSubjects()
    .then(function(subjects) {
        var store = getStore(subjects);
        renderGrid(store, "sw-hipsther-subject-log");
    }, function(error) {
        console.error("An error occurred.");
        console.error(error);
    });
