
var SfrSearchList = function () {
  var app = SfrSearchList;

  if (!Profile.Site) {
    ContentManagement.GetSiteByRegisterID(Profile.Context.Unit.Register.RegisterID, function (r1) {
      Stratum.switchSite(r1.data);    
    });
  }
  
  loadWidget('sfr/chartfactory', function () {
    createApp();
  });

  function loadWidget(widget, callback) {
    var head = document.getElementsByTagName('head')[0];
    var element = document.createElement('script');
    element.src = '/stratum/api/widgets/' + widget;
    element.onload = callback;
    element.onreadystatechange = callback;
    head.appendChild(element);
  }

  function createApp() {
    initializeTips();
    app.max = 500;
    app.view = Ext.getCmp('contentPanel');
    app.view.addCls('sfr-charts');
    app.store = createStore();
    app.panel = createPanel();
    app.filters = createFilters();
    app.button = createButton();
    app.grid = createGrid();
    app.export = createExport();
    app.warning = Ext.create('Ext.form.Label', { hidden: true, text: 'OBS! Max ' + app.max + ' skadetillfällen visas i listan. Exportera listan till Excel för att se hela resultatet', style: 'color:red;' });
    app.header = Ext.create('Ext.Component', { html: '<h3 align="center">Skadetillfällen (aktuell klinik)</h3>', width: '100%' });
    app.title = Ext.create('Ext.Component', { html: '<h2 align="center">Hämta patientlista</h2>' });

    app.panel.add(app.filters);
    app.panel.items.add(app.button);
    app.panel.add(app.export);
    app.panel.add(app.warning);
    app.panel.add(app.header);
    app.panel.add(app.grid); 
    app.view.add([app.title, app.panel]); 
  }

  function createStore() {
    return Ext.create('Ext.data.Store', {
      fields: ['Personnummer', 'Skadedatum'],
      proxy: {
        type: 'memory',
        reader: {
          type: 'json'
        }
      }
    });
  }

  function createPanel() {
    return Ext.create('Ext.panel.Panel', {
      layout: 'vbox',
      width: '100%',
      bodyPadding: 10,
      collapsible: true,
      frame: true
    });
  }

  function createFilters() {
    var components = SfrWidget.createFilterComponents(['from_dat', 'bodypart', 'icd10', 'injtype', 'injgroup', 'trtgrp', 'trttype', 'trtcode', 'fxclass', 'fxclassgroup', 'open']);
    
    var fractureTreatOptions = [
      ['', null],
      ['Hämta där enbart skadedatum är ifyllt', '1'],
      ['Hämta där patient har närliggande skadetillfällen (inom 7 dagar)', '2'],
      ['Hämta där fraktur saknas', '3'],
      ['Hämta där fraktur ej blivit klassificerad', '4'],
      ['Hämta där behandling saknas', '5'],
      ['Hämta där primär behandling saknas men Planerat följdingrepp finns', '6'],
      ['Hämta där primär behandling saknas men Re-operation/Operation i sent skede finns', '7'],
      ['Hämta där Icke-kirurgisk behandling saknas men Operation efter icke-kirurgi övergivits finns', '8'],
      ['Hämta där Operation efter icke-kirurgi övergivits saknas men Icke-kirurgisk behandling tillsammans med Planerat följdingrepp finns', '9'],
      ['Hämta där patient vid PROM-ifyllande angett att denne reoperats men där endast primäroperationer finns registrerade', '10']
    ];
    
    var storeFractureTreatOptions = Ext.create('Ext.data.ArrayStore', {
      data: fractureTreatOptions,
      autoLoad: true,
      fields: ['ValueName', 'ValueCode'],
      mode: 'local'
    });
    
    var fractureTreatOptionsCmp = Ext.create('Ext.form.ComboBox', {
      parameterKey: SfrWidget.ParameterKeys.FRACTURE_TREAT_OPTIONS,
      width: '50%',
      mode: 'local',
      valueField: 'ValueCode',
      displayField: 'ValueName',
      editable: false,
      store: storeFractureTreatOptions
    });

    var specialFractureOptions = [
      ['', null],
      ['Hämta där skadeorsak är stressfraktur', '1'],
      ['Hämta där skadeorsak är patologisk fraktur', '2'],
      ['Hämta där protesnära fraktur förekommer', '3'],
      ['Hämta där implantatrelaterad fraktur förekommer', '4'],
      ['Hämta där misstänkt osteoporosfraktur förekommer', '5'],
      ['Hämta där atypisk fraktur förekommer', '6']];
      
    var storeSpecialFractureOptions = Ext.create('Ext.data.ArrayStore', {
      data: specialFractureOptions,
      autoLoad: true,
      fields: ['ValueName', 'ValueCode'],
      mode: 'local'
    });

    var specialFractureOptionsCmp = Ext.create('Ext.form.ComboBox', {
      parameterKey: SfrWidget.ParameterKeys.SPECIAL_FRACTURE_OPTIONS,
      width: '50%',
      mode: 'local',
      valueField: 'ValueCode',
      displayField: 'ValueName',
      editable: false,
      store: storeSpecialFractureOptions,
      listeners: {
        afterrender: function () {
          Ext.tip.QuickTipManager.register({
            target: specialFractureOptionsCmp.id,
            text: 'Misstänkt osteoporosfraktur definieras vid denna utsökning som en fraktur hos patient 50 år eller äldre och som registrerats ha en fraktur av proximala humerus, höft, bäcken, acetabulum, handled eller rygg.',
            autoHide: false
          });
        }
      }
    });
    var fractureTreatLabel = Ext.create('Ext.form.Label', { text: 'Fraktur/Behandling:' });
    var specialFractureLabel = Ext.create('Ext.form.Label', { text: 'Speciella frakturtyper:' });
    components.splice(4, 0, fractureTreatLabel, fractureTreatOptionsCmp, specialFractureLabel, specialFractureOptionsCmp);

    for (var i = 0; i < components.length; i++) {
      var currentCmp = components[i];
      if (currentCmp instanceof Ext.form.ComboBox) {
        currentCmp.getStore().on('datachanged', Ext.bind(SfrWidget.onFilterChanged, this, [currentCmp, components], false));
      }
    }

    return components;
  }

  function createButton() {
    return Ext.create('Ext.Button', {
      text: 'Hämta lista',
      style: {
        marginBottom: '10px',
        marginTop: '10px'
      },
      handler: function (button) {
        app.warning.setVisible(false);
        button.setDisabled(true);
        var paramsString = SfrWidget.getParameters(app.filters);
        paramsString = paramsString.replace(new RegExp('[a-zA-Z0-9]*ALL=[0-1]*&', 'g'), '');
        paramsString = paramsString.replace(new RegExp('[a-zA-Z0-9]*=0&', 'g'), '');
        paramsString = paramsString.replace(/from_dat/g, 'from_Inj_Dat');
        paramsString = paramsString.replace(/to_dat/g, 'to_Inj_Dat');
        paramsString = paramsString.replace(/bodypart/g, 'bodypart');
        paramsString = paramsString.replace(/icd10/g, 'icd10');
        paramsString = paramsString.replace(/injtype/g, 'injury_type');
        paramsString = paramsString.replace(/fxclass/g, 'fracture_type');
        paramsString = paramsString.replace(/trtgrp/g, 'op_method');
        paramsString = paramsString.replace(/trttype/g, 'treatment_type');
        paramsString = paramsString.replace(/trtcode/g, 'treatment_code');
        paramsString = paramsString.replace(/injgroup/g, 'injury_group');
        paramsString = paramsString.replace(/open/g, 'open_fracture');
        paramsString = paramsString.replace(/SpecialFractureOptions/g, 'special_fraktures');
        paramsString = paramsString.replace(/FractureTreatOptions/g, 'incomplete_registrations');
        paramsString = paramsString.replace(/fracture_typegroup/g, 'fracture_group');
        
        Ext.Ajax.request({
          url: '/stratum/api/statistics/sfr/get_injury_event?' + paramsString.replace(/&$/, ''),
          method: 'GET',
          success: function (response) {
            var data = Ext.decode(response.responseText).data;
            data = data[0].Personnummer[0] ? data : [];
            app.header.update('<h3 align="center">Skadetillfällen (aktuell klinik): ' + data.length + ' st</h3>');
            if (data.length > app.max) {
              data.splice(app.max, data.length - app.max); 
              app.warning.setVisible(true);
            }
            app.store.loadData(data);
            button.setDisabled(false);
          }
        });
        updateExport(paramsString, app.panel);
      }
    });
  }

  function createGrid() {
    var grid = Ext.create('Ext.grid.Panel', {
      title: '',
      store: app.store,
      width: '100%',
      height: 600,
      viewConfig: {
        enableTextSelection: true
      },
      columns: [{
        header: 'Personnummer',
        dataIndex: 'Personnummer',
        width: 130,
        height: 50
      }, {
        header: 'Skadedatum',
        dataIndex: 'Skadedatum',
        xtype: 'datecolumn',
        format: 'Y-m-d',
        width: 110

      }],
      selModel: Ext.create('Ext.selection.RowModel', {
        listeners: {
          select: function (model, record) {
            Stratum.ManagerForSubjects.search(record.data.Personnummer);
            window.scrollToTop();
          }
        }
      })
    });
    return grid;
  }

  function createExport(parameters) {
    var html = '<a style="text-decoration:underline" href="/stratum/api/statistics/sfr/get_injury_event?' + parameters + 'format=csv&returtyp=csv">Exportera listan till Excel</a>';
    return Ext.create('Ext.Component', { style: { paddingTop: '10px', paddingBottom: '10px' }, html: html, name: 'exportLink' });
  }

  function updateExport(parameters) {
    var html = '<a style="text-decoration:underline" href="/stratum/api/statistics/sfr/get_injury_event?' + parameters + 'format=csv&returtyp=csv">Exportera listan till Excel</a>';
    app.export.getEl().dom.innerHTML = html;
  }

  function initializeTips() {
    if (!Ext.tip.QuickTipManager.getQuickTip()) { Ext.tip.QuickTipManager.init(); }
    Ext.tip.QuickTipManager.getQuickTip().on('beforeshow', function () {
      if (Ext.isEmpty(this.activeTarget.text)) {
        return false;
      }
      return app.myToolTipsAreActive || this.activeTarget.text.indexOf('poros') > -1;
    });
  }
};

Ext.util.CSS.removeStyleSheet('accidents');
Ext.util.CSS.createStyleSheet('' 
+ '.x-panel label {color: darkslategrey;}',
'accidents');

SfrSearchList();
