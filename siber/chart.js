
Ext.define('CustomAxis', {
  extend: 'Ext.chart.axis.Category',
  alias: 'axis.custom',
  config: {
    fixedAxisWidth: undefined
  },
  getThickness: function () {
    var customWidth = this.getFixedAxisWidth();
    if (customWidth) {
      return customWidth;
    }
    return this.callParent();
  }
});

Ext.define('Siber.store.Start', {
  extend: 'Ext.data.Store',
  alias: 'store.start',
  storeId: 'start',
  fields: []
});

Ext.define('Siber.view.Filter', {
  extend: 'Ext.form.field.ComboBox',
  xtype: 'siberfilter',
  alias: 'view.siberfilter',
  cls: 'siber-select',
  forceSelection: false,
  typeAhead: true,
  queryMode: 'local',
  minChars: 1,
  anyMatch: true,
  autoSelect: false,
  caseSensitive: false,
  checkChangeEvents: ['change', 'keyup']
});

Ext.define('Siber.controller.Start', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.start',

  updateChart: function () {
    var controller = this;
    var spinner = this.getView().down('#spinner');
    var chart = this.getView().down('trend');
    chart.hide();
    spinner.show();

    var county = controller.getView().down('#countyFilter').getValue();
    var unit = controller.getView().down('#unitFilter').getValue();
    var indicator = controller.getView().down('#indicatorFilter').getValue();
    this.currentCounty = controller.getView().down('#countyFilter').getDisplayValue() || 'Alla';
    controller.getView().down('#unitFilter').getStore().clearFilter();
    controller.getView().down('#unitFilter').getFilters().add(controller.filterUnits.bind(controller));

    county = county[0] === '0' ? county[1] : county;
    var level = unit === '00' ? 'county' : 'unit';
    level = level === 'unit' || (level === 'county' && this.api.indexOf('ybars') >= 0 && county !== '0') ? 'unit' : 'county';
    var id = level === 'unit' && this.api.indexOf('ybars') < 0 ? unit : county;
    var group = level === 'unit' || county !== '0' ? '&group=' + id : '';
    group = (this.api.indexOf('completion') < 0 && this.api.indexOf('struct') < 0) ? '&group=' + id : group;
    var agglevel = this.api.indexOf('struct') < 0 ? 'agglevel=' + level : '';
    var indication = this.api.indexOf('completion') < 0 ? '' : '&indication=' + indicator;

    Ext.Ajax.request({
      type: 'ajax',
      method: 'get',
      cors: true,
      url: '/stratum/api/statistics/siber/' + this.api + '?' + agglevel + group + indication + '&apikey=KbxAwmlwLM4=',
      success: function (response) {
        var result = Ext.decode(response.responseText).data;
        chart.show();
        chart.getStore().loadData(result);
        spinner.hide();
      }
    });
  },

  initialize: function () {
    var controller = this;
    Ext.Ajax.request({
      type: 'ajax',
      method: 'get',
      cors: true,
      url: '/stratum/api/metadata/units/bindings/155?apikey=J6b-GSKrkfk=',
      success: function (response) {
        var result = Ext.decode(response.responseText).data;
        controller.unitCounties = result;
        controller.getView().down('#countyFilter').getFilters().add(controller.filterCounties.bind(controller));
      }
    });
  },

  filterUnits: function (item) {
    return item.data.UnitName !== 'Registercentrum' && (item.data.UnitName === 'Alla' || (this.unitCounties[item.data.UnitName] && this.unitCounties[item.data.UnitName].County === this.currentCounty) || this.currentCounty === 'Alla');
  },

  filterCounties: function (item) {
    var include = false;
    for (var i in this.unitCounties) { if (this.unitCounties[i].County === item.data.ValueName) { include = true; } }
    return include || item.data.ValueName === 'Alla';
  },

  countySelected: function () {
    this.getView().down('#unitFilter').setValue('00');
    this.updateChart();
  },

  unitCounties: {},
  currentCounty: 'Alla'
});

