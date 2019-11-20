var controller;
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
  updateCharts: function () {

    if (!widgetConfig.isDashboard) {
      controller.api = widgetConfig.api;
      controller.updateChart(0);
    }
    else {
      for (var i = 0; i < 5; i++) {
        controller.api = getChartConfig(i, widgetConfig).api;
        controller.updateChart(i);
      }
    }
  },
  updateChart: function (chartID) {
    var view = this.getView();
    var spinner = view.down('#spinner');
    //var chart   = view.down('trend');
    var chart = Ext.getCmp('chart' + chartID);
    chart.hide();
    spinner.show();

    controller.currentCounty = view.down('#countyFilter').getDisplayValue() || 'Alla';
    view.down('#unitFilter').getStore().clearFilter();
    view.down('#unitFilter').getFilters().add(controller.filterUnits.bind(controller));
    if (widgetConfig.isDashboard) {
      view.down('#unitFilter').setValue(Profile.Context.Unit.UnitCode);
    }

    var url = controller.createUrl();

    Ext.Ajax.request({
      type: 'ajax',
      method: 'get',
      cors: true,
      url: url,
      success: function (response) {
        var result = Ext.decode(response.responseText).data;
        chart.show();
        chart.getStore().loadData(result);
        spinner.hide();
      }
    });
  },


  createUrl: function () {
    var view = this.getView();
    var county = view.down('#countyFilter').getValue();
    var unit = view.down('#unitFilter').getValue();
    var indicator = view.down('#indicatorFilter').getValue();

    var isQuarterly = this.api.indexOf('ybars') >= 0;

    county = county[0] === '0' ? county[1] : county;
    var level = unit !== '00' || (isQuarterly && county !== '0') ? 'unit' : 'county';
    var id = level === 'county' || isQuarterly ? county : unit;
    var group = level === 'unit' || county !== '0' ? '&group=' + id : '';
    var indication = widgetConfig.showIndicatorFilter ? '&indication=' + indicator : '';

    var url = '/stratum/api/statistics/siber/' + this.api + '?agglevel=' + level + group + indication + '&apikey=KbxAwmlwLM4=';
    return url;
  },

  initialize: function () {

    Ext.Ajax.request({
      type: 'ajax',
      method: 'get',
      cors: true,
      url: '/stratum/api/metadata/units/bindings/155?apikey=KbxAwmlwLM4=',
      success: function (response) {
        var result = Ext.decode(response.responseText).data;
        controller.unitCounties = result;
        controller.getView().down('#countyFilter').getFilters().add(controller.filterCounties.bind(controller));
        controller.updateCharts();
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
    this.updateCharts();
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
      xtype: 'container',
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
          xtype: 'component',
          html: '',
          id: 'headerCmp'
        },
        {
          itemId: 'indicatorFilter',
          xtype: 'siberfilter',
          hidden: !widgetConfig.showIndicatorFilter,
          displayField: 'ValueName',
          valueField: 'ValueCode',
          fieldLabel: 'Diagnosgrupp:',
          width: '50%',
          // labelWidth: 100,
          labelStyle: 'text-align: right;',
          value: 'all',
          listeners: {
            select: 'updateCharts'
          },
          store: {
            fields: ['ValueCode', 'ValueName'],
            data: [
              { ValueName: 'Alla diagnoser', ValueCode: 'all' },
              { ValueName: 'Depression', ValueCode: 'depression' },
              { ValueName: 'Stressyndrom', ValueCode: 'stress' },
              { ValueName: 'Social fobi', ValueCode: 'social_anxiety' },
              { ValueName: 'Paniksyndrom', ValueCode: 'panic' },
              { ValueName: 'Ångestsyndrom inkl GAD', ValueCode: 'anxiety_including_gad' },
              { ValueName: 'Hälsoångest', ValueCode: 'hypochondriasis' },
              { ValueName: 'Tvångssyndrom', ValueCode: 'ocd' },
              { ValueName: 'Insomni', ValueCode: 'insomnia' },
              { ValueName: 'Dysmorfofobi', ValueCode: 'dysmorphic' },
              { ValueName: 'Ångestsyndrom unga RCADS-47', ValueCode: 'anxiety_young_rcads47' },
              { ValueName: 'Ångestsyndrom unga RCADS-25', ValueCode: 'anxiety_young_rcads25' }/*,
			  { ValueName: 'Ångestsyndrom unga*', ValueCode: 'anxiety_young' }*/


              /*{ ValueName: 'Separationsångest', ValueCode: 'separation_anxiety'}*/
            ],
            sorters: {
              property: 'ValueName',
              direction: 'ASC'
            },
            filters: [
              function (item) {
                if (item.data.ValueCode == 'anxiety_young_rcads47' || item.data.ValueCode == 'anxiety_young_rcads25')
                  return widgetConfig.showSpecialIndicatores;
                if (!widgetConfig.excludedIndicators) return true;
                return !Ext.Array.contains(widgetConfig.excludedIndicators, item.data.ValueCode);
              }
            ]
          },
        },
        {
          itemId: 'countyFilter',
          xtype: 'siberfilter',
          hidden: !widgetConfig.showCountyFilter || widgetConfig.isDashboard,
          displayField: 'ValueName',
          valueField: 'ValueCode',
          fieldLabel: ' Region:',
          width: '50%',
          padding: '0 1px 0 0',
          labelWidth: 60,
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
              url: '/stratum/api/metadata/domains/3003?apikey=KbxAwmlwLM4=',
              withCredentials: true,
              reader: {
                type: 'json',
                rootProperty: 'data.DomainValues'
              },
            },
            listeners: {
              load: function (store) {
                store.add({ ValueName: 'Alla', ValueCode: '00' });
                store.sort({ property: 'ValueName', direction: 'ASC' });
              },
            }
          },
        },
      ]
    },
    {
      xtype: 'container',
      hidden: !widgetConfig.showUnitFilter,
      //border: false,
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
          labelStyle: 'text-align: right;',
          flex: 1,
          labelWidth: 60,
          value: '00',
          listeners: {
            select: 'updateCharts'
          },
          store: {
            fields: ['UnitCode', 'UnitName'],
            autoLoad: true,
            proxy: {
              type: 'ajax',
              url: '/stratum/api/metadata/units/register/155?apikey=KbxAwmlwLM4=',
              withCredentials: true,
              reader: {
                type: 'json',
                rootProperty: 'data'
              },
            },
            listeners: {
              load: function (store) {
                store.add({ UnitName: 'Alla', UnitCode: '00' });
                store.sort({ property: 'UnitName', direction: 'ASC' });
              }
            }
          }
        },
      ]
    },
    getChartItems(),
    {
      xtype: 'container',
      itemId: 'spinner',
      width: '100%',
      height: 162,
      hidden: true,
      //border: false,
      html: '<div class="spinner"><div class="rect1"></div><div class="rect2"></div><div class="rect3"></div><div class="rect4"></div><div class="rect5"></div></div>'
    }
  ]
});

