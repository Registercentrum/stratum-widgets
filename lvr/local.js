{
  /**
   * Collects data from the following reports and appends them to a local hash
   * @param {[int]} ids The report ids which should be added
   * @param {Function} readyCallback
   */
  initialize: function(reports, readyCallback) {
      this._initOnce();
      if (!Ext.isObject(reports)) {
          Ext.isFunction(readyCallback) && readyCallback();
          return;
      }
      this._getReportData(reports, function(data) {
          Ext.isFunction(readyCallback) && readyCallback(data);
      });
  },
  _initOnce: function() {
      if (!this._initOnce.performed) {
          this.initDefinitions();
          // Ext.util.CSS.createStyleSheet('.gauge-button span {color: #666;} .gauge-button-over {background: #ededed} .x-gauge-button-pressed span {color: #000; cursor: initial;}');
          Ext.util.CSS.createStyleSheet('.gauge-btn .x-btn-inner { width: 100%; } .gauge-btn:hover { background: #CBE3F0!important; } .gauge-btn-success:hover { background: #CAE0B7!important; } .gauge-btn-danger:hover { background: #ebccd1!important; }');
          this._initOnce.performed = true;
      }
  },
  _getReportData: function(reports, callback) {
      var reportsSize = 0;
      Ext.Object.each(reports, function(key, value) {
          if (typeof value.sums === 'undefined') {
              reportsSize += 2;
          }
      });
      if (reportsSize === 0) {
          callback(reports);
          return;
      }
      Ext.Object.each(reports, function(id, report) {
          if (typeof report.sums === 'undefined') {
              this.getReport(parseInt(id, 10), 'ClinicALL=0', report, reportsSize, callback);
              this.getReport(parseInt(id, 10), 'ClinicALL=1', report, reportsSize, callback);
          }
      }, this);
  },
  /**
   * Waits for all calls to be return before running the final @callback
   * @param {int} reportId id of the report to be called
   * @param {String} param Parameter to reportmethod eg 'ClinicALL=0'
   * @param {int} totalCalls Total number of calls before callback
   * @param {String} desc Indicator description
   * @param {Function} callback Called when totalCalls decr to 0 i.e. all calls have been answered
   */
  getReport: function(reportId, param, report, totalCalls, callback) {
      var me = this.getReport;
      if (!me.callback && Ext.isFunction(callback)) {
          me.callback = callback;
      }
      if (typeof me.total === 'undefined') {
          me.total = totalCalls;
      }
      if (!me.awaitingData) {
          me.awaitingData = [];
      }
      ReportManagement.GetReport(reportId, param, function(e, r) {
          var me = this.getReport,
              // desc = arguments[3] || reportId,
              sum = 0;
          me.total && me.total--;
          if (r && r.result && r.result.success) {
              var datamap = Ext.merge.apply(this, Ext.Array.map(r.result.data, function(item) {
                  var ret = {};
                  ret[item.x] = item.y;
                  sum += item.y;
                  return ret;
              }));
              report.sums = report.sums || {};
              report[param] = datamap;
              report.sums[param] = sum;
              if (param === 'ClinicALL=0' && report[param]) {
                  report.value = report.sums[param] !== 0 && report[param][report.indicator] ?
                      100 * report[param][report.indicator] / report.sums[param] : 0;
              }
              me.awaitingData.push(report);
          }
          if (typeof me.total !== 'undefined' && me.total <= 0) {
              delete me.total;
              if (Ext.isFunction(me.callback)) {
                  me.callback(me.awaitingData);

                  delete me.callback;
              }
          }
      }, this, callback);
  },
  loadMainChart: function(id, chart, gaugeData) {
      if (!gaugeData) {
          return;
      }
      // colorArrayStyle = ["#206876", "#04859d", "#37b6ce", "#5fbdce", "#015666"],
      // colorArrayStyle = ['rgb(32, 104, 118)', 'rgb(4, 133, 157)', 'rgb(55, 182, 206)', 'rgb(95, 189, 206)', 'rgb(1, 86, 102)'],
      // colorArrayStyle = ['#614D7D', '#E98300', '#3CB6CE', '#A2AD00', '#FECB00'],
      var clinicProp = 'ClinicALL=0', //TODO: Set through config parameter instead?
          regProp = 'ClinicALL=1', //TODO: Set through config parameter instead?
          dataFields = [],
          graphFields = [],
          titles = [],
          clinicData = {
              unit: typeof Profile !== 'undefined' && Profile.Context && Profile.Context.Unit && Profile.Context.Unit.UnitName || 'Kliniken'
          },
          regData = {
              unit: 'Registret' //TODO: config param
          },
          i = 0,
          store = chart.getStore(),
          me = this,
          numericAxis, topAxis, series, nullPos;
      chart.show();
      // chart.hidden = false;
      Ext.Object.each(gaugeData[regProp], function(key, value) {
          dataFields.push('andel' + i);
          dataFields.push('antal' + i);
          graphFields.push('andel' + i);
          regData['antal' + i] = value;
          regData['andel' + i] = 100 * value / gaugeData.sums[regProp];
          if (typeof gaugeData[clinicProp] !== 'undefined' && typeof gaugeData[clinicProp][key] !== 'undefined') {
              clinicData['antal' + i] = gaugeData[clinicProp][key];
              clinicData['andel' + i] = 100 * gaugeData[clinicProp][key] / gaugeData.sums[clinicProp];
          }
          titles.push(key);
          i++;
      });
      store.setFields(Ext.Array.merge('unit', dataFields));
      Ext.Array.each(chart.getAxes(), function(axis) {
          if (axis.type === 'numeric') {
              axis.fields = graphFields;
          }
          if (axis.position === 'top') {
              axis.title = gaugeData.desc;
          }
      });
      nullPos = Ext.Array.indexOf(titles, 'Okänt'); //TODO: should be set dynamically...
      gaugeData.colors = gaugeData.colors || ["#206876", "#04859d", "#37b6ce", "#5fbdce", "#015666"];
      //Probably a bug with ExtJS 5. Series sprites should not have to be removed from surface when setting series.
      try {
          chart.getSeries().length > 0 && chart.getSeries()[0].getSurface().removeAll();
      } catch (e) {
          Ext.log(e);
      }
      var newmax = getMaxValue(chart.getStore().getData(), graphFields);
      if(newmax) {
        chart.getAxes()[0].setMaximum(newmax);
        chart.redraw();
      }
      chart.setSeries({
          type: 'bar',
          // axis: 'left',
          groupGutter: 0,
          xField: 'unit',
          yField: graphFields, //must be set to avoid vml-bug in ie8
          xPadding: 30,
          stacked: false,
          title: titles,
          tooltip: {
              // trackMouse: true,
              renderer: function(tooltip, record, item) {
                  var antal = 'antal',
                      field = item.field;
                  if (field.indexOf('andel') === 0) {
                      antal += field.substr(5);
                      tooltip.setHtml(Ext.String.format('<b>{1}</b><br/>{0} observationer', record.get(antal), Ext.util.Format.number(record.get(item.field), '0.0%')));
                  }
              }
          },
          colors: Ext.Array.insert(gaugeData.colors.slice(0), nullPos, ['#AAA38E'])
      });
      chart.setSprites({
          type: 'text',
          text: gaugeData.desc,
          textAlign: 'middle',
          fontSize: 20,
          width: chart.getWidth(),
          height: 30,
          x: chart.getWidth()/2,
          y: 30
      });
      store.loadData([clinicData, regData]);
      me.scrollToElement(chart.getEl());
      function getMaxValue(data, fields) {
        var max = 0;
        fields.forEach(
          function(item) {
              if (data.max(item) > max) {
                  max = data.max(item);
              }
          }
        );
        return Math.ceil(max / 10) * 10;
    };
  },
  
  getChoiceFromState: function(state, danger, success, standard) {
      return state === 'danger' ? danger : state === 'success' ? success : standard;
  },
  getSmallGaugesInits: function(reports, targetChart, appendChart) {
      var arr = [];
      var me = this;
      Ext.Object.each(reports, function(id, report) {
          if (!Ext.isObject(report) || !!report.hidden) {
              return;
          }
          var state = Ext.isDefined(report.upperLimit) ? ((report.value > report.upperLimit ? !report.invert : report.invert) ? 'success' : 'danger') : '';
          arr.push({
              xtype: 'container',
              cls: 'gauge-button',
              margin: '2px',
              // padding: '12px 8px 8px 8px',
              columnWidth: 0.5,
              layout: 'hbox',
              style: {
                  border: '1px solid',
                  borderColor: me.getChoiceFromState(state, '#ebccd1', '#d6e9c6', '#bce8f1'),

                  background: '#f7f7f7',
                  borderRadius: '3px'
                      // minHeight: '40px'
              },
              minHeight: 50,
              items: [{
                  xtype: 'heatgauge',
                  valueField: 'value',
                  style: {
                      // paddingTop: '5px'
                  },
                  margin: '8 0 0 0',
                  lowerLimitField: 'lowerLimit',
                  upperLimitField: 'upperLimit',
                  invertLimitField: 'invert',
                  store: Ext.create('Ext.data.Store', {
                      fields: ['value', 'upperLimit', 'lowerLimit', 'invert'],
                      data: [report]
                  }),
                  width: 75,
                  height: 30
              }, {
                  xtype: 'button',
                  ui: 'none',
                  flex: 1,
                  height: '100%',
                  // width: '100%',
                  padding: '4 7 7 2',
                  enableToggle: true,
                  allowDepress: false,
                  toggleGroup: 'heatg',
                  pressedCls: 'gauge-button-pressed',
                  cls: 'gauge-btn gauge-btn' + me.getChoiceFromState(state, '-danger', '-success', ''),
                  chartId: id,
                  style: {
                      background: state === 'danger' ? '#f2dede' : state === 'success' ? '#dff0d8' : '#d9edf7',
                      borderLeft: '1px solid #ccc',
                      color: me.getChoiceFromState(state, '#a94442', '#3c763d', '#31708f'),
                      width: '100%'
                  },
                  // shrinkWrap: false,
                  frame: false,
                  data: {
                      text: report.descName,
                      value: Ext.util.Format.number(report.value || 0, '0%')
                  },
                  textAlign: 'left',
                  tooltip: '<p>' + me.getChoiceFromState(state, 'Registrets mål på <b>' + report.upperLimit + '%</b> är inte uppnått ännu', 'Registrets mål på <b>' + report.upperLimit + '%</b> är uppnått!', 'Beskrivande indikator som saknar målvärde') + '</p><i>Klicka för komplett fördelning</i>',
                  // height: 40,
                  tpl: '<span style="font-size: 24px; line-height: 24px; float: left; margin: 0 8px 0 6px;">{value}</span>' +
                      '<div style="font-size: 24px; line-height: 24px; font-family: fontawesome; float: right; margin: 1px; text-shadow: 1px 1px 0px' +
                      me.getChoiceFromState(state, '#f00; color: #F19999;">&#xf071;', '#1d9d74; color: #4c4;">&#xf00c;', ';">') + '</div>' +
                      '<div style="overflow: hidden; white-space: normal; font-size: 11px; line-height: 12px;">{text}</div>',
                  listeners: {
                      beforerender: function(bt) {
                          var tpl = new Ext.XTemplate(bt.tpl);
                          bt.setText(tpl.apply(bt.data));
                      },
                      click: function() {
                          me.loadMainChart(id, targetChart, report);
                      }
                  }
              }]
          });
      }, me);
      if (appendChart) {
          arr.push(targetChart);
      }
      return arr;
  },
  scrollToElement: function(element) {
      if (!element || !element.getY) {
          return;
      }
      (Ext.isChrome ? Ext.getBody() : Ext.get(document.documentElement)).scrollTo('top', element.getY(), true);
  },
  initDefinitions: function() {
      // Ext.chart.theme.LVRTheme = Ext.extend(Ext.chart.theme.Base, {
      //     constructor: function(aConfig) {
      //         Ext.chart.theme.Base.prototype.constructor.call(this, Ext.apply({
      //             colors: ['#A2AD00', '#614D7D', '#3CB6CE', '#E98300', '#FECB00'],
      //             axis: {
      //                 stroke: '#ccc',
      //                 'stroke-width': '1px'
      //             }
      //         }, aConfig));
      //     }
      // });
      !Ext.ClassManager.isCreated('Ext.ux.chart.HeatGauge') && Ext.define('Ext.ux.chart.HeatGauge', {
          extend: 'Ext.chart.PolarChart',
          alias: 'widget.heatgauge',
          constructor: function(config) {
              if (config && config.valueField) {
                  var renderer;
                  if (config.upperLimitField) {
                      renderer = {
                          renderer: function(sprite, record, attribute, index) {
                              if (index !== 0 || !record.get(config.upperLimitField)) {
                                  return attribute;
                              }
                              return attribute; //TEST
                          }
                      };
                  }
                  // config.series = [Ext.apply({
                  config.series = {
                      type: 'gauge',
                      angleField: config.valueField,
                      donut: 50,
                      colors: ['#3CB6CE', '#ddd'],
                      minimum: 0,
                      maximum: 100,
                      steps: 1,
                      totalAngle: Math.PI,
                      needleLength: 100,
                      background: config.background || 'rgb(247, 247, 247)'
                          // background: {fill: '#fff', fillOpacity: 0, globalAlpha: 0}
                  };
                  // }, renderer)];
              }
              this.callParent([config]);
          },
          animate: true,
          insetPadding: 0,
          // axes: [{
          //     type: 'gauge',
          //     position: 'gauge',
          //     label: {
          //         renderer: function() {
          //             return '';
          //         }
          //     }
          // }]
      });
  },
  //Legacy code, not used?
  nameOf: function(aDomainName, aCode) {
      //TODO: realize maps from domains on demand.
      var map = {
          Smoking: {
              '0': 'Aldrig varit rökare',
              '1': 'Slutat röka för >6 månader sedan',
              '2': 'Slutat röka för <6 månader sedan',
              '3': 'Röker, men inte dagligen',
              '4': 'Röker dagligen 1-9 cigaretter/dag',
              '5': 'Röker dagligen 10-19 cigaretter/dag',
              '6': 'Röker dagligen >20 cigaretter/dag'
          },
          InfluenzaVaccination: {
              '0': 'Nej',
              '1': 'Ja'
          },
          PneumococcalVaccination: {
              '0': 'Nej',
              '1': 'Ja, fullvaccinerad',
              '2': 'Ja, vaccinerad en gång'
          },
          AllergyDiagnosis: {
              '0': 'Nej',
              '1': 'Ja'
          }
      };
      return aCode !== undefined ? map[aDomainName][aCode] : (aCode === null ? null : map[aDomainName]);
  },
  //Legacy code, not used?
  titleOf: function(aQuestionName, aCode) {
      //TODO: realize title (prefix text) from question on demand.
      var map = {
          Adrenaline: {
              '1': 'Adrenalin'
          },
          AllergenSpecificImmunotherapy: {
              '1': 'Allergenspecifik immunterapi (ASIT)'
          },
          Antihistamin: {
              '1': 'Antihistamin'
          },
          AntiIgE: {
              '1': 'Anti-IgE'
          },
          AntikolinergikaLong: {
              '1': 'Antikolinergika långverkande'
          },
          AntikolinergikaShort: {
              '1': 'Antikolinergika kortverkande'
          },
          Bisfosfonat: {
              '1': 'Bisfosfonat'
          },
          Calcium: {
              '1': 'Calcium'
          },
          CombinationSteroidsBeta2: {
              '1': 'Steroider och Beta-2-stimulerare i kombination'
          },
          ImmunosuppressiveTreatment: {
              '1': 'Immunsuppressiv behandling'
          },
          InhaledLongactingDilating: {
              '1': 'Beta-2-stimulerande långverkande'
          },
          InhaledShortactingDilating: {
              '1': 'Beta-2-stimulerande kortverkande'
          },
          InhaledSteroids: {
              '1': 'Steroider inhalation'
          },
          Leukotrienhammare: {
              '1': 'Leukotrienhämmare'
          },
          Ltot: {
              '1': 'LTOT (syrgas i hemmet)'
          },
          Nacetylcystein: {
              '1': 'N-Acetylcystein'
          },
          NasalSteroids: {
              '1': 'Nasal steroid'
          },
          Roflumilast: {
              '1': 'Roflumilast'
          },
          SteoroidsPeoralt: {
              '1': 'Steroider per oralt'
          },
          WeaningMedicine: {
              '1': 'Rökavvänjningsmedel'
          }
      };
      return aCode !== undefined ? map[aQuestionName][aCode] : (aCode === null ? null : map[aQuestionName]);
  },
SubjectOverview: {
  beforeProcess: function(aCallback) {
    /*
    // Do your asynchronous stuff ...
    Ext.Ajax.request({
      url: 'api/metadata/domains/map/4001',
      method: 'get',
      success: function(r) {
        this.domainsMap = r = Ext.decode(r.responseText).data;
        aCallback();
      }
    });
    */
    aCallback();
  },
  repeatingLevel: 'Visit',
  /*
  afterProcess: function(aComponent) {
    console.log('Finished rendering');
  },
      filterDate: 'ModifiedAt',
      statusProvider: function (aDataset, aCount) {
          this.down('#summary').setText(Ext.String.format(
              '{0} rader av {1} visas.', 
              aCount.toLocaleString(), 
              aDataset.statistics.total.toLocaleString()
          ));
  },
  */
  contentProvider: function(aHistory, anEventID) {
    var gm = Repository.Global.Methods;
    var lv = [];
    var rp = aHistory[anEventID];
    
    for (var ie in aHistory) {
      var rh = aHistory[ie];
      if (rh.FormName === 'Visit') {
        rr = rh;
      }
    }
    lv.push(Ext.util.Format.date(gm.ParseDate(rp.VisitDate),'Y-m-d'));
    
    if (rr.COPDDiagnosis != null) {
      if (rr.COPDDiagnosis == 1) { lv.push('Ja');}
      else lv.push('Nej');
      }
    
    if (rr.AsthmaDiagnosis != null) {
      if (rr.AsthmaDiagnosis == 1) { lv.push('Ja'); }
      else lv.push('Nej');
      }
    
    else lv.push('');
    
    return lv;
    
  },
  headingProvider: function() {
    return [
      { header: 'Besöksdatum', width: 100},
      { header: 'KOL-diagnos', flex: 1},
      { header: 'Astma-diagnos', flex: 1}
      ];
  }
},
SubjectOverview2: {
  beforeProcess: function(aCallback) {
    /*
    // Do your asynchronous stuff ...
    Ext.Ajax.request({
      url: 'api/metadata/domains/map/4001',
      method: 'get',
      success: function(r) {
        this.domainsMap = r = Ext.decode(r.responseText).data;
        aCallback();
      }
    });
    */
    aCallback();
  },
  repeatingLevel: 'Inpatient',
  contentProvider: function(aHistory, anEventID) {
    var gm = Repository.Global.Methods;
    var lv = [];
    var rp = aHistory[anEventID];
    
    lv.push(Ext.util.Format.date(gm.ParseDate(rp.InpDate),'Y-m-d'));
    lv.push(Ext.util.Format.date(gm.ParseDate(rp.InpDateDischarge),'Y-m-d'));			
    return lv;
    
  },
  headingProvider: function() {
    return [
      { header: 'Inskrivningsdatum',	width: 300 },
      { header: 'Utskrivningsdatum',	flex: 1 }
      ];
  }
}
}