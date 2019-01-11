
Ext.onReady(function () {
    // Widget code goes here
    var container = Stratum.containers && Stratum.containers['HNSV/CIRatioBaseline'] || 'main-container';
    // Widget code goes here
    Profile.APIKey = 'bK3H9bwaG4o=';
    var store = Ext.create('Ext.data.Store', {
        fields: ['CI något öra', 'Ej CI', 'Reg', 'Saknas', 'UnitName',{
            name: 'Ja',
            convert: function(val, item) {
                return Ext.Number.toFixed(item.get('Reg') * item.get('CI något öra'), 0)
            }
        }, {
            name: 'Nej',
            convert: function (val, item) {
                return Ext.Number.toFixed(item.get('Reg') * item.get('Ej CI'), 0)
            }
        }, {
            name: 'null',
            convert: function(val, item) {
                return Ext.Number.toFixed(item.get('Reg') * item.get('Saknas'), 0)
            }
        },{
            name: 'UnitNameReg',
            convert: function(val, item) {
                return Ext.String.format('{0} ({1} reg)', Ext.util.Format.ellipsis(item.get('UnitName'), 25), item.get('Reg'))
            }
        }], autoLoad: true,
      proxy: {
        type: 'ajax',
        url: '/stratum/api/statistics/hnsv/implantat',
        reader: {
          type: 'json',
          rootProperty: 'data'
        }
      },
      sorters: function(a, b) {
        return a.get('UnitName') === 'Riket' ? 1 : b.get('UnitName') === 'Riket' ? -1 :
        a.get('UnitName') === b.get('UnitName') ? 0 : a.get('UnitName') > b.get('UnitName') ? -1 : 1;
      }

    })
    Ext.create('Ext.container.Container', {
        width: '100%',
        layout: 'fit',
        renderTo: container,
        items: {
            insetPadding: 20,
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
                title: ['CI något öra', 'Ej CI', 'Saknas'],
                fullStack: true,
                stacked: true,
                tooltip: {
                    trackMouse: true,
                    cls: 'hnsv-tip',
                    renderer: function(tooltip, storeItem, item) {
                        var sum = storeItem.get('Reg'),
                            current = storeItem.get(item.field);
                        tooltip.setHtml(Ext.String.format('{0} (<b>{1}</b>)<hr/><b>{2}</b> av <b>{3}</b>',
                            storeItem.get('UnitName'),
                            Ext.util.Format.number(current / sum * 100, '0.0%'),
                            current,
                            sum)
                        );
                    }
                },

                yField: ['Ja', 'Nej', 'null'],
                xField: 'UnitNameReg'
            }]
        }
    });

});
