Ext.define("RC.ConfiguratorTool.controller.StartController", {
    extend: 'Ext.app.ViewController',
    alias: "controller.start",
    onFormsButtonClick: function() {
        this.redirectTo('forms');
    },
    onDomainsButtonClick: function() {
        this.redirectTo('domains');
    }
});
