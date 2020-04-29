Ext.define('RC.ConfiguratorTool.FormDetailsController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.formdetails',
    formDetailsStoreLoaded: function(store) {
        var record = store.first();
        var vm = this.getViewModel();
        vm.set('formTitle', record.data.data.FormTitle)
    }
});