Ext.define('Start.viewmodel.Start', {
  extend: 'Ext.app.ViewModel',
  alias: 'viewmodel.start',
  stores: {
    start: {
      type: 'start'
    }
  }
});

Ext.define('Siber.view.Start', {
  extend: 'Ext.container.Container',
  alias: 'view.start',
  controller: 'start',
  viewModel: 'start',
  itemId: 'start',
  items: [
    {
      xtype: 'panel',
      border: false,
      style: {
        marginBottom: '20px'
      },
      layout: {
        type: 'hbox',
        align: 'left'
      },
      items: [
        {
          itemId: 'indicatorFilter',
          xtype: 'siberfilter',
          hidden: !widgetConfig.showIndicatorFilter,
          displayField: 'ValueName',
          valueField: 'ValueCode',
          fieldLabel: 'Indikation:',
          width: '50%',
          labelWidth: 80,
          labelStyle: 'text-align: right;',
          value: 'stress',
          listeners: {
            select: 'countySelected'
          },
          store: {
            fields: ['ValueCode', 'ValueName'],
            data: [
              { ValueName: 'Depression', ValueCode: 'depression' },
              { ValueName: 'Stresssyndrom', ValueCode: 'stress' },
              { ValueName: 'Social fobi', ValueCode: 'social_anxiety' },
              { ValueName: 'Paniksyndrom', ValueCode: 'panic' },
              { ValueName: 'Generaliserat ångestsyndrom', ValueCode: 'generalized_anxiety' },
              { ValueName: 'Hälsoångest', ValueCode: 'hypochondriasis' },
              { ValueName: 'Tvångssyndrom', ValueCode: 'ocd' },
              { ValueName: 'Insomni', ValueCode: 'insomnia' },
            ]
          },
        },
        {
          itemId: 'countyFilter',
          xtype: 'siberfilter',
          hidden: !widgetConfig.showCountyFilter,
          displayField: 'ValueName',
          valueField: 'ValueCode',
          fieldLabel: ' Region:',
          width: '50%',
          padding: '0 1px 0 0',
          labelWidth: 80,
          labelStyle: 'text-align: right;',
          value: '00',
          listeners: {
            select: 'countySelected'
          },
          store: {
            fields: ['ValueCode', 'ValueName'],
            autoLoad: true,
            proxy: {
              type: 'ajax',
              url: 'https://stratum.registercentrum.se/api/metadata/domains/3003?apikey=J6b-GSKrkfk=',
              withCredentials: true,
              reader: {
                type: 'json',
                rootProperty: 'data.DomainValues'
              },
            },
            listeners: {
              load: function (store) {
                store.add({ ValueName: 'Alla', ValueCode: '00' });
                store.sort({ property: 'ValueCode', direction: 'ASC' });
              },
            }
          },
        },
      ]
    },
    {
      xtype: 'panel',
      hidden: !widgetConfig.showUnitFilter,
      border: false,
      style: {
        marginBottom: '20px'
      },
      layout: {
        type: 'hbox',
        align: 'left'
      },
      items: [
        {
          itemId: 'unitFilter',
          xtype: 'siberfilter',
          hidden: !widgetConfig.showUnitFilter,
          displayField: 'UnitName',
          valueField: 'UnitCode',
          fieldLabel: 'Enhet:',
          labelStyle: 'padding-left: 10px; text-align: right;',
          flex: 1,
          labelWidth: 80,
          value: '00',
          listeners: {
            select: 'updateChart'
          },
          store: {
            fields: ['UnitCode', 'UnitName'],
            autoLoad: true,
            proxy: {
              type: 'ajax',
              url: 'https://stratum.registercentrum.se/api/metadata/units/register/155?apikey=J6b-GSKrkfk=',
              withCredentials: true,
              reader: {
                type: 'json',
                rootProperty: 'data'
              },
            },
            listeners: {
              load: function (store) {
                store.add({ UnitName: 'Alla', UnitCode: '00' });
                store.sort({ property: 'UnitCode', direction: 'ASC' });
              }
            }
          }
        },
      ]
    },
    {
      xtype: 'trend',
    },
    {
      xtype: 'panel',
      itemId: 'spinner',
      width: '100%',
      height: 162,
      hidden: true,
      border: false,
      html: '<div class="spinner"><div class="rect1"></div><div class="rect2"></div><div class="rect3"></div><div class="rect4"></div><div class="rect5"></div></div>'
    }
  ]
});

