import "./start.controller"
import "./forms.controller"
import "./form-details.controller"

var ROOT_VIEW = null;
var CURRENT_VIEW = null;

Ext.define("RC.ConfiguratorTool.controller.RootController", {
    extend: 'Ext.app.ViewController',
    alias: "controller.root",
    routes: {
        "default": {
            action: "default",
            lazy: true
        },
        "forms": {
            action: "forms",
            lazy: true
        },
        "domains": {
            action: "domains",
            lazy: true
        },
        "editform/:formId": "editForm"
    },
    defaultToken : 'default',
    default: function() {
        var view = Ext.create("RC.ConfiguratorTool.view.StartView");
        loadView(view);
    },
    forms: function() {
        var view = Ext.create("RC.ConfiguratorTool.view.FormsAdministrationView");
        loadView(view);
    },
    editForm: function(formId) {
        console.log("Editing form: " + formId)
        var view = Ext.create("RC.ConfiguratorTool.view.FormDetailsView");
        loadView(view);
    },
    domains: function() {
        console.log("Nu redigerar vi domäner!");
    }
});

function loadView(view) {
    if(!ROOT_VIEW) {
        ROOT_VIEW = Ext.ComponentQuery.query('#configuratorToolRootView')[0];
    }
    if(CURRENT_VIEW) {
        ROOT_VIEW.remove(CURRENT_VIEW, true);
    }
    ROOT_VIEW.add(view);
    CURRENT_VIEW = view;
}
