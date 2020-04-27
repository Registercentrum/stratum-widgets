Ext.create("Ext.data.Store", {
    autoLoad: true,
    storeId: 'questions',
    proxy: {
        type: "ajax",
        url: "/stratum/api/metadata/forms/" + 1001, // todo: Remove hard coding
        reader: {
            type: "json",
            rootProperty: "data.Questions"
        }            
    },
});
