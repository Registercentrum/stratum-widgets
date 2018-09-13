
Ext.define('Boa.store.Report', {
  extend: 'Ext.data.Store',
  alias: 'store.report',
  storeId: 'report',
  fields: []
});

Ext.define('Boa.controller.Report', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.report',
  updateGrid: function () {
    var controller = this;
    var table = this.getView().down('#table');
    var spinner = this.getView().down('#spinner');
    table.hide();
    spinner.show();
    var unit = 0;
    var county = 0;
    var unitType = controller.getView().down('#unitFilter').getValue() === 0 ? 'unit' : 'county';
    if (typeof Profile !== 'undefined' && Profile.Context !== null) {
      unit   = Profile.Context.Unit.UnitCode.toString();
      county = Profile.Context.Unit.Bindings[0].ValueCode;
      unit = unitType === 'unit' ? unit : county;
    }
    // remove padded 0 in front of number in case it exists
    unit = unit.charAt(0) === '0' && unit.length !== 1 ? unit.substring(1) : unit;

    var year = controller.getView().down('#yearFilter').getValue();
    Ext.Ajax.request({
      type: 'ajax',
      method: 'get',
      cors: true,
      url: '/stratum/api/statistics/BOA/boaw-rapport?grouptype=' + unitType + '&unitcode=' + unit + '&year=' + year + '&fear=1&wantsurg=1&liked=1&using=1&explanation=1&intervention=1',
      success: function (response) {
        var result = Ext.decode(response.responseText).data;
        if(!controller.getViewModel())return;
        controller.getViewModel().set('report', result);
        spinner.hide();
        table.show();
      }
    });
  }
});

