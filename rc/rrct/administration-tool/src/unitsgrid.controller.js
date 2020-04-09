import config from "./config";
import api from "./api";

Ext.define('RC.RRCTAdministration.controller.Units', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.units',
    activate: function() {
        var unit = this.view.selection.data;
        var record = this.getView().getStore().getById(unit.UnitId);
        var controller = this;
        Ext.MessageBox.show({
            title: 'Aktivera enhet',
            msg: `Är du säker på att du vill aktivera enheten ${unit.UnitName} i studien ${config.studyName}?`,
            buttons: Ext.MessageBox.YESNO,
            buttonText: {
                yes: 'Ja',
                no: 'Nej'
            },
            fn: function(response) {
                if (response == 'yes') {
                    record.set('Enabled', true);
                    setButtonState(false, controller);
                }
            }
        });
    },
    deactivate: function() {
        var unit = this.view.selection.data;
        var record = this.getView().getStore().getById(unit.UnitId);
        var controller = this;
        Ext.MessageBox.show({
            title: 'Inaktivera enhet',
            msg: `Är du säker på att du vill inaktivera enheten ${unit.UnitName} i studien ${config.studyName}?`,
            buttons: Ext.MessageBox.YESNO,
            buttonText: {
                yes: 'Ja',
                no: 'Nej'
            },
            fn: function(response) {
                if (response == 'yes') {
                    record.set('Enabled', false);
                    setButtonState(true, controller);
                }
            }
        });
    },
    onSelectionChange: function (component, record, index, eOpts) {
        setButtonState(!record[0].data.Enabled, this);
    },
});

function setButtonState(activateEnabled, controller) {
    if(activateEnabled) {
        controller.lookup('activateUnitButton').enable();
        controller.lookup('deactivateUnitButton').disable();            
    }
    else {
        controller.lookup('activateUnitButton').disable();
        controller.lookup('deactivateUnitButton').enable();
    }
}