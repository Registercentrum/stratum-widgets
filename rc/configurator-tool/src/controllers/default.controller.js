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
