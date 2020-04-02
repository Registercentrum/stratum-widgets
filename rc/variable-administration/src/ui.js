import * as api from "./api";

export function getComboBox(registerStore, callback) {
    return Ext.create('Ext.form.field.ComboBox', {
        fieldLabel: 'Välj register',
        displayField: 'RegisterName',
        valueField: 'RegisterID',
        store: registerStore,
        width: '100%',
        listeners: {
            select: function(element, selection) {
                api.getForms(selection.data.RegisterID).then(forms => {
                    var promiseList = [];
                    forms.forEach(form => {
                        promiseList.push(api.getVariables(form.FormID));
                    });

                    Ext.Promise.all(promiseList).then(results => {
                        var variableList = [].concat.apply([], results);
                        callback(variableList);
                    });
                });
            }
        },
    });
}

export function getGrid() {
    return Ext.create("Ext.grid.Panel", {
        plugins: "gridfilters",
        columns: [
            {
                text: "Variabel",
                flex: 1,
                dataIndex: "ColumnName",
                filter: {
                    type: "string"
                }
            },
            {
                text: "Beskrivning",
                flex: 1,
                dataIndex: "Description",
                filter: {
                    type: "string"
                }
            },
        ],
        listeners: {
            filterchange: function(store) {
                var footerText = getFooterText(store);
                this.down("#toolbarText").setHtml(footerText);
            },
            viewready: function(view) {
                var footerText = getFooterText(view.store);
                this.down("#toolbarText").setHtml(footerText);
            }
        },
        dockedItems: [{
            xtype: 'toolbar',
            dock: 'bottom',
            items: [
                { itemId: "toolbarText", xtype: 'tbtext', text: '' }
            ]
        }]
    });        
}

function getFooterText(store) {
    return "Antal: " + store.data.length;
}
