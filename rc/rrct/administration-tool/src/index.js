import "./unit.model";
import "./unit.store";
import "./unitsgrid.controller";
import "./unitsgrid.view";
import config from "./config";
import * as api from "./api";

api.getStudyDetails().then(studyDetails => {

    Ext.create('RC.RRCTAdministration.store.Unit', {
        storeId: 'units',
        data: studyDetails.Units,
    });

    Ext.create("Ext.container.Container", {
        renderTo: config.domContainer,
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
