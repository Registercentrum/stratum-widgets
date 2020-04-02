import * as api from "./api";
import * as store from "./store";
import * as ui from "./ui";

if(typeof window.VariableAdministration !== "object") {
    throw "No configuration was found for Variable Administration!";
}
var config = window.VariableAdministration;
if(!config.Container) {
    throw "No DOM container was specified!";
}

var gridPanel = ui.getGrid();

function updateGridPanel(variableList) {
    var variableStore = store.getVariableStore(variableList);
    gridPanel.setStore(variableStore);
}

api.getRegisters().then(registers => {

    var registerStore = store.getRegisterStore(registers);

    var comboBox = ui.getComboBox(registerStore, updateGridPanel);

    Ext.create("Ext.container.Container", {
        renderTo: config.Container,
        margin: "0 0 20 0",
        items: [
            comboBox,
            gridPanel
        ]
    });

});