function createChart(id) {
  var widgetConfig = getChartConfig(id, window.widgetConfig);
  var chart = Ext.create('Ext.chart.CartesianChart', {
    extend: 'Ext.chart.CartesianChart',
    id: 'chart' + id,
    //alias: 'view.trend',
    height:  widgetConfig.height || 500,
    width: '100%',
    flipXY: widgetConfig.flipXY,
    border: false,
    colors: widgetConfig.colors || null,
    insetPadding: { right: 20 },
    hidden: true,
    legend: {
      type: 'dom',
      docked: 'top'
    },
    useDarkerStrokeColor: false,
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
        maximum: widgetConfig.asPercentages ? 1 : NaN,
        position: widgetConfig.flipXY ? 'bottom' : 'left',
        grid: true,
        border: false,
        renderer: function (axis, label) {
          if (widgetConfig.asPercentages) {
            label *= 100;
            label = parseInt(label, 10);
          } else {
            label = Math.floor(label) === label ? label : '';
          }

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
      useDarkerStrokeColor: false,
      tooltip: {
        trackMouse: true,
        renderer: function (tooltip, record, ctx) {
          var value = record.get(ctx.field);
          var text = value;
          if (widgetConfig.asPercentages) {
            var period = ctx.field.split('_').slice(-1)[0];
            period = period === 'latest' || period === 'previous' ? '_' + period : '';
            var classification = widgetConfig.isStacked ? ctx.field.split('_').slice(0)[0] + '_' : '';
            var frequency = classification + 'freq' + period;
            var total = classification + 'total' + period;
            text = Math.round(value * 100) + '%';
            if (record.get(frequency)) {
              text = text + ' (' + record.get(frequency) + ' av ' + (record.get(total) || '???') + ')';
            }
          } else {
            text = 'Antal: ' + value;
          }
          tooltip.setHtml(text);
        }
      }
    }
  });

  if (widgetConfig.id !== undefined) {
    var headerCmp = getHeaderText(widgetConfig.id)
    if (headerCmp !== null) {
      var container = Ext.create('Ext.Panel', {
        //html: '',//getHeaderText(id)
        layout: 'vbox',
        height: widgetConfig.height || 500,
        width: '50%'
      });
      container.items.add(headerCmp);
      container.items.add(chart);
      return container;
    }
  }

  return chart;

}


