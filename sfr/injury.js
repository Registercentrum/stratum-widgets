
var injuryWidget = function (callback) {
  injuryWidget.result = {};
  injuryWidget.callback = callback;
  Ext.create('Rc.component.Selector', {
    widget: injuryWidget,
    levels: [
      {
        url: 'stratum/api/metadata/domainvalues/domain/5545?apikey=J6b-GSKrkfk=',
        click: function (record) {
          var values = {};
          var code = record.data.ValueCode;
          if (code.indexOf('M') === 0 && code.indexOf('M84.4') !== 0) {
            injuryWidget.result.Inj_Cause = code;
          } else {
            values.domainId = record.data.Domain.DomainID;
            values.domainValueId = record.data.DomainValueID;
          }
          return values;
        }
      },
      {
        click: function (record) {
          var values = {};
          var code = record.data.ValueCode;
          if (code.indexOf('M') === 0) {
            injuryWidget.result.Inj_Cause = code;
          } else {
            values.domainId = record.data.Domain.DomainID;
            values.domainValueId = record.data.DomainValueID;
          }
          return values;
        }
      },
      {
        click: function (record) {
          var values = {};
          var code = record.data.ValueCode;
          if (code.indexOf('V1') === 0 || code.indexOf('V2') === 0) {
            values.domainId = 5550;
          } else if (code.indexOf('V3') === 0 || code.indexOf('V4') === 0 || code.indexOf('V5') === 0 || code.indexOf('V6') === 0 || code.indexOf('V7') === 0) {
            values.domainId = 5551;
          } else if (code.indexOf('Y35') !== 0 && (code.indexOf('W') === 0 || code.indexOf('X') === 0 || code.indexOf('Y') === 0)) {
            values.domainId = 4097;
          } 
          injuryWidget.result.Inj_Cause = code;
          
          return values;
        }
      },
      {
        click: function (record) {
          var values = {};
          var code = record.data.ValueCode;
          if (injuryWidget.result.Inj_Cause.indexOf('V') === 0) {
            injuryWidget.result.Inj_Cause += '.' + code;
          } else {
            values.domainId = 4098;
            injuryWidget.result.Inj_Activity = code;
          }
          return values;
        }
      },
      {
        click: function (record) {
          var code = record.data.ValueCode;
          injuryWidget.result.Inj_Place = code;
          return {};
        }
      }
    ]
  }).show();
};


Ext.define('Rc.component.Selector', {
  extend: 'Ext.panel.Panel',
  alias: 'component.selector',
  itemId: 'sfr-panel',
  modal: true,
  floating: true,
  frame: true,
  layout: 'vbox',
  closable: true,
  cls: 'sfr-modal',
  title: 'Välj skadekod:',
  widget: false,
  createLevel: function (click, i, template, restore) {
    return {
      xtype: 'dataview',
      itemId: 'view' + i,
      widget: null,
      store: Ext.data.StoreManager.lookup('store' + i),
      itemTpl: template,
      itemSelector: 'div.sfr-menu-item',
      cls: 'sfr-selector',
      click: click,
      restore: restore,
      listeners: {
        itemclick: function (el, record) {
          if (this.hasCls('hiddenview')) {
            this.removeCls('hiddenview');
            i === 0 && Ext.ComponentQuery.query('#sfr-panel').pop().removeCls('sfr-fix');
            i !== 0 && this.up().down('#view' + (i - 1)).removeCls('all');
            var view = this;
            this.restore && this.restore();
            setTimeout(function () { view.getSelectionModel().deselectAll(); Ext.StoreManager.lookup('store' + (i + 1)).setData({}, 0); });
          } else {
            this.el.addCls('hiddenview');
            i === 0 && Ext.ComponentQuery.query('#sfr-panel').pop().addCls('sfr-fix');
            i !== 0 && this.up().down('#view' + (i - 1)).addCls('all');
            var store = 'store' + (i + 1);
            var next = this.click(record);
            if (next.data) {
              setTimeout(function () { (Ext.StoreManager.lookup(store).setData(next.data)); }, 0);
            } else if (next.domainId) {
              Ext.Ajax.request({
                url: 'stratum/api/metadata/domainvalues/domain/' + next.domainId + '?apikey=J6b-GSKrkfk=',
                success: function (response) {
                  var items = Ext.decode(response.responseText).data;
                  items = next.domainValueId ? items.filter(function (element) { return element.DomainValueID === next.domainValueId; })[0].Children : items;
                  Ext.StoreManager.lookup(store).setData(items);
                }
              });
            } else {
              this.up().widget.callback(this.up().widget.result);
              this.up().hide();
            }
          }
        }
      }
    };
  },
  constructor: function (config) {
    var tpl = new Ext.XTemplate(
      '<tpl for=".">',
      '<tpl if="Children.length">',
      '<div style="margin: 0; padding: 0 15px; overflow: hidden; min-width: 200px;" class="sfr-menu-item">',
      '<div><span class="sfr-angle-left">&#xf104</span>{ValueName}<span class="sfr-angle-right">&#xf105</span></div>',
      '<tpl else>',
      '<div style="margin: 0; padding: 0 15px; overflow: hidden; min-width: 200px;" class="sfr-menu-item">',
      '<div><span class="sfr-angle-left">&#xf104</span>{ValueName}</div>',
      '</tpl>',
      '</div>',
      '</tpl>'
    );
    var items = [];
    for (var i = 0; i < config.levels.length; i++) {
      Ext.create('Ext.data.Store', {
        id: 'store' + i,
        autoLoad: typeof config.levels[i].url !== 'undefined',
        fields: [],
        data: config.levels[i].data || [],
        proxy: {
          type: 'ajax',
          method: 'get',
          cors: true,
          url: config.levels[i].url,
          reader: {
            type: 'json',
            rootProperty: 'data'
          }
        }
      });
      var click = config.levels[i].click;
      var restore = config.levels[i].restore;
      items.push(this.createLevel(click, i, tpl, restore));
    }
    config.items = items;

    this.callParent([config]);
  },
});

