
Ext.onReady(function () {
  // Widget code goes here
  var container = Stratum.containers && Stratum.containers['HNSV/RehabBaseline'] || 'main-container';
  var store;
  Profile.APIKey = 'bK3H9bwaG4o=';
  store = Ext.create('Ext.data.Store', {
      fields: ['Reg', 'Har inte deltagit', 'Har deltagit', 'Saknas', 'UnitName',{
          name: 'Ja',
          convert: function (v, i) {
              return Ext.Number.toFixed(i.get('Reg') * i.get('Har deltagit'), 0);
          }
      },{
          name: 'Nej',
          convert: function (v, i) {
              return Ext.Number.toFixed(i.get('Reg') * i.get('Har inte deltagit'), 0);
          }
      },{
          name: 'null',
          convert: function (v, i) {
              return Ext.Number.toFixed(i.get('Reg') * i.get('Saknas'), 0);
          }
      },{
          name: 'UnitNameReg',
          convert: function (v, i) {
              return Ext.String.format('{0} ({1} reg)', Ext.util.Format.ellipsis(i.get('UnitName'), 25), i.get('Reg'))
          }
      }],
      autoLoad: true,
      proxy: {
          type: 'ajax',
          url: '/stratum/api/statistics/hnsv/rehab_baseline_jumbotron_luwi',
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
              title: ['Har Deltagit', 'Har Inte deltagit', 'Saknas'],
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
              yField: ['Ja', 'Nej', 'null' ],
              xField: 'UnitNameReg'
          }]
      }
  });
});
