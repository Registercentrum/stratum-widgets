
Ext.onReady(function () {
  var container = Stratum.containers && Stratum.containers['HNSV/PIRSBaseline'] || 'main-container';
  // Widget code goes here
  Profile.APIKey = 'bK3H9bwaG4o=';
  var store = Ext.create('Ext.data.Store', {
      fields: [
          {
              name: 'PIRS',
              convert: function (value, record) {
                  return value === 'NA' ? 15 : value;
              }
          },
          'Reg',
          'UnitName'
    ],
    autoLoad: true,
    proxy: {
      type: 'ajax',
      url: '/stratum/api/statistics/hnsv/pirsny',
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
//     window.store = store;

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
              majorTickSteps: 10,
              minorTickSteps: 5,
              style: {
                  strokeStyle: '#ccc'
              }
          }],
          series: [{
              type: 'bar',
              renderer: function(sprite, config, rendererData, index) {
                  var field = 'Reg',
                      store = rendererData.store;
                  if (store.getAt(index).get(field) < 5) {
                      return {
                          width: 0
                      };
                  }
              },
              tooltip: {
                  trackMouse: true,
                  cls: 'hnsv-tip',
                  renderer: function(storeItem, item) {
                      this.setHtml(storeItem.get('UnitName') + '<hr/><b>' + Ext.util.Format.number(storeItem.get('PIRS'), '0') + '</b> i snittbetyg bland <b>' + storeItem.get('Reg') + '</b> svarande patienter.');
                  }
              },
              label: {
                  display: 'insideStart',
                  field: 'Reg',
                  renderer: function(value, sprite, config, rendererData, index) {
                      var hideUnder = 5;
                      return (value <= hideUnder ? '<' + hideUnder : Ext.util.Format.number(value, '0')) + ' reg.';
                  },
                  contrast: true
              },
              yField: 'PIRS',
              xField: 'UnitName'
          }]
      }
  });

});
