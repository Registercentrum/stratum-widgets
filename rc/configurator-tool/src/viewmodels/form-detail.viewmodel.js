Ext.define('ConfiguratorToolFormDetailsViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.formdetails',
    data: {
        form: null
    },
    stores: {
        formdetailstore: {
            autoLoad: true,
            proxy: {
                type: "ajax",
                url: "/stratum/api/metadata/forms/" + 1001 // todo: Remove hard coding
            },
            listeners: {
                load: function (store, data) {
                    console.log("store loaded...");
                    console.log(data[0]);
                    Ext.ComponentQuery.query('#formdetails')[0].getViewModel().set('form', data[0]);
                }
            }
        }
    }
});