function getChartConfig(id, widgetConfig) {
  if (!widgetConfig.isDashboard) //TODO
    return widgetConfig;
  var cfg = '';
  switch (id) {
    case 0:
      cfg = {
        api: 'siberw-qbars-count-starts',
        xField: 'YQ',
        yField: 'Freq',
        id: 'BeStartKv',
        title: 'Antal behandlingsstarter',
        // colors: ['#C95D63'], //FF7F16 #EA7515
        colors: ['#43afaf', '#E47C7B'],
        flipXY: false,
        numericPosition: 'bottom'
      }
      break;
    case 1:
      cfg = {
        api: 'siberw-qbars-count-endings',
        xField: 'YQ',
        yField: 'Freq',
        id: 'BeSlutKv',
        title: 'Antal behandlingsavslut',
        // colors: ['#C95D63'],
        colors: ['#E47C7B'],
        flipXY: false,
        numericPosition: 'bottom'
      }
      break;
    case 2:
      cfg = {
        api: 'siberw-qbars-proportion-treated-in-time',
        xField: 'YQ',
        yField: ['proportion'],
        id: 'BeInom30Kv',
        title: ['Andel inom 30 dagar'],
        colors: ['#C95D63'],
        colors: ['#43afaf'],
        flipXY: false,
        asPercentages: true,
        height: 600
      }
      break;
    case 3:
      cfg = {
        api: 'siberw-stacked-qbars-effect',

        flipXY: false,
        xField: 'YQ',
        yField: ['good_proportion', 'bad_proportion', 'missing_proportion'],
        id: 'ForbattradKv',
        title: ['Förbättrad', 'Inte förbättrad', 'Uppgift saknas'],
        isStacked: true,
        asPercentages: true,
        // colors: ['#70C1B3', '#D14F60', '#FFE899'],
        // colors: ['#6BBCC6', '#D14F60', '#FFE899'],
        // colors: ['#6BACC6', '#D14F60', '#FFE899'],
        // colors: ['#6B99C7', '#D14F60', '#FFE899'],
        colors: ['#43afaf', '#E47C7B', '#E8DAB2']
      }

      break;
    case 4:
      cfg = {
        api: 'siberw-qbars-structured-diagnostics',
        xField: 'YQ',
        yField: 'freq',
        title: 'Strukturerad diagnostik',
        // colors: ['#C95D63'],
        colors: ['#E47C7B'],
        flipXY: false,
        numericPosition: 'bottom'
      }
      break;
    case 5:
      cfg = {
        api: 'siberw-stacked-qbars-completion',
        flipXY: false,
        xField: 'YQ',
        yField: ['good_proportion', 'bad_proportion', 'missing_proportion'],
        id: 'EjForbattradKv',
        title: ['Förbättrad', 'Inte förbättrad', 'Uppgift saknas'],
        isStacked: true,
        asPercentages: true,
        // colors: ['#70C1B3', '#D14F60', '#FFE899'],
        // colors: ['#6BBCC6', '#D14F60', '#FFE899'],
        // colors: ['#6BACC6', '#D14F60', '#FFE899'],
        // colors: ['#6B99C7', '#D14F60', '#FFE899'],
        colors: ['#43afaf', '#E47C7B', '#E8DAB2']
      }
      break;
  }
  cfg.isDashboard = true;
  return cfg;
}

