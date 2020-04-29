import "./unit.model";
import "./unit.store";
import "./unitsgrid.controller";
import "./unitsgrid.view";
import config from "./config";
import * as api from "./api";

const ROLE_COORDINATOR = 903;

api.getStudyDetails().then(studyDetails => {

    Ext.create('RC.RRCTAdministration.store.Unit', {
        storeId: 'units',
        data: studyDetails.Units,
    });

    var items = [];
    if(Profile.Context.Role.RoleID === ROLE_COORDINATOR) {
        items.push({ 
            xtype: 'unitsgrid',     
            store: 'units',
            height: 450,
        });
    }
    else {
        items.push({ 
            xtype: 'component',
            style: {
                backgroundColor: '#fee',
                border: '1px solid #daa',
                padding: '15px 0',
                borderRadius: '5px',
                textAlign: 'center'
            },
            html: 'Du måste vara inloggad som koordinator för ' +
                  'att kunna använda detta verktyg.'
        });
    }

    Ext.create("Ext.container.Container", {
        renderTo: config.domContainer,
        margin: "0 0 20 0",
        items: items
    });

});
