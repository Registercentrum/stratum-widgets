var ConfiguratorToolFormDetails = (function() {
    "use strict";

    var FORM_ID = null;
    var STORE = null;
    var VIEW_ID = "RC.ConfiguratorTool.view.FormDetailsView";

    function loadQuestionsStore() {
        return Ext.create("Ext.data.Store", {
            autoLoad: true,
            proxy: {
                type: "ajax",
                url: "/stratum/api/metadata/forms/" + FORM_ID,
                reader: {
                    type: "json",
                    rootProperty: "data.Questions"
                }
            }
        });
    }

    function loadStore() {
        return Ext.create("Ext.data.Store", {
            autoLoad: true,
            proxy: {
                type: "ajax",
                url: "/stratum/api/metadata/forms/" + FORM_ID
            }
        });
    }

    function defineView() {
        Ext.define(VIEW_ID, {
            extend: "Ext.Container",
            alias: "widget.formdetails",
            padding: 20,
            items: [{
                xtype: "component",
                html: "<h2>Redigerar formulär: " + FORM_ID + "</h2>"
            }, {
                xtype: 'form',
                itemId: "testform",
                title: 'Testformulär',
                fieldLabel: 'Formulärtitel',
                viewModel: {
                    type: "formdetails"
                },
                items: [{
                    xtype: "textfield",
                    fieldLabel: 'Formulärnamn',
                    bind: {
                        value: '{form.data.FormTitle}'
                    }
                }]
            }, {
                xtype: "component",
                html: "<h3>Frågor</h3>"
            }, {
                xtype: "grid",
                itemId: "FormsGrid",
                store: loadQuestionsStore(),
                selModel: {
                    selType: 'rowmodel',
                    allowDeselect: true,
                    mode: "SINGLE",
                    toggleOnClick: true
                },
                columns: {
                    items: [
                        { text: "Kolumnnamn", dataIndex: "ColumnName", flex: 1  },
                        { text: "Mapped to", dataIndex: "MappedTo", flex: 1  },
                        { text: "Prefix text", dataIndex: "PrefixText", flex: 1  },
                    ]
                }
            }]
        });
    }

    function defineViewModel() {
        Ext.define('ConfiguratorToolFormDetailsViewModel', {
            extend: 'Ext.app.ViewModel',
            alias: 'viewmodel.formdetails',
            data: {
                form: null
            },
            stores: {
                formdetailstore: {
                    autoLoad: true,
                    proxy: {
                        type: "ajax",
                        url: "/stratum/api/metadata/forms/" + FORM_ID
                    },
                    listeners: {
                        load: function (store, data, success) {
                            console.log("store loaded...");
                            console.log(data[0]);
                            Ext.ComponentQuery.query('#testform')[0].getViewModel().set('form', data[0]);
                        }
                    }
                }
            }
        });
    }

    function getView() {
        return Ext.create(VIEW_ID);
    }

    function setFormId(id) {
        console.log("Setting form id to: " + id);
        FORM_ID = id;
    }

    function init(formId) {
        setFormId(formId);
        //STORE = loadStore();
        defineViewModel();
        defineView();
    }

    return {
        init: init,
        getView: getView
    }

})();

// SiteId: 100
// WidgetId: RC/ConfiguratorToolFormDetails
// WidgetName: Konfiguratörsverktyg, formulärdetaljer
