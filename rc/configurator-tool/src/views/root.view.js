import "../viewmodels/form-details.viewmodel"
import "./start.view"
import "./forms.view"
import "./form-details.view"

Ext.define("RC.ConfiguratorTool.view.RootView", {
    extend: "Ext.container.Container",
    alias: "widget.rootview",
    controller: "root",
    items: [
        {
            xtype: "container",
            id: "configuratorToolRootView"
        }
    ]
});
