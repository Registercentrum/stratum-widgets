
var SfrSearchList = function (anEntity, aQuery) {
  var app = SfrSearchList;
  var patientSearchSettings = { startDate: null, endDate: null, injuryVal: null, prom0Val: null, prom1Val: null, fractureTreatVal: null, bodyPartVal: null, icd10Val: null, specialFractureVal: null, energyTypeVal: null, aoTypeVal: null, treatTypeGroupVal: null, treatTypeVal: null, treatCodeVal: null, injuryGroup: null }
  if (!Ext.ClassManager.isCreated('patientsModel')) {
    Ext.define('patientsModel', {
      extend: 'Ext.data.Model',
      fields: [{
        name: 'PersonNr',
        type: 'string',
        useNull: true
      }, {
        name: 'Skadedatum',
        type: 'date',
        dateFormat: 'c',
        useNull: true
      }, {
        name: 'Frakt',
        type: 'int',
        useNull: true
      }, {
        name: 'Beh',
        type: 'int',
        useNull: true
      }, {
        name: 'ReOp',
        type: 'int',
        useNull: true
      }, {
        name: 'DifferentInjuryClinic',
        type: 'string',
        useNull: true
      }
        , {
        name: 'InjuryGroup',
        type: 'int',
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
      loadWidget('sfr/chartfactory', function () {
        reportMethods = SfrWidget;
        initialize();
      });
    });
  }
  else {
    loadWidget('sfr/chartfactory', function () {
      reportMethods = SfrWidget;
      initialize();
    });
  }


  function loadWidget(widget, callback) {
    var head = document.getElementsByTagName('head')[0];
    var element = document.createElement('script');
    element.src = '/stratum/api/widgets/' + widget;
    element.onload = element.onreadystatechange = callback;
    head.appendChild(element);
  }

  function initialize() {
    if(!Ext.tip.QuickTipManager.getQuickTip()) {Ext.tip.QuickTipManager.init()};
    Ext.tip.QuickTipManager.getQuickTip().on('beforeshow', function () {
      if (Ext.isEmpty(this.activeTarget.text)) {
        return false;
      }
      return app.myToolTipsAreActive || this.activeTarget.text.indexOf('poros') > -1;
    });
      
    createWorklist();
  }

  function onCollapsePanels() {
    var i = 0;
    for (i = 0; i < app.view.items.length; i++) {
      var cmp = app.view.items.items[i];
      if (cmp instanceof Ext.form.Panel) {
        cmp.collapse(Ext.Component.DIRECTION_TOP, true);
      }
    }
  }

  function createWorklist() {
    app.view = Ext.getCmp('contentPanel');
    app.view.addCls('sfr-charts');
    var parameters = Ext.Object.merge(SfrWidget.parameters, SfrWidget.ParameterKeys);;
    var MAX_NR_OF_PATIENTS = 500;
    var patientsTitleCmp = Ext.create('Ext.Component', {html: '<h2 align="center">' + 'Skadetillfällen - sök med särskilda kriterier' + '</h1>'});
    var warningLabel = Ext.create('Ext.form.Label', { text: 'OBS! Max ' + MAX_NR_OF_PATIENTS + ' skadetillfällen visas i listan. Exportera listan till Excel för att se hela resultatet', style: 'color:red;' });
    warningLabel.setVisible(false);
    
    var submitButton = Ext.create('Ext.Button', {
      text: 'Hämta skadetillfällen',
      style: {
        marginBottom: '10px',
        marginTop: '10px'
      },
      handler: function () {
        warningLabel.setVisible(false);
        submitButton.setDisabled(true);
        var paramsString = SfrWidget.getParameters(patientsCmps);
        paramsString = paramsString.replace(/from_dat/g, 'StartDate');
        paramsString = paramsString.replace(/to_dat/g, 'EndDate');
        paramsString = paramsString.replace(/bodypart/g, 'ICD10Group');
        paramsString = paramsString.replace(/icd10/g, 'ICD10CODE');
        paramsString = paramsString.replace(/injtype/g, 'EnergyType');
        paramsString = paramsString.replace(/fxclass/g, 'FractureClass');
        paramsString = paramsString.replace(/trtgrp/g, 'TreatTypeGroup');
        paramsString = paramsString.replace(/trttype/g, 'TreatType');
        paramsString = paramsString.replace(/trtcode/g, 'TreatCode');
        paramsString = paramsString.replace(/injgroup/g, 'InjuryGroup');
        paramsString = paramsString.replace(/open/g, 'OpenClosed');

        ReportManagement.GetReport(3059, paramsString, function (e, r) {
          if (r.result.success) {
            injuriesHeader.update('<h3 align="center">Skadetillfällen (aktuell klinik): ' + r.result.data.length + ' st</h3>');
            if (r.result.data.length > MAX_NR_OF_PATIENTS) {
              r.result.data.splice(MAX_NR_OF_PATIENTS, r.result.data.length - MAX_NR_OF_PATIENTS)
              storePatients.loadData(r.result.data);
              warningLabel.setVisible(true);
            }
            else {
              storePatients.loadData(r.result.data);
            }
          }
          submitButton.setDisabled(false);
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

    var startDateCmp =  getFilter(parameters.from_dat);
    var endDateCmp =    getFilter(parameters.to_dat);
    var icd10GroupCmp = getFilter(parameters.bodypart);
    var icd10Cmp =      getFilter(parameters.icd10);
    var energyTypeCmp = getFilter(parameters.injtype);
    var aoTypeCmp =     getFilter(parameters.fxclass);
    var treatTypeGroupCmp = getFilter(parameters.trtgrp);
    var treatTypeCmp = getFilter(parameters.trttype);
    var treatCodeCmp = getFilter(parameters.trtcode);
    var emptyInjuryFormOptionsCmp = getFilter(parameters.INJURYFORM_OPTIONS);
    var prom0OptionsCmp = getFilter(parameters.PROM0_OPTIONS);
    var prom1OptionsCmp = getFilter(parameters.PROM1OPTIONS);
    var fractureTreatOptionsCmp = getFilter(parameters.FRACTURE_TREAT_OPTIONS);
    var specialFracturesOptionsCmp = getFilter(parameters.SPECIAL_FRACTURE_OPTIONS);
    var injuryGroupCmp = getFilter(parameters.injgroup);
    
    startDateCmp.on('afterrender', function () {
      if (patientSearchSettings.startDate != null) {
        this.setValue(patientSearchSettings.startDate);
      }
    });
    endDateCmp.on('afterrender', function () {
      if (patientSearchSettings.endDate != null) {
        this.setValue(patientSearchSettings.endDate);
      }
    });
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
    var patientsPanelItems = new Array();
    patientsPanel.add(patientsCmps);
    patientsPanel.items.add(submitButton);
    initExportLink('', patientsPanel);
    patientsPanel.add(warningLabel);
    patientsPanel.add(injuriesHeader);
    patientsPanel.add(patientsGrid);
    if (storePatients.data.length > 0) {
      patientsGrid.getView().refresh();
    }
    
    function getFilter(parameter) {
      return patientsCmps[getParameterCmpIndex(parameter, patientsCmps)];
    }
    
    function getParameterCmpIndex(paramterKey, paramterCmps) {
      var i = 0;
      for (i = 0; i < paramterCmps.length; i++) {
        if (paramterCmps[i].parameterKey === paramterKey) {
          return i;
        }
      }
      return -1;
    }
    
    function initExportLink(paramsString, container) {
      paramsString += '&ContextID=' + Profile.Context.ContextID;
      var html = '<a style="text-decoration:underline" href="/stratum/databases/report/3059?' + paramsString + '">Exportera listan till Excel</a>';
      if (initExportLink.cmp === undefined) {
        initExportLink.cmp = Ext.create('Ext.Component', { style: { paddingTop: '10px', paddingBottom: '10px' }, html: html, name: 'exportLink' });
        container.add(initExportLink.cmp);
      }
      else if (initExportLink.cmp.rendered) {
        initExportLink.cmp.getEl().dom.innerHTML = html;
      }
    }
    
    function createPatientsGrid(store) {
      var grid = Ext.create('Ext.grid.Panel', {
        title: '',
        store: store,
        width: '100%',
        height: 600,
        selModel: {
          allowDeselect: true
        },
        viewConfig: {
          enableTextSelection: true
        },
        columns: [{
          header: 'Personnr',
          dataIndex: 'PersonNr',
          width: 123,
          height: 50
        }, {
          header: 'Skadedat',
          dataIndex: 'Skadedatum',
          xtype: 'datecolumn',
          format: 'Y-m-d',
          width: 90

        }, {
          header: 'Frakt',
          dataIndex: 'Frakt',
          width: 60
        }, {
          header: 'Beh',
          dataIndex: 'Beh',
          width: 60
        }, {
          header: 'Re-op',
          dataIndex: 'ReOp',
          width: 60
        }, {
          header: 'Skadetillf. reggat på annan klinik',
          dataIndex: 'DifferentInjuryClinic',
          width: 250
        }],
        selModel: Ext.create('Ext.selection.RowModel', {
          listeners: {
            select: function (model, record, index, eOpts) {
              patientSearchSettings.startDate = startDateCmp.getValue();
              patientSearchSettings.endDate = endDateCmp.getValue();
              patientSearchSettings.injuryVal = emptyInjuryFormOptionsCmp.getValue();
              patientSearchSettings.prom0Val = prom0OptionsCmp.getValue();
              patientSearchSettings.prom1Val = prom1OptionsCmp.getValue();
              patientSearchSettings.fractureTreatVal = fractureTreatOptionsCmp.getValue();
              patientSearchSettings.bodyPartVal = icd10GroupCmp.getValue();
              patientSearchSettings.icd10Val = icd10Cmp.getValue();
              patientSearchSettings.energyTypeVal = energyTypeCmp.getValue();
              patientSearchSettings.aoTypeVal = aoTypeCmp.getValue();
              patientSearchSettings.treatCodeVal = treatCodeCmp.getValue();
              patientSearchSettings.treatTypeGroupVal = treatTypeGroupCmp.getValue();
              patientSearchSettings.treatTypeVal = treatTypeCmp.getValue();
              patientSearchSettings.specialFractureVal = specialFracturesOptionsCmp.getValue();
              patientSearchSettings.injuryGroupVal = injuryGroupCmp.getValue();
              Stratum.ManagerForSubjects.search(record.data.PersonNr);
              window.scrollToTop();
            }
          }
        })
      });
      return grid;
    }

    function addPatientSearchParameterCmps() {
      var cmps = SfrWidget.createFilterComponents(['from_dat', 'bodypart', 'icd10', 'injtype', 'injgroup', 'trtgrp', 'trttype', 'trtcode', 'fxclass', 'fxclassgroup', 'open']);
      var prom0Options = [
        ['', null],
        ['Hämta där PROM dag 0 saknas', '1'],
        ['Hämta där PROM dag 0 finns', '2'],
        ['Hämta där PROM dag 0 finns men exkludera skadetillfällen där patient lämnat samtliga uppgifter obesvarade', '3']
      ];
      
      var storePROM0options = Ext.create('Ext.data.ArrayStore', {
        data: prom0Options,
        autoLoad: true,
        fields: ['ValueName', 'ValueCode'],
        mode: 'local'
      });
      
      var prom0OptionsCmp = Ext.create('Ext.form.ComboBox', {
        parameterKey: SfrWidget.ParameterKeys.PROM0_OPTIONS,
        width: 500,
        mode: 'local',
        valueField: 'ValueCode',
        displayField: 'ValueName',
        editable: false,
        store: storePROM0options,
        listeners: {
          afterrender: function () {
            if (patientSearchSettings.prom0Val != null) {
              this.setValue(patientSearchSettings.prom0Val);
            }
          }
        }
      });

      var prom1Options = [
        ['', null],
        ['Hämta där PROM 1 år saknas', '1'],
        ['Hämta där PROM 1 år finns', '2'],
        ['Hämta där PROM 1 år finns men exkludera skadetillfällen där patient lämnat samtliga uppgifter obesvarade', '3']
      ];

      var storePROM1options = Ext.create('Ext.data.ArrayStore', {
        data: prom1Options,
        autoLoad: true,
        fields: ['ValueName', 'ValueCode'],
        mode: 'local'
      });

      var prom1OptionsCmp = Ext.create('Ext.form.ComboBox', {
        parameterKey: SfrWidget.ParameterKeys.PROM1OPTIONS,
        width: 500,
        mode: 'local',
        valueField: 'ValueCode',
        displayField: 'ValueName',
        editable: false,
        store: storePROM1options,
        listeners: {
          afterrender: function () {
            if (patientSearchSettings.prom1Val != null) {
              this.setValue(patientSearchSettings.prom1Val);
            }
          }
        }
      });
      
      var fractureTreatOptions = [
        ['', null],
        ['Hämta där fraktur saknas', '1'],
        ['Hämta där fraktur ej blivit klassificerad', '2'],
        ['Hämta där behandling saknas', '3'],
        ['Hämta där primär behandling saknas men Planerat följdingrepp finns', '4'],
        ['Hämta där primär behandling saknas men Re-operation/Operation i sent skede finns', '5'],
        ['Hämta där Icke-kirurgisk behandling saknas men Operation efter icke-kirurgi övergivits finns', '6'],
        ['Hämta där Operation efter icke-kirurgi övergivits saknas men Icke-kirurgisk behandling tillsammans med Planerat följdingrepp finns', '7'],
        ['Hämta där patient vid PROM-ifyllande angett att denne reoperats men där endast primäroperationer finns registrerade', '9']
      ];
      
      var storeFractureTreatOptions = Ext.create('Ext.data.ArrayStore', {
        data: fractureTreatOptions,
        autoLoad: true,
        fields: ['ValueName', 'ValueCode'],
        mode: 'local'
      });
      
      var fractureTreatOptionsCmp = Ext.create('Ext.form.ComboBox', {
        parameterKey: SfrWidget.ParameterKeys.FRACTURE_TREAT_OPTIONS,
        width: 500,
        mode: 'local',
        valueField: 'ValueCode',
        displayField: 'ValueName',
        editable: false,
        store: storeFractureTreatOptions,
        listeners: {
          afterrender: function () {
            if (patientSearchSettings.fractureTreatVal != null) {
              this.setValue(patientSearchSettings.fractureTreatVal);
            }
          }
        }
      });
      
      var emptyInjuryFormOptions = [
        ['', null],
        ['Hämta där enbart skadedatum är ifyllt', '1'],
        ['Hämta där patient har närliggande skadetillfällen (inom 7 dagar)', '2']];
      var storeEmptyInjuryFormOptions = Ext.create('Ext.data.ArrayStore', {
        data: emptyInjuryFormOptions,
        autoLoad: true,
        fields: ['ValueName', 'ValueCode'],
        mode: 'local'
      });
      
      var emptyInjuryFormOptionsCmp = Ext.create('Ext.form.ComboBox', {
        parameterKey: SfrWidget.ParameterKeys.INJURYFORM_OPTIONS,
        width: 500,
        mode: 'local',
        valueField: 'ValueCode',
        displayField: 'ValueName',
        editable: false,
        store: storeEmptyInjuryFormOptions,
        listeners: {
          afterrender: function () {
            if (patientSearchSettings.injuryVal != null) {
              this.setValue(patientSearchSettings.injuryVal);
            }
          }
        }
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
        width: 500,
        mode: 'local',
        valueField: 'ValueCode',
        displayField: 'ValueName',
        editable: false,
        store: storeSpecialFractureOptions,
        listeners: {
          afterrender: function () {
            if (patientSearchSettings.specialFractureVal != null) {
              this.setValue(patientSearchSettings.specialFractureVal);
            }
            Ext.tip.QuickTipManager.register({
              target: specialFractureOptionsCmp.id,
              text: 'Misstänkt osteoporosfraktur definieras vid denna utsökning som en fraktur hos patient 50 år eller äldre och som registrerats ha en fraktur av proximala humerus, höft, bäcken, acetabulum, handled eller rygg.',
              autoHide: false
            });
          }
        }
      });
      var prom0FilterLabel = Ext.create('Ext.form.Label', { text: 'Prom dag 0:' });
      var prom1FilterLabel = Ext.create('Ext.form.Label', { text: 'Prom 1 år' });
      var fractureTreatLabel = Ext.create('Ext.form.Label', { text: 'Fraktur/Behandling:' });
      var emptyInjuryFormLabel = Ext.create('Ext.form.Label', { text: 'Skadetillfälle:' });
      var specialFractureLabel = Ext.create('Ext.form.Label', { text: 'Speciella frakturtyper:' });
      cmps.splice(4, 0, emptyInjuryFormLabel, emptyInjuryFormOptionsCmp, prom0FilterLabel, prom0OptionsCmp, prom1FilterLabel, prom1OptionsCmp, fractureTreatLabel, fractureTreatOptionsCmp, specialFractureLabel, specialFractureOptionsCmp);
      return cmps;
    }
  }
};

Ext.util.CSS.removeStyleSheet('accidents');
Ext.util.CSS.createStyleSheet('' +
'.x-panel label {color: darkslategrey;}',
'accidents'
);

SfrSearchList();
