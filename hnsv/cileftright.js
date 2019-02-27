
(function() {
  var container = Stratum.containers && Stratum.containers['HNSV/CILeftRight'] || 'main-container';

  var store, mergedData = {},
      completeData = [];

  store = Ext.create('Ext.data.Store', {
      fields: ['Left', 'Right', 'UnitName'],
      listeners: {},
      sorters: {
          property: 'UnitName',
          direction: 'DESC'
      }
  });
  Ext.Ajax.request({
      url: '/stratum/api/aggregate/hnsv/hnsvmap/total/count/SurgeryUnitHNSVMap/ACiLeft',
      success: function(resp) {
          var leftData = Ext.decode(resp.responseText).data;
          Ext.Object.each(leftData, function(k, v) {
              mergedData[k] = Ext.merge({
                  Left: v['Ja']
              }, mergedData[k]);
          });
          Ext.Ajax.request({
              url: '/stratum/api/aggregate/hnsv/hnsvmap/total/count/SurgeryUnitHNSVMap/ACiRight',
              success: function(resp2) {
                  var rightData = Ext.decode(resp2.responseText).data;
                  Ext.Object.each(rightData, function(k, v) {
                      mergedData[k] = Ext.merge({
                          Right: v['Ja']
                      }, mergedData[k]);
                  });
                  Ext.Object.each(mergedData, function(k, v) {
                      completeData.push({
                          UnitName: k,
                          Left: v.Left,
                          Right: v.Right
                      });
                  });
                  store.loadData(completeData);
              }
          });
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
          animate: true,
          colors: ['#4BACC6', '#9BBB59'],
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
              style: {
                  strokeStyle: '#ccc'
              }
          }],
          series: [{
              type: 'bar',
              title: ['Vänster öra', 'Höger öra'],
              stacked: true,
              tooltip: {
                  trackMouse: true,
                  cls: 'hnsv-tip',
                  renderer: function(tooltip, storeItem, item) {
                      var current = storeItem.get(item.field);
                      tooltip.setHtml(Ext.String.format('{0} <hr/><b>{1}</b> patienter',
                          storeItem.get('UnitName'),
                          current
                      ));
                  }
              },
              yField: ['Left', 'Right'],
              xField: 'UnitName'
          }]
      }
  });
}());
