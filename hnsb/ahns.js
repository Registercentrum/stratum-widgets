function displayDenominator(n){
  var denominatorSpan = Ext.fly('hnsb-denominator');
  denominatorSpan && denominatorSpan.setHtml(n);
}
function initializeDefinitions () {
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
function go() {
initializeDefinitions ();
var container = Stratum.containers && Stratum.containers['HNSB/AHNS'] || 'main-container';

var ahnsStore;
var domainId = 4491;
var missingText = 'Saknas';
var missingValue = 9999;
Profile.APIKey = 'bK3H9bwaG4o=';
ahnsStore = Ext.create('Ext.data.Store', {
  fields: ['value', {
      name: 'key',
      convert: function(val) {
  // Group all null values under 'Saknas'
          return val === 'null' ? missingText : val;
      }
  }, 'frequency'],
  autoLoad: true,
  proxy: {
      type: 'ajax',
      url: '/stratum/api/aggregate/HNSB/HNSBBase/Total/Count/AHNS/',
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
            if (aKey === missingText)
              av = missingValue;
            if (bKey === missingText)
              bv = missingValue;
            Ext.each(data.DomainValues, function(dv) {
              if (!av && aKey === dv.ValueName)
                av = dv.Sequence;
              else if (!bv && bKey === dv.ValueName)
                bv = dv.Sequence;
              if (av && bv)
                return false;
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

Ext.widget('container', {
  renderTo: container,
  width: '100%',
  height: 350,
  layout: 'fit',
  items: {
      xtype: 'polar',
      animate: true,
      store: ahnsStore,
      colors: ['#A2AD00', '#614D7D', '#3CB6CE', '#E98300', '#FECB00', '#AAA38E'],
      shadow: false,
      legend: {
          docked: 'right'
      },
      listeners: {},
      series: [{
          type: 'pie:null',
          nullValue: 'Saknas',
          donut: 50,
          angleField: 'value',
          showInLegend: true,
          tips: {
              trackMouse: true,
              renderer: function(storeItem) {
                  this.update(Ext.String.format('<b>{0}</b><hr/>{1} observationer ({2} av totalt {3})',
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
}
go();
