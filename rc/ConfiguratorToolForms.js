
var configuratorToolFormsWidget = (function() {
    "use strict";

    function defineView() {
        Ext.define("RC.ConfiguratorTool.view.FormsView", {
            extend: "Ext.Panel",
            alias: "widget.formsview",
            items: [
                {
                    xtype: "component",
                    html: "<h1>Formulär</h1>"
                }
            ]
        });
    }

    defineView();

})();

// SiteId: 100
// WidgetId: RC/ConfiguratorToolForms
// WidgetName: Konfiguratörsverktyg, formulär
