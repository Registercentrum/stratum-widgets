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
    }],
    tools: [{
        type: 'help',
        callback: 'onHelp',
        scope: this
    }]
});

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
