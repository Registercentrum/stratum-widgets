
var SfrWidget = {
  parameters: {
    openphyses: 'openphyses',
    elapsedtime: 'elapsedtime',
    tidsper: 'tidsper',
    icd10sp: 'icd10sp',
    promindexfotled: 'promindexfotled',
    promindexhandled: 'promindexhandled',
    injyear: 'injyear',
    icd10fotled: 'icd10fotled',
    trttype2: 'trttype2',
    trttype3: 'trttype3', 
    from_dat: 'from_dat', 
    from_trt_dat: 'from_trt_dat',
    from_fx_savedate: 'from_fx_savedate',
    injtype: 'injtype',
    injgroup: 'injgroup',
    samtidfrakt: 'samtidfrakt', 
    bodypart: 'bodypart', 
    icd10: 'icd10', 
    open: 'open',
    fxclassgroup: 'fxclassgroup', 
    fxclass: 'fxclass',
    behsekv: 'behsekv', 
    surgery: 'KirNoKir',
    trttype: 'trttype',
    trtmainsurg: 'trtmainsurg',
    trtgrp: 'trtgrp',
    trtcode: 'trtcode',
    from_age: 'from_age',
    to_age: 'to_age', 
    gender: 'gender', 
    enhet: 'enhet',
    statOut: 'statOut',
    to_trt_dat: 'to_trt_dat',
    to_fx_savedate: 'to_fx_savedate', 
    to_dat: 'to_dat',
    clinic: 'clinic',
    incomplete: 'increg',
    special: 'spcfx'
  },
  
  init: function (callBackFn) {
    Ext.Ajax.request({
      url: '/stratum/api/metadata/domainvalues/domain/4299',
      method: 'GET',
      success: function (response) {
        SfrWidget.init.icd10Groups = Ext.decode(response.responseText).data;
        Ext.Ajax.request({
          url: '/stratum/api/metadata/domains/4300',
          method: 'GET',
          success: function (response) {
            var responseData = Ext.decode(response.responseText).data;
            var data = responseData['DomainValues'];
            SfrWidget.init.opTypeGroups = data;
            callBackFn();
          }
        });
      }
    });
  },
  
  createDiagram: function (config) {
    if(!Array.isArray(config.yFields)) {
      config.yFields = [];
    }
    if (config.yField && config.yFields.length === 0) {
      config.yFields[0] = config.yField;
    }
    var hasMultipleYfields = config.yFields.length > 1;
    
    var modelName = 'model' + config.reportID;
    if (!Ext.ClassManager.isCreated(modelName)) {
      Ext.define(modelName, {
        extend: 'Ext.data.Model',
        fields: [{
          name: config.xField,
          type: 'string',
          useNull: true
        }, {
          name: config.yFields[0],
          type: 'float',
          useNull: true
        }, {
          name: config.yFields[1] || 'y2',
          type: 'float',
          useNull: true
        }, {
          name: config.yFields[2] || 'y3',
          type: 'float',
          useNull: true
        }]
      });
    }
    
    var dummyStore = Ext.create('Ext.data.Store', {
      model: modelName
    });
    
    var store = Ext.create('Ext.data.Store', {
      model: modelName,
      proxy: {
        type: 'memory',
        reader: {
          type: 'json'
        }
      }
    });
    
    var chart;
    if (config.chartType == 'bar') {
      chart = Ext.create('Ext.chart.Chart', {
        hidden: config.extraChartParameterKey == SfrWidget.parameters.clinic,
        store: dummyStore,
        background: '#F1F1F1',
        insetPadding: '10 30 10 10',
        width: '100%',
        height: 300,
        animate: true,
        shadow: false,
        flipXY: config.flipChart,
        style: {
          borderWidth: '1px',
          borderColor: '#ddd',
          borderStyle: 'solid',
          borderRadius: '5px',
          minGapWidth: 20,
        },
        legend: {
          position: 'top',
          hidden: !hasMultipleYfields,
          html: '',
          toggleable: false,
          style: {
            background: "#fffffe",
          }
        },
        axes: [
          {
            type: 'numeric',
            fields: config.yFields,
            position: config.flipChart ? 'top' : 'left',
            constrain: false,
            titleMargin: 5,
            label: {
              fontSize: 12,
              x: config.flipChart ? 0 : -5,
            },
            grid: {
              odd: {
                opacity: 0.5,
                fill: '#ddd'
              }
            },
            limits: [{
              value: config.limit,
              hidden: true,
              line: {
                strokeStyle: config.limit ? '#000' : 'transparent',
                lineDash: [2, 2],
                lineWidth: 1,
              },
            }],
            renderer: function (v, b, c) {
              return b.renderer(v) + (config.isPercentage ? '%' : '');
            },
          }, {
            type: 'category',
            position: config.flipChart ? 'left' : 'bottom',
            fields: [config.xField],
            titleMargin: config.flipChart ? 10 : 10,
            label: {
              fontSize: 12,
              x: config.flipChart ? -10 : 0
            },
            renderer: function (label) {
              if (label.length > 24) {
                label = label.substring(0, 24) + ' ';
              }
              
              return label;
            }
          }
        ],
        series: [{
          xField: config.xField,
          yField: config.yFields,
          colors: config.colors || null,
          stacked: hasMultipleYfields,
          title: '',
          type: 'bar',
          style: {
            strokeStyle: '#000',
            opacity: 0.7
          },
          highlightCfg: {
            opacity: 1.0,
          },
          axis: config.flipChart ? 'top' : 'left',
          tips: {
            trackMouse: true,
            renderer: function (storeItem, item) {
              var text = '';
              var attribut = storeItem.get('Attribut');
              var andel = storeItem.get('Andel');
              var namnare = storeItem.get('Namnare');
              var antal = storeItem.get('Antal');
              var summa = storeItem.get('Summa');
              var antal1 = storeItem.get('Antal1');
              var antal2 = storeItem.get('Antal2');
              var antal3 = storeItem.get('Antal3');
              var andel1 = storeItem.get(config.yFields[0]);
              var andel2 = storeItem.get(config.yFields[1]);
              var andel3 = storeItem.get(config.yFields[2]);
              var median = storeItem.get('Median');
              var medelvarde = storeItem.get('Mean');
              var kategoritotal = storeItem.get('KategoriTotal');
              var q1 = storeItem.get('Q1');
              var q3 = storeItem.get('Q3');
              var max = storeItem.get('Max');
              var missing = storeItem.get('NAs');
              var totaltAntal = storeItem.get('TotalAntal');
              var ucl = storeItem.get('UCL');
              var lcl = storeItem.get('LCL');
              if (hasMultipleYfields) {
                if (andel1 !== undefined) {
                  text += '<br/>'
                  text += config.yFields[0] + ' : ' + andel1 + '%';
                }
                if (andel2 !== undefined) {
                  text += '<br/>'
                  text += config.yFields[1] + ' : ' + andel2 + '%';
                }
                if (andel3 !== undefined) {
                  text += '<br/>'
                  text += config.yFields[2] + ' : ' + andel3 + '%';
                }
                if (andel1 !== undefined) {
                  this.update(storeItem.get(config.xField) + ': ' + text + '<br/>' + 'n=' + summa);
                  return;
                }
              }
              if (median !== undefined) {
                text += '<br/>Median: ' + median + '<br/>';
              }
              if (medelvarde !== undefined) {
                text += 'Medelvärde: ' + medelvarde + '<br/>';
              }
              if (max !== undefined) {
                text += 'Max: ' + max + '<br/>';
              }
              if (q1 !== undefined) {
                text += '25:e-percentil: ' + q1 + '<br/>';
              }
              if (q3 !== undefined) {
                text += '75:e-percentil: ' + q3 + '<br/>';
              }
              if (andel !== undefined) {
                text += andel + '%<br/>';
              }
              if (lcl !== undefined) {
                text += 'Undre 95% konf.gräns: ' + lcl + '<br/>';
              }
              if (ucl !== undefined) {
                text += 'Övre 95% konf.gräns: ' + ucl + '<br/>';
              }
              if (kategoritotal !== undefined) {
                text += ' (' + antal + '/' + kategoritotal + ')<br/>';
              }
              else if (antal !== undefined) {
                text += 'n=' + antal + '<br/>';
              }
              if (namnare !== undefined) {
                text += 'Totalt antal: ' + namnare;
              }
              var xName = storeItem.get(config.xField);
              if (attribut !== undefined) {
                xName = attribut;
              }
              this.update(xName + ': ' + text);
              return;
            }
          },
          label: hasMultipleYfields ? null : {
            field: config.yFields,
            display: 'insideEnd',
            orientation: 'horizontal',
            calloutColor: 'none',
            renderer: function (label, ctx, lastLabel, store, index) {
              label = '';
              
              if (store.store.fractureData[index][config.yFields[0]] == 0) {
                label = '0';
                if (config.isPercentage) {
                  label += '%';
                }
              }

              if (config.isPercentage) {
                if (!store.store.fractureData[index].Andel || store.store.fractureData[index].Andel === 'NA') {
                  label = 'Ingen\ndata';
                }
              }
              
              return label;
            }
          },
          renderer: function (aSprite, aConfig, aRenderedData, anIndex) {
            if (config.reportID == 'sfrutdata_43' || config.reportID == 'sfrutdata_44') {
              var c = '#C0504D';
              if (anIndex % 2 == 0) {
                c = '#4F81BD';
              }
              aConfig.fill = c;
              return aConfig;
            }
            
            if (config.colors) {
              return aConfig;
            }
            if (aRenderedData == undefined) {
              return;
            }
            var record = aRenderedData.store.getAt(anIndex);
            if (Ext.isEmpty(record)) {
              return;
            }
            
            var color = SfrWidget.getColor(config && config.xField ? record.data[config.xField] : record.data.origXname);
            if (color != '') {
              aConfig.fill = color;
            }
            return aConfig;
          },
        }]
      });
    }
    
    var saveButton = Ext.create('Ext.Button', {
      hidden: config.extraChartParameterKey == SfrWidget.parameters.clinic,
      text: 'Spara diagram',
      handler: function () {
        var title = Ext.query('h1')[0].textContent;
        title = title.replace(/[å,Å,ä,Ä]/g, 'a');
        title = title.replace(/[Ö,ö]/g, 'o');
        var config = { filename: title };
        chart.download(config);
      }
    });
    
    var chartSummary = Ext.create('Ext.Component', {
      html: '',
      width: 640,
      height: 25
    });
    
    if (!config.parameters) {
      getReport(null);
    }
    
    if (config.mainChart != null) {
      if (config.extraChartParameterKey !== SfrWidget.parameters.clinic) {
        config.mainChart.extraChartReport = getReport;
      } else {
        config.mainChart.extraClinicChartReport = getReport;
      }
      return [saveButton, chart, chartSummary];
    }
    
    var title = Ext.create('Ext.Component', {
      margin: '65 0 10 0',
      html: '<h2 align="left">' + config.title + '</h2>',
      width: 640,
      listeners: {
        render: function (c) {
          if (config.titleToolTip) {
            Ext.tip.QuickTipManager.register({
              target: c.id,
              text: config.titleToolTip,
              autoHide: false
            });
          }
        }
      }
    });
    
    var selectedMaster = Ext.create('Ext.Component', {
      html: '',
      width: 640,
      height: 25
    });
    
    var indicatorPanel = Ext.create('Ext.panel.Panel', {
      layout: 'vbox',
      width: '100%',
      margin: '0 1px 0 0',
      bodyPadding: 10,
      collapsible: true,
      frame: true,
      collapsed: true,
      listeners: {
          beforecollapse: function () {
              var y = typeof window.scrollY === 'undefined' ? window.pageYOffset : window.scrollY;
              SfrWidget.scrollYPos = y;
          },
          collapse: function () {
              Ext.defer(function () { scrollTo(0, SfrWidget.scrollYPos); }, 0);
          },
          beforeexpand: function () {
              var y = typeof window.scrollY === 'undefined' ? window.pageYOffset : window.scrollY;
              SfrWidget.scrollYPos = y;
          },
          expand:  function () {
              Ext.defer( function () { scrollTo(0, SfrWidget.scrollYPos); }, 0);
          }
      }
    });
    
    var chartTitle = Ext.create('Ext.Component', {
      html: '<h3 align="center">' + (config.chart1Header || '') + '</h3>',
      width: 700,
      height: 25
    });
    
    if (config.parameters && config.mainChart == null) {
      var filterComponents = SfrWidget.createFilterComponents(config.parameters);
      config.submitButton = createSubmitButton();
      indicatorPanel.add(filterComponents);
      indicatorPanel.add(config.submitButton);
      indicatorPanel.add(selectedMaster);
    }
    
    indicatorPanel.items.add(chartTitle);
    indicatorPanel.items.add(saveButton);
    indicatorPanel.items.add(chart);
    indicatorPanel.items.add(chartSummary);
    
    if (config.createExtraChart) {
      if (config.chart2Header) {
        var chart2HeaderCmp = Ext.create('Ext.Component', {
          html: '<h3 align="center">' + config.chart2Header + '</h3>',
          width: '100%',
          height: 25
        });
        indicatorPanel.items.add(chart2HeaderCmp);
      }
      var myConfig = Ext.clone(config);
      myConfig.createExtraChart = false;
      myConfig.chart1Header = '';
      myConfig.chart2Header = '';
      myConfig.mainChart = chart;
      var extraChartComponents = this.createDiagram(myConfig);
      
      for (i = 0; i < extraChartComponents.length; i++) {
        indicatorPanel.items.add(extraChartComponents[i]);
      }
      
      if (filterComponents) {
        var clinicFilterExists;
        for (var i = 0; i < filterComponents.length; i++) {
          if (filterComponents[i].parameterKey == SfrWidget.parameters.clinic || filterComponents[i].parameterKey == SfrWidget.parameters.enhet) {
            clinicFilterExists = true;
          }
        }
        if (clinicFilterExists && config.chart2Header) {
          var chart3Header = Ext.create('Ext.Component', {
            hidden: true,
            id: 'AnnanKlinik' + config.reportID,
            html: '<h3 align="center">' + 'Annan klinik' + '</h3>',
            width: '100%',
            height: 25
          });
          
          indicatorPanel.items.add(chart3Header);
          var myConfig = Ext.clone(config);
          myConfig.chart1Header = '';
          myConfig.chart2Header = '';
          myConfig.createExtraChart = false;
          myConfig.extraChartParameterKey = SfrWidget.parameters.clinic;
          myConfig.mainChart = chart;
          var chart3Components = this.createDiagram(myConfig);
          
          for (i = 0; i < chart3Components.length; i++) {
            indicatorPanel.items.add(chart3Components[i]);
          }
        }
      }
    }
    
    return [title, indicatorPanel];
    
    function createSubmitButton() {
      var button = Ext.create('Ext.Button', {
        text: 'Hämta statistik',
        style: {
          marginBottom: '4px',
          marginTop: '4px'
        },
        
        handler: function (a1, a2, a3, a4) {
            
          if (config.masterSelect) {
            var mSel = config.masterSelect;
            var val = mSel.getValue();
            if (!val) {
              config.submitButton.setDisabled(false);
              Ext.Msg.show({
                title: 'Huvudval',
                msg: 'Inget huvudval gjort.',
                buttons: Ext.Msg.OK,
                icon: Ext.MessageBox.INFO,
                width: 600
              });
              return;
            }
            else {
              selectedMaster.update('<span style="color:red;"><b>Huvudval:</b></span> <b>' + config.masterSelect.getRawValue()) + '</b>';
            }
          }
          spin(config.submitButton, 'Hämtar', 120, null);
          SfrWidget.createDiagram.nrStoresToTransform = 1;
          SfrWidget.createDiagram.nrStoresTransformed = 0;
          
          if (chart.extraChartReport) {
            chart.extraChartReport(filterComponents);
            SfrWidget.createDiagram.nrStoresToTransform++;
          }
          
          if (chart.extraClinicChartReport) {
            var extraClinicChoosen = filterComponents.filter(function(i){return i.itemId==='enhet'})[0].getValue();
            if(extraClinicChoosen) {
              chart.extraClinicChartReport(filterComponents);
            }
          }
          
          /***************TODO:remove similar code from getreport ***************************************************************************/
          for (i = 0; i < filterComponents.length; i++) {
            if (filterComponents[i].parameterKey == SfrWidget.parameters.enhet) {
              if (!Ext.isEmpty(filterComponents[i].getValue())) {
                SfrWidget.createDiagram.nrStoresToTransform++;
              }
            }
          }
          /*********************************************************************************************/
          
          getReport(filterComponents);
        }
      });
      return button;
    }
    
    function transformChart() {
      var countField;
      var totalAntal;
      
      var record = store.getData().items[0];
      totalAntal = record && record.get('TotalAntal') || 0;
      countField = record && record.get('N') || countField;
      countField = record && record.get('Summa') || countField;
      countField = config.isNdata ? config.yFields[0] : countField;
      
      if(!totalAntal && countField) {
        store.each(function (record) {
          totalAntal += parseInt(record.get(countField));
        });
      }
      var updateTxt = config.footerTxt || 'Antal observationer';
      updateTxt = totalAntal ? updateTxt += ': ' + totalAntal : '';
      chartSummary.update(updateTxt);
      
      chart.resumeEvents();
      chart.bindStore(store);
      chart.setColors(getColors(store));
      
      if (config.flipChart) {
        chart.height = (chart.getStore().getData().items.length * 25) + 40;
        var panel = chart.container.component;
        var scrollsave = typeof window.scrollY === 'undefined' ? window.pageYOffset : window.scrollY;
        panel && panel.updateLayout();
        scrollTo(0, scrollsave);
      }
      
      if (config.submitButton && SfrWidget.createDiagram.nrStoresToTransform) {
        SfrWidget.createDiagram.nrStoresTransformed++;
        if (SfrWidget.createDiagram.nrStoresTransformed === SfrWidget.createDiagram.nrStoresToTransform) {
          config.submitButton.setDisabled(false);
          unspin();
        }
      }
    }
    
    function getColors(store) {
      var colors = [];
      store.each(function (record) {
        colors.push(SfrWidget.getColor(config && config.xField ? record.data[config.xField] : record.data.origXname));
      });
      return colors;
    }
    
    function getReport(filters) {
      if (config.submitButton) config.submitButton.hasFocus = false;
      config.submitButton && config.submitButton.setDisabled(true);
      
      var parameters = SfrWidget.getParameters(filters, config);
      
      if (!chart.isVisible()) {
        var annanKlinikTitle = Ext.getCmp('AnnanKlinik' + config.reportID);
        if (annanKlinikTitle)
        annanKlinikTitle.setVisible(true);
      }
      chart.setVisible(true);
      saveButton.setVisible(true);
      Ext.Ajax.request({
        url: '/stratum/api/statistics/sfr/' + config.reportID + '?apikey=bK3H9bwaG4o%3D' + parameters, //TODO //https://stratum.registercentrum.se
        method: 'GET',
        timeout: 60000,
        success: function (response, opts) {
          var responseData = Ext.decode(response.responseText).data;
          if(responseData[0].Andel==='NA')responseData[0].Andel="0";
          if (chart.store != null) {
            chart.bindStore(dummyStore);
            store.fractureData = Ext.decode(response.responseText).data;
            store.loadRawData(responseData);
            transformChart();
          }
        },
        failure: function () {
          unspin();
          Ext.Msg.show({
            title: 'Fel vid hämtning',
            msg: 'Okänt fel uppstod vid hämtning av statistik.',
            buttons: Ext.Msg.OK,
            icon: Ext.MessageBox.INFO,
            width: 600
          });
        }
      });
    }
  },
  
  createFilterComponents: function (config) {
    var parameters = SfrWidget.parameters;
    var filterComponents = [];
    var values = [];
    
    values[parameters.openphyses] = {text: 'Öppna/Slutna fyser:', domain: null, options: [
      { ValueName: '',       ValueCode: null}, 
      { ValueName: 'Slutna', ValueCode: '0'}, 
      { ValueName: 'Öppna',  ValueCode: '1'}
    ]};
    values[parameters.gender] = {text: 'Kön:', options: [
      { ValueName: '',       ValueCode: null}, 
      { ValueName: 'Man',    ValueCode: '1'}, 
      { ValueName: 'Kvinna', ValueCode: '2' }
    ]},
    values[parameters.elapsedtime] = { text: 'Tidsgräns:', options: [
      { ValueName: '24 tim', ValueCode: '24'}, 
      { ValueName: '36 tim', ValueCode: '36'}
    ]},
    values[parameters.icd10sp] = { text: 'Diagnoskod:', options: [
      { ValueName: '',            ValueCode: null}, 
      { ValueName: 'S72.0',       ValueCode: 'S72.0' }, 
      { ValueName: 'S72.1',       ValueCode: 'S72.1' }, 
      { ValueName: 'S72.2',       ValueCode: 'S72.2' }, 
      { ValueName: 'S72.3',       ValueCode: 'S72.3'}, 
      { ValueName: 'S72.4',       ValueCode: 'S72.4' }, 
      { ValueName: 'S72.0-S72.2', ValueCode: 'S72.0-S72.2' }, 
      { ValueName: 'S72.3-S72.4', ValueCode: 'S72.3-S72.4'}
    ]},
    values[parameters.promindexfotled] = { text: 'PROM-index:', default: '1', options: [
      { ValueName: 'Dysfunktion ', ValueCode: '1'}, 
      { ValueName: 'Mobility',     ValueCode: '3'}
    ]},
    values[parameters.promindexhandled] = { text: 'PROM-index:', default: '1', options: [
      { ValueName: 'Dysfunktion ',      ValueCode: '1'}, 
      { ValueName: 'Arm/hand funktion', ValueCode: '2'}
    ]},
    values[parameters.icd10fotled] = { text: 'ICD10:', options: [
      { ValueName: 'S82.6', ValueCode: 'S82.6' }, 
      { ValueName: 'S82.8', ValueCode: 'S82.8' }
    ]},
    values[parameters.trttype2] = { text: 'Behandlingstyp:', options: [
      { ValueName: '(1) Operation som första behandlingsval', ValueCode: '2'}, 
      { ValueName: '(2) Operation efter ickekir övergivits',  ValueCode: '3'}, 
      { ValueName: '(3) Planerat följdingrepp',               ValueCode: '4'}, 
      { ValueName: '(4) Primäroperation: (1), (2), (3)',      ValueCode: '0'}, 
      { ValueName: '(5) Reoperation',                         ValueCode: '9'}
    ]},
    values[parameters.trttype3] = { text: 'Behandlingstyp:', options: [
      { ValueName: '',                                              ValueCode: null}, 
      { ValueName: '(1) Operation som första behandlingsval',       ValueCode: '2'}, 
      { ValueName: '(2) Operation efter ickekir tidigt övergivits', ValueCode: '3'}, 
      { ValueName: '(3) Primäroperation: (1), (2)',                 ValueCode: '23'}, 
      { ValueName: '(4) Planerat följdingrepp',                     ValueCode: '4'}, 
      { ValueName: '(5) Reoperation',                               ValueCode: '5'}
    ]},
    values[parameters.samtidfrakt] = { text: 'Antal samtidiga frakturer:', onselect: onBodyPartSelected, options: [
      { ValueName: '',      ValueCode: null}, 
      { ValueName: 'En',    ValueCode: '1' }, 
      { ValueName: 'Flera', ValueCode: '2' }
    ]},
    values[parameters.open] = { text: 'Öppen/Sluten fraktur:', options: [
      { ValueName: '',       ValueCode: null}, 
      { ValueName: 'Öppen',  ValueCode: '1'}, 
      { ValueName: 'Sluten', ValueCode: '0'}
    ]};
    values[parameters.behsekv] = { text: 'Behandlingssekvens:', options: [
      { ValueName: '',                              ValueCode: null}, 
      { ValueName: 'Icke-kirurgi',                  ValueCode: '1'}, 
      { ValueName: 'Primär kirurgisk behandling',   ValueCode: '2'}, 
      { ValueName: 'Reoperationer/Op i sent skede', ValueCode: '3'}
    ]};
    values[parameters.surgery] = { text: 'Kirurgi/icke-kirurgi:', options: [
      { ValueName: '',             ValueCode: null}, 
      { ValueName: 'Icke kirurgi', ValueCode: '1'}, 
      { ValueName: 'Kirurgi',      ValueCode: '2'}
    ]};
    values[parameters.statOut] = { text: 'Median/Medelvärde', default: '0', options: [
      { ValueName: 'Median',     ValueCode: '0' }, 
      { ValueName: 'Medelvärde', ValueCode: '1' }
    ]};
    
    values[parameters.injyear]      = { text: 'Skadeår:', options: getYears(), domain: null, default: '2017'},
    values[parameters.to_age]       = { text: 'Patientålder <', options: getAges()},
    values[parameters.from_age]     = { text: 'Patientålder >=', options: getAges()},
    values[parameters.tidsper]      = { text: 'Tidsperiod:', default: '3'},
    values[parameters.enhet]        = { text: 'Annan Klinik', unit: true, sorters: { property: 'ValueName', direction: 'ASC' }},
    values[parameters.injtype]      = { text: 'Skadetyp:', domain: 4049},
    values[parameters.bodypart]     = { text: 'Kroppsdel:', domain: 4299},
    values[parameters.trttype]      = { text: 'Behandlingstyp:', domain: 4056};
    values[parameters.fxclassgroup] = { text: 'Frakturtypsgrupp:', domain: 4488};
    values[parameters.injgroup]     = { text: 'Skadeorsaksgrupp:', domain: 4312},
    values[parameters.trtmainsurg]  = { text: 'Operatörskategori:', domain: 4059};
    
    // values[parameters.icd10]            = { text: 'ICD10:', domain: 4061 };
    // values[parameters.fxclass]          = { text: 'Frakturtyp:', domain: 4060, dependencies: ['icd10']}
    // values[parameters.trtgrp]           = { text: 'Op-metod:', domain: 4059, dependencies: ['bodypart']};
    // values[parameters.trtcode]          = { text: 'Behandlingskod:', domain: 4059, dependencies: ['bodypart', 'icd10', 'trttype']};
    
    var keys = Object.keys(parameters);
    for (var p = 0; p < keys.length; p++) {
      var parameter = keys[p];
      var i = config.indexOf(parameter);
      if (parameter === parameters.tidsper ) i = indexOfTimePeriod(config);
      if (i < 0) continue;
      var item = config[i];
      if (item.indexOf(':') > 1) {
        item = item.slice(0, item.indexOf(':'));
        if (item === parameters.tidsper) values[item].options = getTimePeriods(config[i].slice(config[i].indexOf(':') +1 , config[i].length).split(','));
      }
      if (item === parameters.from_dat)     getDateFilter();
      if (item === parameters.from_trt_dat) getTreatmentDateFilter();
      if (item === parameters.from_fx_savedate) getSaveDateFilter();
      if (item === parameters.icd10)        getIcd10();
      if (item === parameters.fxclass)      getFxClass();
      if (item === parameters.trtgrp)       getTreatmentGroupFilter();
      if (item === parameters.trtcode)      getTreatmentCode();
      
      if (values[item]) {
        label = Ext.create('Ext.form.Label', { text: values[item].text });
        filterComponents.push(label);
        filterComponents.push(
          createFilterComponent(
            item,
            values[item]
          )
        );
      }
    }
    
    for (var i = 0; i < filterComponents.length; i++) {
      var currentCmp = filterComponents[i];
      if (currentCmp instanceof Ext.form.ComboBox) {
        currentCmp.on('select', Ext.bind(this.onFilterChanged, this, [currentCmp, filterComponents], false));
        currentCmp.getStore().on('datachanged', Ext.bind(this.onFilterChanged, this, [currentCmp, filterComponents], false));
        currentCmp.getStore().on('clear', Ext.bind(this.onFilterChanged, this, [currentCmp, filterComponents], false));
      }
    }
    
    return filterComponents;
    
    function indexOfTimePeriod(config) {
        for(var i = 0; i < config.length; i++) {
            if (config[i].indexOf('tidsper') > -1) return i;
        }
        return -1;
    }
    
    function getDateFilter() {
      label = Ext.create('Ext.form.Label', { text: 'Fr.o.m. skadedatum:' });
      filterComponents.push(label);
      
      var startDateField = Ext.create('Ext.form.DateField', {
        format: 'Y-m-d',
        altFormats: "Ymd|ymd",
        width: 150,
        editable: true,
        allowBlank: false,
        maxValue: new Date(),
        parameterKey: parameters.from_dat,
        value: d = new Date(new Date().getFullYear(), 0, 1)
      });
      
      filterComponents.push(startDateField);
      label = Ext.create('Ext.form.Label', {text: 'T.o.m. skadedatum:'});
      
      filterComponents.push(label);
      var endDateField = Ext.create('Ext.form.DateField', {
        format: 'Y-m-d',
        altFormats: "Ymd|ymd",
        allowBlank: false,
        editable: true,
        width: 150,
        value: new Date(),
        parameterKey: parameters.to_dat
      });
      filterComponents.push(endDateField);
    }

    function getSaveDateFilter() {
      label = Ext.create('Ext.form.Label', { text: 'Fr.o.m. datum för frakturregistrering:' });
      filterComponents.push(label);

      var startDateField = Ext.create('Ext.form.DateField', {
        format: 'Y-m-d',
        altFormats: "Ymd|ymd",
        width: 150,
        editable: true,
        allowBlank: true,
        maxValue: new Date(),
        parameterKey: parameters.from_fx_savedate,
      });

      filterComponents.push(startDateField);
      label = Ext.create('Ext.form.Label', {text: 'T.o.m. datum för frakturregistrering:'});

      filterComponents.push(label);
      var endDateField = Ext.create('Ext.form.DateField', {
        format: 'Y-m-d',
        altFormats: "Ymd|ymd",
        allowBlank: true,
        editable: true,
        width: 150,
        parameterKey: parameters.to_fx_savedate
      });
      filterComponents.push(endDateField);
    }
    
    function getTreatmentDateFilter() {
      label = Ext.create('Ext.form.Label', {
        text: 'Fr.o.m. behandlingsdatum:'
      });
      filterComponents.push(label);
      var startDateField = Ext.create('Ext.form.DateField', {
        format: 'Y-m-d',
        altFormats: "Ymd|ymd",
        width: 150,
        editable: false,
        allowBlank: false,
        maxValue: new Date(),
        x: 297,
        y: 0,
        parameterKey: parameters.from_trt_dat, //TODO
        value: d = new Date(new Date().getFullYear(), 0, 1)
      });
      filterComponents.push(startDateField);
      var endDateField = Ext.create('Ext.form.DateField', {
        format: 'Y-m-d',
        altFormats: "Ymd|ymd",
        allowBlank: false,
        editable: false,
        width: 150,
        x: 297,
        y: 0,
        value: new Date(),
        parameterKey: parameters.to_trt_dat
      });
      label = Ext.create('Ext.form.Label', {
        text: 'T.o.m. behandlingsdatum:'
      });
      filterComponents.push(label);
      filterComponents.push(endDateField);
    }
    
    function getIcd10() {
      filterComponents.push(Ext.create('Ext.form.Label', {text: 'ICD10:'}));
      filterComponents.push(createParametersCmp(3134, [combo(parameters.bodypart)], parameters.icd10, ''));
    }
    
    function getFxClass() {
      filterComponents.push(Ext.create('Ext.form.Label', {text: 'Frakturtyp:'}));
      var dependencies = [];
      combo(parameters.fxclassgroup) && dependencies.push(combo(parameters.fxclassgroup));
      combo(parameters.icd10) && dependencies.push(combo(parameters.icd10));
      filterComponents.push(createParametersCmp(3136, dependencies, parameters.fxclass, ''));
    }
    
    function getTreatmentGroupFilter() {
      label = Ext.create('Ext.form.Label', {
        text: 'Op-metod:'
      });
      filterComponents.push(label);
      var opMethodCmp = createParametersCmp(3137, [combo(parameters.bodypart)], parameters.trtgrp, '')
      filterComponents.push(opMethodCmp);
    }
    
    function getTreatmentCode() {
      label = Ext.create('Ext.form.Label', { text: 'Behandlingskod:' });
      filterComponents.push(label);
      var treatCodesCmp = createParametersCmp(3138, [combo(parameters.bodypart), combo(parameters.icd10), combo(parameters.trtgrp)], SfrWidget.parameters.trtcode, '');
      filterComponents.push(treatCodesCmp);
    }
    
    function combo(parameter) {
      return filterComponents.filter(function(i){return i.itemId===parameter})[0];
    }
    
    function getNoSelectionObject(text) {
      return {
        ValueName: text,
        ValueCode: null
      };
    }
    
    function getYears() {
      var currentDate = new Date();
      var maxYear = 0;
      var items = [];
      if (currentDate.getMonth() < 6)
      maxYear = currentDate.getFullYear() - 2;
      else
      maxYear = currentDate.getFullYear() - 1;
      for (var i = maxYear; i >= 2012; i--) {
        var o = {
          ValueName: i,
          ValueCode: i
        }
        items.push(o);
      }
      return items;
    }
    
    function onBodyPartSelected(combo, record, opts) {
      var val = combo.getValue();
      var disabled = val == 2;
      var paramNames = SfrWidget.parameters;
      for (var i in filterComponents) {
        
        var cmp = filterComponents[i];
        if (cmp.parameterKey == undefined || cmp.parameterKey == paramNames.from_dat || cmp.parameterKey == paramNames.to_dat || cmp.parameterKey == paramNames.gender || cmp.parameterKey == paramNames.to_age || cmp.parameterKey == paramNames.from_age || cmp.parameterKey == paramNames.enhet || cmp.parameterKey == paramNames.statOut || cmp.parameterKey == paramNames.samtidfrakt)
        continue;
        cmp.setDisabled(disabled);
        if (disabled)
        cmp.setValue(null);
      }
    }
    
    function getAges() {
      var ages = new Array();
      ages.push({ValueName: '', ValueCode: null});
      for (var i = 0; i <= 120; i++) {
        ages.push({
          ValueName: i.toString(),
          ValueCode: i.toString()
        });
      }
      return ages;
    }
    
    function getTimePeriods(items) {
      var options = [];
      for(var i = 0; i < items.length; i++) {
        options.push({ValueName: items[i] + ' år', ValueCode: items[i]})
      }
      return options;
    }
    
    function createFilterComponent(key, config) {
      var store = new Ext.data.Store({
        fields: ['ValueName', 'ValueCode'],
        data: config.options,
        sorters: config.sorters || [],
      });
      
      if (config.domain) {
        Ext.Ajax.request({
          url: '/stratum/api/metadata/domains/' + config.domain,
          method: 'GET',
          success: function (response, opts) {
            var responseData = Ext.decode(response.responseText).data;
            var data = responseData['DomainValues'];
            data.splice(0, 0, {Valuecode: '', ValueName: ''})
            store.loadData(data);
          }
        });
      }
      if(config.unit) {
        Ext.Ajax.request({
          url: '/stratum/api/metadata/units/register/110?apikey=bK3H9bwaG4o%3D',
          method: 'GET',
          success: function (response, opts) {
            var responseData = response.responseText;
            responseData = responseData.replace(new RegExp('UnitName', 'g'), 'ValueName');
            responseData = responseData.replace(new RegExp('UnitCode', 'g'), 'ValueCode');
            var data = Ext.decode(responseData).data;
            store.loadData(data);
          }
        });
      }
      
      return new Ext.form.ComboBox({
        itemId: key,
        parameterKey: key,
        store: store,
        width: '50%',
        queryMode: 'local',
        sortfield: 'ValueName',
        displayField: 'ValueName',
        valueField: 'ValueCode',
        editable: false,
        value: config.default,
        listeners: {
          select: config.onselect || function() {return;},
        },
        dependencies: config.dependencies
      });
    }
    
    function createParametersCmp(reportID, dependencyCmps, parameterKey, defaultValue) {
      var comboParamsStore = Ext.create('Ext.data.Store', {
        fields: [{
          name: 'ValueName',
          type: 'string'
        }, {
          name: 'ValueCode',
          type: 'string'
        }],
        sortOnLoad: false
      });
      
      var comboParamsBox = Ext.create('Ext.form.ComboBox', {
        itemId: parameterKey,
        store: comboParamsStore,
        width: '50%',
        queryMode: 'local',
        displayField: 'ValueName',
        valueField: 'ValueCode',
        dependencyCmps: dependencyCmps,
        parameterKey: parameterKey,
        defaultParameterKeyValue: defaultValue,
        reportID: reportID,
        remoteSort: true,

        forceSelection: true,
        editable: false,
        noSelectionObject: getNoSelectionObject(''),
        listConfig: {
          getInnerTpl: function(displayField) {
           return '<tpl if="xindex%2==0"><div class="sfr-odd"></tpl><tpl  if="xindex%2==1"><div class="sfr-even"></tpl> {' + displayField + '} </div>';
          }
        },
      });
      
      return comboParamsBox;
    }
  },
  
  getColor: function (xValue) {
    xValue = xValue.toLowerCase();
    var colors = {
      'inget av ovanstående': '#C0C0C0', 
      'spec. i handkir': 'FF0000', 
      'spec. i ortop. med >50% f': '#FFFF00', 
      'spec. i ortop. >50% barnortop': '#A2AD00',
      'spec. i ortop. >50% rygg': '#FF9E38',
      'spec. i ortop': '#B2DFEE',
      'st läk. med ass': '#3D9140',
      'st-läk': '#3D9140',
      'underläk': '#F0F0F0',
      'operation som första behandlingsval': '#C0504D',
      'operation efter att icke-': '#A2AD00',
      'planerat följdingrepp': '#F0F0F0',
      'icke-kirurgisk behandling': '#4F81BD',
      'kirurgiska behandlingar': '#DC143C',
      'pga felaktigt': '#B2DFEE',
      'pga patientupplevda': '#FFFF00',
      'pga annan orsak': '#3D9140',   
      'pga felställd/felläkt fraktur': '#C0504D',
      'pga infektion': '#A2AD00',
      'pga oläkt fraktur': '#F0F0F0',
      'pga ändrad behandlingsplan': '#4F81BD',
      'pga ändrad diagnos': '#DC143C',
      're-op': '#DC143C',
      'rörlighet': '#C0504D',
      'hygien': '#A2AD00',
      'aktiviteter': '#FFFF00',
      'smärtor': '#4F81BD',
      'oro ': '#DC143C',
      'eq5d-index ': '#3D9140',
      'arm/hand': '#C0504D',
      'dysfunction': '#A2AD00',
      'daily': '#B2DFEE',
      'emotion': '#4F81BD',
      'mobility': '#FF9E38',
      'bother': '#FFFF00',
      'transportolyck': '#3D9140',
      'exponering för mekaniska': '#C0504D',
      'exponering för levande': '#A2AD00',
      'övergrepp av annan person': '#B2DFEE',
      'oklar avsikt': '#4F81BD',
      'avsiktlig självdestruktiv': '#DC143C',
      'polisingripande': '#FFFF00',
      'exponering för natur': '#C0C0C0',
      'exponering för andra': '#FF0000',
      'exponering för ström': '#993399',
      'fall': '#E98300',
      '-a1': '#A2AD00', '-a2': '#A2AD00', '-a3': '#A2AD00', '-a4': '#A2AD00', '-a5': '#A2AD00',
      '-b1': '#FECB00', '-b2': '#FECB00', '-b3': '#FECB00', '-b4': '#FECB00', '-b5': '#FECB00',
      '-c1': '#C0504D', '-c2': '#C0504D', '-c3': '#C0504D', '-c4': '#C0504D', '-c5': '#C0504D',
      'svar finns ej': '#DC143C',
      'svar finns': '#3D9140',
      '2015': '#3D9140', '2017': '#3D9140', '2019': '#3D9140', '2021': '#3D9140', '2023': '#3D9140', '2025': '#3D9140', '2027': '#3D9140',
      '2016': '#DC143C', '2018': '#DC143C', '2020': '#DC143C', '2022': '#DC143C', '2024': '#DC143C', '2026': '#DC143C', '2028': '#DC143C',
    }
    var key = Object.keys(colors).filter(function(item) {return xValue.indexOf(item)>-1; })[0];
    var color = colors[key];
    if(color) {
      return color;
    }
    var i;
    colors = {
      54979: '#614D7D',
      54980: '#C0504D',
      54981: '#A2AD00',
      54982: '#3CB6CE',
      54983: '#4F81BD',
      54984: '#DC143C',
      54985: '#FECB00',
      54986: '#AAA38E',
      54987: '#FF0000',
      54988: '#614D7D',
      54989: '#E98300',
      54990: '#FFAAFF',
      54992: '#3D9140',
      55046: '#C0504D',
      55047: '#A2AD00',
      55048: '#B2DFEE',
      55049: '#4F81BD',
      55051: '#DC143C',
      55052: '#FFFF00',
      55053: '#E98300',
      55054: '#FFAAFF'
    }
    
    var icd10Groups = SfrWidget.init.icd10Groups;
    
    for (i = 0; i < icd10Groups.length; i++){
        if(!icd10Groups[i].Children)continue;
        for (var j = 0; j < icd10Groups[i].Children.length; j++){
            if (xValue == icd10Groups[i].Children[j].ValueName.toLowerCase().substring(0, xValue.length) || icd10Groups[i].ValueName.toLowerCase() == xValue || xValue == icd10Groups[i].Children[j].ValueCode.toLowerCase().substring(0, xValue.length)) {
              if(colors[icd10Groups[i].Children[j].DomainValueID]){
                return colors[icd10Groups[i].Children[j].DomainValueID];
              } else if(colors[icd10Groups[i].DomainValueID]) {
                return colors[icd10Groups[i].DomainValueID];
              }
            }
        }
    }
    
    var opMethodGroups = SfrWidget.init.opTypeGroups;
    for (i = 0; i < opMethodGroups.length; i++) {
      if (xValue == opMethodGroups[i].ValueName.toLowerCase()){
        if(colors[opMethodGroups[i].DomainValueID]){
          return colors[opMethodGroups[i].DomainValueID];
        }
      }
    }
    return '#6fadf2';
  },
  
  onFilterChanged: function (component, filterComponents) {
    var apis = { icd10: 'ui-diagnoses', fxclass: 'ui-ao-classes', trtgrp: 'ui-op-methods', trtcode: 'ui-treatments' };
    var dependentComponents = SfrWidget.getDependentComponents(component, filterComponents);
    
    for (var i = 0; i < dependentComponents.length; i++) {
      dependentComponents[i].clearValue();
      dependentComponents[i].setDisabled(true);

      var parameters = SfrWidget.getParameters(dependentComponents[i].dependencyCmps);
      var api = apis[dependentComponents[i].parameterKey];
      var component = dependentComponents[i];
      
      parameters = parameters.replace(new RegExp('fxclass', 'g'), 'aoclass');
      if (api==='ui-treatments') {
        parameters = parameters.replace(new RegExp('trtgrp'), 'treatmentgroup');   
        if (parameters.indexOf('treatmentgroup') < 0) return;
      }
      
      fetchDropdown(api, component, parameters);
    }

    function dropdownCallback(data, dropdown){
      data.forEach(function(i){ i.ValueName =  i.ValueCode + ' ' + i.ValueName});
      if(!dropdown.isVisible())return;
      dropdown.getStore().loadData(data);
      dropdown.setDisabled(false);
    }

    function fetchDropdown(api, component, query) {
      Ext.Ajax.request({
          url: '/stratum/api/statistics/sfr/' + api + '?apikey=bK3H9bwaG4o%3D' + query,
          method: 'GET',
          success: function (response, opts) {
            var responseData = Ext.decode(response.responseText).data;
            var noop = {ValueCode: '', ValueName: ''};
            responseData.splice(0, 0 , noop);
            dropdownCallback(responseData, component);
          }
      });  
    }
  },
  
  getParameters: function (filterComponents, config) {
    var parameters = '';
    config = config || {};
    
    if (config.masterSelect ) {
      parameters += '&masterval=' + config.masterSelect.getValue();
    }
    
    if (config.createExtraChart) {
      parameters += '&' + SfrWidget.parameters.enhet + '=' + Profile.Context.Unit.UnitCode;
    }
    
    if (!filterComponents) return parameters;
    
    for (var i = 0; i < filterComponents.length; i++) {
      var current = filterComponents[i];
      if (current instanceof Ext.form.Label || (current.parameterKey === SfrWidget.parameters.enhet && config.extraChartParameterKey === 'ClinicALL')) {
        continue;
      }
      if (current instanceof Ext.form.field.Date) {
        if(current.getValue()){
            parameters += '&' + current.parameterKey + '=' + Ext.util.Format.date(current.getValue(), 'Y-m-d');
          }
        continue;
      }
      if (current.getValue()) {
        parameters += '&' + current.parameterKey + '=' + current.getValue();
      }
    }
    
    return parameters;
  },
  
  getDependentComponents: function (component, filterComponents) {
    var dependentComponents = new Array();
    for (var i = 0; i < filterComponents.length; i++) {
      if (filterComponents[i] instanceof Ext.form.Label) continue;
      if (filterComponents[i].dependencyCmps) {
        for (var j = 0; j < filterComponents[i].dependencyCmps.length; j++) {
          if (filterComponents[i].dependencyCmps[j] === component) {
            dependentComponents.push(filterComponents[i]);
          }
        }
      }
    }
    return dependentComponents;
  },
  
  createMasterSelect: function (values, helpNote) {
    var codes = {
      4:  { ValueName: 'Fraktur eller behandling',                 ValueCode: '4'},
      5:  { ValueName: 'Fraktur',                                  ValueCode: '5'},
      6:  { ValueName: 'Behandling',                               ValueCode: '6'},
      10: { ValueName: 'Första primära behandlingen',              ValueCode: '10' },
      11: { ValueName: 'Sista primära behandlingen',               ValueCode: '11' },
      20: { ValueName: 'Skadetillfälle',                           ValueCode: '20' },
      21: { ValueName: 'Skadetillfälle, Fraktur eller Behandling', ValueCode: '21' },
      30: { ValueName: 'Icke-kir, Op som 1:a beh.val',             ValueCode: '30' },
      31: { ValueName: 'Icke-kir, Op som 1:a beh.val, Op efter icke kir tidigt överg, Planerat följdingrepp', ValueCode: '31' },
      32: { ValueName: 'Någon behandling (inkl reoperationer)',    ValueCode: '32' }
    }
    var data = [];
    for (var i = values.length - 1; i >= 0; i--) {
      var current = values[i];
      data.push(codes[current]);
    }
    
    var store = new Ext.data.Store({
      fields: ['ValueName', 'ValueCode'],
      data: data
    });
    
    var combo = new Ext.form.ComboBox({
      fieldLabel: '<h2 style="color:red;">Huvudval</h2>',
      labelAlign: 'top',
      labelSeparator: '',
      editable: false,
      store: store,
      width: 300,
      displayField: 'ValueName',
      valueField: 'ValueCode',
      mode: 'local',
      forceSelection: true,
    });
    
    return combo;
  },
  
  createHtmlComponent: function (html) {
    return Ext.create('Ext.Component', {
      margin: '10 0 10 0',
      html: html,
      width: 640
    });
  },
  
  createHelpNote: function (aHelpNote) {
    var button = Ext.create('Ext.Button', {
      padding: 0,
      isHelpNote: true,
      width: 16,
      height: 16,
      border: false,
      frame: false,
      helpNote: aHelpNote, 
      tabIndex: -1,
      glyph: 0xf0e6, 
      ui: "toolbar",
      cls: "EventFormHelpNoteButton",
      listeners: {
        render: function (a, b, c) { createHoveringHelpNote(a) },
        click: function (a, b, c) { SfrWidget.createFloatingHelpNote2(a) }
      }
    });
    return button;
  },
  
  createFloatingHelpNote2: function (aButton) {
    aButton.on('destroy', function () {
      this.tip.destroy();
    });
    if (aButton.tip) {
      aButton.tip.close();
      aButton.tip.destroy();
    }
    aButton.tip = Ext.create('Ext.tip.ToolTip', {
      target: aButton.el,
      cls: 'EventFormHelpNote',
      shadow: false,
      closable: true,
      draggable: true,
      autoHide: false,
      anchor: 'left',
      closeAction: 'destroy',
      title: ' ',
      minWidth: 120,
      maxWidth: 380,
      listeners: {
        show: function () {
          this.update(aButton.helpNote, true);
        },
        close: function () {
          createHoveringHelpNote(aButton);
        }
      }
    });
    aButton.tip.show();
  },
}

Ext.override(Ext.scroll.Scroller, {
  privates: {
    restoreState: function () {
      var me = this,
        el = me.getScrollElement(),
        dom;
      if (el) {
        dom = el.dom;

        if (me.trackingScrollTop !== undefined) {
          me.restoring = true;
          Ext.defer(function () {
            me.restoring = false;
          }, 50);
        }
      }
    }
  }
});

Ext.util.CSS.removeStyleSheet('sfr-chart');
Ext.util.CSS.createStyleSheet(''
+ '.sfr-charts .x-panel-body {'
+ '  border-width: 0px;'
+ '}'
+ '.sfr-charts input[readonly] {'
+ '  color: #333;'
+ '  background-color: #eee;'
+ '}'
+ '.sfr-charts label {'
+ '  font-weight: 400;'
+ '}'
+ '.sfr-odd, .sfr-even {'
+ '  border-bottom: 1px solid #e8e8e8;'
+ '}'
, 'sfr-chart');
