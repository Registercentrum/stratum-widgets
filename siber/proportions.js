
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
  checkChangeEvents: ['change', 'keyup'],

  constructor: function (config) {
    config.queryMode = 'local';
    this.callParent(arguments);
  }
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
    county = county[0] === '0' ? county[1] : county;
    var level = county === '0' ? 'county' : 'unit';
    county = county !== '0' ? '&group=' + county : '';
    Ext.Ajax.request({
      type: 'ajax',
      method: 'get',
      cors: true,
      url: '/stratum/api/statistics/siber/' + this.api + '?agglevel=' + level + county + '&apikey=KbxAwmlwLM4=',
      success: function (response) {
        var result = Ext.decode(response.responseText).data;
        chart.show();
        chart.getStore().loadData(result);
        spinner.hide();
        // chart.setHeight(chart.getStore().getData().items.length * 80 + 80);
      }
    });
  }
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
      itemId: 'countyFilter',
      xtype: 'siberfilter',
      displayField: 'ValueName',
      valueField: 'ValueCode',
      label: 'Enhet:',
      labelWidth: '60px !important;',
      labelStyle: 'vertical-align: middle;',
      cls: 'ssw-select col-md-6',
      value: '00',
      sortfield: 'UnitName',
      sortdirection: 'DESC',
      listeners: {
        select: 'updateChart'
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
            store.add({ ValueName: 'Inom riket', ValueCode: '00' });
            store.sort({ property: 'ValueCode', direction: 'ASC' });
          }
        }
      },
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
  height: 500,
  width: 750,
  flipXY: true,
  border: false,

  insetPadding: {
    right: 20
  },
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
      position: 'bottom',
      grid: true,
      minimum: 0,
      maximum: 1,
      majorTickSteps: 10,
      renderer: function (axis, label) { return (label.toFixed(1) * 100) + '% '; }
    },
    {
      type: 'category',
      position: 'left',
      fields: 'name',
      fixedAxisWidth: 150,
      renderer: function (axis, label) { return Ext.util.Format.ellipsis(label, 22, true); }
    }
  ],

  series: {
    type: 'bar',
    stacked: false,
    xField: 'name',
    yField: ['proportion_previous', 'proportion_latest'],
    title: ['Föregående 365 dagar', 'Senaste 365 dagarna'],
    style: {
      maxBarWidth: 50
    }
  }
});

Ext.application({
  name: 'Siber',
  units: [],
  launch: function () {
    var target = (typeof Stratum !== 'undefined' && Stratum.containers) ? Stratum.containers['SIBER/Proportions'] : 'contentPanel';
    Ext.create('Siber.view.Start', {
      renderTo: target,
    });
    Ext.ComponentQuery.query('#start')[0].getController().api = WidgetConfig.api;
    Ext.ComponentQuery.query('#start')[0].getController().updateChart();
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
