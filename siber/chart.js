
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
    this.currentCounty = controller.getView().down('#countyFilter').getDisplayValue() || 'Alla landsting';
    controller.getView().down('#unitFilter').getStore().clearFilter();
    controller.getView().down('#unitFilter').getFilters().add(controller.filterUnits.bind(controller));

    county = county[0] === '0' ? county[1] : county;
    var level = unit === '00' ? 'county' : 'unit';
    level = level === 'unit' || (level === 'county' && this.api.indexOf('ybars') >= 0 && county !== '0') ? 'unit' : 'county';
    var id = level === 'unit' && this.api.indexOf('ybars') < 0 ? unit : county;
    var group = level === 'unit' || county !== '0' ? '&group=' + id : '';
    var agglevel = this.api.indexOf('struct') < 0 ? 'agglevel=' + level : '';

    Ext.Ajax.request({
      type: 'ajax',
      method: 'get',
      cors: true,
      url: '/stratum/api/statistics/siber/' + this.api + '?' + agglevel + group + '&apikey=KbxAwmlwLM4=',
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
    return item.data.UnitName !== 'Registercentrum' && (item.data.UnitName === 'Alla enheter' || (this.unitCounties[item.data.UnitName] && this.unitCounties[item.data.UnitName].County === this.currentCounty) || this.currentCounty === 'Alla landsting');
  },

  filterCounties: function (item) {
    var include = false;
    for (var i in this.unitCounties) { if (this.unitCounties[i].County === item.data.ValueName) { include = true; } }
    return include || item.data.ValueName === 'Alla landsting';
  },

  countySelected: function () {
    this.getView().down('#unitFilter').setValue('00');
    this.updateChart();
  },

  unitCounties: {},
  currentCounty: 'Alla landsting'
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
      layout: {
        type: 'hbox',
        align: 'left'
      },
      items: [
        {
          itemId: 'countyFilter',
          xtype: 'siberfilter',
          hidden: !widgetConfig.showCountyFilter && true,
          displayField: 'ValueName',
          valueField: 'ValueCode',
          fieldLabel: ' Region:',
          width: 250,
          labelWidth: 60,
          labelStyle: 'padding-left: 10px;',
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
                store.add({ ValueName: 'Alla landsting', ValueCode: '00' });
                store.sort({ property: 'ValueCode', direction: 'ASC' });
              },
            }
          },
        },
        {
          itemId: 'unitFilter',
          xtype: 'siberfilter',
          hidden: !widgetConfig.showUnitFilter && true,
          labelStyle: 'padding-left: 10px;',
          displayField: 'UnitName',
          valueField: 'UnitCode',
          fieldLabel: 'Klinik:',
          flex: 1,
          labelWidth: 50,
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
                store.add({ UnitName: 'Alla enheter', UnitCode: '00' });
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
  colors: widgetConfig.colors,
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
      position: widgetConfig.flipXY ? 'bottom' : 'left',
      grid: true,
      border: false,
      renderer: function (axis, label) { if (widgetConfig.asPercentages) { label = Math.round(label * 100) + '%'; } return label; }
    },
    {
      type: 'category',
      position: widgetConfig.flipXY ? 'left' : 'bottom',
      fields: widgetConfig.xField,
      fixedAxisWidth: 150,
      renderer: function (axis, label) { return Ext.util.Format.ellipsis(label, 22, true); }
    }
  ],

  series: {
    type: 'bar',
    stacked: false,
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
        if (widgetConfig.asPercentages) { value = Math.round(value * 100) + '%'; }
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
  + '}', 'siber'
);
