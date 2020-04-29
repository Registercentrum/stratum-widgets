Ext.define('RC.ConfiguratorTool.FormDetailsViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.formdetails',
    stores: {
        formdetails: {
            autoLoad: true,
            proxy: {
                type: "ajax",
                url: "/stratum/api/metadata/forms/" + 1001 // todo: Remove hard coding
            },
            listeners: {
                load: 'formDetailsStoreLoaded'
            }
        },
    },
});
