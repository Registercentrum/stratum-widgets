(function(_profile) {
    "use strict";

    var MAIN_VIEW = null;
    var CURRENT_VIEW = null;

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

        defineMainController();
        defineMainView();

        Ext.application({
            name: 'ConfiguratorToolApp',
            defaultToken : 'default',
            launch: function() {
                Ext.create('Ext.panel.Panel', {
                    renderTo: 'sw-konfiguratoersverktyg',
                    items: [ mainItem ]
                });
                MAIN_VIEW = Ext.ComponentQuery.query('#configuratorToolMainView')[0];
            }            
        });

    }

    function loadWidget(widgetName, successCallback, errorCallback) {
        Ext.Loader.loadScript({
            url: "/stratum/api/widgets/rc/" + widgetName,
            onLoad: function() {
                try {
                    if(successCallback) {
                        successCallback();
                    }
                } catch (error) {
                    console.error("An error occurred:");
                    console.error(error);
                    if(errorCallback) {
                        errorCallback(error);
                    }
                }
            }
        });        
    }

    function loadView(view) {
        if(CURRENT_VIEW) {
            MAIN_VIEW.remove(CURRENT_VIEW, true);
        }
        MAIN_VIEW.add(view);
        CURRENT_VIEW = view;
    }

    function defineMainController() {
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
            default: function() {
                loadWidget("ConfiguratorToolDefault", function() {
                    var view = Ext.create("RC.ConfiguratorTool.view.DefaultView");
                    loadView(view);
                });
            },
            forms: function() {
                loadWidget("ConfiguratorToolForms", function() {
                    var view = Ext.create("RC.ConfiguratorTool.view.FormsAdministrationView");
                    loadView(view);
                });
            },
            editForm: function(formId) {
                loadWidget("ConfiguratorToolFormDetails", function() {
                    ConfiguratorToolFormDetails.init(formId);
                    var view = ConfiguratorToolFormDetails.getView();
                    loadView(view);
                });
            },
            domains: function() {
                console.log("Nu redigerar vi domäner!");
            }
        });
    }

    function defineMainView() {
        Ext.define("RC.ConfiguratorTool.view.MainView", {
            extend: "Ext.Panel",
            alias: "widget.mainview",
            controller: "main",
            items: [
                {
                    xtype: "container",
                    id: "configuratorToolMainView"
                }
            ]
        });
    }

    Ext.onReady(function() {
        init();
    });
    
})(Profile);
// SiteId: 100
// WidgetId: RC/ConfiguratorTool
// WidgetName: Konfiguratörsverktyg
