
//Caching of data currently disabled due to context switches...
Repository.Local.LVRUnitOverview = /*Repository.Local.LVRUnitOverview ||*/ {
  /*
   * gridconfig described as
   * {ids: [12,123,42], title: 'Title', storeId: 'store123'} or an array of gridconfigs...
   */
  overview: {
      '3096': {
          desc: 'Diagnos'
      },
      '3097': {
          desc: 'Könsfördelning KOL-patienter'
      },
      '3098': {
          desc: 'Åldersfördelning KOL-patienter'
      },
      '3103': {
          desc: 'Stadiumindelning KOL-patienter'
      },
      '3099': {
          desc: 'Könsfördelning Astma-patienter'
      },
      '3100': {
          desc: 'Åldersfördelning Astma-patienter'
      },
      '3101': {
          desc: 'AKT'
      }
  },
  createUnitOverviewGrid: function(gridconfig, data, renderTo) {
      if (!data) {
          return;
      }
      // var data = Repository.Local.current.unitOverviewData;
      Ext.each(gridconfig, function(gc) {
          var tmp = [],
              store;
          store = gc.storeId && Ext.StoreManager.lookup(gc.storeId);
          if (!store) {
              Ext.each(gc.ids || [], function(id) {
                  var value = data[id] || {};
                  Ext.Object.each(data[id]['ClinicALL=1'], function(k, v) {
                      var i = {
                          group: value.desc,
                          antal: value['ClinicALL=0'] && value['ClinicALL=0'][k] ? value['ClinicALL=0'][k] : '',
                          andel: value['ClinicALL=0'] && value['ClinicALL=0'][k] ? value['ClinicALL=0'][k] / value.sums['ClinicALL=0'] : '',
                          rAntal: v,
                          variable: k,
                          rAndel: v / value.sums['ClinicALL=1']
                      };
                      tmp.push(i);
                  });
              });
              store = Ext.create('Ext.data.Store', {
                  groupField: 'group',
                  storeId: gc.storeId,
                  fields: ['andel', 'antal', 'group', 'rAndel', 'rAntal', 'variable'],
                  data: tmp
              });
          }
          Ext.create('Ext.grid.Panel', {
              title: gc.title,
              store: store,
              margin: '0 0 30px 0',
              columns: {
                  defaults: {
                      menuDisabled: true
                  },
                  items: [{
                      text: 'Variabel',
                      dataIndex: 'variable',
                      flex: 1
                  }, {
                      text: 'Antal',
                      dataIndex: 'antal',
                      align: 'right'
                  }, {
                      text: 'Andel',
                      dataIndex: 'andel',
                      align: 'right',
                      renderer: function(v) {
                          return Ext.util.Format.number(v * 100, '0.0%');
                      }
                  }, {
                      text: 'Reg. Antal',
                      align: 'right',
                      dataIndex: 'rAntal'
                  }, {
                      text: 'Reg. Andel',
                      align: 'right',
                      dataIndex: 'rAndel',
                      renderer: function(v) {
                          return Ext.util.Format.number(v * 100, '0.0%');
                      }
                  }]
              },
              features: [{
                  ftype: 'grouping',
                  collapsible: false,
                  groupHeaderTpl: '{name}'
              }],
              renderTo: renderTo
          });
      });
  }
};
Ext.fly('mainContainer').mask('Laddar data ...');
Repository.Local.Methods.initialize(Repository.Local.LVRUnitOverview.overview, function() {
  var lvrOverview = Repository.Local.LVRUnitOverview;
  lvrOverview.createUnitOverviewGrid([{
      ids: [3096],
     // storeId: 'lvrUnitDiagnosis',
      title: 'Diagnos'
  }, {
      ids: [3097, 3098, 3103],
    //  storeId: 'lvrUnitKOL',
      title: 'KOL'
  }, {
      ids: [3099, 3100, 3101],
    //  storeId: 'lvrUnitAstma',
      title: 'Astma'
  }], lvrOverview.overview, 'mainContainer');
  Ext.fly('mainContainer').unmask();
});
