
(function() {
    var container = Stratum.containers && Stratum.containers['HNSV/Sign'] || 'main-container';

    var store;
    Profile.APIKey = 'bK3H9bwaG4o=';
    store = Ext.create('Ext.data.Store', {
        fields: ['value', {
            name: 'key',
            convert: function(val) {
                return ({'Ja': 'Barndomsdöva', 'Nej': 'Ej barndomsdöva', 'null': 'Saknar svar'})[val] || val;
            }
        }, 'frequency'],
        autoLoad: true,
        proxy: {
            type: 'ajax',
            url: '/stratum/api/aggregate/hnsv/hnsvmap/total/count/ASignLanguage',
            reader: {
                type: 'objecttoarray.frequency',
                frequencyField: 'frequency',
                toPercent: true,
                rootProperty: 'data'
            }
        }
    });
    Ext.widget('container', {
        renderTo: container,
        width: '100%',
        height: 400,
        layout: 'fit',
        items: {
            xtype: 'polar',
            animate: true,
            store: store,
            innerPadding: 10,
            colors: ['#999999','#4BACC6', '#9BBB59'],
            shadow: false,
            legend: {
                docked: 'right'
            },
            listeners: {},
            series: [{
                type: 'pie',
                donut: 50,
                angleField: 'value',
                showInLegend: true,
                tips: {
                    trackMouse: true,
                    renderer: function(tooltip, storeItem) {
                        tooltip.update(Ext.String.format('<b>{0}</b><hr/>{1} observationer ({2} av totalt {3})',
                            storeItem.get('key'),
                            storeItem.get('value'),
                            Ext.util.Format.number(storeItem.get('frequency'), '0.0%'),
                            storeItem.store.sum('value')));
                    }
                },
                highlight: {
                    segment: {
                        margin: 5
                    }
                },
                label: {
                    field: 'key',
                    renderer: function(text, sprite, config, rendererData, index) {
                        var store = rendererData.store,
                            value = store.getAt(index).get('value'),
                            hidden = rendererData.series.getHidden(),
                            visibleSum = 0,
                            ratio;

                        store.each(function(item, index) {
                            visibleSum += hidden[index] ? 0 : item.get('value');
                        });
                        ratio = 100 * value / visibleSum;
                        return ratio >= 3 ? Ext.util.Format.number(ratio, '0.0%') : '';
                    },
                    display: 'inside',
                    contrast: true,
                    hideLessThan: 2
                }
            }]
        }
    });
}());