Ext.application({
  name: 'Siber',
  units: [],
  launch: function () {

    var target = (typeof Stratum !== 'undefined' && Stratum.containers) ? Stratum.containers['SIBER/Chart'] : 'contentPanel';
    Ext.create('Siber.view.Start', {
      renderTo: target
    });

    controller = Ext.ComponentQuery.query('#start')[0].getController();
    controller.initialize();

  }
});



Ext.util.CSS.removeStyleSheet('siber');
Ext.util.CSS.createStyleSheet(
  ' '
  + '.numRatingsAxis {'
  + '  white-space: normal;'
  + '  width: 200px;'
  + '}'

  + '.siber-select .x-form-trigger-wrap {'
  + '  border-color: #999;'
  + '}'

  + '.siber-select .x-form-trigger-wrap-focus.x-form-trigger-wrap {'
  + '  border-color: #338FEB;'
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

function getChartItems() {
  if (widgetConfig.isDashboard) {
    return {
      xtype: 'container',
      //border: false,
      height: 2000,
      layout: {
        type: 'vbox'
      },
      items: [{
        xtype: 'container',
        height: 650,
        layout: { type: 'hbox' },
        items: [createChart(0), createChart(1)]
      },
      {
        xtype: 'container',
        height: 650,
        layout: { type: 'hbox' },
        items: [createChart(2), createChart(3)]
      },
      {
        xtype: 'container',
        height: 650,
        layout: { type: 'hbox' },
        items: [createChart(4), createChart(5)]
      }

      ]

    }
  }
  else {
    return {
      xtype: 'container',
      //border: false,
      height: 650,
      items: [{
        xtype: 'container',
        height: 650,
        layout: { type: 'hbox' },
        items: [createChart(0)]
      }

      ]

    }
  }

}

function getHeaderText(id) {
  if (id == undefined)
    return null;
  var headerText = null;
  var subheaderText = null;
  switch (id) {
    case 'BeStartKv':
      headerText = 'Behandlingsstart - uppdelat per kvartal';
      subheaderText = 'Antal påbörjade internetbehandlingar över tid';
      break;
    case 'BeSlutKv':
      headerText = 'Behandlingsavslut - uppdelat per kvartal';
      subheaderText = 'Antal avslutade internetbehandlingar över tid';
      break;
    case 'BeInom30Kv':
      headerText = 'Tillgänglighet - uppdelat per kvartal';
      subheaderText = 'Andel patienter som blev bedömda och startade psykologisk behandling inom 30 dagar efter vårdbegäran, över tid';
      break;
    case 'ForbattradKv':
      headerText = 'Behandlingsresultat - uppdelat på kvartal';
      subheaderText = 'Andel patienter som är förbättrade efter behandling per diagnosgrupp, över tid';
      break;
    case 'EjForbattradKv':
      headerText = 'abc1';
      subheaderText = 'def1';
      break;
    case '':
      headerText = 'abc2';
      subheaderText = 'def2';
      break;
  }

  if (headerText !== null) {
    var cmp = Ext.create('Ext.Component', {
      html: '<h2>' + headerText + '</h2><p>' + subheaderText + '</p>'
    });
    return cmp;
  }
  return null;
}
//# sourceURL=SIBER/Chart






