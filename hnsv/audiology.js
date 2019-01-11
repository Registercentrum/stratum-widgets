
(function() {
    var container = Stratum.containers && Stratum.containers['HNSV/Audiology'] || 'main-container';

    var store;
    Profile.APIKey = 'bK3H9bwaG4o=';
    store = Ext.create('Ext.data.Store', {
        
        fields: ['Ingen','Liten','God','Mycket god', 'UnitName', {
            name: 'UnitNameReg',
            convert: function(val, item) {
                var sum = item.get('Ingen') + item.get('Liten') + item.get('God') + item.get('Mycket god');
                return Ext.String.format('{0} ({1} reg)', Ext.util.Format.ellipsis(item.get('UnitName'), 25), sum);
            }
        }],
        listeners: {
            refresh: function(st) {
                var ingenSum = 0,
                    litenSum = 0,
                    godSum = 0,
                    mGodSum = 0;
                st.each(function(item) {
                    ingenSum += item.get('Ingen');
                    litenSum += item.get('Liten');
                    godSum += item.get('God');
                    mGodSum += item.get('Mycket god');
                });
                st.add({
                    Ingen: ingenSum,
                    Liten: litenSum,
                    God: godSum,
                    'Mycket god': mGodSum,
                    UnitName: 'Riket'
                });
            }
        },
        sorters: function(a, b) {
            return a.get('UnitName') === 'Riket' ? 1 : b.get('UnitName') === 'Riket' ? -1 :
                a.get('UnitName') === b.get('UnitName') ? 0 : a.get('UnitName') > b.get('UnitName') ? -1 : 1;
        }
    });
    ReportManagement.GetReport(3116, null, function(e, r) {
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
            colors:  ["#4F6228", "#9BBB59", "#F79646", "#C0504D"],
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
                fullStack: true,
                stacked: true,
                tooltip: {
                    trackMouse: true,
                    cls: 'hnsv-tip',
                    renderer: function(tooltip, storeItem, item) {
                        var sum = storeItem.get('Mycket god')+storeItem.get('God')+storeItem.get('Liten')+storeItem.get('Ingen'),
                            current = storeItem.get(item.field);
                        tooltip.setHtml(Ext.String.format('{0} (<b>{1}</b>)<hr/><b>{2}</b> av <b>{3}</b>',
                            storeItem.get('UnitName'),
                            Ext.util.Format.number(current / sum * 100, '0.0%'),
                            current,
                            sum));
                    }
                },
                yField: ['Mycket god', 'God', 'Liten', 'Ingen'],
                xField: 'UnitNameReg'
            }]
        }
    });
}());
