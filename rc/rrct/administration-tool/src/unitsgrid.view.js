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
        viewready: function() {
            updateFooterText(this);
        },
        storechange: function() {
            updateFooterText(this);
        },
        selectionchange: 'onSelectionChange'
    },
});

function updateFooterText(view) {
    var numIncluded = Ext.Array.filter(view.store.data.items, function(item) {
        return item.data.Enabled;
    }).length;
    var footerText = "Antal: " + view.store.data.length + ". Aktiva: " + numIncluded;
    view.down("#toolbarText").setHtml(footerText);
}
