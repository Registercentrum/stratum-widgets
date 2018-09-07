
Ext.util.CSS.removeStyleSheet('sfr-injury');
Ext.util.CSS.createStyleSheet(''
  + '.sfr-selector.hiddenview > div {'
  + '  display: none;'
  + '}'
  + '.sfr-selector.hiddenview .x-item-selected {'
  + '  display: initial !important;'
  + '  background-color: gray;'
  + '  color: white;'
  + '  padding: 0 !important;'
  + '}'
  + '.sfr-selector.hiddenview .x-item-selected div {'
  + '  background-color: #7c7c7c;'
  + '  width: 500px;'
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
  + '  display: initial;'
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

var treatmentWidget = function (e, current, callback, loadonly) {
  treatmentWidget.event = e;
  treatmentWidget.result = {};
  treatmentWidget.valueGroups = treatmentWidget.valueGroups || [];
  treatmentWidget.icd10 = current.Parent.Fx_ICD10;
  treatmentWidget.trttype = current.Trt_Type;
  treatmentWidget.child = current.Parent.Fx_OpenPhyses === 1;

  
  !treatmentWidget.valueGroups[4056] && fetchValueGroup(4056);
  !treatmentWidget.valueGroups[4061] && fetchValueGroup(4061);
  !treatmentWidget.valueGroups[4157] && fetchValueGroup(4157);
  !treatmentWidget.valueGroups[4188] && fetchValueGroup(4188);
  !treatmentWidget.valueGroups[5665] && fetchValueGroup(5665);

  Ext.create('Ext.data.Store', {
    id: 'firstStore',
    fields: [],
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
  
  if(loadonly)return;
  
  var imageTpl = new Ext.XTemplate(
    '<tpl for=".">',
    '<div style="margin: 0; padding: 0 15px; overflow: hiddenview;" class="thumb-wrap">',
    '<div><span class="sfr-angle-left">&#xf104</span>{ValueName}</div>',
    '</div>',
    '</tpl>'
  );

  treatmentWidget.window = Ext.create('Ext.panel.Panel', {
    minwidth: 400,
    height: 400,
    modal: true,
    floating: true,
    frame: true,
    layout: 'vbox',
    closable: true,
    cls: 'sfr-modal',
    title: 'Skadekod',
    items: [
      {
        xtype: 'dataview',
        itemId: 'viewOne',
        store: Ext.data.StoreManager.lookup('firstStore'),
        tpl: imageTpl,
        itemSelector: 'div.thumb-wrap',
        selectable: 'simple',
        cls: 'sfr-selector',
        listeners: {
          itemclick: function (el, record) {
            if (this.hasCls('hiddenview')) {
              this.removeCls('hiddenview');
              //this.el.down('.x-item-selected').removeCls('x-item-selected')
              var view = this;
              setTimeout(function () { view.getSelectionModel().deselectAll(); Ext.StoreManager.lookup('secondStore').setData({}, 0) });
            } else {
              this.el.addCls('hiddenview');
              var code = record.data.ValueCode;
              var children = record.data.Children;
              setTimeout(function () { Ext.StoreManager.lookup('secondStore').setData(children); }, 0);

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
              this.el.down('.x-item-selected').removeCls('x-item-selected')
              this.up().down('#viewOne').removeCls('all');
              var view = this;
              setTimeout(function () { view.getSelectionModel().deselectAll(); Ext.StoreManager.lookup('thirdStore').setData({}, 0) });
            } else {
              this.up().down('#viewOne').addCls('all');
              this.addCls('hiddenview');
              var code = record.data.ValueCode;
              var children = record.data.Children;
              setTimeout(function () { Ext.StoreManager.lookup('thirdStore').setData(children) }, 0);
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
              this.el.down('.x-item-selected').removeCls('x-item-selected')
              this.up().down('#viewTwo').removeCls('all');
              Ext.StoreManager.lookup('fourthStore').setData({});
            } else {
              this.addCls('hiddenview');
              this.up().down('#viewTwo').addCls('all');
              var code = record.data.ValueCode;
              treatmentWidget.result.Trt_Code = code;
              callback(treatmentWidget.event, treatmentWidget.result);
              this.up().hide();
              return;
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
              this.el.down('.x-item-selected').removeCls('x-item-selected')
              this.up().down('#viewThree').removeCls('all');
              Ext.StoreManager.lookup('fifthStore').setData({});
              treatmentWidget.result.Inj_Activity = '';
            } else {
              this.addCls('hiddenview');
              this.up().down('#viewThree').addCls('all');
              var code = record.data.ValueCode;
              var domainId = 0;
              if (treatmentWidget.result.Inj_Cause.indexOf('V') !== 0) {
                domainId = 4098;
                treatmentWidget.result.Inj_Activity = code;
              }
              if (!domainId) {
                if (treatmentWidget.result.Inj_Cause.indexOf('V') === 0) {
                  treatmentWidget.result.Inj_Cause += '.' + code;
                } else {
                  treatmentWidget.result.Inj_Activity = code;
                }
                callback(treatmentWidget.event, treatmentWidget.result);
                this.up().hide();
                return;
              }
              Ext.Ajax.request({
                url: 'https://stratum.registercentrum.se/api/metadata/domainvalues/domain/' + domainId + '?apikey=J6b-GSKrkfk=',
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
            treatmentWidget.result.Inj_Place = code;
            callback(treatmentWidget.event, treatmentWidget.result);
            this.up().hide();
            return;
          }
        }
      }
    ],
    // renderTo: Ext.getBody()
  });
  filterValues();

  function fetchValueGroup(domain) {
    Ext.Ajax.request({
      url: 'https://stratum.registercentrum.se/api/metadata/domainvalues/domain/' + domain + '?apikey=J6b-GSKrkfk=',
      success: function (response) {
        var items = Ext.decode(response.responseText).data;
        treatmentWidget.valueGroups[domain] = items;
      }
    });
  }

  function filterValues() {
    var allLoaded = (treatmentWidget.valueGroups[4056] && treatmentWidget.valueGroups[4056].length > 0) && (treatmentWidget.valueGroups[4061] && treatmentWidget.valueGroups[4061].length > 0) && (treatmentWidget.valueGroups[5665] && treatmentWidget.valueGroups[5665].length > 0) && (treatmentWidget.valueGroups[4188] && treatmentWidget.valueGroups[4188].length > 0) && (treatmentWidget.valueGroups[4157] && treatmentWidget.valueGroups[4157].length > 0);
    if (!allLoaded) {
      setTimeout(function () { filterValues(); }, 100);
      return;
    }
    filterTreatments();
    attachChildren(4188);
    filterAllValues();
    Ext.StoreManager.lookup('firstStore').setData(treatmentWidget.valueGroups[4188]);
    treatmentWidget.window.show();
  }

  function filterAllValues() {
    for (var i = 0; i < treatmentWidget.valueGroups[4188].length; i++) {
      for (var j = 0; j < treatmentWidget.valueGroups[4188][i].Children.length; j++) {
        for (var k = 0; k < treatmentWidget.valueGroups[4188][i].Children[j].Children.length; k++) {
          if (!filterSpecificValue(treatmentWidget.valueGroups[4188][i].Children[j].Children[k].DomainValueID, treatmentWidget.trttype, treatmentWidget.icd10, treatmentWidget.child)) {
            treatmentWidget.valueGroups[4188][i].Children[j].Children.splice(k, 1);
            k--;
          }
        }
        if (treatmentWidget.valueGroups[4188][i].Children[j].Children.length === 0) {
          treatmentWidget.valueGroups[4188][i].Children.splice(j, 1);
          j--;
        }
      }
      if (treatmentWidget.valueGroups[4188][i].Children.length === 0) {
        treatmentWidget.valueGroups[4188].splice(i, 1);
        i--;
      }
    }
  }

  function filterTreatments() {
    treatmentWidget.valueGroups[4056] = treatmentWidget.valueGroups[4056].filter(function (i) { return i.ValueCode == treatmentWidget.trttype })
  }

  function attachChildren(domain) {
    for (var i = 0; i < treatmentWidget.valueGroups[domain].length; i++) {
      if (!treatmentWidget.valueGroups[domain][i].Children) continue;
      for (var j = 0; j < treatmentWidget.valueGroups[domain][i].Children.length; j++) {
        treatmentWidget.valueGroups[domain][i].Children[j] = getGrandChildren(treatmentWidget.valueGroups[domain][i].Children[j])
      }
    }
  }

  function getGrandChildren(item) {
    var grandChildren = treatmentWidget.valueGroups[4157].filter(function (i) { return i.DomainValueID == item.DomainValueID });
    return grandChildren && grandChildren[0];
  }

  function filterSpecificValue(aTreatmentCodeID, aTreatType, aICD10, isChildFracture) {
    var i = 0;
    var j = 0;
    var treatMatch = false;
    var icdMatch = false;
    var childAdultFractureMatch = true;
    for (i = 0; i < treatmentWidget.valueGroups['4056'].length; i++) {
      if (aTreatType == treatmentWidget.valueGroups['4056'][i].ValueCode) {
        if (treatmentWidget.valueGroups['4056'][i].Children.length > 0) {
          for (j = 0; j < treatmentWidget.valueGroups['4056'][i].Children.length; j++) {
            if (treatmentWidget.valueGroups['4056'][i].Children[j].DomainValueID == aTreatmentCodeID) {
              treatMatch = true;
            }
          }
        }
      }
    }
    for (i = 0; i < treatmentWidget.valueGroups['4061'].length; i++) {
      if (aICD10 == treatmentWidget.valueGroups['4061'][i].ValueCode) {
        if (treatmentWidget.valueGroups['4061'][i].Children.length > 0) {
          for (j = 0; j < treatmentWidget.valueGroups['4061'][i].Children.length; j++) {
            if (treatmentWidget.valueGroups['4061'][i].Children[j].DomainValueID == aTreatmentCodeID) {
              icdMatch = true;
            }
          }
        }
      }
    }
    if (isChildFracture === true) {
      for (i = 0; i < treatmentWidget.valueGroups[5665].length; i++) {
        if (treatmentWidget.valueGroups[5665].DomainValueID == 60609) {
          if (treatmentWidget.valueGroups[5665][i].Children.length > 0) {
            for (j = 0; j < treatmentWidget.valueGroups[5665][i].Children.length; j++) {
              if (treatmentWidget.valueGroups[5665][i].Children[j].DomainValueID == aTreatmentCodeID) {
                childAdultFractureMatch = false;
              }
            }
          }
        }
      }
    }
    else {
      for (i = 0; i < treatmentWidget.valueGroups[5665].length; i++) {
        if (treatmentWidget.valueGroups[5665].DomainValueID == 60608) {
          if (treatmentWidget.valueGroups[5665][i].Children.length > 0) {
            for (j = 0; j < treatmentWidget.valueGroups[5665][i].Children.length; j++) {
              if (treatmentWidget.valueGroups[5665][i].Children[j].DomainValueID == aTreatmentCodeID) {
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
