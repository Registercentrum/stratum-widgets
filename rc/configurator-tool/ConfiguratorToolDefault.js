
(function() {
    "use strict";

    function defineController() {
        Ext.define("RC.ConfiguratorTool.controller.DefaultController", {
            extend: 'Ext.app.ViewController',
            alias: "controller.default",
            onFormsButtonClick: function() {
                this.redirectTo('forms');
            },
            onDomainsButtonClick: function() {
                this.redirectTo('domains');
            }
        });
    }

    function defineView() {
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
    }

    defineView();
    defineController();

})();

// SiteId: 100
// WidgetId: RC/ConfiguratorToolDefault
// WidgetName: Konfiguratörsverktyg, default
