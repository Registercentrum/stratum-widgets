 function initializeDefinitions()  {
  Ext.each(['Pie', 'Bar'], function(sType) {
      !Ext.chart.series['Null:'+sType] && Ext.define('Ext.chart.series.Null:' + sType, {
          alias: 'series.' + sType.toLowerCase() + ':null',
          extend: 'Ext.chart.series.' + sType,
          constructor: function() {
              this.callParent(arguments);
              this.nullValue = this.nullValue || 'null';
              this.nullColor = this.nullColor || '#b7b7b7';
              this._oldColorArrayStyle = Ext.isArray(this.colorArrayStyle) && this.colorArrayStyle.slice(0);
              this.getChart().on('refresh', this.refreshTitle, this);
          },
          refreshTitle: function() {
              var title = Ext.isArray(this.yField) && this.yField.slice(0),
                  nullPos;
              nullPos = title ? Ext.Array.indexOf(title, this.nullValue) : -1;
              if (nullPos >= 0) {
                  if (Ext.isArray(this._oldColorArrayStyle) && this._oldColorArrayStyle.length > nullPos) {
                      this.colorArrayStyle = this._oldColorArrayStyle.slice(0);
                      Ext.Array.insert(this.colorArrayStyle, nullPos, [this.nullColor]);
                  }
                  if (this.nullTitle) {
                      title[nullPos] = this.nullTitle;
                      this.title = title;
                  }
                  this.chart.redraw();
              }
          }
      });
  });
}

function displayDenominator (n){
  var denominatorSpan = Ext.fly('hnsb-denominator');
  denominatorSpan && denominatorSpan.setHtml(n);
}

function go() {	
initializeDefinitions();
var container = Stratum.containers && Stratum.containers['HNSB/Cause'] || 'main-container';
var store;
var domainId = 4489;
Profile.APIKey = 'bK3H9bwaG4o=';
store = Ext.create('Ext.data.Store', {
  fields: ['key', 'value', 'frequency'],
  autoLoad: true,
  proxy: {
      type: 'ajax',
      url: '/stratum/api/aggregate/HNSB/HNSBBase/Total/Count/AMainCause/',
      reader: {
          type: 'objecttoarray.frequency',
          frequencyField: 'frequency',
          toPercent: true,
          rootProperty: 'data'
      }
  },
  listeners: {
      load: function(st) {
          displayDenominator(st.sum('value') || '0');
  // Get the domain and sort according to the domainvalue sequence
          Ext.Ajax.request({
              url: '/stratum/api/metadata/domains/' + domainId,
              method: 'get',
              success: function(resp) {
                  var data = Ext.decode(resp.responseText).data;
                  if (data) {
                      st.sort([{
                          sorterFn: function(a, b) {
                              var av, bv;
            var aKey = a.get('key');
            var bKey = b.get('key');
                              Ext.each(data.DomainValues, function(dv) {
                                  if (!av && aKey === dv.ValueName)
                av = dv.Sequence;
              if (!bv && bKey === dv.ValueName)
                bv = dv.Sequence;
                                  if (av && bv)
                                      return false; // end loop
                              });
                              return av === bv ? 0 : av < bv ? -1 : 1;
                          },
          direction: 'ASC'
                      }]);
                  }
              }

          });
      }
  }
});
Ext.create('Ext.Container', {
  renderTo: container,
  width: '100%',
  height: 300,
  layout: 'fit',
  items: {
      xtype: 'chart',
      animate: true,
      shadow: false,
      colors: ['#614D7D', '#4BACC6', '#1e833f'],
      innerPadding: {
          top: 40
      },
      store: store,
      axes: [{
          type: 'numeric',
          position: 'left',
          fields: ['value'],
          label: function(v) {
              return Ext.util.Format.number(v, '0');
          },
          style: {
              strokeStyle: '#ccc'
          },
          grid: true
      }, {
          type: 'category',
          position: 'bottom',
          fields: ['key'],
          style: {
              strokeStyle: '#ccc'
          },
          label: {
              rotate: {
                  degrees: -45
              }
          }
      }],
      series: [{
          type: 'bar',
          highlight: false,
          tips: {
              trackMouse: true,
              renderer: function(storeItem) {
                  this.setHtml(Ext.String.format('{0}<hr/><b>{1}</b> observationer.', storeItem.get('key'), storeItem.get('value')));
              }
          },
          label: {
              display: 'outside',
              orientation: 'horizontal',
              field: 'frequency',
              renderer: Ext.util.Format.numberRenderer('0.0%')
          },
          xField: 'key',
          yField: 'value'
      }]
  }
});
}
go();
