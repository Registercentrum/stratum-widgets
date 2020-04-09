
Ext.define("RC.RRCTAdministration.model.Unit", {
    extend: "Ext.data.Model",
    fields: [ 
        { name: "UnitId" }, 
        { name: "UnitName" }, 
        { name: "Enabled", type: 'boolean' },
    ]
});
