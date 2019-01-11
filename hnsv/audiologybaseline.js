
Ext.onReady(function () {
  // Widget code goes here
  var container = Stratum.containers && Stratum.containers['HNSV/AudiologyBaseline'] || 'main-container';
  var store;
  Profile.APIKey = 'bK3H9bwaG4o='
  store = Ext.create('Ext.data.Store', {
      fields: [{name: 'Ingen', convert: function (v, i) { return Ext.Number.toFixed(i.get('Ingen') * i.get('Reg'), 0)}},
               {name: 'Liten', convert: function (v, i) { return Ext.Number.toFixed(i.get('Liten') * i.get('Reg'), 0)}},
               {name: 'God', convert: function (v, i) { return Ext.Number.toFixed(i.get('God') * i.get('Reg'), 0)}},
               {name: 'Mycket god', convert: function (v, i) { return Ext.Number.toFixed(i.get('Mycket god') * i.get('Reg'),0)}}, 'Reg', 'UnitName', {
          name: 'UnitNameReg',
          convert: function(val, item) {
              return Ext.String.format('{0} ({1} reg)', Ext.util.Format.ellipsis(item.get('UnitName', 25)), item.get('Reg'))
          }
      }],
      autoLoad: true,
      proxy: {
          type: 'ajax',
          url: '/stratum/api/statistics/hnsv/nytta',
          reader: {
              type: 'json',
              rootProperty: 'data'
          }
      },
      sorters: function(a, b) {
          return a.get('UnitName') === 'Riket' ? 1 : b.get('UnitName') === 'Riket' ? -1 :
              a.get('UnitName') === b.get('UnitName') ? 0 : a.get('UnitName') > b.get('UnitName') ? -1 : 1;
      }
  });

//     window.store = store;

  Ext.create('Ext.container.Container', {
      width: '100%',
      layout: 'fit',
      renderTo: container,
      items: {
          insetPadding: 40,
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
                  renderer: function(storeItem, item) {
                      var sum = storeItem.get('Reg'),
                          current = storeItem.get(item.field);
                      this.setHtml(Ext.String.format('{0} (<b>{1}</b>)<hr/><b>{2}</b> av <b>{3}</b>',
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

});
