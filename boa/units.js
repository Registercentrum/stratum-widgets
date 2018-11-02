
Ext.define('Boa.store.Units', {
  extend: 'Ext.data.Store',
  alias: 'store.units',
  storeId: 'units',
  fields: []
});

Ext.define('Boa.controller.Units', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.units',
  data: {},
  updateGrid: function () {
    var table = this.getView().down('#table');
    var spinner = this.getView().down('#spinner');
    table.hide();
    spinner.show();
    var me = this;
    Ext.Ajax.request({
      type: 'ajax',
      method: 'get',
      cors: true,
      url: '/stratum/api/metadata/units/register/104?apikey=bK3H9bwaG4o=',
      success: function (response) {
        var result = Ext.decode(response.responseText).data;
        me.data.units = result;
      }
    });
    Ext.Ajax.request({
      type: 'ajax',
      method: 'get',
      cors: true,
      url: '/stratum/api/metadata/units/register/104?apikey=bK3H9bwaG4o=',
      success: function (response) {
        var result = Ext.decode(response.responseText).data;
        me.data.units = result;
      }
    });
    Ext.Ajax.request({
      type: 'ajax',
      method: 'get',
      cors: true,
      url: '/stratum/api/metadata/domains/map/3003?apikey=bK3H9bwaG4o=',
      success: function (response) {
        var result = Ext.decode(response.responseText).data;
        me.data.counties = result;
      }
    });
    Ext.Ajax.request({
      type: 'ajax',
      method: 'get',
      cors: true,
      url: '/stratum/api/metadata/units/bindings/104?apikey=bK3H9bwaG4o=',
      success: function (response) {
        var result = Ext.decode(response.responseText).data;
        me.data.associations = result;
      }
    });
    me.composeTable();
  },
  composeTable: function () {
    var me = this;
    if (me.data.units && me.data.counties && me.data.associations) {
      var table = this.getView().down('#table');
      var spinner = this.getView().down('#spinner');
      table.show();
      spinner.hide();
      var list = [];
      me.data.units.forEach(function (i) {
        var countyName = me.data.associations[i.UnitName].County;
        var countyId = Object.keys(me.data.counties.County)[Ext.Object.getValues(me.data.counties.County).indexOf(countyName)];
        if (countyId) {
          list.push({ id: i.UnitCode, name: i.UnitName, county: countyName, cid: countyId });
        }
      });
      setTimeout(function () { me.updateExcelLink(list); }, 100);
    } else {
      setTimeout(function () { me.composeTable(); }, 500);
    }
  },
  updateExcelLink: function (data) {
    var tag = document.getElementById('exportUnitList');
    if (!tag) return;

    var content = 'Kod; Enhet; Landstingskod; Landsting;\n';
    data.forEach(function (i) {
      content += i.id + ';' + i.name + ';' + i.cid + ';' + i.county + ';';
      content += '\n';
    });

    content = '\ufeff' + content;
    var blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var callback = function () {
      window.event.preventDefault();
      window.navigator.msSaveBlob(blob, 'boa-statistik.csv');
    };

    if (window.navigator.msSaveBlob) {
      tag.addEventListener('click', callback);
    } else {
      tag.setAttribute('href', url);
    }
    document.getElementById('exportBar').setAttribute('class', 'bsw-visible');
  }
});

