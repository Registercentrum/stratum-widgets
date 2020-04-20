var SELECTED_ITEM = null;

Ext.define("RC.ConfiguratorTool.controller.FormsAdministrationController", {
    extend: 'Ext.app.ViewController',
    alias: 'controller.formsadministration',
    onSelect: function(event) {
        var editButton = this.getView().down("#editButton");
        var removeButton = this.getView().down("#removeButton");
        editButton.setDisabled(!event.selected.length);
        removeButton.setDisabled(!event.selected.length);
        if(event.selected.length > 0) {
            SELECTED_ITEM = event.selected.items[0];
        }
    },
    onNew: function() {
        console.log("New button was clicked");
    },
    onEdit: function() {
        this.redirectTo('editform/' + SELECTED_ITEM.id);
    },
    onRemove: function() {
        console.log("Remove button was clicked");
    }
});
