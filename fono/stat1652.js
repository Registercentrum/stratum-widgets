
(function() {

	var container = Stratum.containers && Stratum.containers['FONO/stat1652'] || 'mainContainer';

    var yFields = [],
        origXNames = {},
        NO_DIAGNOSIS = 'Ingen diagnos',
        xField = 'x',
        MAX_CHARS = 15,
        store,
        chart,
        container,
        colors = ['#a2ad00', '#3cb6ce',
					'#e98300', '#fecb00', 
					'#7a6597', '#5fd2ea', '#ffe736',
					'#c5bea8', '#dce44d', '#957eb2', '#7eeeff',
					'#ffb948', '#ffff56', '#e1dac4', '#614d7d', '#aaa38e', '#bfc82f', '#ff9d2b'
				];
        // colors = ['#DC143C', '#AAFF7F', '#FFFF00', '#4F81BD', '#B2DFEE', '#9BBB59', '#C0504D', '#333333'];

    Profile.APIKey = 'jf64ZLZw15E=';

    container = Ext.create('Ext.container.Container', {
        layout: 'vbox',
        renderTo: container
    });

    store = Ext.create('Ext.data.Store', {
    	fields: [],
        sorters: {
            property: 'x',
            direction: 'DESC'
        }
    });

    chart = Ext.create('Ext.chart.Chart', {
        width: '100%',
        height: 1600,
        flipXY: true,
        hidden: true,
        colors: colors,
        store: store,
        legend: {
            type: 'dom',
            docked: 'right'
        },
        axes: [{
            type: 'numeric',
            position: 'top',
            grid: true,
            minimum: 0,
            maximum: 100
        }, {
            type: 'category',
            position: 'left'
        }],
        series: [{
            type: 'bar',
            highlight: true,
            stacked: true,
            tips: {
                trackMouse: true,
                renderer: function(tooltip, storeItem, info) {
                    var field = info.field,
                        value = storeItem.get(field);
                    tooltip.setHtml(Ext.String.format('{1}<hr/>{0} observationer', value, origXNames[field] || field));
                }
            },
            xField: 'x',
            yField: yFields
        }]
    });

    Ext.Ajax.request({
        url: '/stratum/api/metadata/domains/4305',
        method: 'get',
        success: function(rDiagnosises) {
            var dDiagnosises = Ext.decode(rDiagnosises.responseText);
            var i = 0;
            for (i = 0; i < dDiagnosises.data.DomainValues.length; i++) {
                var diagnosisField = {};
                var valueName = Ext.util.Format.ellipsis(dDiagnosises.data.DomainValues[i].ValueName, MAX_CHARS);
                origXNames[valueName] = dDiagnosises.data.DomainValues[i].ValueName;
                diagnosisField.name = valueName;
                diagnosisField.type = 'int';
                yFields.push(valueName);
            }
            yFields.push(NO_DIAGNOSIS);
            store.setFields(Ext.Array.merge(yFields, xField));
            chart.setColors(colors);
            Ext.Ajax.request({
                url: '/stratum/api/metadata/units/register/127',
                method: 'get',
                success: function(rUnits) {
                    var dUnits = Ext.decode(rUnits.responseText);
                    var i = 0;
                    store.beginUpdate();
                    spin(container, 'Laddar diagram', 300, 200);
                    for (i = 0; i < dUnits.data.length; i++) {
                        Ext.Ajax.request({
                            url: '/stratum/api/aggregate/fono/VocalChordsSurgery/unit/count/DiagnosisPrimary/year(SurgeryDate)/?UnitCode=' + dUnits.data[i].UnitCode,
                            method: 'get',
                            success: Ext.bind(function(rUnit, dummy, index) {
                                var dUnit = Ext.decode(rUnit.responseText);
                                var year;
                                for (year = new Date().getFullYear() - 3; year < new Date().getFullYear(); year++) {
                                    var obj = {};
                                    obj.x = dUnits.data[index].UnitName + ' ' + year;
                                    var d = 0;
                                    for (d = 0; d < yFields.length; d++) {
                                        obj[yFields[d]] = 0;
                                    }
                                    for (var diag in dUnit.data) {
                                        var diagShort = Ext.util.Format.ellipsis(diag, MAX_CHARS);
                                        if (diagShort == 'null') {
                                            diagShort = Ext.util.Format.ellipsis(NO_DIAGNOSIS, MAX_CHARS);
                                        }
                                        obj[diagShort] = dUnit.data[diag][year];
                                    }
                                    store.add(obj);
                                }
                                if (index === dUnits.data.length-1) {
                                    store.endUpdate();
                                    //container.remove(container.getComponent('spinner'));
                                    container.add(chart);
                                    chart.show();
                                    unspin();
                                }
                            }, this, i, true)
                        });
                    }
                }
            });
        }
    });

    container.add({
        xtype: 'component',
        width: '100%',
        html: '<h2 align="center">Antal registreringar per klinik uppdelat per diagnos</h1>',
    });         

}());
