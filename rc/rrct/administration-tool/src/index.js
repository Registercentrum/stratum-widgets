import "./unit.model";
import "./unit.store";
import "./unitsgrid.controller";
import "./unitsgrid.view";
import * as api from "./api";

api.setRrctBaseUrl('/stratum/api/rrct/clinicaltrial-duality-nationellariktlinjer.1.0.0/');
api.getStudyDetails().then(studyDetails => {

    Ext.create('RC.RRCTAdministration.store.Unit', {
        storeId: 'units',
        data: studyDetails.Units,
    });

    Ext.create("Ext.container.Container", {
        renderTo: 'sw-rrct-administration',
        margin: "0 0 20 0",
        items: [
            { 
                xtype: 'unitsgrid',     
                store: 'units',
                height: 450,
            }
        ]
    });

});
