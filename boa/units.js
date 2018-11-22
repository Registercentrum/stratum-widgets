
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
      html: '<div>Här kan du få en lista över alla enheter som är anslutna till BOA.</div><br/><div id="exportBar" class="bsw-hidden"><a class="btn btn-default bsw-button" id="exportUnitList" href="" download="enheter.csv">EXCEL</a><span class="bsw-download-text pull-left">Ladda ner </span></div>'
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

Ext.util.CSS.removeStyleSheet('bsw-units');
Ext.util.CSS.createStyleSheet(
  ' '
+ '.template-container {'
+ '    margin: 10px auto;'
+ '}'

+ '.bsw-button {'
+ '  font-family: "Roboto-Slab";'
+ '  color: #245d71;'
+ '  border: 1px solid #245d71;'
+ '  margin: -6px 0 0 6px;'
+ '  line-height: 20px;'
+ '  font-size: 13px;'

+ '}', 'bsw-units'
);
