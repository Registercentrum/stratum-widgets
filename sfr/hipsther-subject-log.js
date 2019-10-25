(function() {
    "use strict";

    var HIPSTHER_BASE_URL = Repository.Local.Methods.Hipsther.getBaseUrl();

    function init() {
        defineModel();
        getSubjects()
            .then(function(subjects) {
                var store = getStore(subjects);
                renderUI(store);
            }, function(error) {
                console.error("An error occurred.");
                console.error(error);
            });
    }

    function defineModel() {
        Ext.define("Hipsther.SubjectLogEntry", {
            extend: "Ext.data.Model",
            fields: [ 
                { name: "SubjectKey" }, 
                {
                    name: "DateConsidered",
                    convert: function(value, record) {
                        if(!record.get("Screening")) return "";
                        return record.get("Screening").DateConsidered;
                    }
                }, 
                { name: "SubjectId" }, 
                {
                    name: "Withdrawn",
                    convert: function(value, record) {
                        return value ? "Ja" : "Nej";
                    }
                }, 
                {
                    name: "WithdrawalDateTime", 
                    convert: function(value, record) {
                        if(!record.get("WithdrawalDetails")) return "";
                        return record.get("WithdrawalDetails").WithdrawalDateTime;
                    }
                }
            ]
        });        
    }

    function getStore(data) {
        return Ext.create("Ext.data.Store", {
            model: "Hipsther.SubjectLogEntry",
            sorters: { property: 'DateConsidered', direction: 'DESC' },
            data: data
        });        
    }
        
    function renderUI(store) {
        Ext.create("Ext.container.Container", {
            renderTo: "sw-hipsther-subject-log",
            margin: "0 0 20 0",
            items: [
                getGrid(store)
            ]
        })
    }
    
    function getGrid(store) {
        return Ext.create("Ext.grid.Panel", {
            store: store,
            plugins: "gridfilters",
            columns: [
                {
                    text: "Personnummer",
                    flex: 1,
                    dataIndex: "SubjectKey",
                    filter: {
                        type: "string"
                    }
                },
                {
                    text: "Datum",
                    width: 100,
                    dataIndex: "DateConsidered",
                    xtype: "datecolumn",
                    renderer: Ext.util.Format.dateRenderer('Y-m-d'),
                    filter: {
                        type: 'date'
                    }
                },
                {
                    text: "Rand. nummer",
                    width: 130,
                    dataIndex: "SubjectId",
                    filter: {
                        type: "string"
                    }
                },
                {
                    text: "Withdrawn",
                    width: 110,
                    dataIndex: "Withdrawn",
                    filter: {
                        type: 'list'
                    }
                },
                {
                    text: "Withdrawn date",
                    width: 130,
                    dataIndex: "WithdrawalDateTime",
                    xtype: "datecolumn",
                    renderer: Ext.util.Format.dateRenderer('Y-m-d'),
                    filter: {
                        type: 'date'
                    }
                }
            ],
            listeners: {
                filterchange: function(store, filters, opts) {
                    var footerText = getFooterText(store);
                    this.down("#toolbarText").setHtml(footerText);
                },
                viewready: function(view, opts) {
                    var footerText = getFooterText(view.store);
                    this.down("#toolbarText").setHtml(footerText);
                }
            },
            dockedItems: [{
                xtype: 'toolbar',
                dock: 'bottom',
                items: [
                    { itemId: "toolbarText", xtype: 'tbtext', text: '' }
                ]
            }]
        });        
    }

    function getFooterText(store) {
        var numWithdrawn = Ext.Array.filter(store.data.items, function(item) {
            return item.data.Withdrawn === "Ja";
        }).length;
        return "Antal: " + store.data.length + ". Withdrawn: " + numWithdrawn;
    }

    function getSubjects() {
        return getResource(HIPSTHER_BASE_URL + "/subjects");
    }

    function getResource(resource) {
        var deferred = new Ext.Deferred();
        Ext.Ajax.request({
            url: resource,
            success: function (response) {
                if(response.status !== 200){
                    deferred.reject();
                }
                var responseJson = Ext.util.JSON.decode(response.responseText);
                if(responseJson.success === false || responseJson.code !== 0) {
                    deferred.reject();
                }
                deferred.resolve(responseJson.data);
            },
            failure: function (response) {
                if(response.responseText) {
                    var responseJson = Ext.util.JSON.decode(response.responseText);
                    deferred.reject(responseJson);
                }
                else {
                    deferred.reject("An unknown error occurred while getting resource: " + resource);
                }
            }
        });

        return deferred.promise;
    }

    init();

})();
// SiteId: 206
// WidgetId: SFR/HipstherSubjectLog
// WidgetName: Hipsther Subject Log
