
Ext.define('Septum.view.Main', {
  extend: 'Ext.chart.CartesianChart',
  xtype: 'trend',
  alias: 'view.trend',
  height: 500,
  width: 700,

  captions: {
    credits: {
      docked: 'bottom',
      text: '\n\n\nAktuell enhet: ' + (Profile && Profile.Context !== null ? Profile.Context.Unit.UnitName : 'Riket') + '\n',
      align: 'left',
      style: {
        fontSize: 14,
        fontFamily: 'open_sans',
        fontWeight: 400
      }
    },
    figcaption: {
      docked: 'bottom',
      text: 'Antalet svar fås genom att hålla muspekaren över respektive stapel. *Baserat på de data som kommit in i år.',
      align: 'left',
      style: {
        fontSize: 12,
        fontFamily: 'open_sans',
        fontWeight: 'normal'
      }
    },

  },

  legend: {
    type: 'dom',
    docked: 'bottom',
    style: {
      padding: '0 0 0 42px',
    },
    tpl: '<div class="x-legend-inner"><div class="x-legend-container"><tpl for="."><div class="x-legend-item"><span class="x-legend-item-marker {[ values.disabled ? Ext.baseCSSPrefix + \'legend-inactive\' : \'\' ]}" style="background:{mark};"></span>{name}</div></tpl></div></div>'
  },

  store: {
    fields: [],
    autoLoad: true,
    proxy: {
      type: 'ajax',
      withCredentials: true,
      reader: {
        type: 'json',
        rootProperty: 'data'
      }
    },
  },

  axes: [
    {
      type: 'numeric',
      position: 'left',
      grid: true,
      minimum: 0,
      maximum: 100,
      increment: 20,
      renderer: function (axis, label) { return label.toFixed(0) + '%  '; },
      style: { strokeStyle: '#979797', majorTickSize: 0 },
    },
    {
      type: 'category',
      position: 'bottom',
      style: { opacity: 0.2, majorTickSize: 0 },
      title: { text: '', fontSize: 15 },
      label: {
        color: '#183136',
        textAlign: 'center'
      },
      fields: 'Operationsår',
    }
  ],

  series: {
    type: 'bar',
    stacked: false,
    subStyle: { stroke: '#fff' },
    style: { minBarWidth: 12 },
    xField: 'Operationsår',

    tooltip: {
      trackMouse: true,
      renderer: function (tooltip, record, ctx) {
        var count = record.get(ctx.field + ' (antal)');
        var shareAll = record.get(ctx.field);
        var shareCropped = record.get(ctx.field + ' (utan saknade värden)');
        var text = '';
        if (WidgetConfig.verbose) {
          text = 'Antal: ' + count + '<br/>Andel (av de som tillfrågats): ' + shareAll + '%';
          text += ctx.field.indexOf('Svar saknas') < 0 ? '<br/>Andel (av de som svarat): ' + shareCropped + '%' : '';
        } else {
          text = 'Antal: ' + count + '<br/>Andel: ' + shareAll + '%';
        }
        tooltip.setHtml(text);
      }
    },

    renderer: function (sprite, config, attr) {
      var offsetX = sprite.getField().indexOf('Enhet') > -1 ? 4 : -4;
      return Ext.apply(attr, { x: config.x + offsetX });
    },
  },

  constructor: function (config) {
    var fields = config.series.yField.map(function (item) { return 'Riket : ' + item; });
    if (!config.restricted) {
      var unitFields = config.series.yField.map(function (item) { return 'Enhet : ' + item; });
      fields = fields.map(function (item, index) { return [unitFields[index], item]; });
      var extraColors = config.series.colors.map(function (item, index) { return [item, config.series.colors[index].replace('rgb', 'rgba').replace(')', ', 0.5)')]; });
      config.series.colors = [].concat.apply([], extraColors);
    }
    config.legend = {};
    // config.legend.tpl = this.config.legend.tpl.replace('texttoreplace', config.unit);
    config.series.yField = [].concat.apply([], fields);

    this.callParent(arguments);
  }
});

Ext.application({
  name: 'Septum',
  units: [],
  launch: function () {
    var target = (typeof Stratum !== 'undefined' && Stratum.containers) ? Stratum.containers['SEP/Chart'] : 'contentPanel';
    var restricted = !(Profile && Profile.Context !== null && Profile.Context.Unit.UnitName);
    var unit = Profile && Profile.Context !== null ? Profile.Context.Unit.UnitName : 'Riket';
    var url = '/stratum/api/statistics/Sep/utdata/?apikey=bK3H9bwaG4o=&rinvoke=1&idnr=' + WidgetConfig.id;
    url = WidgetConfig.url ? WidgetConfig.url : url;

    Ext.create('Septum.view.Main', {
      renderTo: target,
      restricted: restricted,
      unit: unit,
      series: {
        yField: WidgetConfig.yField,
        colors: WidgetConfig.colors,
      },
      store: { proxy: { url: url } },
    });
  },
});

Ext.util.CSS.removeStyleSheet('septum');
Ext.util.CSS.createStyleSheet(
  ' '
  + '  .x-legend-container {'
  + '      width: 520px;'
  + '      height: 140px;'
  + '      margin: auto;'
  + '      text-align: left;'
  + '  }'
  + '  .x-legend-item {'
  + '    width: 260px;'
  + '    max-width: 260px;'
  + '    float: left;'
  + '    text-overflow: clip;'
  + '  }', 'septum'
);

//! Septums nya utdata 2017
