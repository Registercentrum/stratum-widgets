
export function render(store, container) {
    Ext.create("Ext.container.Container", {
        renderTo: container,
        margin: "0 0 20 0",
        items: [
            get(store)
        ]
    })
}

function get(store) {
    return Ext.create("Ext.grid.Panel", {
        store: store,
        plugins: "gridfilters",
        columns: [
            {
                text: "Personnummer",
                flex: 1,
                dataIndex: "SubjectKey",
                filter: {
                    type: "string"
                }
            },
            {
                text: "Datum",
                width: 100,
                dataIndex: "DateConsidered",
                xtype: "datecolumn",
                renderer: Ext.util.Format.dateRenderer('Y-m-d'),
                filter: {
                    type: 'date'
                }
            },
            {
                text: "Rand. #",
                width: 130,
                dataIndex: "SubjectId",
                filter: {
                    type: "string"
                }
            },
            {
                text: "Withdrawn",
                width: 110,
                dataIndex: "Withdrawn",
                filter: {
                    type: 'list'
                }
            },
            {
                text: "Withdr. datum",
                width: 130,
                dataIndex: "WithdrawalDateTime",
                xtype: "datecolumn",
                renderer: Ext.util.Format.dateRenderer('Y-m-d'),
                filter: {
                    type: 'date'
                }
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
    var numWithdrawn = Ext.Array.filter(store.data.items, function(item) {
        return item.data.Withdrawn === "Ja";
    }).length;
    return "Antal: " + store.data.length + ". Withdrawn: " + numWithdrawn;
}