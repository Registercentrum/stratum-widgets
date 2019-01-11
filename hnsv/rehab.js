
(function() {
    var container = Stratum.containers && Stratum.containers['HNSV/Rehab'] || 'main-container';

    var store;
    Profile.APIKey = 'bK3H9bwaG4o=';
    store = Ext.create('Ext.data.Store', {
        fields: ['Ja', 'Nej', 'null', 'UnitName', {
            name: 'UnitNameReg',
            convert: function(val, item) {
                return Ext.String.format('{0} ({1} reg)', Ext.util.Format.ellipsis(item.get('UnitName'), 25), item.get('Ja') + item.get('Nej') + item.get('null'));
            }
        }],
        listeners: {
            refresh: function(st) {
                var jaSum = 0,
                    nejSum = 0,
                    nullSum = 0;
                st.each(function(item) {
                    jaSum += item.get('Ja');
                    nejSum += item.get('Nej');
                    nullSum += item.get('null');
                });
                st.add({
                    Ja: jaSum,
                    Nej: nejSum,
                    'null': nullSum,
                    UnitName: 'Riket'
                });
            }
        },
        sorters: function(a, b) {
            return a.get('UnitName') === 'Riket' ? 1 : b.get('UnitName') === 'Riket' ? -1 :
                a.get('UnitName') === b.get('UnitName') ? 0 : a.get('UnitName') > b.get('UnitName') ? -1 : 1;
        }
    });
    ReportManagement.GetReport(3115, null, function(e, r) {
        if (r && r.result) {
            if (r.result.success) {
                store.loadRawData(r.result.data);
            } else if (r.result.error) {
                Ext.log({
                    level: 'error'
                }, "error on data load: " + r.result.error);
            }
        }
    });

    Ext.create('Ext.container.Container', {
        width: '100%',
        layout: 'fit',
        renderTo: container,
        items: {
            xtype: 'chart',
            height: 700,
            flipXY: true,
            animation: false,
            colors: ['#9BBB59', '#C0504D', '#999'],
            shadow: false,
            store: store,
            legend: {
                dock: 'bottom'
            },
            axes: [{
                type: 'category',
                position: 'left',
                style: {
                    strokeStyle: '#ccc'
                },
                label: {
                    textAlign: 'right'
                }
            }, {
                type: 'numeric',
                position: 'bottom',
                grid: true,
                minimum: 0,
                maximum: 100,
                style: {
                    strokeStyle: '#ccc'
                },
                renderer: Ext.util.Format.numberRenderer('0%')
            }],
            series: [{
                type: 'bar',
                title: ['Har Deltagit', 'Har Inte deltagit', 'Saknas'],
                fullStack: true,
                stacked: true,
                tooltip: {
                    trackMouse: true,
                    cls: 'hnsv-tip',
                    renderer: function(tooltip, storeItem, item) {
                        var sum = storeItem.get('Ja') + storeItem.get('Nej') + storeItem.get('null'),
                            current = storeItem.get(item.field);
                        tooltip.setHtml(Ext.String.format('{0} (<b>{1}</b>)<hr/><b>{2}</b> av <b>{3}</b>',
                            storeItem.get('UnitName'),
                            Ext.util.Format.number(current / sum * 100, '0.0%'),
                            current,
                            sum));
                    }
                },
                yField: ['Ja', 'Nej', 'null'],
                xField: 'UnitNameReg'
            }]
        }
    });
}());
