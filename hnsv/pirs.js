
(function() {
    var container = Stratum.containers && Stratum.containers['HNSV/PIRS'] || 'main-container';

    var store;
    Profile.APIKey = 'bK3H9bwaG4o=';
    store = Ext.create('Ext.data.Store', {
        fields: ['PIRS', 'UnitName', 'Reg'],
        listeners: {
            refresh: function(st) {
                var pirsSum = 0,
                    regSum = 0;
                st.each(function(item) {
                    pirsSum += item.get('PIRS') * item.get('Reg');
                    regSum += item.get('Reg');
                });
                st.add({
                    PIRS: pirsSum / regSum,
                    Reg: regSum,
                    UnitName: 'Riket'
                });
            }
        },
        sorters: function(a, b) {
            return a.get('UnitName') === 'Riket' ? 1 : b.get('UnitName') === 'Riket' ? -1 :
                a.get('UnitName') === b.get('UnitName') ? 0 : a.get('UnitName') > b.get('UnitName') ? -1 : 1;
        }
    });
    ReportManagement.GetReport(3113, null, function(e, r) {
        if (r && r.result) {
            if (r.result.success) {
                store.loadData(r.result.data);
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
            colors: ['#3CB6CE', '#4BACC6', '#1e833f'],
            shadow: false,
            store: store,
            axes: [{
                type: 'category',
                position: 'left',
                fields: ['UnitName'],
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
                }
            }],
            series: [{
                type: 'bar',
                renderer: function(sprite, config, rendererData, index) {
                    var field = 'Reg',
                        store = rendererData.store;
                    if (store.getAt(index).get(field) < 10) {
                        return {
                            width: 0
                        };
                    }
                },
                tooltip: {
                    trackMouse: true,
                    cls: 'hnsv-tip',
                    renderer: function(tooltip, storeItem, item) {
                        tooltip.setHtml(storeItem.get('UnitName') + '<hr/><b>' + Ext.util.Format.number(storeItem.get('PIRS'), '0') + '</b> i snittbetyg bland <b>' + storeItem.get('Reg') + '</b> svarande patienter.');
                    }
                },
                label: {
                    display: 'insideStart',
                    field: 'Reg',
                    renderer: function(value, label, storeItem, item) {
                        var hideUnder = 10;
                        return (value < hideUnder ? '<' + hideUnder : Ext.util.Format.number(value, '0')) + ' reg.';
                    },
                    contrast: true
                },
                yField: 'PIRS',
                xField: 'UnitName'
            }]
        }
    });
}());
