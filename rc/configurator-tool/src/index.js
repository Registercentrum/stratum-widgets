import "./controllers/root.controller"
import "./views/root.view"

var rootItem = { 
    title: 'Registerkonfigurering', 
    xtype: 'rootview',
};

if(!Profile.Context) {
    rootItem = {
        xtype: "component",
        html: '<div class="alert alert-danger" role="alert"><i class="fa fa-exclamation-triangle pull-right"></i>Du måste vara inloggad för att arbeta med konfiguratörsverktyget.</div>'
    };
}

Ext.application({
    name: 'ConfiguratorToolApp',
    defaultToken : 'default',
    launch: function() {
        Ext.create('Ext.panel.Panel', {
            frame: false,
            renderTo: 'sw-konfiguratoersverktyg',
            items: [ rootItem ]
        });
    }            
});
