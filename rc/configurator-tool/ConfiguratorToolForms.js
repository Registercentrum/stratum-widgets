
(function() {
    "use strict";

    var SELECTED_ITEM = null;

    function getStore() {

        var store = Ext.create("Ext.data.Store", {
            model: Ext.define(null, {
                extend: "Stratum.Form"
            }),
            autoLoad: true,
            proxy: {
                type: "rest",
                url: "/stratum/api/metadata/forms/register/" + Profile.Context.Unit.Register.RegisterID,
                reader: "compactjson",
                writer: "compactjson"
            }
        });
        
        return store;
    }

    function defineController() {
        Ext.define("RC.ConfiguratorTool.controller.FormsAdministrationController", {
            extend: 'Ext.app.ViewController',
            alias: 'controller.formsadministration',
            onSelect: function(event, record, index, options) {
                var editButton = this.getView().down("#editButton");
                var removeButton = this.getView().down("#removeButton");
                editButton.setDisabled(!event.selected.length);
                removeButton.setDisabled(!event.selected.length);
                if(event.selected.length > 0) {
                    SELECTED_ITEM = event.selected.items[0];
                }
            },
            onNew: function(event, record, index, options) {
                console.log("New button was clicked");
            },
            onEdit: function(event, record, index, options) {
                this.redirectTo('editform/' + SELECTED_ITEM.id);
            },
            onRemove: function(event, record, index, options) {
                console.log("Remove button was clicked");
            },
        });
    }

    function defineView() {
        Ext.define("RC.ConfiguratorTool.view.FormsAdministrationView", {
            extend: "Ext.Panel",
            alias: "widget.formsadministration",
            controller: "formsadministration",
            title: "Formulär",
            dockedItems: [{
                xtype: 'toolbar',
                dock: 'top',
                items: [{
                    text: "Nytt",
                    handler: "onNew"
                }, {
                    text: "Redigera",
                    itemId: "editButton",
                    disabled: true,
                    handler: "onEdit"
                }, {
                    text: "Ta bort",
                    itemId: "removeButton",
                    disabled: true,
                    handler: "onRemove"
                }]
            }],
            items: [{
                xtype: "grid",
                itemId: "FormsGrid",
                height: 200,
                store: getStore(),
                selModel: {
                    selType: 'rowmodel',
                    allowDeselect: true,
                    mode: "SINGLE",
                    toggleOnClick: true
                },
                listeners: {
                    select: "onSelect",
                    deselect: "onSelect"
                },
                columns: {
                    items: [
                        { text: "Titel", dataIndex: "FormTitle", flex: 1  },
                        { text: "Namn", dataIndex: "FormName", flex: 1  },
                        { text: "Cross border", dataIndex: "IsCrossBorder", width: 100  },
                        { text: "Subject bound", dataIndex: "IsSubjectBound", width: 100  }
                    ]
                }
            }]
        });
    }

    defineView();
    defineController();

})();

// SiteId: 100
// WidgetId: RC/ConfiguratorToolForms
// WidgetName: Konfiguratörsverktyg, formulär
