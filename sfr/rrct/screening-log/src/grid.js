
export function renderUI(store, container) {
    Ext.create("Ext.container.Container", {
        renderTo: container,
        margin: "0 0 20 0",
        items: [
            getGrid(store)
        ]
    });
}

function getGrid(store) {
    return Ext.create("Ext.grid.Panel", {
        store: store,
        plugins: "gridfilters",
        columns: [
            {
                text: "Enhet",
                flex: 1,
                dataIndex: "unitName",
                filter: {
                    type: "string"
                }
            },
            {
                text: "Datum",
                xtype: "datecolumn",
                dataIndex: "screeningDate",
                renderer: Ext.util.Format.dateRenderer('Y-m-d'),
                filter: {
                    type: 'date'
                }
            },
            {
                text: "Inkl.",
                dataIndex: "included",
                filter: {
                    type: 'list'
                }
            },
            {
                text: "Rand. #",
                dataIndex: "subjectId"
            },
            {
                text: "Orsak",
                flex: 1,
                dataIndex: "reason"
            }
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
    var numIncluded = Ext.Array.filter(store.data.items, function(item) {
        return item.data.included === "Ja";
    }).length;
    return "Antal: " + store.data.length + ". Inkluderade: " + numIncluded;
}
