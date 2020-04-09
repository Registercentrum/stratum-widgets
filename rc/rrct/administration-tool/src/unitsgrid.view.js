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
                    disabled: false
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
        }
    },
});

function getFooterText(store) {
    var numIncluded = Ext.Array.filter(store.data.items, function(item) {
        return item.data.Enabled === "Ja";
    }).length;
    return "Antal: " + store.data.length + ". Aktiva: " + numIncluded;
}
