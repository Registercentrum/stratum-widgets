Ext.define("RC.ConfiguratorTool.view.DefaultView", {
    extend: "Ext.Panel",
    alias: "widget.defaultview",
    layout:'column',
    controller: "default",
    items: [{
        xtype: "container",
        layout: "center",
        margin: "80 0",
        columnWidth: 0.50,
        items: [{
            xtype: "button",
            scale: "large",
            iconCls: 'x-fa fa-wpforms',
            text: "Formulär",
            iconAlign:'top',
            padding: 15,
            handler: "onFormsButtonClick"
        }]
    }, {
        xtype: "container",
        columnWidth: 0.50,
        margin: "80 0",
        layout: "center",
        items: [{
            xtype: "button",
            scale: "large",
            disabled: true,
            iconCls: 'x-fa fa-cube',
            text: "Domäner",
            iconAlign:'top',
            padding: 15,
            handler: "onDomainsButtonClick"
        }]
    }]
});
