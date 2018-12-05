Profile.APIKey='jf64ZLZw15E=';
displayPatientView();
function displayPatientView() {
	var container = Stratum.containers && Stratum.containers['FONO/stat1653'] || 'mainContainer';

    var MYCKET_BATTRE = 'Mycket bättre';
    var BATTRE = 'Bättre';
    var OFORANDRAT = 'Oförändrad';
    var SAMRE = 'Sämre';
    var MYCKET_SAMRE = 'Mycket sämre';
    var TOTALT='TOTALT';

    Ext.tip.QuickTipManager.init();
    
    var container = Ext.create('Ext.container.Container', {
        layout: 'vbox',
        renderTo: container
    });
        
    var colors = ['#DC143C', '#AAFF7F','#FFFF00', '#4F81BD', '#B2DFEE', '#9BBB59', '#C0504D'];
    if (!Ext.ClassManager.isCreated('Ext.chart.theme.FONO')) {
        Ext.define('Ext.chart.theme.FONO', {
            extend: 'Ext.chart.theme.Base',
            alias: 'chart.theme.FONO',
            constructor: function (aConfig) {
                Ext.chart.theme.Base.prototype.constructor.call(this, Ext.apply({ colors: colors}, aConfig));
            }
      });
    }
    
    var staticFields= [
        { name: 'x', type: 'string' },
        { name: 'unit', type: 'float' },
        { name: 'register', type: 'float' },
        { name: 'registerCount', type: 'int' },
        { name: 'registerCountTotal', type: 'int' },
        { name: 'unitCount', type: 'int' },
        { name: 'unitCountTotal', type: 'int' }
    ];

    function createStore(fields) {
        return Ext.create('Ext.data.Store', {
            fields: fields/*,
            sorters: {
                property: 'x',
                direction: 'DESC'
            }*/
        });
    }
   
    chart1Store = createStore(staticFields);   
    var yFields=new Array();
    var origXNames=new Array();   
    var counter=0;    
    var totalCountBetter=0;
    var totalAll=0;
    Ext.Ajax.request({
        url: '/stratum/api/metadata/units/register/127',
        method: 'get',
        success: function (rUnits) {
            var dUnits = Ext.decode(rUnits.responseText);
            var result = new Array();
            var i = 0;
            chart1Store.beginUpdate();
            spin(container, 'Laddar diagram', 300, 200);
            for (i = 0; i < dUnits.data.length; i++) {
                Ext.Ajax.request({
                    url: '/stratum/api/aggregate/fono/VocalChordsSurgeryPost/unit/count/PostSurgeryVoice?UnitCode=' + dUnits.data[i].UnitCode,
                    method: 'get',
                    success: Ext.bind(function (rUnit, dummy, index) {
                        var dUnit = Ext.decode(rUnit.responseText);  
                        var v=getValue(dUnit.data);
                        var nrObs=getNrObservations(dUnit.data);
                        var nrObsTotal=getNrObservationsTotal(dUnit.data);                        
                        var obj = { x: dUnits.data[index].UnitName, unit: v, unitCount: nrObs, unitCountTotal:nrObsTotal };                                                                        
                        totalCountBetter+=nrObs;
                        totalAll+=nrObsTotal;                        
                        chart1Store.add(obj);
                        counter++;
                        if(counter==dUnits.data.length){
                            var totalObj={};
                            totalObj.x=TOTALT;        
                            totalObj.unit=totalCountBetter/totalAll*100;
                            totalObj.unitCount= totalCountBetter;
                            totalObj.unitCountTotal=totalAll;
                            chart1Store.add(totalObj);
                            //chart1Store.sorters.clear();
                            // For some reason the TOTAL item cannot be added unsorted, even if sorters are cleared, so a custom sorter must be used (ExtJS 5.1).
                            chart1Store.sort(function(a,b) {
                                var ax = a.get('x'),
                                    bx = b.get('x');

                                if (ax === TOTALT || ax > bx) {
                                    return -1;
                                }
                                if (bx === TOTALT || ax < bx) {
                                    return 1;
                                }
                                return 0;
                            });
                            chart1Store.endUpdate();
                            container.add(chart1);
                            unspin();
                        }
                    }, this, i, true)
                });
            }
        }
    });

    function getValue(obj) {
        if (obj === undefined) {
            return 0;
        }
        var ms = obj[MYCKET_SAMRE];
        var s = obj[SAMRE];
        var o = obj[OFORANDRAT];
        var b = obj[BATTRE];
        var mb = obj[MYCKET_BATTRE];
        if (ms === undefined) {
            ms = 0;
        }
        if (s === undefined) {
            s = 0;
        }
        if (o === undefined) {
            o = 0;
        }
        if (b === undefined) {
            b = 0;
        }
        if (mb === undefined) {
            mb = 0;
        }
        var r=0;        
        r= ((mb + b) / (mb + b + o + s + ms)) * 100;                
        if(isNaN(r)){
            return 0;
        }
        return r;
    }

    function getNrObservations(obj) {
        if (obj === undefined) {
            return 0;
        }
        var b = obj[BATTRE];
        var mb = obj[MYCKET_BATTRE];
        if (b === undefined) {
            b = 0;
        }
        if (mb === undefined) {
            mb = 0;
        }
        return b + mb;
    }
    
    function getNrObservationsTotal(obj) {
        if (obj === undefined) {
            return 0;
        }
        var ms = obj[MYCKET_SAMRE];
        var s = obj[SAMRE];
        var o = obj[OFORANDRAT];
        var b = obj[BATTRE];
        var mb = obj[MYCKET_BATTRE];
        if (ms === undefined) {
            ms = 0;
        }
        if (s === undefined) {
            s = 0;
        }
        if (o === undefined) {
            o = 0;
        }
        if (b === undefined) {
            b = 0;
        }
        if (mb === undefined) {
            mb = 0;
        }
        return mb + b + o + s + ms;
    }
     
   var chart1 = createChart(['unit'], ['Kliniken', 'Registret'], chart1Store, 700, false);   

   function createChart(fields, titles, store, height, stacked) { 
        return Ext.create('Ext.chart.Chart', {            
            width: '100%',
            height: height,
            //theme: 'FONO',
            store: store,
            flipXY: true,
            interactions: 'itemhighlight',
            plugins: {
                ptype: 'chartitemevents'
            },
            axes: [{
                type: 'numeric',
                position: 'bottom',
                fields: fields,
                grid: true,
                minimum: 0,
                maximum: 100
            }, {
                type: 'category',
                position: 'left',
                fields: ['x']
            }],
            series: [{
                type: 'bar',
                axis: 'bottom',
                highlight: true,
                tooltip: {
                    trackMouse: true,
                    width: 210,
                    height: 60,
                    renderer: function (storeItem, item) {
                        var s = Ext.util.Format.number(storeItem.get(item.field), '0.0') + '%';
                        if (item.field == 'unit') {
                            s += ' (' + storeItem.get('unitCount') + '/' + storeItem.get('unitCountTotal') + ' st)';
                        }
                        else {
                            s += ' (' + storeItem.get('registerCount') + '/' + storeItem.get('registerCountTotal') + ' st)';
                        }                                                                                               
                        this.update(s);
                    }
                },
                label: {
                    display: 'insideEnd',
                    field: ['unit', 'register'],
                    renderer: Ext.util.Format.numberRenderer('0.0'),
                    orientation: 'horizontal'
                },
                xField: 'x',
                yField: fields,
                title: titles,
                stacked: stacked
            }]
        });
    }

    container.add({
        xtype: 'component',
        html: '<h2 align="center">Andel patienter som upplever rösten som bättre eller mycket bättre efter operationen. Avser samtliga registreringar från registrets start.</h1>',
        width: '100%'
    });
}