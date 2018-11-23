! function() {
  window.LVRMatris = window.LVRMatris = {
      init: function(config) {
          Ext.apply(this.config, config);
          this._ct = Ext.create('Ext.container.Container', {
              renderTo: this.config.container,
              minHeight: 200
          });
          this._resultsCt = Ext.create('Ext.container.Container', {
              style: {
                  opacity: 0
              }
          });
          this.loadSpecification();
      },
      /**
       * Parameters used for global configuration
       */
      config: {
          container: 'main-container',
          server: '',
          diagnosis: 1, // Default to 1 (KOL), 2 = Astma
          selections: {
              gender: 1,
              landsting: 1,
              unit_type: 1,
              stadiumktg: 1,
              // indicators: 3
          },
          apikey: 'bK3H9bwaG4o='
      },
      /**
       * Initiates loading of specification for the filter options
       * e.g. period, age etc
       */
      loadSpecification: function() {
          LVRMatris._ct.setLoading('Hämtar konfiguration...');
          var conf = this.config;
          var rScript = 'spec_urval' + (conf.specRevision ? ('/' + conf.specRevision) : ''),
              formattedData;

          LVRMatris._loadMetaData(rScript, function(data) {
              formattedData = LVRMatris.formatSpecificationData(data);
              LVRMatris.drawCombos(formattedData);
              LVRMatris.loadIndicators();
          });

          LVRMatris.getUnitLabelStore();
      },
      /**
       * Initiates loading of the specifiction of all indicators
       * later drawn as radio buttons 
       */
      loadIndicators: function() {
          var conf = this.config;
          var rScript = 'indikatorbibliotek' + (conf.indicatorRevision ? ('/' + conf.indicatorRevision) : '');
          LVRMatris._loadMetaData(rScript, function(data) {
              LVRMatris._indicatorData = LVRMatris.mapIndicators(data);
              LVRMatris.drawIndicatorRadios();
          });
      },
      /**
       * Wrapper for calling fetching meta data from the R-server
       * 
       * @param rScript the name of the rScript being called\
       * @param successFn callback for when the data has been received
       */
      _loadMetaData: function(rScript, successFn) {
          var conf = this.config;
          LVRMatris._ct.setLoading('Hämtar indikatorbeskrivningar...');
          Ext.Ajax.request({
              url: conf.server + '/api/statistics/lvr/' + rScript,
              method: 'get',
              params: {
                  apikey: conf.apikey,
                  rinvoke: 1,
                  diagnos: conf.diagnosis
              },
              success: function(res, opts) {
                  var data;
                  if (res) {
                      data = Ext.decode(res.responseText);
                  } else {
                      return;
                  }
                  if (data.success) {
                      successFn(data.data);
                  }
                  LVRMatris._ct.setLoading(false);
              },
              failure: function(res, opts) {
                  LVRMatris.displayError('Kunde inte hämta datan...');
                  LVRMatris._ct.setLoading(false);
              }
          });
      },
      displayError: function(msg, debug) {
          Ext.Msg.alert('Fel!', msg || 'Ett oväntat fel inträffade');
          if (debug) {
              Ext.log(debug);
          }
      },
      /**
       * Creates a store, for storing all unit names as presented by the R-script
       * `lvr/labels` which maps unit ids to display names, if not created already
       * 
       * @returns a reference to the unit label store
       */
      getUnitLabelStore: function() {
          var conf = this.config;
          if (!LVRMatris._labelStore) {
              LVRMatris._labelStore = Ext.create('Ext.data.Store', {
                  autoLoad: true,
                  proxy: {
                      type: 'ajax',
                      url: conf.server + '/api/statistics/lvr/labels',
                      extraParams: {
                          apikey: conf.apikey,
                          rinvoke: 1,
                          inp: conf.diagnosis === 3 ? 1 : 0
                          // diagnos: conf.diagnosis
                      },
                      reader: { type: 'json', rootProperty: 'data' },
                      listeners: {
                          exception: function(e, res) {
                              var err;
                              try {
                                  err = Ext.decode(res.responseText).message;
                              } catch (ex) {
                                  err = '';
                              }
                              LVRMatris.displayError('<p>Ett fel inträffade när beskrivningar skulle laddas in.</p>' + err);
                          }
                      }
                  },
                  fields: [
                      {
                          name: 'unitId',
                          type: 'int',
                          mapping: 'id'
                      }, {
                          name: 'unitName',
                          mapping: 'label'
                      }
                  ]
              });
          }
          return LVRMatris._labelStore;
      },
      /**
       * Returns the display name which is related to a specific 
       * unit id found in the unit label store
       * 
       * @param unitId string with the unit's id 
       * @param displayType determines if it is a unit/county/riket 
       */
      getDisplayName: function(unitId, displayType) {
          var store = LVRMatris.getUnitLabelStore(),
              labelRecord, retName;

          if (displayType < 3) {
              try {
                  retName = LVRMatris._landsting[unitId];
              } catch (e) {
                  retName = displayType === 1 ? 'Alla' : 'missing';
              }
          } else {
              if (store) {
                  labelRecord = store.findRecord('unitId', unitId, null, null, null, true);
              }
              retName = labelRecord ? labelRecord.get('unitName') : 'missing';
          }

          return retName;
      },
      formatSpecificationData: function(data) {
          var tmpData = [];
          Ext.Object.each(data, function(key, value, obj) {
              tmpData.push({
                  variable: key,
                  label: value.label,
                  values: LVRMatris.formatComboSpec(value.values)
              });
              // Store all landstings for fast name lookup
              if(key === 'landsting'){
                  LVRMatris._landsting = value.values;
              }
          });
          return tmpData;
      },
      formatComboSpec: function(data) {
          return Ext.Array.map(Ext.Object.getKeys(data), function(key) {
              return {
                  id: key,
                  label: data[key]
              };
          });
      },
      mapIndicators: function(indicators) {
          var indicatorMap = LVRMatris._indicatorMap = LVRMatris._indicatorMap || {};

          Ext.each(indicators, function(indicator) {
              indicatorMap[indicator.valueid] = indicator;
          });
      },
      // formatOne: function(data, key) {
      // 	var tmpValues = [],
      // 		keyMap = LVRMatris._keyMap = LVRMatris._keyMap || {},
      // 		sortingValues = {},
      // 		descriptions = {},
      // 		keyValues = {};
      // 	Ext.Object.each(data.values, function(k, v, o) {
      // 		tmpValues.push({
      // 			id: k,
      // 			label: v
      // 		});
      // 		keyValues[v] = v;
      // 		if (data.sorting) {
      // 			sortingValues[v] = data.sorting[k];
      // 		}
      // 		if (data.description) {
      // 			descriptions[v] = data.description[k];
      // 		}
      // 	});
      // 	keyMap[key] = {
      // 		label: data.label,
      // 		values: keyValues
      // 	};
      // 	if (!Ext.Object.isEmpty(sortingValues)) {
      // 		keyMap[key].sorting = sortingValues;
      // 	}
      // 	if (!Ext.Object.isEmpty(descriptions)) {
      // 		keyMap[key].descriptions = descriptions;
      // 	}
      // 	return tmpValues;
      // },
      // _getMetaDataValues: function(data, variable, id) {
      // 	var retObj = LVRMatris._keyMap[variable];
      // 	if (!Ext.isObject(retObj)) {
      // 		return; //throw
      // 	}
      // 	if (id) {
      // 		return retObj[id][data];
      // 	}
      // 	return retObj[data];
      // },
      // getValues: function(variable, id) {
      // 	return LVRMatris._getMetaDataValues('values', variable, id);
      // },
      // getDescriptions: function(variable, id) {
      // 	return LVRMatris._getMetaDataValues('descriptions', variable, id);
      // },
      _getIndicatorAttribute: function(indicatorId, attribute) {
          var _id = indicatorId || LVRMatris._currentIndicator;

          return LVRMatris._indicatorMap &&
              LVRMatris._indicatorMap[_id] &&
              LVRMatris._indicatorMap[_id][attribute];
      },
      getIndicatorLabel: function(indicatorId) {
          return LVRMatris._getIndicatorAttribute(indicatorId, 'valuelabel');
      },
      getIndicatorDescription: function(indicatorId) {
          return LVRMatris._getIndicatorAttribute(indicatorId, 'description');
      },
      getIndicatorSorting: function(indicatorId) {
          return LVRMatris._getIndicatorAttribute(indicatorId, 'sorting');
      },
      getSorterFunction: function(isForChart){
          return function(a, b) {
              var aVal = a.get('ratio'),
                  bVal = b.get('ratio'),
                  modifier = (LVRMatris.getIndicatorSorting() === 'desc' ? 1 : -1) *
                  (isForChart ? 1 : -1); 
                  
              if(aVal === null){
                  if(bVal === null){
                      return LVRMatris.sortByName(a.get('displayName'), b.get('displayName')); // Sort by name
                  }
                  return aVal === null ? 1 : -1;
              } else if(bVal === null){
                  return -1;
              } 
              return (aVal > bVal ? modifier : aVal < bVal ? -modifier : ((isForChart ? -1 : 1) * LVRMatris.sortByName(a.get('displayName'), b.get('displayName'))));
          };   
      },
      sortByName: function(aName, bName){
         return Ext.isString(aName) ? aName.localeCompare(bName) : -1; 
      },
      getStore: function(_params, isForChart) {
          var conf = this.config;
          if (!LVRMatris._store) {
              var fields = [
                      {
                          name: 'ratio',
                          type: 'float',
                          mapping: 'ratio',
                          allowNull: true
                      }, {
                          name: 'regInd',
                          type: 'int',
                          mapping: 'regInd',
                          allowNull: true
                      }, {
                          name: 'regIndTrue',
                          type: 'int',
                          mapping: 'regIndTrue',
                          allowNull: true
                      }, {
                          name: 'regTotal',
                          type: 'int',
                          mapping: 'regTotal',
                          allowNull: true
                      }, {
                          name: 'ci',
                          type: 'float',
                          mapping: 'ci',
                          allowNull: true
                      }, {
                          name: 'unitId',
                          type: 'string',
                          mapping: 'ids'
                      }, {
                          name: 'displayType',
                          type: 'int',
                          mapping: 'displaytype'
                      }, {
                          name: 'displayName',
                          convert: function(v, rec) {
                              return LVRMatris.getDisplayName(rec.get('unitId'), rec.get('displayType'));
                          },
                          depends: ['unitId', 'displayType']
                      },
                      {
                          name: 'svarsfrekv',
                          type: 'float',
                          allowNull: true
                      }
                  ];
              LVRMatris._chartStore = Ext.create('Ext.data.Store', { 
                  fields: fields, 
                  sorters: LVRMatris.getSorterFunction(true),
                  filters: function(a){
                      return Ext.isNumber(a.get('ratio'));
                  },
                  listeners: {
                      datachanged: function(aStore){
                          var chart = LVRMatris._chart,
                              indicator = LVRMatris._currentIndicator,
                              ct = LVRMatris._resultsCt,
                              count = aStore.count();

                          if (chart) {
                              chart.setTitle(Ext.String.format('<span style="font-weight: bold;">{0}</span><br/><em>{1}</em>',
                                  LVRMatris.getIndicatorLabel(indicator),
                                  LVRMatris.getIndicatorDescription(indicator)));
                              chart.setHeight(Math.max(350, count * 30 + 100));
                          }

                      }
                  }
              });
              var dataRequestUrl = '/api/statistics/lvr/riktig_data';
              if(conf.diagnosis === 3){
                  dataRequestUrl = '/api/statistics/lvr/inp_utdata';
              }
              LVRMatris._store = Ext.create('Ext.data.Store', {
                  autoLoad: true,
                  proxy: {
                      type: 'ajax',
                      url: conf.server + dataRequestUrl + (conf.dataRevision ? ('/' + conf.dataRevision) : ''),
                      extraParams: _params,
                      reader: { type: 'json', rootProperty: 'data' },
                      // reader: 'objecttoarray',
                      listeners: {
                          exception: function(e, res) {
                              var err;
                              try {
                                  err = Ext.decode(res.responseText).message;
                              } catch (ex) {
                                  err = '';
                              }
                              if (LVRMatris._store) {
                                  LVRMatris._store.removeAll();
                              }
                              LVRMatris.displayError('<p>Ett fel inträffade när resultatdata skulle laddas.</p>' + err);
                          }
                      }
                  },
                  fields: fields,
                  sorters: LVRMatris.getSorterFunction(), 
                  listeners: {
                      beforeload: function(store) {
                          var ct = LVRMatris._resultsCt;
                          LVRMatris._currentIndicator = LVRMatris._form.getValues()['indicators'];
                          LVRMatris._ct.setLoading('Hämtar underlag');
                          if (ct && ct.el.getStyle('opacity') !== '0') {
                              store.suspendEvents(true);
                              ct.animate({
                                  duration: 500,
                                  to: {
                                      opacity: 0
                                  },
                                  callback: function() {
                                      store.resumeEvents();
                                  }
                              });
                          }
                      },
                      load: function(aStore, aList) {
                          var ct = LVRMatris._resultsCt;
                          LVRMatris._chartStore.loadRecords(aList);
                          LVRMatris._ct.setLoading(false);
                          ct.animate({
                              duration: 500,
                              to: {
                                  opacity: 1
                              }
                          });
                      }
                  }
              });
          }
          return isForChart ? LVRMatris._chartStore : LVRMatris._store;
      },
      loadStore: function(params) {
          var store = LVRMatris.getStore();
          store.load({
              params: params
          });
      },
      collapseOnHeader: function(panel) {
          panel.header.el.on('click', function() {
              if (panel.collapsed) {
                  panel.expand();
              } else {
                  panel.collapse();
              }
          });
      },
      updateSelectionDescriptions: function(form) {
          var selectionDescription = LVRMatris._selectionDescription, retVal = '', hasValues,
              currentIndicator = LVRMatris._currentIndicator = LVRMatris._form.getValues()['indicators'];
          if (!selectionDescription) {
              return;
          }
          form.items.each(function(a) {
              if (a.isXType('combo') && a.getValue() && a.getValue() !== '0') {
                  hasValues = true;
                  retVal += Ext.String.format('<b>{0}</b>: {1}<br>', a.getFieldLabel(), a.getDisplayValue());
              }
          });
          if (hasValues) {
              selectionDescription.setTitle('<span style="font-weight: bold;">' +
                  LVRMatris.getIndicatorLabel(currentIndicator) +
                  '</span>');
              selectionDescription.update(retVal);
              selectionDescription.show();
          } else {
              selectionDescription.hide();
          }
      },
      createSelectionDescription: function() {
          var conf = this.config;
          return Ext.create('Ext.panel.Panel', {
              padding: 10,
              hidden: true,
              frame: true
          });
      },
      createChart: function(params) {
          var conf = this.config;
          return Ext.create('Ext.chart.Chart', {
              height: 700,
              margin: '30 0 0 0',
              flipXY: true,
              insetPadding: '0 30 30 30',
              interactions: 'itemhighlight',
              animation: false,
              border: false,
              collapsible: true,
              collapseFirst: false,
              background: '#eee',
              style: {
                  borderWidth: '1px 1px 0 1px',
                  borderColor: '#ddd',
                  borderStyle: 'solid',
                  'border-top-left-radius': '5px',
                  'border-top-right-radius': '5px'
              },
              listeners: {
                  afterrender: LVRMatris.collapseOnHeader
              },
              sprites: [
        /*{
                  type: 'text',
                  text: 'Column Charts\nStacked Columns',
                  fontSize: '12px',
                  width: 10,
                  height: 30,
                  x: 9, // the sprite x position
                  y: 10 // the sprite y position
                }*/
              ],
              tools: [{
                  type: 'print',
                  tooltip: 'Ladda ner bild',
                  // hidden:true,
                  handler: function(event, toolEl, panelHeader) {
                      var chart = panelHeader.up('chart');
                      if (chart) {
                          chart.download();
                      }
                  }
              }],
              plugins: {
                  ptype: 'chartitemevents'
              },
              store: LVRMatris.getStore(params, true),
              axes: [{
                  type: 'numeric',
                  position: 'bottom',
                  id: 'ratio-axis',
                  majorTickSteps: 10,
                  maximum: 100,
                  minimum: 0,
                  // Not needed when range is capped to 0-100
                  // listeners: {
                  // 	rangechange: function(axis, range) {
                  // 		var cAxis = this.getChart().getAxis('ratio-axis-top');
                  // 		if (cAxis) {
                  // 			cAxis.setMinimum(range[0]);
                  // 			cAxis.setMaximum(range[1]);
                  // 		}
                  // 	}
                  // },
                  renderer: function(s) {
                      return Ext.util.Format.number(s, '0%');
                  },
                  increment: 1,
                  grid: {
                      odd: {
                          opacity: 0.5,
                          fill: '#ddd'
                      }
                  }
              }, {
                      majorTickSteps: 10,
                      maximum: 100,
                      minimum: 0,
                      type: 'numeric',
                      id: 'ratio-axis-top',
                      position: 'top',
                      renderer: function(s) {
                          return Ext.util.Format.number(s, '0%');
                      }
                  }, {
                      position: 'left',
                      id: 'clinic-axis',
                      type: 'category',
                      label: {
                          textAlign: 'right'
                      },
                      fields: ['displayName'],
                      renderer: function(v) {
                          return Ext.util.Format.ellipsis(v, 32, true);
                      }
                  }],
              series: [{
                  type: 'bar',
                  yAxis: 'ratio-axis',
                  // labelOverflowPadding: 0,

                  label: {
                      display: 'insideEnd',
                      field: ['regInd'],
                      calloutColor: 'rgba(0,0,0,0)',
                      renderer: function(text, sprite, config, rendererData, index) {
                          var store = rendererData.store,
                              record = store.getAt(index);

                          if (Ext.isNumber(record.get('regInd')) && record.get('regInd') / record.get('regTotal') < 0.6) {
                              return '*';
                          } else {
                              return '';
                          }
                      }
                  },
                  xField: 'displayName',
                  yField: 'ratio',
                  colors: ['#3CB6CE'],
                  highlight: {
                      fillStyle: '#3CB6CE',
                      strokeStyle: '#3CB6CE',
                      globalAlpha: 0.8
                  },
                  renderer: function(sprite, config, rendererData, index) {
                      var storeItem = rendererData.store.getAt(index);
                      var lowCoverage = (Ext.isNumber(storeItem.get('regInd')) && storeItem.get('regInd') / storeItem.get('regTotal') < 0.6); 
                      switch (storeItem.get('displayType')) {
                          case 1: // Alla
                              return {
                                  fillStyle: lowCoverage ? '#AAA38E' : '#26879B',
                                  stroke: lowCoverage ? '#B9B3A2' : '#207383'
                              };
                          case 2: // Landsting
                              return {
                                  fillStyle: lowCoverage ? '#B9B3A2' : '#2C9EB5',
                                  stroke: lowCoverage ? '#A7A08B' : '#26879B'
                              };
                          default: // Enheter
                              return {
                                  fillStyle: lowCoverage ? '#DCD9D0' : '#5BC2D7',
                                  stroke: lowCoverage ? '#C2BDAD' : '#2C9EB5'
                              };
                      }

                  },
                  tooltip: {
                      renderer: function(storeItem, item) {
                          var ansFreq = Ext.util.Format.number(storeItem.get('svarsfrekv'), '0.0%');
                          var ansFreqText = '';
                          if(ansFreq){
                              ansFreqText = Ext.String.format(
                                  'Antal rapporterad indikator: {0}<br>' +
                                  'Svarfrekvens indikator: {1}<br>',
                                  storeItem.get('regInd'),
                                  ansFreq
                              );
                          }
                          this.update(Ext.String.format(
                              '{0}<br>' + 
                              'Resultat indikator: {1}<br>{2}',
                              storeItem.get('displayName'),
                              Ext.util.Format.number(storeItem.get('ratio'), '0.0%'),
                              ansFreqText
                          ));
                      }
                  }
              }]
          });
      },
      getFormStore: function(formName){
          var store;
          try{
              store = LVRMatris._form.items.findBy(function(el){
                  return el.name === name
              }).store;
          } catch(e){
              LVRMatris.displayError(e);
          } finally {
              return store;
          }
      },
      getForm: function() {
          var conf = this.config;
          LVRMatris._form = LVRMatris._form || Ext.widget({
              xtype: 'form',
              dockedItems: [{
                  dock: 'bottom',
                  xtype: 'button',
                  margin: '10 0',
                  text: 'Ladda data',
                  formBind: true,
                  height: 40,
                  width: '100%',
                  handler: function(btn) {
                      var form = btn.up('form');
                      if (!form) {
                          return; //exception
                      }
                      if (!LVRMatris._chart) {
                          LVRMatris._ct.add(LVRMatris._resultsCt);

                          //Draw selection description
                          LVRMatris._selectionDescription = LVRMatris.createSelectionDescription();

                          //Draw chart
                          LVRMatris._chart = LVRMatris.createChart();

                          //Draw grid
                          LVRMatris._grid = LVRMatris.createGrid();

                          LVRMatris._resultsCt.add(LVRMatris._selectionDescription);
                          LVRMatris._resultsCt.add(LVRMatris._chart);
                          LVRMatris._resultsCt.add(LVRMatris._grid);
                      }
                      LVRMatris.updateSelectionDescriptions(form);
                      LVRMatris.loadStore(Ext.apply(form.getValues(), {
                          apikey: conf.apikey,
                          diagnos: conf.diagnosis,
                          rinvoke: 1
                      }));
                  }
              }]
          });
          return LVRMatris._form;
      },
      drawCombos: function(data) {
          var form;
          if (!data) {
              this.displayError('Oväntat fel...', 'Gick inte att hitta data när combos skulle renderas');
              return;
          }
          form = this.getForm();
          this._ct.add(form);
          Ext.each(data, function(d) {
              form.add({
                  xtype: 'combo',
                  width: '100%',
                  store: {
                      fields: ['id', 'label'],
                      data: d.values
                  },
                  editable: false,
                  name: d.variable,
                  value: "0",
                  fieldLabel: d.label,
                  valueField: 'id',
                  displayField: 'label'
              });
          });
      },
      drawIndicatorRadios: function() {
          var data = LVRMatris._indicatorMap,
              radioItems = [],
              tooltips = [],
              form;
          if (!data) {
              this.displayError('Oväntat fel...', 'Gick inte att hitta data när indikatorer skulle renderas');
              return;
          }
          data = Ext.Object.getValues(data);
          data = Ext.Array.sort(data, function(a,b){
              return a.sortOrder - b.sortOrder;
          });
          Ext.Array.each(data, function(value) {
              indicatorId = 'indicator-' + value.valueid;
              radioItems.push({
                  boxLabel: value.valuelabel,
                  id: indicatorId,
                  name: 'indicators', // data.variable,
                  inputValue: value.valueid
              });
              if (Ext.String.trim(value.description)) {
                  tooltips.push({
                      target: indicatorId,
                      anchor: 'top',
                      showDelay: 100,
                      trackMouse: true,
                      html: value.description
                  });
              }
          });
          form = LVRMatris.getForm();
          form.add({
              xtype: 'radiogroup',
              fieldLabel: data.label, // + ' (max ' + d.selections + ')',
              columns: 2,
              items: radioItems,
              blankText: 'Du måste välja minst en indikator',
              allowBlank: false,
              msgTarget: 'under'
          });
          Ext.each(tooltips, function(tooltip) {
              Ext.create('Ext.tip.ToolTip', tooltip);
          });
      },
      createGrid: function() {
          return Ext.create('Ext.grid.Panel', {
              title: '<span style="font-weight: bold;">Tabelldata</span>',
              store: this.getStore(),
              collapsible: true,
              collapseFirst: false,
              plugins: ['clipboard'],
              selModel: {
                  type: 'spreadsheet',
                  columnSelect: false,
                  rowSelect: false
              },
              collapsed: true,
              enableColumnMove: false,
              style: {
                  borderColor: '#ddd',
              },
              tools: [{
                  type: 'print',
                  tooltip: 'Ladda ner bild',
                  hidden: true,
                  handler: function(event, toolEl, panelHeader) {
                      var grid = panelHeader.up('grid');
                      if (grid) {
                          Ext.Msg.alert('Fel', 'Funktion saknas...');
                      }
                  }
              }],
              border: true,
              viewConfig: {
                  loadMask: false
              },
              columns: [{
                  text: 'Namn',
                  dataIndex: 'displayName',
                  flex: 1
              }, {
                      text: 'Antal <br> rapporterade <br> patienter',
                      style: {
                          fontSize: '10px'
                      },
                      width: 90,
                      dataIndex: 'regTotal'
                  }, {
                      text: 'Antal <br> rapporterad <br> indikator',
                      style: {
                          fontSize: '10px'
                      },
                      width: 86,
                      dataIndex: 'regInd'
                  }, {
                      text: 'Antal som <br> uppfyller <br> indikator',
                      style: {
                          fontSize: '10px'
                      },
                      width: 80,
                      dataIndex: 'regIndTrue'
                  }, {
                      text: 'Resultat <br> (Andel %)',
                      style: {
                          fontSize: '10px'
                      },
                      width: 80,
                      dataIndex: 'ratio',
                      renderer: function(value) {
                          return Ext.util.Format.number(value, '0.0%');
                      }
                  }, {
                      text: 'Svarsfrekvens <br> (Andel %)',
                      style: {
                          fontSize: '10px'
                      },
                      width: 80,
                      dataIndex: 'svarsfrekv',
                      renderer: function(value) {
                          return Ext.util.Format.number(value, '0.0%');
                      }
                  }, {
                      text: 'Konfidensintervall <br> (95%)',
                      style: {
                          fontSize: '10px'
                      },
                      width: 116,
                      dataIndex: 'ci',
                      renderer: function(value) {
                          return value === null ? '' : '&plusmn;' + Ext.util.Format.number(value, '0.0%');
                      }
                  }],
              listeners: {
                  afterrender: LVRMatris.collapseOnHeader
              }
          });
      }
  };
  // CAN NOT BE USED THIS WAY IN STRATUM...
  // Example code for initializing widget:
  // --------------------------------------------
  // Ext.onReady(function() {
  //     LVRMatris.init({
  //         server: 'http://stratum.registercentrum.se',
  //         diagnosis: 2, //Astma
  //         // dataRevision: 575,
  //         // specRevision: 575,
  //         // indicatorRevision: 575
  //     });
  // });

  // Init inside widget to work in stratum
  if(typeof window.isTemplate === 'undefined' || isTemplate('{{diagnosis}}')){
      return;
  }
  var initConf = {
     diagnosis: parseInt('{{diagnosis}}'), 
  };
  if(!isTemplate('{{dataRevision}}')){
      initConf.dataRevision = '{{dataRevision}}';
  }
  if(!isTemplate('{{specRevision}}')){
      initConf.specRevision = '{{specRevision}}';
  }
  if(!isTemplate('{{indicatorRevision}}')){
      initConf.indicatorRevision = '{{indicatorRevision}}';
  }
  LVRMatris.init(initConf);
} ();