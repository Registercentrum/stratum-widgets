
(function() {
    "use strict";

    var _apiKey = "JjaQCqCCWz8=";

    function init() {
        defineModel();
        Ext.Promise.all([getCandidates(), getUnits()]).then(function(result) {
            var flattenedData = flattenCandidates(result[0], result[1]);
            var store = getStore(flattenedData);
            renderUI(store);
        }, function(error) {
            console.error("An error occurred.");
            console.error(error);
        });        
    }

    function defineModel() {
        Ext.define("Hipsther.ScreeningLog", {
            extend: "Ext.data.Model",
            fields: [ 
                { name: "unitName" }, 
                { name: "screeningDate" }, 
                {
                    name: "included",
                    convert: function(value, record) {
                        return value ? "Ja" : "Nej";
                    }
                },
                { name: "subjectId" }
            ]
        });        
    }

    function getStore(data) {
        return Ext.create("Ext.data.Store", {
            model: "Hipsther.ScreeningLog",
            sorters: { property: 'screeningDate', direction: 'DESC' },
            data: data
        });        
    }

    function renderUI(store) {
        Ext.create("Ext.container.Container", {
            renderTo: "sw-hipsther-screening-log",
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
                    text: "Enhet",
                    flex: 1,
                    dataIndex: "unitName",
                    filter: {
                        type: "string"
                    }
                },
                {
                    text: "Datum",
                    xtype: "datecolumn",
                    width: 110,
                    dataIndex: "screeningDate",
                    renderer: Ext.util.Format.dateRenderer('Y-m-d'),
                    filter: {
                        type: 'date'
                    }
                },
                {
                    text: "Inkluderad",
                    width: 130,
                    dataIndex: "included",
                    filter: {
                        type: 'list'
                    }
                },
                {
                    text: "Rand. nummer",
                    width: 130,
                    dataIndex: "subjectId"
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
        var numIncluded = Ext.Array.filter(store.data.items, function(item) {
            return item.data.included === "Ja";
        }).length;
        return "Antal: " + store.data.length + ". Inkluderade: " + numIncluded;
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

    function getCandidates() {
        var env = "-" + Repository.DeploymentMode.toLowerCase();
        if(Repository.DeploymentMode === "PROD") {
            env = "";
        }
        var HIPSTHER_BASE_URL = "/stratum/api/rrct/clinicaltrial-hipsther" + env + "-nationellariktlinjer.1.0.0";

        return getResource(HIPSTHER_BASE_URL + "/candidates?apikey=" + _apiKey);
    }

    function getUnits() {
        return getResource("/stratum/api/metadata/units/register/110?apikey=" + _apiKey);
    }

    function flattenCandidates(candidates, units) {
        var mapped = Ext.Array.map(candidates, function(item, index) {
            return {
                unitName: getUnitNameById(units, item.Screening.UnitId),
                screeningDate: new Date(item.Screening.DateConsidered),
                included: item.Included,
                subjectId: item.SubjectId
            };
        });
        return mapped;
    }

    function getUnitNameById(units, unitId) {
    
        var match = Ext.Array.findBy(units, function(unit) {
            return unit.UnitID == unitId;
        });

        return match.UnitName;
    }

    init();

})();
// SiteId: 206
// WidgetId: SFR/HipstherScreeningLog
// WidgetName: Hipsther Screening Log
