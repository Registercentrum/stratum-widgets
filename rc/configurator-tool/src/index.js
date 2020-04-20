import "./controllers/main.controller"
import "./controllers/default.controller"
import "./controllers/forms.controller"
import "./viewmodels/form-detail.viewmodel"
import "./views/main.view"
import "./views/default.view"
import "./views/forms.view"
import "./views/form-detail.view"

var mainItem = { 
    title: 'Registerkonfigurering', 
    xtype: 'mainview',
};

if(!Profile.Context) {
    mainItem = {
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
            items: [ mainItem ]
        });
    }            
});
