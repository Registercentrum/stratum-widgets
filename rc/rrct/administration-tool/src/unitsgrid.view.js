Ext.define('RC.UserAdministration.view.UnitsGrid', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.unitsgrid',
    selModel: 'rowmodel',
    controller: 'units',
    columns: [
        {
            text: 'Enhet',
            dataIndex: 'UnitName',
            flex: 1,
            sortable: true,
        },
        {
            text: 'Aktiv',
            dataIndex: 'Enabled',
            sortable: true,
            renderer: function(value) {
                return value ? "Ja" : "Nej";
            }
        },
    ],
    dockedItems: [
        {
          xtype: 'toolbar',
          reference: 'search',
          dock: 'top',
          border: false,
          items: [
                {
                    reference: 'activateUnitButton',
                    text: 'Aktivera',
                    handler: 'activate',
                    minWidth: 80,
                    disabled: true
                },
                {
                    reference: 'deactivateUnitButton',
                    text: 'Inaktivera',
                    handler: 'deactivate',
                    minWidth: 80,
                    disabled: true
                },
            ]
        }, {
            xtype: 'toolbar',
            dock: 'bottom',
            items: [
                { itemId: "toolbarText", xtype: 'tbtext', text: '' }
            ]
        }
    ],
    listeners: {
        viewready: function(view) {
            var footerText = getFooterText(view.store);
            this.down("#toolbarText").setHtml(footerText);
        },
        selectionchange: 'onSelectionChange'
    },
});

function getFooterText(store) {
    var numIncluded = Ext.Array.filter(store.data.items, function(item) {
        return item.data.Enabled;
    }).length;
    return "Antal: " + store.data.length + ". Aktiva: " + numIncluded;
}
