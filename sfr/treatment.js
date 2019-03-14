
var treatmentWidget = function (current, callback, loadonly) {
  treatmentWidget.result = {};
  treatmentWidget.callback = callback;
  treatmentWidget.valueGroups = treatmentWidget.valueGroups || [];
  treatmentWidget.backups = treatmentWidget.backups || [];
  treatmentWidget.icd10 = current.Parent.Fx_ICD10;
  treatmentWidget.trttype = current.Trt_Type;
  var isBackFracture = current.Parent.Fx_LowerVertebra !== null;
  var isChildTypeFracture = current.Parent.Fx_OpenPhyses === 1;
  var inChildAge = (isBackFracture && Profile.Person.Age < 16) || Profile.Person.Age < 10;
  treatmentWidget.isChild = isChildTypeFracture || inChildAge;

  !treatmentWidget.valueGroups[4056] && fetchValueGroup(4056);
  !treatmentWidget.valueGroups[4061] && fetchValueGroup(4061);
  !treatmentWidget.valueGroups[6030] && fetchValueGroup(6030);
  !treatmentWidget.valueGroups[6031] && fetchValueGroup(6031);
  !treatmentWidget.valueGroups[5665] && fetchValueGroup(5665);
  !treatmentWidget.valueGroups[4156] && fetchValueGroup(4156);

  if (loadonly) return;

  initValues();

  Ext.create('Rc.component.Selector', {
    widget: treatmentWidget,
    addValueCodes: true,
    alignTarget: '',
    levels: [
      {
        data: treatmentWidget.valueGroups[4056],
        restore: function () {
          treatmentWidget.valueGroups[6031] = Ext.decode(treatmentWidget.backups[6031]).data;
          treatmentWidget.valueGroups[6030] = Ext.decode(treatmentWidget.backups[6030]).data;
          attachChildren(6031);
        },
        click: function (record) {
          treatmentWidget.trttype = record.data.ValueCode;
          treatmentWidget.result.Trt_Type = treatmentWidget.trttype;
          filterAllValues();
          return { data: treatmentWidget.valueGroups[6031] };
        }
      },
      {
        click: function (record) {
          var values = {};
          var code = record.data.ValueCode;
          if (code.indexOf('M') === 0) {
            treatmentWidget.result.Inj_Cause = code;
          } else {
            values.domainId = record.data.Domain.DomainID;
            values.domainValueId = record.data.DomainValueID;
          }
          values.data = record.data.ValueName === record.data.Children[0].ValueName ? record.data.Children[0].Children : record.data.Children;
          return values;
        }
      },
      {
        click: function (record) {
          var values = {};
          var code = record.data.ValueCode;
          var children = record.data.Children;
          if (children) {
            values.data = children;
          } else {
            treatmentWidget.result.Trt_Code = code;
          }

          return values;
        }
      },
      {
        click: function (record) {
          var values = {};
          var code = record.data.ValueCode;
          treatmentWidget.result.Trt_Code = code;
          return values;
        }
      }
    ]
  }).show();

  function fetchValueGroup(domain) {
    Ext.Ajax.request({
      url: '/stratum/api/metadata/domainvalues/domain/' + domain + '?apikey=J6b-GSKrkfk=',
      success: function (response) {
        var items = Ext.decode(response.responseText).data;
        treatmentWidget.valueGroups[domain] = items;
        treatmentWidget.backups[domain] = response.responseText;
      }
    });
  }

  function initValues() {
    var allLoaded = (treatmentWidget.valueGroups[4056] && treatmentWidget.valueGroups[4056].length > 0)
      && (treatmentWidget.valueGroups[4061] && treatmentWidget.valueGroups[4061].length > 0)
      && (treatmentWidget.valueGroups[5665] && treatmentWidget.valueGroups[5665].length > 0)
      && (treatmentWidget.valueGroups[6031] && treatmentWidget.valueGroups[6031].length > 0)
      && (treatmentWidget.valueGroups[6030] && treatmentWidget.valueGroups[6030].length > 0)
      && (treatmentWidget.valueGroups[4156] && treatmentWidget.valueGroups[4156].length > 0);
    if (!allLoaded) {
      setTimeout(function () { initValues(); }, 100);
      return;
    }
    treatmentWidget.valueGroups[6031] = Ext.decode(treatmentWidget.backups[6031]).data;
    treatmentWidget.valueGroups[6030] = Ext.decode(treatmentWidget.backups[6030]).data;
    attachChildren(6031);
  }

  function attachChildren(domain) {
    for (var i = 0; i < treatmentWidget.valueGroups[domain].length; i++) {
      if (!treatmentWidget.valueGroups[domain][i].Children) continue;
      for (var j = 0; j < treatmentWidget.valueGroups[domain][i].Children.length; j++) {
        treatmentWidget.valueGroups[domain][i].Children[j].Children = getGrandChildren(treatmentWidget.valueGroups[domain][i].Children[j]);
      }
    }
  }
  
  function getGrandChildren(item) {
    var grandChildren = treatmentWidget.valueGroups[6030].filter(function (i) { return i.DomainValueID === item.DomainValueID; });
    return grandChildren && grandChildren[0] && grandChildren[0].Children;
  }

  function filterAllValues() {
    for (var i = 0; i < treatmentWidget.valueGroups[6031].length; i++) {
      for (var j = 0; j < treatmentWidget.valueGroups[6031][i].Children.length; j++) {
        if (!treatmentWidget.valueGroups[6031][i].Children[j].Children) {
          if (!filterSpecificValue(treatmentWidget.valueGroups[6031][i].Children[j].DomainValueID, treatmentWidget.trttype, treatmentWidget.icd10, treatmentWidget.isChild) || !treatmentWidget.valueGroups[6031][i].Children[j].IsActive) {
            treatmentWidget.valueGroups[6031][i].Children.splice(j, 1);
            j--;
          }
        } else {
          for (var k = 0; k < treatmentWidget.valueGroups[6031][i].Children[j].Children.length; k++) {
            if (!filterSpecificValue(treatmentWidget.valueGroups[6031][i].Children[j].Children[k].DomainValueID, treatmentWidget.trttype, treatmentWidget.icd10, treatmentWidget.isChild)  || !treatmentWidget.valueGroups[6031][i].Children[j].Children[k].IsActive) {
              treatmentWidget.valueGroups[6031][i].Children[j].Children.splice(k, 1);
              k--;
            }
          }
          if (treatmentWidget.valueGroups[6031][i].Children[j].Children.length === 0) {
            treatmentWidget.valueGroups[6031][i].Children.splice(j, 1);
            j--;
          }
        }
      }
      if (treatmentWidget.valueGroups[6031][i].Children.length === 0) {
        treatmentWidget.valueGroups[6031].splice(i, 1);
        i--;
      }
    }
  }

  function filterSpecificValue(aTreatmentCodeID, aTreatType, aICD10, isChildFracture) {
    var i = 0;
    var j = 0;
    var treatMatch = false;
    var icdMatch = false;
    var childAdultFractureMatch = true;
    for (i = 0; i < treatmentWidget.valueGroups['4056'].length; i++) {
      if (aTreatType === treatmentWidget.valueGroups['4056'][i].ValueCode) {
        if (treatmentWidget.valueGroups['4056'][i].Children.length > 0) {
          for (j = 0; j < treatmentWidget.valueGroups['4056'][i].Children.length; j++) {
            if (treatmentWidget.valueGroups['4056'][i].Children[j].DomainValueID === aTreatmentCodeID) {
              treatMatch = true;
            }
          }
        }
      }
    }
    for (i = 0; i < treatmentWidget.valueGroups['4061'].length; i++) {
      if (aICD10 === treatmentWidget.valueGroups['4061'][i].ValueCode) {
        if (treatmentWidget.valueGroups['4061'][i].Children.length > 0) {
          for (j = 0; j < treatmentWidget.valueGroups['4061'][i].Children.length; j++) {
            if (treatmentWidget.valueGroups['4061'][i].Children[j].DomainValueID === aTreatmentCodeID) {
              icdMatch = true;
            }
          }
        }
      }
    }
    if (isChildFracture === true) {
      for (i = 0; i < treatmentWidget.valueGroups[5665].length; i++) {
        if (treatmentWidget.valueGroups[5665][i].DomainValueID === 60609) {
          if (treatmentWidget.valueGroups[5665][i].Children.length > 0) {
            for (j = 0; j < treatmentWidget.valueGroups[5665][i].Children.length; j++) {
              if (treatmentWidget.valueGroups[5665][i].Children[j].DomainValueID === aTreatmentCodeID) {
                childAdultFractureMatch = false;
              }
            }
          }
        }
      }
    } else if (isChildFracture === false) {
      for (i = 0; i < treatmentWidget.valueGroups[5665].length; i++) {
        if (treatmentWidget.valueGroups[5665][i].DomainValueID === 60608) {
          if (treatmentWidget.valueGroups[5665][i].Children.length > 0) {
            for (j = 0; j < treatmentWidget.valueGroups[5665][i].Children.length; j++) {
              if (treatmentWidget.valueGroups[5665][i].Children[j].DomainValueID === aTreatmentCodeID) {
                childAdultFractureMatch = false;
              }
            }
          }
        }
      }
    }

    return treatMatch && icdMatch && childAdultFractureMatch;
  }
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
  draggable: true,
  cls: 'sfr-modal',
  title: 'Välj behandling:',
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
      '<div><span class="sfr-angle-left">&#xf104</span><span class="sfr-value-code">({ValueCode})</span> {ValueName}</div>',
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
        },
        sorters: 'Sequence'
      });
      var click = config.levels[i].click;
      var restore = config.levels[i].restore;
      items.push(this.createLevel(click, i, tpl, restore));
    }
    config.items = items;
    config.cls = !config.addValueCodes ? 'sfr-modal' : 'sfr-use-value-codes sfr-modal';
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
  + '}'
  + '.sfr-value-code{'
  + '  display: none;'
  + '}'
  + '.sfr-use-value-codes .sfr-value-code {'
  + '  display: initial;'
  + '}', 'sfr-selector');
