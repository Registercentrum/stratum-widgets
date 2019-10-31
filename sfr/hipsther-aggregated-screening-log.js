
(function() {
    'use strict';

    // UTV:  SJ9-63odWfc=
    // PROD: JjaQCqCCWz8=
    var _apiKey = "SJ9-63odWfc=";

    function init() {
        Ext.Promise.all([getCandidates(), getUnits()]).then(function(result) {
            defineModel();
            var combined = getCombinedUnits(result[0], result[1]);
            var store = getStatisticsStore(combined);
            renderGrid(store);
        }, function(error) {
            console.error("An error occurred.");
            console.error(error);
        });        
    }

    function defineModel() {
        Ext.define('Hipsther.ScreeningStatistics', {
            extend: 'Ext.data.Model',
            fields: [
                'unitName', 
                'screened', 
                'randomized' 
            ]
        });        
    }

    function getStatisticsStore(data) {
        return Ext.create('Ext.data.Store', {
            model: 'Hipsther.ScreeningStatistics',
            sorters: 'unitName',
            data: data
        });        
    }

    function renderGrid(store) {
        Ext.create('Ext.grid.Panel', {
            renderTo: "sw-hipsther-aggregerad-screeninglog",
            store: store,
            title: 'Antal screenade och randomiserade i Hipsther-studien',
            columns: [
                {
                    text: 'Enhet',
                    flex: 1,
                    hideable: false,
                    dataIndex: 'unitName'
                },
                {
                    text: 'Screenade',
                    width: 110,
                    hideable: false,
                    dataIndex: 'screened'
                },
                {
                    text: 'Randomiserade',
                    width: 130,
                    hideable: false,
                    dataIndex: 'randomized'
                }
            ]
        });        
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

    function getCombinedUnits(candidates, units) {
        var mapped = Ext.Array.map(candidates, function(item, index) {
            return {
                unitName: getUnitNameById(units, item.Screening.UnitId),
                included: item.Included
            };
        });
        var grouped = groupBy(mapped, 'unitName');

        var combined = [];
        for(var unitId in grouped) {
            var numberOfRandomized = Ext.Array.filter(grouped[unitId], function(item) {
                return item.included;
            }).length;
            combined.push({
                unitName: unitId,
                screened: grouped[unitId].length,
                randomized: numberOfRandomized
            });
        }
        return combined;
    }

    function getUnitNameById(units, unitId) {
    
        var match = Ext.Array.findBy(units, function(unit) {
            return unit.UnitID == unitId;
        });

        return match.UnitName;
    }
        
    function groupBy(xs, key) {
        return xs.reduce(function(rv, x) {
            (rv[x[key]] = rv[x[key]] || []).push(x);
            return rv;
        }, {});
    };

    init();

})();
// SiteId: 206
// WidgetId: SFR/HipstherAggregatedScreeningLog
// WidgetName: Hipsther Aggregerad Screening Log
