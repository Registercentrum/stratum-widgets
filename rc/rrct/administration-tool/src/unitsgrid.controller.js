Ext.define('RC.RRCTAdministration.controller.Units', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.units',
    activate: function() {
        console.log('activate');
    },
    deactivate: function() {
        console.log('deactivate');
    },
    onSelectionChange: function (component, record, index, eOpts) {
        //console.log();
        if(record[0].data.Enabled) {
            this.lookup('activateUnitButton').disable();
            this.lookup('deactivateUnitButton').enable();
        }
        else {
            this.lookup('activateUnitButton').enable();
            this.lookup('deactivateUnitButton').disable();            
        }
    },
});
