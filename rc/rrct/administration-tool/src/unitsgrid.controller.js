import config from "./config";
import * as api from "./api";

Ext.define('RC.RRCTAdministration.controller.Units', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.units',
    activate: function() {
        changeUnitState(true, this);
    },
    deactivate: function() {
        changeUnitState(false, this);
    },
    onSelectionChange: function (component, record, index, eOpts) {
        setButtonState(!record[0].data.Enabled, this);
    },
});

function changeUnitState(activate, controller) {
    var view = controller.getView();
    var unit = view.selection.data;
    var record = view.getStore().getById(unit.UnitId);
    var title = activate ? 'Aktivera enhet' : 'Inaktivera enhet';
    var actionText = activate ? 'aktivera' : 'inaktivera'
    var message = `Är du säker på att du vill ${actionText} enheten ${unit.UnitName} i studien ${config.studyName}?`;
    Ext.MessageBox.show({
        title: title,
        msg: message,
        buttons: Ext.MessageBox.YESNO,
        buttonText: {
            yes: 'Ja',
            no: 'Nej'
        },
        fn: function(response) {
            if (response == 'yes') {
                var action = activate ? api.activateUnit : api.deactivateUnit;
                action(unit.UnitId).then(function() {
                    record.set('Enabled', activate);
                    setButtonState(!activate, controller);
                    view.fireEvent('storechange');
                }).catch(error => {
                    console.log("Kunde inte ändra status på enheten.");
                    console.log(error);
                });
            }
        }
    });
}

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