Ext.util.CSS.removeStyleSheet('sfr-selector');
Ext.util.CSS.createStyleSheet(''
  + '.sfr-selector.hiddenview .x-dataview-item > div {'
  + '  display: none;'
  + '}'
  + '.sfr-modal.sfr-fix .x-panel-body .x-box-inner {'
  + '  background-image: linear-gradient(to bottom, #7c7c7c 30px, white 10px);'
  + '}'
  + '.sfr-selector {'
  + '  background-color: white;'
  + '}'
  + '.sfr-menu-item:hover {'
  + '  background-color: #e8e8e8;'
  + '}'
  + '.sfr-hidden {'
  + '  display: none;'
  + '}'
  + '.sfr-modal > div {'
  + '  border: solid 0px white;'
  + '}'
  + '.sfr-selector.hiddenview .x-item-selected {'
  + '  display: inline !important;'
  + '  color: white;'
  + '  padding: 0 !important;'
  + '}'
  + '.sfr-selector.hiddenview .x-item-selected div {'
  + '  background-color: #7c7c7c;'
  + '  padding: 5px 5px 5px 0px !important;'
  + '}'
  + '.sfr-selector {'
  + '  cursor: pointer;'
  + '  padding-top: 0px !important;'
  + '  user-select: none;'
  + '}'
  + '.sfr-selector.hiddenview {'
  + '  padding-top: 0px;'
  + '  border-top: none;'
  + '  top: 0px !important;'
  + '}'
  + '.sfr-angle-left {'
  + '  font-family: FontAwesome;'
  + '  display: none;'
  + ' }'
  + '.sfr-angle-right {'
  + '  font-family: FontAwesome;'
  + '  display: inline;'
  + '  padding-left: 5px;'
  + '  color: #aaa;'
  + ' }'
  + '.x-item-selected .sfr-angle-left {'
  + '  display: inline;'
  + '  padding: 0 5px;'
  + '}'
  + '.x-item-selected .sfr-angle-right {'
  + '  display: none;'
  + '}'
  + '.x-view-item-focused {'
  + '  outline: 0 !important;'
  + '}'
  + '.sfr-selector.hiddenview.all {'
  + '  display: none;'
  + '}'
  + '.sfr-menu-item {'
  + '  border-bottom: 1px solid #eee;'
  + '  padding: 5px 15px 5px 15px !important;'
  + '}', 
'sfr-selector');
