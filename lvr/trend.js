<h1>KOL öppenvård - Indikatorer över tid</h1>
<div id='main-container'></div>
    <p style="margin-top: 10px; font-size: 12px;"><strong>*</strong> Alla/landsting/enheter med låg svarsfrekvens (andel svar på indikatorn av rapporterade patienter < 60 %).</p>
    <p style="margin-top: 10px; font-size: 12px;">Endast landsting/enheter med minst 30 rapporterade patienter och 15 rapporterade svar på indikatorn syns i grafen.</p>

<script type="text/javascript">
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
            this.createStyles();
            this.loadSpecification();
        },
        /**
         * Parameters used for global configuration
         */
        config: {
            container: typeof Stratum !== 'undefined' && Stratum.containers && Stratum.containers['LVR/Trend'] || 'main-container',
            server: '',
            diagnosis: 1, // Default to 1 (KOL), 2 = Astma
            trend: 0,
            selections: {
                gender: 1,
                landsting: 1,
                unit_type: 1,
                stadiumktg: 1,
                // indicators: 3
            },
            apikey: 'bK3H9bwaG4o='
        },
        createStyles: function() {
            Ext.util.CSS.createStyleSheet(
                '.lvr-trend-chart .x-legend-item[data-recordindex="0"] > span, ' +
                '.lvr-trend-chart .x-legend-item[data-recordindex="2"] > span, ' +
                '.lvr-trend-chart .x-legend-item[data-recordindex="4"] > span ' +
                ' { border-radius: 0; }'
            );
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
                url: conf.server + '/stratum/api/statistics/lvr/' + rScript,
                method: 'get',
                params: {
                    apikey: conf.apikey,
                    rinvoke: 1,
                    diagnos: conf.diagnosis,
                    trend: conf.trend
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
                        url: conf.server + '/stratum/api/statistics/lvr/labels',
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
                        return LVRMatris.sortByName(a, b); // Sort by name
                    }
                    return aVal === null ? 1 : -1;
                } else if(bVal === null){
                    return -1;
                }
                return (aVal > bVal ? modifier : aVal < bVal ? -modifier : ((isForChart ? -1 : 1) * LVRMatris.sortByName(a, b)));
            };

        },
        sortByName: function(a, b){
            return  a.get('displayName').localeCompare(b.get('displayName'));
        },
        sortByYear: function(a, b) {
            return a.get('period') > b.get('period') ? 1 : -1;
        },
        reduce: function(arr, combiner, initialValue) {
	          var counter, accumulatedValue;

	          if (arr.length === 0) {
		            return arr;
	          } else {
		            if (arguments.length === 2) {
			              counter = 1;
			              accumulatedValue = arr[0];
		            } else if (arguments.length >= 3) {
			              counter = 0;
			              accumulatedValue = initialValue;
		            }
		            while(counter < arr.length) {
			              accumulatedValue = combiner(accumulatedValue, arr[counter]);
			              counter++;
		            }

		            return accumulatedValue;
	          }
        },

        flattenTrendData : function (dataArr, obj){
            var objIndex;
            if(Ext.Array.findBy(dataArr, function(item, i) {objIndex = i; return item.period == obj.period; })) {
                dataArr[objIndex] = Ext.Object.merge({}, obj, dataArr[objIndex]);
                return dataArr;
            } else {
                return dataArr.concat(obj);
            }
        },
        trendDataConverter: function (displayTypeNumber, currentBool, format) {
            return function (v, r) {
                var ratio = r.data.ratio, svarsfrekv = r.data.svarsfrekv;
                var currentYear = new Date().getFullYear();
                if (ratio == null) {
                  return undefined;
                }
                if (r.data.displayType == displayTypeNumber) {
                    if (format) {
                        var label = Ext.util.Format.number(ratio, "0.0%");
                        if(svarsfrekv) {
                          return svarsfrekv >= 60 ? label : label + '*';
                        } else {
                          return label;
                        }
                    } else if (currentBool && r.data.period == currentYear || r.data.period == currentYear - 1) {
                        return ratio;
                    } else if (!currentBool && !(r.data.period == currentYear)) {
                        return ratio;
                    } else {
                        return undefined;
                    }
                } else {
                    return undefined;
                }
            };
        },
        trendTooltipRenderer: function (storeItem, item) {
            var dataArr = Ext.Array.pluck(LVRMatris.getStore({}, false).data.items, "data");
            var period = item.record.data.period;
            var dataObj = Ext.Array.findBy(dataArr, function (i) {return i.period == period && i[item.field];});
            var ansFreq = Ext.util.Format.number(dataObj.svarsfrekv, '0.0%');
            var ansFreqText = '';
            if(ansFreq){
                ansFreqText = Ext.String.format(
                    'Antal rapporterad indikator: {0}<br>' +
                    'Svarfrekvens indikator: {1}<br>',
                    dataObj.regInd,
                    ansFreq
                );
            }
            this.update(Ext.String.format(
                '{0}<br>' + 'År {1} <br>' +
                'Resultat indikator: {2}<br>{3}',
                dataObj.displayName,
                dataObj.ongoing ? period + ' pågående' : period,
                Ext.util.Format.number(dataObj.ratio, '0.0%'),
                ansFreqText
            ));
        },
        trendTitleRenderer: function (type) {
            var store = LVRMatris.getStore({}, false).data.items;
            return Ext.Array.findBy(store, function (obj) {return obj.data[type];}).data.displayName;
        },
        createUnitStore: function (id, unitType){
            var unitData = Ext.Array.pluck(LVRMatris.getUnitLabelStore().data.items, "data")
            var unitsInCurrentCounty = Ext.Array.filter(unitData, function(unit) {
                return unit.landsting === id;
            });
            unitsInCurrentCounty.unshift({id: 0, label: 'Ingen'})
            var filteredUnits = Ext.Array.filter(unitsInCurrentCounty, function (unit) {
              if(unit.label == 'Ingen') {
                return true;
              }
              if(unitType == "0") {
                return true;
              } else if (unitType == unit.vardtyp) {
                return true;
              } else {
                return false;
              }
            });
            var sortedUnits = Ext.Array.sort(filteredUnits, function(a,b){
                if (a.label == 'Ingen') {
                    return -1;
                } else if (b.label == 'Ingen') {
                    return 1;
                } else {
                    return a.label.localeCompare(b.label);
                }
            });
            var store = Ext.create('Ext.data.Store', {
                fields: ['id', 'label'],
                data: sortedUnits
            });
            return store;
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
                var timeChartFields = ['ids', {name: "nation", convert: LVRMatris.trendDataConverter(1, false)},
                                       {name: "nationCurrent", convert: LVRMatris.trendDataConverter(1, true)},
                                       {name: "formatedNation", convert: LVRMatris.trendDataConverter(1, false, true) },
                                       {name: "county", convert: LVRMatris.trendDataConverter(2, false)},
                                       {name: "countyCurrent", convert: LVRMatris.trendDataConverter(2, true)},
                                       {name: "formatedCounty", convert: LVRMatris.trendDataConverter(2, false, true) },
                                       {name: "unit", convert: LVRMatris.trendDataConverter(3, false)},
                                       {name: "unitCurrent", convert: LVRMatris.trendDataConverter(3, true)},
                                       {name: "formatedUnit", convert: LVRMatris.trendDataConverter(3, false, true) }
                                      ];
                LVRMatris._chartStore = Ext.create('Ext.data.Store', {
                    fields: conf.trend ? Ext.Array.merge(fields, timeChartFields) : fields,
                    sorters: conf.trend ? LVRMatris.sortByYear : LVRMatris.getSorterFunction(true),
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
                                !conf.trend && chart.setHeight(Math.max(350, count * 30 + 100));
                            }

                        }
                    }
                });
                var dataRequestUrl = '/stratum/api/statistics/lvr/riktig_data';
                if(conf.trend) {
                    dataRequestUrl = conf.diagnosis === 3 ? '/stratum/api/statistics/lvr/tidsserie_inp' : '/stratum/api/statistics/lvr/tidsserie_ov';
                }
                else if(conf.diagnosis === 3){
                    dataRequestUrl = '/stratum/api/statistics/lvr/inp_utdata';
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
                    fields: conf.trend ? Ext.Array.merge(fields, timeChartFields) : fields,
                    sorters: conf.trend ? [ LVRMatris.sortByName,LVRMatris.sortByYear] : LVRMatris.getSorterFunction(),
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
                            };
                        },
                        load: function(aStore, aList) {
                            var ct = LVRMatris._resultsCt;
                            if(conf.trend){
                                LVRMatris._chartStore.loadData(LVRMatris.reduce(Ext.Array.pluck(aList, "data"), LVRMatris.flattenTrendData, []));
                            } else {
                                LVRMatris._chartStore.loadRecords(aList);
                            }
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
            var chartConf = {
                height: 700,
                margin: '30 0 0 0',
                interactions: 'itemhighlight',
                animation: false,
                border: false,
                collapsible: true,
                collapseFirst: false,
                background: '#eee',
                listeners: {
                    afterrender: LVRMatris.collapseOnHeader
                },
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
            };
            if(conf.trend) {
                return Ext.create('Ext.chart.Chart', Ext.Object.merge(chartConf,{
                    height: 500,
                    innerPadding: { top: 25, left: 40, right: 40, bottom: 20} ,
                    colors: ['black', 'black', 'blue', 'blue', 'green', 'green'],
                    store: LVRMatris.getStore(params, true),
                    componentCls: 'lvr-trend-chart',
                    style: {
                        borderWidth: '1px 1px 0 1px',
                        borderColor: '#ddd',
                        borderStyle: 'solid',
                        'border-top-left-radius': '5px',
                        'border-top-right-radius': '5px'
                    },
                    legend: {
                        docked: 'bottom',
                        width: '100%',
                        style: {
                            backgroundColor: '#eee',
                            textAlign: 'center'
                        }
                    },
                    axes: [{
                        type: 'numeric',
                        fields: ['nation', 'nationCurrent', 'county', 'countyCurrent', 'unit', 'unitCurrent'],
                        position: 'left',
                        grid: true,
                        maximum: 100,
                        minimum: 0,
                        renderer: function (text) {return Ext.util.Format.number(text, '0%');}
                    }, {
                        type: 'category',
                        fields: 'period',
                        position: 'bottom',
                    }],
                    series: [{
                            type: 'line',
                            axis: 'left',
                            title: 'Alla',
                            xField: 'period',
                            yField: 'nation',
                            label:   {field: 'formatedNation', display: 'over'},
                            marker: {type: 'square',scale: 1.2, lineWidth: 0, fill: 'black', strokeStyle: 'none'},
                            tooltip: {trackMouse: true, renderer: LVRMatris.trendTooltipRenderer}
                        }, {
                            type: 'line',
                            title: 'Pågående Alla',
                            axis: 'left',
                            xField: 'period',
                            yField: 'nationCurrent',
                            label: {field: 'formatedNation', display: 'over'},
                            style: {lineDash: [6, 3] },
                            marker: {type: 'circle', strokeStyle: 'none'},
                            tooltip: {trackMouse: true, renderer: LVRMatris.trendTooltipRenderer}
                        }, {
                            type: 'line',
                            title: 'Landsting', // Ext.util.Format.ellipsis(LVRMatris.trendTitleRenderer('county'), 18),
                            axis: 'left',
                            xField: 'period',
                            yField: 'county',
                            label: {field: 'formatedCounty', display: 'over'},
                            marker: {type: 'square', scale: 1.2, lineWidth: 0, fill: 'blue', strokeStyle: 'none'},
                            tooltip: {trackMouse: true, renderer: LVRMatris.trendTooltipRenderer}
                        }, {
                            type: 'line',
                            title: 'Pågående Landsting', // Ext.util.Format.ellipsis('Pågående ' + LVRMatris.trendTitleRenderer('county'), 18),
                            axis: 'left',
                            xField: 'period',
                            yField: 'countyCurrent',
                            label: {field: 'formatedCounty', display: 'over'},
                            style: {lineDash: [6, 3] },
                            marker: {type: 'circle', strokeStyle: 'none'},
                            tooltip: {trackMouse: true, renderer: LVRMatris.trendTooltipRenderer}
                        }, {
                            type: 'line',
                            title: 'Enhet', // Ext.util.Format.ellipsis(LVRMatris.trendTitleRenderer('unit'), 18),
                            axis: 'left',
                            xField: 'period',
                            yField: 'unit',
                            label: {field: 'formatedUnit', display: 'over'},
                            marker: {type: 'square', scale: 1.2, lineWidth: 0, fill: 'green', strokeStyle: 'none'},
                            tooltip: {trackMouse: true, renderer: LVRMatris.trendTooltipRenderer}
                        },   {
                            type: 'line',
                            title: 'Pågående Enhet', // Ext.util.Format.ellipsis('Pågående ' + LVRMatris.trendTitleRenderer('unit'), 18),
                            axis: 'left',
                            xField: 'period',
                            yField: 'unitCurrent',
                            label: {field: 'formatedUnit', display: 'over'},
                            style: {lineDash: [6, 3] },
                            marker: {type: 'circle', strokeStyle: 'none'},
                            tooltip: {trackMouse: true, renderer: LVRMatris.trendTooltipRenderer}
                        }
                    ]
                } ));
            } else {
                return Ext.create('Ext.chart.Chart', Ext.Object.merge({
                    flipXY: true,
                    insetPadding: '0 30 30 30',
                    style: {
                        borderWidth: '1px 1px 0 1px',
                        borderColor: '#ddd',
                        borderStyle: 'solid',
                        'border-top-left-radius': '5px',
                        'border-top-right-radius': '5px'
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
                }, chartConf));
            }
        },
        getFormStore: function(formName){
            var store;
            try{
                store = LVRMatris._form.items.findBy(function(el){
                    return el.name === name;
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
            var form, conf = this.config;
            if (!data) {
                this.displayError('Oväntat fel...', 'Gick inte att hitta data när combos skulle renderas');
                return;
            }
            form = this.getForm();
            this._ct.add(form);
            Ext.each(data, function(d) {
                var combo = {
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
                };
                if (d.variable == 'landsting' && conf.trend ) {
                    combo.listeners = {
                        change: function (a,b,c,d) {
                            var unit = LVRMatris.getForm().getForm().findField('unit');
                            var unitType = LVRMatris.getForm().getForm().findField('unit_type');
                            var unitTypeValue = unitType && unitType.value || '0';
                            unit.setStore(LVRMatris.createUnitStore(parseInt(a.value, 10), unitTypeValue));
                            unit.setValue('0');
                        }
                    };
                }
                if (d.variable == 'unit_type' && conf.trend) {
                  combo.listeners = {
                    change: function (a,b,c,d) {
                      var unit = LVRMatris.getForm().getForm().findField('unit');
                      var landstingValue = LVRMatris.getForm().getForm().findField('landsting').value;
                      unit.setStore(LVRMatris.createUnitStore(parseInt(landstingValue, 10), a.value));
                      unit.setValue('0')
                    }
                  }
                }
                form.add(combo);
                if (d.variable == 'landsting' && conf.trend) {
                    form.add({
                        xtype: 'combo',
                        width: '100%',
                        store: {
                            fields: ['id', 'label'],
                            data: [{id:0, label: 'Ingen'}]
                        },
                        editable: false,
                        name: 'unit',
                        fieldLabel: 'Enhet',
                        value: '0',
                        valueField: 'id',
                        queryMode: 'local',
                        displayField: 'label'
                    });
                }
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
            var conf = this.config;
            var colums = [{
                    text: 'Namn',
                    dataIndex: 'displayName',
                    flex: 1,
                    renderer: function(val, metaData, record) {
                        return record.get('ongoing') ? 'Pågående ' + val : val;
                    }
                },
                {
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
                }
            ];
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
                columns: conf.trend ? Ext.Array.insert(colums, 1, [{text: 'År', style: {fontSize: '10px'}, width: 50, dataIndex: 'period'}]) : colums,
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
       trend: parseInt('{{trend}}')
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
    if(!isTemplate('{{ct}}')){
        initConf.container = '{{ct}}';
    }
    LVRMatris.init(initConf);
} ();
</script>
 <script type="text/javascript">
    Ext.onReady(function() {
        LVRMatris.init({
            // server: 'http://stratum.registercentrum.se',
            diagnosis: 1,
	trend: 1
            //dataRevision: 823,
            //specRevision: 823,
            //indicatorRevision: 823
        });
    });
</script>