Ext.define('Siber.view.Main', {
  extend: 'Ext.chart.CartesianChart',
  xtype: 'trend',
  alias: 'view.trend',
  height: widgetConfig.height || 500,
  width: '100%',
  flipXY: widgetConfig.flipXY,
  border: false,
  colors: widgetConfig.colors || null,
  insetPadding: { right: 20 },
  legend: {
    type: 'dom'
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
      minimum: 0,
      position: widgetConfig.flipXY ? 'bottom' : 'left',
      grid: true,
      border: false,
      renderer: function (axis, label) {
        if (widgetConfig.asPercentages) { label *= 100; }
        label = parseInt(label, 10);
        // label = axis.getSegmenter().renderer(label, layout); 
        if (widgetConfig.asPercentages) { label += '%'; }
        return label;
      }
    },
    {
      type: 'category',
      position: widgetConfig.flipXY ? 'left' : 'bottom',
      fields: widgetConfig.xField,
      fixedAxisWidth: 150,
      labelWidth: 40,
      renderer: function (axis, label) {
        var words = label.split(' ');
        var newLabel = [];
        var newWord = words.shift();
        words.forEach(function (word) {
          var testWord = newWord + ' ' + word;
          if (testWord.length > 22) {
            newLabel.push(newWord);
            newWord = word;
          } else {
            newWord = testWord;
          }
        });
        newLabel.push(newWord);
        label = newLabel.join('\n');
        return label;
      }
    }
  ],

  series: {
    type: 'bar',
    stacked: widgetConfig.isStacked,
    xField: widgetConfig.xField,
    yField: widgetConfig.yField,
    title: widgetConfig.title,
    style: {
      maxBarWidth: 70
    },
    tooltip: {
      trackMouse: true,
      renderer: function (tooltip, record, ctx) {
        var value = record.get(ctx.field);
        if (widgetConfig.asPercentages) {
          var period = ctx.field.split('_')[1];
          var share = 'freq_' + period;
          value = Math.round(value * 100) + '%';
          if (record.get(share)) {
            value = value + ' (' + record.get(share) + ' av ???)';
          }
        }
        tooltip.setHtml(value);
      }
    }
  }
});

Ext.application({
  name: 'Siber',
  units: [],
  launch: function () {
    var target = (typeof Stratum !== 'undefined' && Stratum.containers) ? Stratum.containers['SIBER/Chart'] : 'contentPanel';
    Ext.create('Siber.view.Start', {
      renderTo: target
    });
    var controller = Ext.ComponentQuery.query('#start')[0].getController();
    controller.api = widgetConfig.api;
    controller.initialize();
    controller.updateChart();
  },
});

Ext.util.CSS.removeStyleSheet('siber');
Ext.util.CSS.createStyleSheet(
  ' '
  + '.numRatingsAxis {'
  + '  white-space: normal;'
  + '  width: 200px;'
  + '}'

  + '.siber-select .x-form-trigger-wrap {'
  + '  border-color: #3F73A6;'
  + '}'

  + '.siber-select .x-form-item-body {'
  + '  height: 40px;'
  + '  border-radius: 3px;'
  + '}'

  + '.siber-select input {'
  + '  color: #3F73A6;'
  + '  color: #2f5880;'
  + '  padding: 9px 14px;'
  + '}'

  + '.siber-select div {'
  + '  border-radius: 3px;'
  + '}'

  + '.siber-select label {'
  + '  white-space: nowrap;'
  + '  padding-top: 11px;'
  + '  color: #3F73A6;'
  + '  color: #2f5880;'
  + '}'

  + '.siber-select .x-form-trigger {'
  + '  vertical-align: middle;'
  + '  color: #3F73A6;'
  + '}', 'siber'
);
