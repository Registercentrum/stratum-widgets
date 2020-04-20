import "./controllers/main.controller"
import "./controllers/default.controller"
import "./controllers/forms.controller"
import "./viewmodels/form-detail.viewmodel"
import "./views/main.view"
import "./views/default.view"
import "./views/forms.view"
import "./views/form-detail.view"

(function(_profile) {
    "use strict";

    function init() {

        var mainItem = { 
            title: 'Registerkonfigurering', 
            xtype: 'mainview',
        };

        if(!_profile.Context) {
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
                    renderTo: 'sw-konfiguratoersverktyg',
                    items: [ mainItem ]
                });
            }            
        });

    }

    Ext.onReady(function() {
        init();
    });
    
})(Profile);
// SiteId: 100
// WidgetId: RC/ConfiguratorTool
// WidgetName: Konfiguratörsverktyg
