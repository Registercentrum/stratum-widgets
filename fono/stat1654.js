
displayPatientView();
function displayPatientView() {
	var container = Stratum.containers && Stratum.containers['FONO/stat1654'] || 'mainContainer';

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
    
    var colors = ['#DC143C', '#AAFF7F','#FFFF00', '#4F81BD', '#B2DFEE', '#9BBB59', '#C0504D', '#222222'];
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
        { name: 'x', type: 'string', convert: whiteAsNewlines },
        { name: 'unit', type: 'float' },
        { name: 'register', type: 'float' },
        { name: 'registerCount', type: 'int' },
        { name: 'registerCountTotal', type: 'int' },
        { name: 'unitCount', type: 'int' },
        {name:  'unitCountTotal', type: 'int'}
    ]
    
    function createStore(fields) {
        return Ext.create('Ext.data.ArrayStore', {
            storeId: 'myStore',
            autoLoad: true,
            sorters: [{
                sorterFn: function (o1, o2) {
                    if (o1.x == TOTALT) {
                        return -1;
                    }
                    if (o2.x == TOTALT) {
                        return 1;
                    }
                    if (o1.x > o2.data.x) {
                        return -1;
                    }
                    else if (o1.x < o2.data.x) {
                        return 1;
                    }
                    return 0;
                }
            }],
            fields: fields
        });
    }
       
    chart2Store = createStore(staticFields);    
    var yFields=new Array();
    var origXNames=new Array();
    
    spin(container, 'Laddar diagram', 300, 200);
    Ext.Ajax.request({
        url: '/stratum/api/aggregate/fono/VocalChordsSurgeryPost/total/count/DiagnosisPrimary/PostSurgeryVoice',
        method: 'get',
        success: function (rRegister) {
            var dRegister = Ext.decode(rRegister.responseText);
            Ext.Ajax.request({
                url: '/stratum/api/aggregate/fono/VocalChordsSurgeryPost/unit/count/DiagnosisPrimary/PostSurgeryVoice',
                method: 'get',
                success: function (rUnit) {
                    var dUnit = Ext.decode(rUnit.responseText);
                    var result = new Array();
                    for (var prop in dRegister.data) {
                        var xName=prop;
                        if(xName=='null'){
                            xName='Ingen diagnos';
                        }
                        result.push({ x: xName, unit: getValue(dUnit.data[prop]),
                            register: getValue(dRegister.data[prop]), 
                            unitCount: getNrObservations(dUnit.data[prop]), 
                            unitCountTotal: getNrObservationsTotal(dUnit.data[prop]),
                            registerCount: getNrObservations(dRegister.data[prop]), 
                            registerCountTotal: getNrObservationsTotal(dRegister.data[prop]) 
                            });
                    }
                    chart2Store.loadData(result);
                    container.add(chart2);            
                    unspin();
                }
            });
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
     
    var chart2 = createChart(['unit', 'register'], ['Kliniken', 'Registret'], chart2Store, 600, false);      
    function createChart(fields, titles, store, height, stacked) { 
        return Ext.create('Ext.chart.Chart', {            
            width: '100%',
            height: height,
            //theme: 'FONO',
            store: store,
            flipXY: true,
            legend: {
                docked: 'right',
                visible: fields.length > 1               
            },
            axes: [{
                type: 'numeric',
                position: 'bottom',
                fields: fields,
                label: {
                    renderer: Ext.util.Format.numberRenderer('0')
                },
                grid: true,
                minimum: 0
            }, {
                type: 'category',
                position: 'left',
                fields: ['x']
            }],
            series: [{
                type: 'bar',
                axis: 'bottom',
                highlight: true,
                style: {
                    minGapWidth: 20
                },
                tooltip: {
                    trackMouse: true,
                    width: 210,
                    height: 60,
                    renderer: function (tooltip, storeItem, item) {
                        var s = Ext.util.Format.number(storeItem.get(item.field), '0.0') + '%';
                        if (item.field == 'unit') {
                            s += ' (' + storeItem.get('unitCount') + '/' + storeItem.get('unitCountTotal') + ' st)';
                        }
                        else {
                            s += ' (' + storeItem.get('registerCount') + '/' + storeItem.get('registerCountTotal') + ' st)';
                        }                                                                                               
                        tooltip.update(s);
                    }
                },
                label: {
                    display: 'insideEnd',
                    field: ['unit', 'register'],
                    renderer: Ext.util.Format.numberRenderer('0.0'),
                    orientation: 'horizontal',
                    color: '#333',
                    fontSize: 11
                },
                xField: 'x',
                yField: fields,
                title: titles,
                stacked:stacked
            }]
        });
    }
    
    container.add({
        xtype: 'component',
        html: '<h2 align="center">Andel patienter som upplever rösten som bättre eller mycket bättre efter operationen, uppdelat per diagnos</h1>',
        width: '100%'
    });    
}
