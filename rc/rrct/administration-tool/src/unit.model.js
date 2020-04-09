
Ext.define("RC.RRCTAdministration.model.Unit", {
    extend: "Ext.data.Model",
    idProperty: 'UnitId',
    fields: [ 
        { name: "UnitId" }, 
        { name: "UnitName" }, 
        { name: "Enabled", type: 'boolean' },
    ]
});