Ext.define('Boa.view.Units', {
  extend: 'Ext.container.Container',
  alias: 'view.units',
  controller: 'units',
  viewModel: 'units',
  items: [
    {
      xtype: 'boaunittable',
      itemId: 'table',
      style: {
        padding: 0
      },
      cls: 'col-md-12',
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

Ext.define('Boa.viewmodel.Units', {
  extend: 'Ext.app.ViewModel',
  alias: 'viewmodel.units',
  stores: {
    report: {
      type: 'units'
    }
  }
});


Ext.define('Boa.view.UnitsTable', {
  extend: 'Ext.container.Container',
  alias: 'view.boaunittable',
  xtype: 'boaunittable',
  constructor: function (config) {
    config.bind = {
      html: '<div>Här kan du få en lista över alla enheter som är anslutna till BOA.</div><br/><div id="exportBar" class="bsw-hidden"><a class="btn btn-default bsw-roboto" id="exportUnitList" href="" download="enheter.csv">EXCEL</a><span class="bsw-download-text pull-left">Ladda ner </span></div>'
    };
    this.callParent(arguments);
  }
});

Ext.application({
  name: 'Boa',
  views: ['Units', 'UnitsTable'],
  viewcontrollers: ['Units'],
  viewmodels: ['Units'],
  stores: ['Units'],
  launch: function () {
    var target = (typeof Stratum !== 'undefined' && Stratum.containers) ? Stratum.containers['BOA/Units'] : 'contentPanel';
    Ext.create('Boa.view.Units', {
      id: 'unitsView',
      renderTo: target
    });
    Ext.getCmp('unitsView').getController().updateGrid();
  }
});

Ext.util.CSS.removeStyleSheet('template');
Ext.util.CSS.createStyleSheet(
  ' '
  + '.template-container {'
  + '    margin: 10px auto;'
  + '}'

  + '.boa-question {'
  + '    font-weight: 800;'
  + '}'

  + '.base-page {'
  + '    padding: 0;'
  + '}'

  + '.x-form-trigger-wrap-default{'
  + '  border: none;'
  + '}'

  + '.bsw-spinner {'
  + ' width: 100%;'
  + '}'

  + '  .bsw-select .x-form-item-body {'
  + '      max-width: 460px;'
  + '      height: 42px;'
  + '      border-radius: 3px;'
  + '      background-color: #ffffff;'
  + '      border: solid 1px rgba(36, 93, 113, 0.5);'
  + '  }'

  + '  .bsw-select input {'
  + '      color: #245d71;'
  + '      padding: 10px 14px;'
  + '  }'

  + '  .bsw-select div {'
  + '      border-radius: 3px;'
  + '  }'

  + '  .bsw-select label {'
  + '      white-space: nowrap;'
  + '      vertical-align: middle;'
  + '      width: 145px !important;'
  + '  }'

  + '  .bsw-report-table.table > thead > tr > th {'
  + '      vertical-align: middle;'
  + '  }'

  + '  .bsw-report-table > tbody > tr > td:last-child {'
  + '      border-right: none !important;'
  + '  }'

  + '  .bsw-report-table > thead > tr > th:last-child {'
  + '      border-right: none;'
  + '  }'

  + '  .bsw-report-table > tbody > tr > td {'
  + '      border: none;'
  + '  }'

  + '  .bsw-report-table tr:nth-child(even) {'
  + '    background-color: rgba(24, 49, 53, 0.1);'
  + '  }'

  + '  .bsw-report-table thead > tr:nth-child(2) {'
  + '    background-color: rgba(127, 192, 213, 0.4);'
  + '  }'

  + '  .bsw-report-table tbody > tr:nth-child(1), .bsw-report-table tr:nth-child(4), .bsw-report-table tr:nth-child(7), .bsw-report-table tr:nth-child(14), .bsw-report-table tr:nth-child(21), .bsw-report-table tr:nth-child(28)  {'
  + '    background-color: rgba(251, 182, 0, 0.1);'
  + '  }'

  + '  .bsw-report-table tbody > tr:nth-child(1) td, .bsw-report-table tr:nth-child(4) td, .bsw-report-table tr:nth-child(7) td, .bsw-report-table tr:nth-child(14) td, .bsw-report-table tr:nth-child(21) td, .bsw-report-table tr:nth-child(28) td {'
  + '    padding-left: 15px !important;'
  + '    font-weight: bold !important;'
  + '    color: #183136 !important;'
  + '    text-transform: uppercase;'
  + '    font-size: 11px;'
  + '  }'

  + '  .bsw-report-table > tbody > tr > td:nth-child(odd), .bsw-report-table > thead > tr > th {'
  + '      border-right: solid 1px rgba(36, 93, 113, 0.5);'
  + '      border-bottom: none;'
  + '      border-top: none;'
  + '  }'

  + '  .bsw-report-table > thead > tr > th {'
  + '      border-bottom: none;'
  + '  }'


  + '  .bsw-report-table > thead > tr:nth-child(1) th {'
  + '      height:35px;'
  + '}'

  + '  .bsw-report-table > thead > tr:nth-child(2) th {'
  + '      height: 50px;'
  + '      border-bottom: 1px solid white;'
  + '  }'

  + '  .bsw-report-table > tbody > tr > td:nth-child(even), .bsw-report-table > thead > tr:nth-child(2) > th:nth-child(even) {'
  + '      border-right: dashed 1px rgba(36, 93, 113, 0.5);'
  + '      border-bottom: none;'
  + '      border-top: none;'
  + '  }'

  + '  .bsw-report-table th, td {'
  + '      text-align: center;'
  + '      height: 36px;'
  + '      line-height: 1.6 !important;'
  + '  }'

  + '  .bsw-report-table th:nth-child(1), td:nth-child(1) {'
  + '      text-align: left;'
  + '      padding-left: 25px !important;'
  + '  }'

  + '  .bsw-report-table > thead > tr > th:nth-child(1) {'
  + '      padding-left: 15px !important;'
  + '  }'

  + '  .bsw-report-table > thead > tr > th {'
  + '      font-weight: normal;'
  + '      color: #183136;'
  + '      padding: 8px;'
  + '  }'

  + '  .bsw-report-table > thead > tr:nth-child(2) {'
  + '      font-size:12px;'
  + '  }'

  + '  .bsw-report-table > tbody > tr > td {'
  + '      font-size: 12px;'
  + '      font-weight: 400;'
  + '      font-style: normal;'
  + '      font-stretch: normal;'
  + '      line-height: normal;'
  + '      letter-spacing: normal;'
  + '      color: #4a4a4a;'
  + '  }'

  + '  .bsw-report-table {'
  + '      border: 1px rgba(36, 93, 113, 0.5);'
  + '      border-style: solid none solid none;'
  + '      width: 100%;'
  + '  }'

  + '  .bsw-summary {'
  + '      border-top: dashed 2px #3e9bbc;'
  + '      color: #245d71;'
  + '      padding-top: 20px;'
  + '      margin-top: 24px;'
  + '  }'

  + '  .bsw-summary label{'
  + '      font-weight: normal !important;'
  + '}'

  + '  .bsw-summary div:nth-child(2) {'
  + '      font-family: "Roboto Slab";'
  + '      font-size: 24px;'
  + '      font-weight: 300;'
  + '      font-style: normal;'
  + '      font-stretch: normal;'
  + '      color: #3e9bbc;'
  + '  }'

  + '  .bsw-summary div:nth-child(3) {'
  + '      color: #183136;'
  + '      min-height: 30px;'
  + '  }'

  + '  .bsw-download-text {'
  + '      line-height: 48px;'
  + '      float: right;'
  + '      margin-right: 15px;'
  + '  }'

  + '  .bsw-roboto {'
  + '      font-family: "Roboto Slab";'
  + '      font-size: 18px;'
  + '      font-weight: 300;'
  + '      font-style: normal;'
  + '      font-stretch: normal;'
  + '      line-height: 1.67;'
  + '      letter-spacing: normal;'
  + '      color: #245d71;'
  + '  }', 'template'
);
