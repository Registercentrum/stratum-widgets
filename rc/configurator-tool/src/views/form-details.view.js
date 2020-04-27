import "../stores/questions.store"

Ext.define("RC.ConfiguratorTool.view.FormDetailsView", {
    extend: "Ext.panel.Panel",
    alias: "widget.formdetails",
    bind: {
        title: '{formTitle}'
    },
    viewModel: {
        type: "formdetails"
    },
    controller: 'formdetails',
    items: [{
        xtype: 'form',
        itemId: "testform",
        title: 'Redigerar formulär',
        fieldLabel: 'Formulärtitel',
        items: [{
            xtype: "textfield",
            fieldLabel: 'Formulärnamn',
            bind: {
                value: '{formTitle}'
            }
        }]
    }, {
        xtype: "component",
        html: "<h3>Variabler</h3>"
    }, {
        xtype: "grid",
        itemId: "FormsGrid",
        selModel: {
            selType: 'rowmodel',
            allowDeselect: true,
            mode: "SINGLE",
            toggleOnClick: true
        },
        store: 'questions',
        columns: {
            items: [
                { text: "Kolumnnamn", dataIndex: "ColumnName", flex: 1  },
                { text: "Mapped to", dataIndex: "MappedTo", flex: 1  },
                { text: "Prefix text", dataIndex: "PrefixText", flex: 1  },
            ]
        },
    }]
});
