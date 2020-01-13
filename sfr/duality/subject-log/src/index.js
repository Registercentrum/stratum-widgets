import { define as defineModel } from "../../../_shared/models/rrct.subject-log.model"
import { get as getStore } from "../../../_shared/stores/rrct.subject-log.store";
import * as api from "../../../_shared/api";
import { render as renderGrid } from "../../../_shared/ui/rrct.subject-log.grid";

defineModel();
api.setRrctBaseUrl("/stratum/api/rrct/clinicaltrial-duality-nationellariktlinjer.1.0.0")

api.getSubjects()
    .then(function(subjects) {
        var store = getStore(subjects);
        renderGrid(store, "sw-duality-subject-log");
    }, function(error) {
        console.error("An error occurred.");
        console.error(error);
    });
