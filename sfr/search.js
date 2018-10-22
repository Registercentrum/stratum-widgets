
var SfrSearchList = function () {
  var app = SfrSearchList;
  if (!Ext.ClassManager.isCreated('patientsModel')) {
    Ext.define('patientsModel', {
      extend: 'Ext.data.Model',
      fields: [{
        name: 'Personnummer',
        type: 'string',
        useNull: true
      }, {
        name: 'Skadedatum',
        type: 'date',
        dateFormat: 'c',
        useNull: true
      }]
    });
  }
  
  var storePatients = Ext.create('Ext.data.Store', {
    model: 'patientsModel',
    proxy: {
      type: 'memory',
      reader: {
        type: 'json'
      }
    }
  });

  if (!Profile.Site) {
    ContentManagement.GetSiteByRegisterID(Profile.Context.Unit.Register.RegisterID, function (r1) {
      Stratum.switchSite(r1.data);    
    });
  }
  
  loadWidget('sfr/chartfactory', function () {
    initialize();
  });

  function loadWidget(widget, callback) {
    var head = document.getElementsByTagName('head')[0];
    var element = document.createElement('script');
    element.src = '/stratum/api/widgets/' + widget;
    element.onload = callback;
    element.onreadystatechange = callback;
    head.appendChild(element);
  }

  function initialize() {
    if (!Ext.tip.QuickTipManager.getQuickTip()) { Ext.tip.QuickTipManager.init(); }
    Ext.tip.QuickTipManager.getQuickTip().on('beforeshow', function () {
      if (Ext.isEmpty(this.activeTarget.text)) {
        return false;
      }
      return app.myToolTipsAreActive || this.activeTarget.text.indexOf('poros') > -1;
    });
      
    createWorklist();
  }

  function createWorklist() {
    app.view = Ext.getCmp('contentPanel');
    app.view.addCls('sfr-charts');
    var MAX_NR_OF_PATIENTS = 500;
    var patientsTitleCmp = Ext.create('Ext.Component', { html: '<h2 align="center">Hämta patientlista</h1>' });
    var warningLabel = Ext.create('Ext.form.Label', { text: 'OBS! Max ' + MAX_NR_OF_PATIENTS + ' skadetillfällen visas i listan. Exportera listan till Excel för att se hela resultatet', style: 'color:red;' });
    warningLabel.setVisible(false);
    
    var submitButton = Ext.create('Ext.Button', {
      text: 'Hämta lista',
      style: {
        marginBottom: '10px',
        marginTop: '10px'
      },
      handler: function () {
        warningLabel.setVisible(false);
        submitButton.setDisabled(true);
        var paramsString = SfrWidget.getParameters(patientsCmps);
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
        
        Ext.Ajax.request({
          url: '/stratum/api/statistics/sfr/get_injury_event?' + paramsString.replace(/&$/, ''),
          method: 'GET',
          success: function (response) {
            var data = Ext.decode(response.responseText).data;
            data = data[0].Personnummer[0] ? data : [];
            injuriesHeader.update('<h3 align="center">Skadetillfällen (aktuell klinik): ' + data.length + ' st</h3>');
            if (data.length > MAX_NR_OF_PATIENTS) {
              data.splice(MAX_NR_OF_PATIENTS, data.length - MAX_NR_OF_PATIENTS);
              storePatients.loadData(data);
              warningLabel.setVisible(true);
            } else {
              storePatients.loadData(data);
            }
            submitButton.setDisabled(false);
          }
        });
        initExportLink(paramsString, patientsPanel);
      }
    });
    
    var patientsPanel = Ext.create('Ext.panel.Panel', {
      layout: 'vbox',
      width: '100%',
      bodyPadding: 10,
      collapsible: true,
      frame: true
    });

    app.view.add([patientsTitleCmp, patientsPanel]);
    
   
    var patientsCmps = addPatientSearchParameterCmps();
    
    for (var i = 0; i < patientsCmps.length; i++) {
      var currentCmp = patientsCmps[i];
      if (currentCmp instanceof Ext.form.ComboBox) {
        currentCmp.getStore().on('datachanged', Ext.bind(SfrWidget.onFilterChanged, this, [currentCmp, patientsCmps], false));
      }
    }

    var injuriesHeader = Ext.create('Ext.Component', {
      html: '<h3 align="center">Skadetillfällen (aktuell klinik)</h3>',
      width: '100%'
    });
    
    var patientsGrid = createPatientsGrid(storePatients);
    patientsPanel.add(patientsCmps);
    patientsPanel.items.add(submitButton);
    initExportLink('', patientsPanel);
    patientsPanel.add(warningLabel);
    patientsPanel.add(injuriesHeader);
    patientsPanel.add(patientsGrid);
    if (storePatients.data.length > 0) {
      patientsGrid.getView().refresh();
    }
    
    function initExportLink(paramsString, container) {
      var html = '<a style="text-decoration:underline" href="/stratum/api/statistics/sfr/patientlista?' + paramsString + 'format=csv&returtyp=csv">Exportera listan till Excel</a>';
      if (initExportLink.cmp === undefined) {
        initExportLink.cmp = Ext.create('Ext.Component', { style: { paddingTop: '10px', paddingBottom: '10px' }, html: html, name: 'exportLink' });
        container.add(initExportLink.cmp);
      } else if (initExportLink.cmp.rendered) {
        initExportLink.cmp.getEl().dom.innerHTML = html;
      }
    }
    
    function createPatientsGrid(store) {
      var grid = Ext.create('Ext.grid.Panel', {
        title: '',
        store: store,
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

    function addPatientSearchParameterCmps() {
      var cmps = SfrWidget.createFilterComponents(['from_dat', 'bodypart', 'icd10', 'injtype', 'injgroup', 'trtgrp', 'trttype', 'trtcode', 'fxclass', 'fxclassgroup', 'open']);
      
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
      cmps.splice(4, 0, fractureTreatLabel, fractureTreatOptionsCmp, specialFractureLabel, specialFractureOptionsCmp);
      return cmps;
    }
  }
};

Ext.util.CSS.removeStyleSheet('accidents');
Ext.util.CSS.createStyleSheet('' 
+ '.x-panel label {color: darkslategrey;}',
'accidents');

SfrSearchList();
