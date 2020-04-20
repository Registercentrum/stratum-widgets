var MAIN_VIEW = null;
var CURRENT_VIEW = null;

Ext.define("RC.ConfiguratorTool.controller.MainController", {
    extend: 'Ext.app.ViewController',
    alias: "controller.main",
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
        var view = Ext.create("RC.ConfiguratorTool.view.DefaultView");
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
    if(!MAIN_VIEW) {
        MAIN_VIEW = Ext.ComponentQuery.query('#configuratorToolMainView')[0];
    }
    if(CURRENT_VIEW) {
        MAIN_VIEW.remove(CURRENT_VIEW, true);
    }
    MAIN_VIEW.add(view);
    CURRENT_VIEW = view;
}