Ext.define('Boa.view.Filter', {
  extend: 'Ext.form.field.ComboBox',
  xtype: 'boafilter',
  alias: 'view.boafilter',
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

Ext.define('Boa.view.Report', {
  extend: 'Ext.container.Container',
  alias: 'view.report',
  controller: 'report',
  viewModel: 'report',
  items: [
    {
      itemId: 'yearFilter',
      xtype: 'boafilter',
      displayField: 'YearName',
      valueField: 'YearCode',
      label: 'År för första besök',
      labelWidth: 140,
      labelStyle: 'vertical-align: middle;',
      cls: 'bsw-select col-md-6',
      value: 0,
      sortfield: 'YearName',
      sortdirection: 'DESC',
      listeners: {
        select: 'updateGrid'
      },
      store: {
        fields: ['YearCode', 'YearName'],
        data: [
          { YearCode: 0, YearName: 'Alla år' },
          { YearCode: 2018, YearName: '2018' },
          { YearCode: 2017, YearName: '2017' },
          { YearCode: 2016, YearName: '2016' },
          { YearCode: 2015, YearName: '2015' },
          { YearCode: 2014, YearName: '2014' },
          { YearCode: 2013, YearName: '2013' },
          { YearCode: 2012, YearName: '2012' },
          { YearCode: 2011, YearName: '2011' }
        ]
      }
    },
    {
      itemId: 'unitFilter',
      xtype: 'boafilter',
      displayField: 'UnitName',
      valueField: 'UnitCode',
      label: 'Enhet:',
      labelWidth: '60px !important;',
      labelStyle: 'vertical-align: middle;',
      cls: 'bsw-select col-md-6',
      value: 0,
      sortfield: 'UnitName',
      sortdirection: 'DESC',
      listeners: {
        select: 'updateGrid'
      },
      store: {
        fields: ['UnitCode', 'UniName'],
        data: [
          { UnitCode: 0, UnitName: 'Kliniken' },
          { UnitCode: 1, UnitName: 'Landstinget' }
        ]
      }
    },
    {
      xtype: 'container',
      cls: 'col-md-12 bsw-summary',
      items: [
        {
          xtype: 'label',
          bind: {
            html: '<div>Första besök</div><div>{report.FormInfo.0.Number}</div><div>Inmatade forumlär</div>'
          },
          cls: 'col-md-4'
        },
        {
          xtype: 'label',
          bind: {
            html: '<div>3 månader</div><div>{report.FormInfo.2.Number}</div><div>Inmatade formulär</div>'
          },
          cls: 'col-md-4'
        },
        {
          xtype: 'label',
          bind: {
            html: '<div>1 år</div><div>{report.FormInfo.4.Number}</div><div>Inmatade formulär</div>'
          },
          cls: 'col-md-4'
        }
      ]
    },
    {
      xtype: 'boareporttable',
      itemId: 'table',
      style: {
        padding: 0
      },
      cls: 'col-md-12',
      bind: {
        html: 'foo'
      }
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

Ext.define('Boa.viewmodel.Report', {
  extend: 'Ext.app.ViewModel',
  alias: 'viewmodel.report',
  stores: {
    report: {
      type: 'report'
    }
  }
});


Ext.define('Boa.view.ReportTable', {
  extend: 'Ext.container.Container',
  alias: 'view.boareporttable',
  xtype: 'boareporttable',
  constructor: function (config) {
    config.bind = {
      html: this.createHtml()
    };
    this.callParent(arguments);
  },
  createHtml: function () {
    var html = ''
        + '<table class="bsw-report-table">';
    html += '<thead><tr><th></th><th colspan="2">Första besök</th><th colspan="2">3 månader</th><th colspan="2">12 månader</th>';
    html += '<tr><th></th><th>Antal</th><th>Andel</th><th>Antal</th><th>Andel</th><th>Antal</th><th>Andel</th></tr></thead>';
    var questions = [2, 2];
    html += '<tbody>';
    for (var i = 0; i < 2; i++) {
      html += '<tr><td>{report.Tables.' + i + '.question}</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
      for (var j = 0; j < questions[i]; j++) {
        html += '<tr><td>{report.Tables.' + i + '.options.' + j + '.option}</td><td>{report.Tables.' + i + '.options.' + j + '.FVPat_.Number}</td><td>{report.Tables.' + i + '.options.' + j + '.FVPat_.Percent}%</td><td>{report.Tables.' + i + '.options.' + j + '.M3Pat_.Number}</td><td>{report.Tables.' + i + '.options.' + j + '.M3Pat_.Percent}%</td><td>{report.Tables.' + i + '.options.' + j + '.Y1Pat_.Number}</td><td>{report.Tables.' + i + '.options.' + j + '.Y1Pat_.Percent}%</td></tr>';
      }
    }

    questions = [6, 6];
    for (i = 2; i < 4; i++) {
      html += '<tr><td>{report.Tables.' + i + '.question}</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
      for (j = 0; j < questions[i - 2]; j++) {
        html += '<tr><td>{report.Tables.' + i + '.options.' + j + '.option}</td><td>-</td><td>-</td><td>{report.Tables.' + i + '.options.' + j + '.M3Pat_.Number}</td><td>{report.Tables.' + i + '.options.' + j + '.M3Pat_.Percent}%</td><td>{report.Tables.' + i + '.options.' + j + '.Y1Pat_.Number}</td><td>{report.Tables.' + i + '.options.' + j + '.Y1Pat_.Percent}%</td></tr>';
      }
    }

    html += '<tr><td>{report.Tables.' + i + '.question}</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
    for (j = 0; j < 6; j++) {
      html += '<tr><td>{report.Tables.' + i + '.options.' + j + '.option}</td><td>{report.Tables.' + i + '.options.' + j + '.FVPT_.Number}</td><td>{report.Tables.' + i + '.options.' + j + '.FVPT_.Percent}%</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>';
    }
    i++;
    html += '<tr><td>{report.Tables.' + i + '.question}</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
    var fix;
    for (j = 0; j < 6; j++) {
      //fix = j === 1 ? 2 : j === 2 ? 1 : j;
      html += '<tr><td>{report.Tables.' + i + '.options.' + j + '.option}</td><td>-</td><td>-</td><td>{report.Tables.' + i + '.options.' + j + '.M3PT_.Number}</td><td>{report.Tables.' + i + '.options.' + j + '.M3PT_.Percent}%</td><td>-</td><td>-</td></tr>';
    }

    html += '</tbody></table>';
    return html;
  }
});

Ext.application({
  name: 'Boa',
  views: ['Report', 'ReportTable'],
  viewcontrollers: ['Report'],
  viewmodels: ['Report'],
  stores: ['Report'],
  launch: function () {
    var target = (typeof Stratum !== 'undefined' && Stratum.containers) ? Stratum.containers['BOA/Reports'] : 'output';
    Ext.create('Boa.view.Report', {
      id: 'reportView',
      renderTo: target
    });
    Ext.getCmp('reportView').getController().updateGrid();
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

  , 'template'
);
