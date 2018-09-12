
Ext.util.CSS.removeStyleSheet('sfr-injury');
Ext.util.CSS.createStyleSheet(''
  + '.sfr-selector.hiddenview > div {'
  + '  display: none;'
  + '}'
  + '.sfr-modal.sfr-fix .x-panel-body .x-box-inner {'
  + '  background-image: linear-gradient(to bottom, #7c7c7c 20px, white 10px);'
  + '}'
  + '.sfr-selector {'
  + '  background-color: white;'
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
  + '.x-item-selected .sfr-angle-left {'
  + '  display: inline;'
  + '  padding: 0 5px;'
  + '}'
  + '.x-view-item-focused {'
  + '  outline: 0 !important;'
  + '}'
  + '.sfr-selector.hiddenview.all {'
  + '  display: none;'
  + '}'
  , 'sfr-injury'
);

var injuryWidget = function (e, callback) {
injuryWidget.event = e;
injuryWidget.result = {};

Ext.create('Ext.data.Store', {
  id: 'firstStore',
  autoLoad: true,
  fields: [],
  proxy: {
    type: 'ajax',
    method: 'get',
    cors: true,
    url: 'stratum/api/metadata/domainvalues/domain/5545?apikey=J6b-GSKrkfk=',
    reader: {
      type: 'json',
      rootProperty: 'data'
    }
  }
});

Ext.create('Ext.data.Store', {
  id: 'secondStore',
  fields: []
});

Ext.create('Ext.data.Store', {
  id: 'thirdStore',
  fields: []
});

Ext.create('Ext.data.Store', {
  id: 'fourthStore',
  fields: []
});

Ext.create('Ext.data.Store', {
  id: 'fifthStore',
  fields: []
});

var imageTpl = new Ext.XTemplate(
  '<tpl for=".">',
  '<div style="margin: 0; padding: 0 15px; overflow: hidden;" class="thumb-wrap">',
  '<div><span class="sfr-angle-left">&#xf104</span>{ValueName}</div>',
  '</div>',
  '</tpl>'
);

Ext.create('Ext.panel.Panel', {
  // minwidth: 500,
  // minHeight: 500,
  itemId: 'sfr-panel',
  modal: true,
  floating: true,
  frame: true,
  layout: 'vbox',
  closable: true,
  cls: 'sfr-modal',
  title: 'Välj skadekod:',
  items: [
    {
      xtype: 'dataview',
      itemId: 'viewOne',
      store: Ext.data.StoreManager.lookup('firstStore'),
      tpl: imageTpl,
      itemSelector: 'div.thumb-wrap',
      cls: 'sfr-selector',
      listeners: {
        itemclick: function (el, record) {
          if (this.hasCls('hiddenview')) {
            this.removeCls('hiddenview');
            Ext.ComponentQuery.query('#sfr-panel').pop().removeCls('sfr-fix');
            var view = this;
            setTimeout(function() {view.getSelectionModel().deselectAll(); Ext.StoreManager.lookup('secondStore').setData({}, 0)});
          } else {
            this.el.addCls('hiddenview');
            Ext.ComponentQuery.query('#sfr-panel').pop().addCls('sfr-fix');
            var code = record.data.ValueCode;
            if (code.indexOf('M') === 0 && code.indexOf('M84.4') !== 0) {
              injuryWidget.result.Inj_Cause = code;
              callback(injuryWidget.event, injuryWidget.result);
              this.up().hide();
              return;
            }
            Ext.Ajax.request({
              url: 'stratum/api/metadata/domainvalues/domain/' + record.data.Domain.DomainID + '?apikey=J6b-GSKrkfk=',
              success: function (response) {
                var items = Ext.decode(response.responseText).data;
                var children = items.find(function (element) { return element.DomainValueID === record.data.DomainValueID; }).Children;
                Ext.StoreManager.lookup('secondStore').setData(children);
              }
            });
          }
        }
      }
    },
    {
      xtype: 'dataview',
      itemId: 'viewTwo',
      store: Ext.data.StoreManager.lookup('secondStore'),
      tpl: imageTpl,
      itemSelector: 'div.thumb-wrap',
      cls: 'sfr-selector',
      listeners: {
        itemclick: function (el, record) {
          if (this.hasCls('hiddenview')) {
            this.removeCls('hiddenview');
            this.up().down('#viewOne').removeCls('all');
            var view = this;
            setTimeout(function() {view.getSelectionModel().deselectAll(); Ext.StoreManager.lookup('thirdStore').setData({}, 0)});
          } else {
            this.up().down('#viewOne').addCls('all');
            this.addCls('hiddenview');
            var code = record.data.ValueCode;
            if (code.indexOf('M') === 0) {
              injuryWidget.result.Inj_Cause = code;
              callback(injuryWidget.event, injuryWidget.result);
              this.up().hide();
              return;
            }
            Ext.Ajax.request({
              url: 'stratum/api/metadata/domainvalues/domain/' + record.data.Domain.DomainID + '?apikey=J6b-GSKrkfk=',
              success: function (response) {
                var items = Ext.decode(response.responseText).data;
                var children = items.find(function (element) { return element.DomainValueID === record.data.DomainValueID; }).Children;
                Ext.StoreManager.lookup('thirdStore').setData(children);
              }
            });
          }
        }
      }
    },
    {
      xtype: 'dataview',
      itemId: 'viewThree',
      store: Ext.data.StoreManager.lookup('thirdStore'),
      tpl: imageTpl,
      itemSelector: 'div.thumb-wrap',
      cls: 'sfr-selector',
      listeners: {
        itemclick: function (el, record) {
          if (this.hasCls('hiddenview')) {
            this.removeCls('hiddenview');
            this.up().down('#viewTwo').removeCls('all');
            var view = this;
            setTimeout(function() {view.getSelectionModel().deselectAll(); Ext.StoreManager.lookup('fourthStore').setData({}, 0)});
          } else {
            this.addCls('hiddenview');
            this.up().down('#viewTwo').addCls('all');
            var code = record.data.ValueCode;
            var domainId = 0;
            if (code.indexOf('V1') === 0 || code.indexOf('V2') === 0) {
              domainId = 5550;
            }
            if (code.indexOf('V3') === 0 || code.indexOf('V4') === 0 || code.indexOf('V5') === 0 || code.indexOf('V6') === 0 || code.indexOf('V7') === 0) {
              domainId = 5551;
            }
            if (code.indexOf('Y35') !== 0 && (code.indexOf('W') === 0 || code.indexOf('X') === 0 || code.indexOf('Y') === 0)) {
              domainId = 4097;
            }
            if (!domainId) {
              injuryWidget.result.Inj_Cause = code;
              callback(injuryWidget.event, injuryWidget.result);
              this.up().hide();
              return;
            }
            injuryWidget.result.Inj_Cause = code;
            Ext.Ajax.request({
              url: 'stratum/api/metadata/domainvalues/domain/' + domainId + '?apikey=J6b-GSKrkfk=',
              success: function (response) {
                var items = Ext.decode(response.responseText).data;
                Ext.StoreManager.lookup('fourthStore').setData(items);
              }
            });
          }
        }
      }
    },
    {
      xtype: 'dataview',
      itemId: 'viewFour',
      store: Ext.data.StoreManager.lookup('fourthStore'),
      tpl: imageTpl,
      itemSelector: 'div.thumb-wrap',
      cls: 'sfr-selector',
      listeners: {
        itemclick: function (element, record) {
          if (this.hasCls('hiddenview')) {
            this.removeCls('hiddenview');
            this.up().down('#viewThree').removeCls('all');
            var view = this;
            setTimeout(function() {view.getSelectionModel().deselectAll(); Ext.StoreManager.lookup('fifthStore').setData({}, 0)});
            injuryWidget.result.Inj_Activity = '';
          } else {
            this.addCls('hiddenview');
            this.up().down('#viewThree').addCls('all');
            var code = record.data.ValueCode;
            var domainId = 0;
            if (injuryWidget.result.Inj_Cause.indexOf('V') !== 0) {
              domainId = 4098;
              injuryWidget.result.Inj_Activity = code;
            }
            if (!domainId) {
              if (injuryWidget.result.Inj_Cause.indexOf('V') === 0) {
                injuryWidget.result.Inj_Cause += '.' + code;
              } else {
                injuryWidget.result.Inj_Activity = code;
              }
              callback(injuryWidget.event, injuryWidget.result);
              this.up().hide();
              return;
            }
            Ext.Ajax.request({
              url: 'stratum/api/metadata/domainvalues/domain/' + domainId + '?apikey=J6b-GSKrkfk=',
              success: function (response) {
                var items = Ext.decode(response.responseText).data;
                Ext.StoreManager.lookup('fifthStore').setData(items);
              }
            });
          }
        }
      }
    },
    {
      xtype: 'dataview',
      itemId: 'viewFive',
      store: Ext.data.StoreManager.lookup('fifthStore'),
      tpl: imageTpl,
      itemSelector: 'div.thumb-wrap',
      cls: 'sfr-selector',
      listeners: {
        itemclick: function (element, record) {
          this.addCls('hiddenview');
          var code = record.data.ValueCode;
          injuryWidget.result.Inj_Place = code;
          callback(injuryWidget.event, injuryWidget.result);
          this.up().hide();
          return;
        }
      }
    }
  ],
}).show();
};
