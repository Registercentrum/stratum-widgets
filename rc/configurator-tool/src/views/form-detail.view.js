Ext.define("RC.ConfiguratorTool.view.FormDetailsView", {
    extend: "Ext.Container",
    alias: "widget.formdetails",
    itemId: "formdetails",
    viewModel: {
        type: "formdetails"
    },
    items: [{
        xtype: 'form',
        itemId: "testform",
        title: 'Testformulär',
        fieldLabel: 'Formulärtitel',
        items: [{
            xtype: "textfield",
            fieldLabel: 'Formulärnamn',
            bind: {
                value: '{form.data.FormTitle}'
            }
        }]
    }, {
        xtype: "component",
        html: "<h3>Variabler</h3>"
    }, {
        xtype: "grid",
        itemId: "FormsGrid",
        store: loadQuestionsStore(1001), // todo: Remove hard coding
        selModel: {
            selType: 'rowmodel',
            allowDeselect: true,
            mode: "SINGLE",
            toggleOnClick: true
        },
        bind: {
            store: 'formdetailstore',
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

function loadQuestionsStore(formId) {
    return Ext.create("Ext.data.Store", {
        autoLoad: true,
        proxy: {
            type: "ajax",
            url: "/stratum/api/metadata/forms/" + formId,
            reader: {
                type: "json",
                rootProperty: "data.Questions"
            }
        }
    });
}
