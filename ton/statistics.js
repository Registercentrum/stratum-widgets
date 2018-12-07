
/**************************************************************************
   * Tonsill widget for charts of data
   **************************************************************************/
  
  var TonsillWidget = function () {
    var serverPrefix = Stratum.containers && Stratum.containers['TON/Statistics'] ? '' : 'https://stratum.registercentrum.se'
    // API account: Ronny
    var _apiKey = 'SJ9-63odWfc=';
    var _container = Stratum.containers && Stratum.containers['TON/Statistics'] || 'contentPanel';
  
    // Default values
    var _unit = Profile && Profile.Context && Profile.Context.Unit ? Profile.Context.Unit : null;
    var _unitCode = _unit == null ? 0 : _unit.UnitCode;
    var _unitName = _unit == null ? '(Riket)' : _unit.UnitName;
    var _indicatorId = 0;
    var _indicatorName = '(Alla indikatorer)';
  
    var _current = {
      isStateOverview: true,
      unitCode: _unitCode,
      unitName: _unitName,
      indicatorId: _indicatorId,
      indicatorName: _indicatorName,
      te: true,
      tt: true,
      ci: true,
      selectedYearIndex: -1
    };
  
    // Remove Keystone borders around panels
    Ext.util.CSS.removeStyleSheet('ton-defaults');
    Ext.util.CSS.createStyleSheet(''
      + '.x-panel-body-default { border-width: 0; } '
      + '#sw-tonstatistics, #sw-tonstatistics .x-form-text-default {font-size: 14px; color: #454c5a;}'
      //+ '.ton-legend .x-legend-item { display: block !important; max-width: 19.5em;}'
      + '.ton-legend-timeframe, .ton-legend-colors { font-size: 13px; line-height: 21px;}'
      + '.ton-legend-timeframe { margin: 3px 0 0 11px; }'
      + '.ton-legend-state-confidence-interval {width: 11px; height: 8px; border-top: 1px dashed blue; border-bottom: 1px dashed red; display: inline-block; margin: 0 5px 1px 6px;}'
      + '.ton-legend-confidence-interval {width: 24px; height: 11px; border-right: 1px solid black; border-left: 1px solid black; display: inline-block; margin: 0 5px 0px 14px;}'
      + '.ton-legend-confidence-interval-bar {width: 100%; height: 1px; border-top: 1px solid black; margin-top: 5px;}'
      + '.ton-circle {border-radius: 50%; width: 14px; height: 14px; display: inline-block; margin: 0 6px -1px 10px;}'
      + '.ton-green {background: #68ba8b;}'
      + '.ton-orange {background: #ffcb7f;}'
      + '.ton-red {background: #ed6154;}'
      + '.indicator-1 .ton-par-legend, .indicator-2 .ton-par-legend, .indicator-3 .ton-par-legend, .indicator-4 .ton-par-legend {'
      + '    visibility: hidden;'
      + '}'
      , 'ton-defaults');
  
  
    /**************************************************************************
     * Dropdowns for unit and indicator choices
     **************************************************************************/
    var createChoicesPanel = function () {
      var urlUnits = serverPrefix + '/stratum/api/metadata/units/register/129/';	// TODO: remove domain prefix
      // var urlUnits = serverPrefix + '/stratum/api/statistics/ton/grupperlista';
      var urlIndicators = serverPrefix + '/stratum/api/statistics/ton/indikatorerlista/'; // indikatorerlista2 // TODO: Not used yet
      var doChangeUnitCallback = null;
      var doChangeIndicatorCallback = null;
  
      Ext.util.CSS.removeStyleSheet('ton-choices');
      Ext.util.CSS.createStyleSheet(
        '.ton-choice .x-form-text-default { '
        + '		font: normal 16px open_sans,helvetica,arial,sans-serif; '
        + '		padding: 8px 10px 8px 10px; '
        + '} '
        + '	.ton-choice .x-form-trigger {'
        + '		vertical-align: middle;'
        + '	}'
        + '.nav-back-button {'
        + '		margin: 0;'
        + ' 	height: 22px;'
        + ' 	background: white;'
        + ' 	border: none;'
        + '     padding: 0px;'
        + '		padding-left: 5px;'
        + ' 	font-size: 20px;'
        + '		color: #286d7d;'
        + '}'
        + '#contentPanel .nav-back-button:hover {'
		+ '  text-decoration: none;'
		+ '}'
        + '	.nav-back-button .x-btn-wrap {'
        + ' 	display: initial;'
        + '	}'
        + ' .nav-back-button span {'
        + '		color: #286d7d !important;'
        + '	}'
        , 'ton-choices'
      );
  
      // TODO: Build a DB of indicators for other parts to use (to fetch IndicatorId and name?)
  
      var choicesPanel = Ext.create('Ext.container.Container', {
        itemId: 'Choices--',
        layout: 'hbox',
        margin: '0 0 20 0',
        items: [{
          xtype: 'combo',
          itemId: 'UnitSelector--',
          cls: 'ton-choice',
          value: 0,
          width: 400,
          margin: '0 10 0 0',
          fieldLabel: 'VÄLJ KLINIK',
          labelAlign: 'top',
          displayField: 'UnitName',
          valueField: 'UnitCode',
          value: _unitCode,
          forceSelection: false,
          typeAhead: true,
          queryMode: 'local',
          minChars: 1,
          checkChangeEvents: ['change', 'keyup'],
  
          store: {
            fields: ['UnitCode', 'UnitName'],
            autoLoad: true,
            proxy: {
              type: 'ajax',
              method: 'get',
              cors: true,
              url: urlUnits,
              extraParams: {
                apiKey: _apiKey
              },
              reader: {
                type: 'json',
                rootProperty: 'data'
              }
            },
            sorters: ['SortOrder'],
            listeners: {
              load: function (store) {
                var aUnit = { UnitCode: 0, UnitName: '(Riket)' };
                store.insert(0, aUnit);
                store.sort('UnitName', 'ASC'); 
              }
            }
          },
          listeners: {
            afterrender: function (combo) {
              combo.select('(Riket)');
            },
            select: {
              fn: function (combo) {
                _current.selectedYearIndex = -1;
                // TODO: Is this check needed?
                if (typeof doChangeUnitCallback === 'function')
                  doChangeUnitCallback(combo.getValue(), combo.getRawValue());
                else
                  console.log('Error in createChoices: doChangeUnitCallback is not set!');
              }
            }
          }
        }, {
          xtype: 'combo',
          itemId: 'IndicatorSelector--',
          cls: 'ton-choice',
          value: 0,
          flex: 1,
          fieldLabel: 'VÄLJ INDIKATOR',
          labelAlign: 'top',
          displayField: 'indicatorLabel',
          valueField: 'indicatorId',
          value: _indicatorId,
          store: {
            fields: ['indicatorId', 'indicatorLabel'],
            //proxy: 'ajax',
            //method: 'get',
            //cors: true,
            //url: urlIndicators,
            params: {
              apiKey: _apiKey
            },
            //reader: {
            //	type: 'json',
            //	rootProperty: 'data'
            //}
  
            // TEMP local data (keep sorter/listener)
            data: [
              {
                indicatorId: 0,
                indicatorLabel: '(Alla indikatorer)'
              }, {
                indicatorId: 1,
                indicatorLabel: 'Återinläggning för blödning'
              }, {
                indicatorId: 2,
                indicatorLabel: 'Smärta'
              }, {
                indicatorId: 3,
                indicatorLabel: 'Besvärsfrihet'
              }, {
                indicatorId: 4,
                indicatorLabel: 'Täckningsgrad'
              }],
            sorters: ['indicatorId'],
            listeners: {
              load: function (store) {
                store.sort('indicatorId', 'ASC');
              },
            }
          },
          listeners: {
            afterrender: function (combo) {
              combo.select('(Alla indikatorer)');
            },
            select: {
              fn: function (combo) {
                _current.selectedYearIndex = -1;
                // TODO: Is this check needed?
                if (typeof doChangeIndicatorCallback === 'function')
                  doChangeIndicatorCallback(combo.getValue(), combo.getRawValue(), false);
                else
                  console.log('Error in createChoices: doChangeIndicatorCallback is not set!');
              }
            }
          }
        },
        ]
      });
  
      choicesPanel.setChangeUnitCallback = function (callback) {
        doChangeUnitCallback = callback;
      }
  
      choicesPanel.setChangeIndicatorCallback = function (callback) {
        doChangeIndicatorCallback = callback;
      };
  
      choicesPanel.updateUnit = function () {
        choicesPanel.down('#UnitSelector--').setValue(_current.unitCode);
      };
  
      // Set the combo to show the current indicator when the user clicks on an indicator panel
      choicesPanel.updateIndicator = function () {
        choicesPanel.down('#IndicatorSelector--').setValue(_current.indicatorId);
      };
  
      return choicesPanel;
    }; // createChoices
  
    /**************************************************************************
     * Two lines of statistic numbers
     **************************************************************************/
    var createStatisticsPanel = function () {
      Ext.util.CSS.removeStyleSheet('ton-charts-statistics');
      Ext.util.CSS.createStyleSheet(
        '.upper-case { text-transform: uppercase } '
        + '.statistics-panel { '
        + '		border-top: solid 1px #359aa3; '
        + '		border-bottom: solid 1px #359aa3 '
        + '} '
        + '.statistics-panel-inner { border-bottom: dashed 1px #359aa3 } '
        + '.statistics-text { font-weight: bold; font-size: 20px; color: #58585a; } '
        , 'ton-charts-statistics'
      );
  
      var boldify = function (text) {
        return '<span style="font-weight:700">' + text + '</span>';
      };
  
      var updateOverviewData = function (rowPanel, row, unitCode) {
        var url = serverPrefix + '/stratum/api/statistics/ton/antaloperationer/'; // antaloperationer3
        Ext.Ajax.request({
          type: 'ajax',
          method: 'get',
          cors: true,
          url: url,
          params: {
            apiKey: _apiKey,
            group: unitCode,
            uiRow: row
          },
          success: function (response, opts) {
            var responseData = Ext.decode(response.responseText).data;
  
            var from = responseData.period.length > 0 ? responseData.period[0] : '';
            var to = responseData.period.length > 1 ? ' t om ' + responseData.period[1] : '';
            rowPanel.down('#rowCaption_' + row).setHtml(from + to);
            rowPanel.down('#op_count_' + row).setHtml(boldify(isNaN(responseData.op_count) ? '-' : responseData.op_count));
            rowPanel.down('#te_count_' + row).setHtml(boldify(isNaN(responseData.te_count) ? '-' : responseData.te_count));
            rowPanel.down('#tt_count_' + row).setHtml(boldify(isNaN(responseData.tt_count) ? '-' : responseData.tt_count));
            rowPanel.down('#freq_30_' + row).setHtml(boldify(
              isNaN(responseData.freq_30) ? '-'
                : Ext.util.Format.number(responseData.freq_30 * 100, '0%')));
            rowPanel.down('#freq_180_' + row).setHtml(boldify(
              isNaN(responseData.freq_180) ? '-'
                : Ext.util.Format.number(responseData.freq_180 * 100, '0%')));
          },
          failure: function (response, opts) {
            // response.status == 400, response.responseText == '...'
            console.log('Custom error in updateOverviewData, response:');
            console.dir(response);
          }
        });
      }; //updateOverviewData()
  
      var getStatisticsRow = function (row) {
        var statisticsRow = Ext.create('Ext.container.Container', {
          itemId: 'StatisticsRow' + row + '--',
          layout: 'column',
          cls: row === 1 ? 'statistics-panel-inner' : '',
          margin: row === 1 ? '15 0 10 0' : '15 0 10 0',
          paddingBottom: row === 1 ? '10px' : '',
          padding: '0 0 0 0',
          items: [{
            xtype: 'container',
            layout: 'auto',
            columnWidth: 0.6,
            items: [{
              xtype: 'container',
              //cls: 'upper-case',
              itemId: 'rowCaption_' + row,
              html: row === 1 ? 'Senaste 12 månaderna' : 'Senaste 5 åren'
            }, {
              xtype: 'container',
              layout: 'column',
              items: [{
                xtype: 'container',
                layout: 'vbox',
                columnWidth: 0.33,
                items: [{
                  xtype: 'container',
                  cls: 'statistics-text',
                  itemId: 'op_count_' + row,
                  html: '&ndash;'
                }, {
                  xtype: 'container',
                  html: 'Totalt'
                }]
              }, {
                xtype: 'container',
                layout: 'vbox',
                columnWidth: 0.33,
                items: [{
                  xtype: 'container',
                  cls: 'statistics-text',
                  itemId: 'te_count_' + row,
                  html: '&ndash;'
                }, {
                  xtype: 'container',
                  html: 'TE+TEA operationer'
                }]
              }, {
                xtype: 'container',
                layout: 'vbox',
                columnWidth: 0.33,
                items: [{
                  xtype: 'container',
                  cls: 'statistics-text',
                  itemId: 'tt_count_' + row,
                  html: '&ndash;'
                }, {
                  xtype: 'container',
                  html: 'TT+TTA operationer'
                }]
              }]
            }]
          }, {
            xtype: 'container',
            layout: 'auto',
            columnWidth: 0.4,
            items: [{
              xtype: 'container',
              cls: 'upper-case',
              html: 'Svarsfrekvens'
            }, {
              xtype: 'container',
              layout: 'column',
              items: [{
                xtype: 'container',
                layout: 'vbox',
                columnWidth: 0.5,
                items: [{
                  xtype: 'container',
                  cls: 'statistics-text',
                  itemId: 'freq_30_' + row,
                  html: '&ndash;'
                }, {
                  xtype: 'container',
                  html: '30 dagarsenkäten'
                }]
              }, {
                xtype: 'container',
                layout: 'vbox',
                columnWidth: 0.5,
                items: [{
                  xtype: 'container',
                  cls: 'statistics-text',
                  itemId: 'freq_180_' + row,
                  html: '&ndash;'
                }, {
                  xtype: 'container',
                  html: '6 månadersenkäten'
                }]
              }]
            }]
          }]
        });
  
        return statisticsRow;
      }; // getStatisticsRow()
  
      var row1 = null;
      var row2 = null;
      var statisticsPanel = Ext.create('Ext.container.Container', {
        itemId: 'StatisticsRows--',
        layout: 'auto',
        cls: 'statistics-panel',
        items: [
          row1 = getStatisticsRow(1),
          row2 = getStatisticsRow(2)
        ]
      });
  
      // Method to update the statistics rows with data for a particular unit
      statisticsPanel.updateUnit = function () {
        //console.log('statistics.updateUnit: ' + _current.unitCode + ', name:' + _current.unitName + ', (indicator:' + _current.indicatorId + ', unit:' + _current.unitCode + ')');
        updateOverviewData(row1, 1, _current.unitCode);
        updateOverviewData(row2, 2, _current.unitCode);
      };
  
      return statisticsPanel;
    }; // createStatisticsPanel
  
    /**************************************************************************
     * Overview of the four indicators
     **************************************************************************/
    var createIndicatorsPanel = function () {
      var greyish = '#e5edef';
      var darkGreenish = '#359aa3';
      var lightGreenish = '#89c1c7';
      var darkOrangish = '#f67e09';
      var lightOrangish = '#ebb281';
  
      Ext.util.CSS.removeStyleSheet('ton-charts-indicators');
      Ext.util.CSS.createStyleSheet(
        '.indicator-panel { '
        + '		cursor: pointer; '
        + '		padding-left: 15px; '
        + '		padding-right: 15px '
        + '} '
        + '.indicator-panel div { '
        + '		cursor: pointer '
        + '} '
        + '.indicators-header { '
        + '		display: block; '
        + '		border-bottom: 1px #286d7d solid; '
        + '		padding-top: 10px; '
        + '		padding-bottom: 5px; '
        + '		width: 100% '
        + '} '
        + '.indicators-header-text { '
        + '		font-size: 14px; '
        + '		font-weight: normal; '
        + '		color: #286d7d; '
        + '		padding: 0px '
        + '} '
        + '.indicators-header-link { '
        + '		font-size: 20px; '
        + '		color: #286d7d; '
        + '		padding: 0px '
        + '} '
        + '.indicators-chart { '
        + '		padding-top: 25px '
        + '} '
        + '.indicators-text { '
        //+ '		width: 125px;'
        + '		display: block; '
        + '		font-size: 12px; '
        + '		position: absolute;'
        + '		top: 62%;'
        + '		left: 190px;'
        + '		transform: translateY(-50%);'
        + '}'
        + '.indicator-panel .x-legend-inner {'
        + '  padding: 0px;'
        + '  width: 100%;'
        + '}'
        + '.indicator-panel .x-legend-horizontal {'
        + '  overflow-x: hidden;  '
        + '}'
        , 'ton-charts-indicators'
      );
  
      /*
       * Create a Bar Chart
       */
      var getBarChart = function (chartId, name, title) {
        var barChart = Ext.create('Ext.container.Container', {
          itemId: 'Chart' + chartId + '--',
          cls: 'indicator-panel',
          enableToggle: true,
          bodyStyle: { 'background-color': greyish },
          style: { backgroundColor: greyish },
          layout: 'auto',
          margin: '10 20 20 0',
          listeners: {
            click: {
              element: 'el',
              fn: function (event) {
                if (typeof doClickIndicatorCallback === 'function')
                  doClickIndicatorCallback(chartId, name, true);
                else
                  console.log('Error in getPieChart: doClickIndicatorCallback is not set!');
              }
  
            },
          },
          items: [{
            xtype: 'container',
            cls: 'indicators-header',
            layout: 'hbox',
            items: [{
              xtype: 'label',
              cls: 'indicators-header-text',
              html: title,
              flex: 1
            }, {
              xtype: 'container',
              bodyStyle: {
                background: greyish
              },
              html: '<span class="fa fa-arrow-right indicators-header-link" aria-hidden="true"></span>'
            }]
          }, {
            xtype: 'cartesian',
            itemId: 'chart' + chartId,
            width: '100%',
            height: 250,
            padding: '20 0 0 0',
            innerPadding: {
              top: 40
            },
            colors: [darkGreenish, greyish], // Overridden in updatePanel
            background: greyish,
            store: {
              fields: []
            },
            legend: {
              type: 'dom',
              docked: 'top',
              toggleable: false,
              width: '100%',
              style: {
                backgroundColor: greyish
              },
              tpl: [
                // '<div class="x-legend-container"><tpl for="."><div class="x-legend-item"><span class="x-legend-item-marker {[ values.disabled ? Ext.baseCSSPrefix + \'legend-inactive\' : \'\' ]}" style="background:{mark};"></span>{name}</div></tpl><div style="height: 30px; font-size: 13px;"><span class="x-legend-item-marker" style="top: 34px; left:14px; background: rgba(53, 154, 163, 0.5);"></span><span class="x-legend-item-marker" style="top: 34px; left:30px; background: rgba(246, 126, 9, 0.5);"></span><span style="top: 38px; position: absolute; left: 50px;">Inte matchat med PAR</span></div>'
                '<div class="x-legend-inner"><div class="x-legend-container"><tpl for="."><div class="x-legend-item"><span class="x-legend-item-marker {[ values.disabled ? Ext.baseCSSPrefix + \'legend-inactive\' : \'\' ]}" style="background:{mark};"></span>{name}</div></tpl></div>'
              ],
            },
            axes: [{
              hidden: true,
              minimum: 0,
              type: 'numeric',
              fields: ['allFraction', 'groupFraction'],
              position: 'left'
            }, {
              type: 'category',
              fields: ['label'],
              position: 'bottom',
              renderer: function (axis, label) {
                return label.replace('#', '\n');
              }
            }],
            series: [{
              type: 'bar',
              stacked: false,
              title: ['Riket', 'Vald enhet'], // Overridden in updatePanel
              xField: 'label',
              yField: ['allFraction', 'groupFraction'],
              label: {
                field: ['allFractionText', 'groupFractionText'],
                display: 'outside',
                orientation: 'horizontal',
                calloutColor: 'none',
                padding: 0,
                renderer: function (v) {
                  return (v === '0,0%') ? '' : v;
                }
              },
              tooltip: {
                trackMouse: true,
                renderer: function (tooltip, rec, item) {
                  var period = rec.data.label.split('#')[0];
                  var text = Ext.String.format(
                    '<span style="font-weight:bold">{0}</span><br>' +
                    'Period: {1}<br>',
                    title, period);
  
                  if (isNaN(rec.data.allFraction)) {
                    text += 'Riket: <span style="color:red">data saknas!</span>';
                  } else {
                    text += Ext.String.format(
                      'Riket: {0} patienter ({1})',
                      rec.data.allCount, rec.data.allFractionText);
                  }
  
                  if (rec.data.displayGroup) {
                    if (rec.data.groupNoData) {
                      text += '<br>Enheten: <span style="color:red">data saknas!</span>';
                    } else {
                      text += Ext.String.format(
                        '<br>Enheten: {0} patienter ({1})',
                        rec.data.groupCount, rec.data.groupFractionText);
                    }
                  }
                  tooltip.setHtml(text);
                }
              },
              renderer: function (sprite, config, rendererData, index) {
                var record = rendererData.store.getData().items[index];
  
                if (record) {
                  var field = sprite._field;
                  var surface = sprite.getSurface();
                  //var isNational = (field === 'allFraction');
                  //console.log('field:' + field + ', ' + _current.unitName + ',' + _current.unitCode + ', chartID:' + chartId);
  
                  if (!surface.myTextSprites)
                    surface.myTextSprites = {};
                  var textSprites = surface.myTextSprites[field];
                  if (!textSprites)
                    textSprites = surface.myTextSprites[field] = [];
                  var textSprite = textSprites[index];
  
                  if (isNaN(record.data[field])) {
                    if (!textSprite)
                      textSprite = textSprites[index] = surface.add({ type: 'text' });
  
                    textSprite.setAttributes({
                      text: 'Inga\ndata',
                      x: config.x + 10,
                      y: 25,
                      fill: 'black', //'red',
                      fontSize: 12,
                      zIndex: 10001,
                      scalingY: -1
                    });
                    textSprite.show();
                  } else {
                    if (textSprite) {
                      textSprite.hide();
                    }
                  }
                }
  
                var changes = {
                  strokeStyle: 'none'
                };
                if (index === 1) {
                  // Last bar, color it different
                  if (sprite.attr.fillStyle === darkGreenish) {
                    changes.fillStyle = lightGreenish;
                  } else if (sprite.attr.fillStyle === darkOrangish) {
                    changes.fillStyle = lightOrangish;
                  }
                }
                return changes;
              }
            }]
          }]
        }); //create barChart
  
        barChart.doRedraw = function () {
          var chart = this.down('#chart' + chartId);
          chart.redraw();
        };
  
        barChart.updateData = function (unitCode, unitName) {
          // Hide/show the data for the selected group
          var chart = this.down('#chart' + chartId);
          updateIndicatorData(chart, chartId, unitCode, unitName);
          chart.setConfig('colors', unitCode === 0
            ? [darkGreenish, greyish]
            : [darkGreenish, darkOrangish]);
          chart.series[0].setConfig('title', unitCode === 0
            ? ['Riket', '']
            : ['Riket', unitName]);
        };
  
        return barChart;
      }; //getBarChart
  
      /*
       * Create a Pie Chart
       */
      var getPieChart = function (chartId, name, title) {
        var getPieChartText = function (chartId) {
          switch (chartId) {
            case 2:
              return 'andelen patienter som har '
                + 'kontaktat sjukvården på '
                + 'grund av smärta efter '
                + 'operationen, under de '
                + 'senaste 12 månaderna.';
            //+ '<i class="fa fa-arrow-right" aria-hidden="true"></i>';
            case 3:
              return 'uppger att de har blivit '
                + '&quot;besvärsfria&quot; eller &quot;ganska '
                + 'bra från sina besvär&quot; sex '
                + 'månader efter operation., '
                + 'under de senaste 12 '
                + 'månaderna.';
            case 4:
              return 'av patienterna som '
                + 'opereras finns i '
                + 'tonsillregistret. Uppgifterna '
                + 'avser 2017';
            default:
              return 'Beskrivning saknas';
          }
        };
  
        var polarChart = Ext.create('Ext.container.Container', {
          itemId: 'Chart' + chartId + '--',
          cls: 'indicator-panel',
          bodyStyle: { 'background-color': greyish },
          style: { backgroundColor: greyish },
          layout: 'auto',
          margin: chartId === 2 ? '10 0 20 0' :
            chartId === 3 ? '0 20 0 0' :
              '0 0 0 0',
          listeners: {
            click: {
              element: 'el',
              fn: function (event) {
                if (typeof doClickIndicatorCallback === 'function')
                  doClickIndicatorCallback(chartId, name, true);
                else
                  console.log('Error in getPieChart: doClickIndicatorCallback is not set!');
              }
            },
          },
          items: [{
            xtype: 'container',
            cls: 'indicators-header',
            layout: 'hbox',
            items: [{
              xtype: 'label',
              cls: 'indicators-header-text',
              html: title,
              flex: 1
            }, {
              xtype: 'container',
              bodyStyle: {
                background: greyish
              },
              html: '<span class="fa fa-arrow-right indicators-header-link" aria-hidden="true"></span>'
            }]
          }, {
            xtype: 'container',
            layout: 'column',
            items: [{
              xtype: 'container',
              //layout: 'vbox',
              //columnWidth: 0.38,
              items: [
                {
                  xtype: 'polar',
                  itemId: 'chart' + chartId,
                  cls: 'indicators-chart',
                  columnWidth: 0.5,
                  width: 190,
                  height: 260,
                  colors: ['#2f949e', '#1E667B'], // ljus '#FE9500','#C68311'
                  legend: {
                        type: 'dom',
                    docked: 'top',
                    tpl: ['<div class="x-legend-inner"><div style="width: 180px;" class="x-legend-container">' +
                      '<div  class="x-legend-item">' +
                      '<span class="x-legend-item-marker"></span><span>...</span>' +
                      '</div></div></div>'],
                    style: {
                      background: greyish
                    }
                  },
                  background: greyish,
                  store: {
                    fields: []
                  },
                  series: [{
                    type: 'pie',
                    angleField: 'groupFraction',
                    showInLegend: true,
                    donut: 60,
                    style: {
                      miterLimit: 10,
                      lineCap: 'miter',
                      lineWidth: 0,
                    },
                    subStyle: {
                      strokeStyle: ['greyish', 'greyish', 'greyish', 'greyish', 'greyish'],
                      lineWidth: [1, 1, 1, 1, 1]
                    },
                    tooltip: {
                      trackMouse: true,
                      renderer: function (tooltip, rec, item) {
                        var text = Ext.String.format(
                          '<span style="font-weight:bold">{0}</span><br>{1}',
                          title, rec.data.tooltip);
                        tooltip.setHtml(text);
                      }
                    },
                    renderer: function (sprite, config, renderData, index) {
                      if (index === 0) {
                        var store = renderData.store,
                          storeItems = store.getData().items,
                          record = storeItems[index],
                          surface = sprite.getSurface(),
                          textSprites,
                          textSprite;
                        if (!record) {
                          return;
                        }
  
                        textSprites = surface.myTextSprites;
                        if (!textSprites) {
                          textSprites = surface.myTextSprites = [];
                        }
                        textSprite = textSprites[index];
                        if (!textSprite) {
                          textSprite = textSprites[index] = surface.add({ type: 'text' });
                        }
  
                        var size = surface.container.getSize();
                        var x = size.width / 2;
                        var y = size.height / 2;
  
                        if (isNaN(record.data.groupFraction)) {
                          textSprite.setAttributes({
                            text: 'Data saknas eller det finns\nfärre än fem registreringar.',
                            x: x - 80,
                            y: y - 10,
                            fontSize: 12,
                            zIndex: 10000
                          });
                        } else {
                          textSprite.setAttributes({
                            text: record.data.groupFractionText
                          });
  
                          var spritewidth = textSprite.attr.bbox.transform.width;
  
                          textSprite.setAttributes({
                            x: x - spritewidth / 2 - 8,
                            y: y + 3,
                            fill: 'black',
                            //fontFamily: 'open_sans',
                            fontWeight: 700,
                            color: '#58585a',
                            fontSize: 30,
                            zIndex: 10000
                          });
                        }
                      }
                    }
                  }]
                }]
            }, {
              xtype: 'component',
              //columnWidth: 0.5,
              cls: 'indicators-text',
              html: getPieChartText(chartId)
            }]
          }]
        }); //create polarChart
  
        /*** External methods ***/
        polarChart.doRedraw = function () {
          var chart = this.down('#chart' + chartId);
          chart.redraw();
        };
  
        polarChart.updateData = function (unitCode, unitName) {
          // Change color if local data (setColor only changes the color temporarily)
          var chart = this.down('#chart' + chartId);
          updateIndicatorData(chart, chartId, unitCode, unitName);
          chart.setConfig('colors', unitCode === 0
            ? ['#2f949e', '#1E667B']
            : ['#FE9500', '#C68311']);
        };
  
        return polarChart;
      }; //getPieChart
  
      /*
       * Temporary solution to show "not implemented message
       */
      var getNoChart = function (chartId, name, title) {
        var noChart = Ext.create('Ext.container.Container', {
          cls: 'indicator-panel',
          bodyStyle: { 'background-color': greyish },
          style: { backgroundColor: greyish },
          layout: 'auto',
          margin: '0 0 0 0',
          items: [{
            xtype: 'label',
            cls: 'indicators-header',
            text: title
          }, {
            xtype: 'container',
            layout: 'fit',
            style: {
              color: 'red',
              fontSize: '18pt',
              padding: '20pt'
            },
            html: 'Ej implementerad'
          }]
        }); //create noChart
  
        noChart.doRedraw = function () { /* do nothing */ };
  
        // No update
        noChart.updateData = function (unitCode, unitName) { /* do nothing */ };
  
        return noChart;
      }; //getNoChart
  
      // Transform incoming data to a usable format, depending on indicator
      var transformData = function (indicatorId, unitCode, unitName, data) {
        var isNational = (unitCode === 0);
        var noAllData = false;
        var noGroupData = false;
  
        var result = {
          data: [] //,
        };
        var item = null;
  
        if (indicatorId === 1) {
          // Bar chart - return all data
          // (Group is same as All if 'Riket' is selected)
          for (key in data) {
            if(key === '0') continue;
            noAllData = (data[key].all.fraction === 'NaN');
            noGroupData = (data[key].group.fraction === 'NaN')  || (data[key].group.fraction === 'NA');
            item = {
              label: data[key].period[0] + '\u2013' + data[key].period[1],
              // + (key === '0' ? '#Matchat, PAR' : '#Utan PAR'),
              allNoData: noAllData, // NY
              allFraction: data[key].all.fraction * 100,
              allFractionText: Ext.util.Format.number(data[key].all.fraction * 100, '0.0%'),
              allCount: data[key].all.count_ind,
              displayGroup: (unitCode !== 0),
              groupNoData: noGroupData, // NY
              //groupHasData: unitCode !== 0 && !isNaN(data[key].group.fraction),
              groupFraction: unitCode === 0 ? 0 : data[key].group.fraction * 100,
              groupFractionText: unitCode === 0 ? '' : Ext.util.Format.number(data[key].group.fraction * 100, '0.0%'),
              groupCount: unitCode === 0 ? 0 : data[key].group.count_ind
            };
            result.data.push(item);
          }
        } else {
          if (data.length !== 2) {
            console.log('Error in transformData, incoming data was not an array of two! '
              + 'Indicator:' + indicatorId + ', unitCode:' + unitCode);
            return result;
          }
  
          // Pie charts - Use the last 12 months data for indicator 2 and 3,
          // and the earlier data for indicator 4
          var index = (indicatorId === 4) ? 0 : 1;
          noGroupData = (data[index].group.noGroupData);
          item = {
            label: data[index].period[0] + ' - ' + data[index].period[1],
            groupNoData: noGroupData,
            groupFraction: (data[index].group.fraction * 100) + 0.001,
            groupFractionText: Ext.util.Format.number(data[index].group.fraction * 100, '0%'),
            groupCount: data[index].group.count_ind
          };
  
          // Store the tooltip in both data points
          var tooltip = Ext.String.format('{0}: {1} patienter ({2})',
            isNational ? 'Riket' : 'Enheten',
            item.groupCount, item.groupFractionText);
          item.tooltip = tooltip;
          result.data.push(item);
  
          // Also need a secon data point, the supplement of groupFraction for a sum of 100%
          item = {
            label: null,
            groupFraction: 100 - data[index].group.fraction * 100,
            groupFractionText: null,
            groupCount: 0,
            tooltip: tooltip
          };
          result.data.push(item);
        }
  
        return result;
      }; //transformData
  
      var updateIndicatorData = function (chart, indicatorId, unitCode, unitName) {
        var url = serverPrefix + '/stratum/api/statistics/ton/oversiktsandelar/'; // oversiktsandelar3
        var me = this;
        Ext.Ajax.request({
          url: url,
          method: 'get',
          cors: true,
          params: {
            apiKey: _apiKey,
            group: unitCode,
            indicatorId: indicatorId
          },
          success: function (response, opts) {
  
            var responseData = Ext.decode(response.responseText).data;
            var myData = transformData(indicatorId, unitCode, unitName, responseData);
            
            chart.store.loadData(myData.data);
  
            if (indicatorId != 1) {
              chart.legend.update(
                '<div class="x-legend-inner"><div style="width: 180px;" class="x-legend-container">' +
                '<div  class="x-legend-item">' +
                '<span class="x-legend-item-marker" style="background: ' + chart.getColors()[0] + '"></span><span>' + unitName.replace('(','').replace(')','') + '</span>' +
                '</div></div></div>'
              );
            }
            chart.redraw();
          },
          failure: function (response, opts) {
            console.log('updateChart error: ' + response.status + ', ' + response.responseText);
          }
        });
      }; //updateIndicatorData
  
      var chart1 = null,
        chart2 = null,
        chart3 = null,
        chart4 = null;
  
      var indicatorsPanel = Ext.create('Ext.container.Container', {
        itemId: 'Indicators--',
        layout: 'column',
        margin: '15 0 0 0',
        defaults: {
          columnWidth: 0.5,
          height: 307
        },
        items: [
          // TODO: Use the API or preloaded DB for chartId and name
          chart1 = getBarChart(1, 'Återinläggning för blödning', 'Återinläggning för blödning'),
          chart2 = getPieChart(2, 'Smärta', 'Sökt för smärta efter operation'),
          chart3 = getPieChart(3, 'Symptomfrihet', 'Besvärsfrihet'),
          chart4 = getPieChart(4, 'Täckningsgrad', 'Täckningsgrad')
          //chart4 = getNoChart(4, 'Täckningsgrad', 'Täckningsgrad')
        ],
      });
  
      // Method to update the indicator overviews with data for a particular unit
      indicatorsPanel.updateUnit = function () {
        chart1.updateData(_current.unitCode, _current.unitName);
        chart2.updateData(_current.unitCode, _current.unitName);
        chart3.updateData(_current.unitCode, _current.unitName);
        chart4.updateData(_current.unitCode, _current.unitName);
      };
  
      // Set the callback function to be called when the user changes indicator
      indicatorsPanel.setDoClickIndicatorCallback = function (callback) {
        doClickIndicatorCallback = callback;
      };
  
      return indicatorsPanel;
    }; //createIndicatorsPanel
  
  
    /**************************************************************************
     * Detaild 5-year chart of chosen indicator's trend
     **************************************************************************/
    var createChart5Year = function (legend) {
      var doClickYearCallback = null;
      var legend = Ext.create('Ext.chart.Legend', {
            type: 'dom',
        itemId: 'Legend--',
        flex: 1,
        docked: 'top',
        tpl: [
          '<div class="x-legend-inner"><div class="x-legend-container ton-legend"><tpl for="."><div class="x-legend-item"><span class="x-legend-item-marker {[ values.disabled ? Ext.baseCSSPrefix + \'legend-inactive\' : \'\' ]}" style="background:{mark};"></span>{name}</div></tpl><div class="ton-par-legend" style="margin-top: 8px;"><span class="x-legend-item-marker" style="top: 31px; left: 13px; background: rgba(53, 154, 163, 0.5);"></span><span class="x-legend-item-marker" style="top: 31px; left:30px; background: rgba(246, 126, 9, 0.5);"></span><span style="margin-left: 50px; font-size: 13px;">Inte matchat med PAR</span></div></div></div>'
        ],
        listeners: {
          render: function (me, eOpts) {
            // console.log(me.tpl);
          }
        }
      });
  
      var selectYear = function (yearData, name) {
        // console.log('... year selected:' + yearData.year);
        //_current.selectedYearIndex = index;
        doClickYearCallback(yearData, name);
      };
  
      var chart5Year = Ext.create('Ext.chart.CartesianChart', {
        itemId: 'FiveYearChart--',
        width: '100%',
        height: 350,
        padding: '0 0 0 0',
        innerPadding: {
          top: 40
        },
        colors: ['#359AA3', '#F67E09'], // darkGreenish, darkOrangish
        background: 'white',
        legend: legend,
        animation: false,
        //autoRender: true,	// TODO: Temp
        plugins: {
          ptype: 'chartitemevents',
          clickEvents: true
        },
        store: {
          fields: []
          // Add listeners (See stratum start page f12-code)
          //		init? - stop chart animation, set opacity = 0
          // 		load -  start animation + your own animation (opacity)
          //				(what happens during reload?)
        },
        axes: [{
          type: 'numeric',
          fields: ['fractionN', 'fraction'],
          position: 'left',
          //minimum: 0,
          //maximum: 1,
          style: {
            axisLine: false
          },
          grid: {
            odd: {
              stroke: 'white'
            },
            even: {
              stroke: '#e8e8e8'
            }
          },
          renderer: function (axis, label, layout, lastLabel) {
            return Ext.util.Format.number(label * 100, '0%');
          }
        }, {
          type: 'category',
          fields: 'year',
          position: 'bottom',
          renderer: function(axis, label){
            return label + ' >';
          }
        }],
  
        series: [{
          type: 'bar',
          stacked: false,
          title: ['Riket', 'Vald enhet'],
          xField: 'year',
          yField: ['fractionN', 'fraction'],
          /*
          label: {									// TODO: Replace with sprite texts for better placement with CI
            field: ['fractionN', 'fraction'],
            display: 'outside',
            orientation: 'horizontal',
            calloutColor: 'none',
            renderer: function (v) {
              return (v === 0) ? '' : Ext.util.Format.number(v * 100, '0.0%');
            }
          },
          */
          tooltip: {
            trackMouse: true,
            renderer: function (tooltip, rec, item) {
              var text = 'Andel: {0}<br>'
                + 'Totalt: {1} operationer<br>'
                + 'Operationsteknik: {2}<br>'
                + 'Svarsfrekvens 30 d: {3}<br>'
                + 'Svarsfrekvens 6 mån: {4}<br>'
                + 'Täckningsgrad: {5}'
              if (_current.indicatorId === 1)
                // text += '<br>Matchad, PAR: {6}';
  
              var suffix = item.field === 'fraction' ? '' : 'N';
              var fraction = Ext.util.Format.number(rec.data['fraction' + suffix] * 100, '0.0%');
              var total = rec.data['count' + suffix];
              if(total==='NA'){total = '?'};
              var opTech = (rec.data.te === 1 ? 'TE+TEA' : '') + (rec.data.te === 1 && rec.data.tt === 1 ? '/' : '') + (rec.data.tt === 1 ? 'TT+TTA' : '');
              var freq30 = Ext.util.Format.number(rec.data['freq30' + suffix] * 100, '0%');
              var freq180 = Ext.util.Format.number(rec.data['freq180' + suffix] * 100, '0%');
              var coverage = Ext.util.Format.number(rec.data['coverage' + suffix] * 100, '0%') || '-';
              var par = rec.data['par' + suffix] ? 'ja' : 'nej';
  
              text = Ext.String.format(text, fraction, total, opTech, freq30, freq180, coverage, par);
              tooltip.setHtml(text);
            }
          },
          renderer: function (sprite, config, rendererData, index) {
            var record = rendererData.store.getData().items[index];
            var field = sprite._field;						// Name of current field (source value for the bar)
            var surface = sprite.getSurface();				// Ext.draw.engine.Canvas
            var isNationalField = (field === 'fractionN');
            var suffix = isNationalField ? 'N' : '';
  
            if (record) {
              /***** Show 'inga data' if there are no data for each bar *****/
              if (!surface.myTextSprites)
                surface.myTextSprites = {};
              var textSprites = surface.myTextSprites[field];
              if (!textSprites)
                textSprites = surface.myTextSprites[field] = [];
              var textSprite = textSprites[index];
              var isNoData = record.data['noData' + suffix];
              var isTooFewData = record.data['tooFewData' + suffix];
              var isNational = (_current.unitCode === 0);
  
              // Show 'inga data' if:
              // - There's no data for the current bar
              //   AND
              //   - is a national bar
              //   - or a clinic bar and the user has chosen to see a clinic's data
              if ((isNoData || isTooFewData) && (isNationalField || !isNational)) {
                if (!textSprite)
                  textSprite = textSprites[index] = surface.add({ type: 'text' });
                textSprite.setAttributes({
                  text: isTooFewData?'För få\ndata':'Inga\ndata',
                  x: config.x + 8,
                  y: 25,
                  fill: 'black',
                  fontSize: 12,
                  zIndex: 10001,
                  scalingY: -1
                });
                textSprite.show();
              } else {
                if (textSprite)
                  textSprite.hide();
              }
  
              /***** Handle the CI (konfidensintervall) *****/
              if (!surface.myCISprites)
                surface.myCISprites = {};
              var ciSprites = surface.myCISprites[field];
              if (!ciSprites)
                ciSprites = surface.myCISprites[field] = [];
              var ciSprite = ciSprites[index];
  
              if (_current.ci && !(isNoData || isTooFewData)) {
                var scale = sprite.attr.scalingY;				// Scale of Y-axis (multiplay with value to get pixels)
                var lineWidth = 1;								// Width of the lines
                var canvasHeight = sprite.attr.innerHeight;			// Height of the chart in canvas
                var lower = record.data['lower' + suffix];		// CI lower value
                var lowerS = lower * scale;					// CI lower Y-axis placement in pixels
                var upper = record.data['upper' + suffix];		// CI upper value
                var upperS = upper * scale;					// CI upper Y-axis placement in pixels
                var fraction = record.data['fraction' + suffix];	// The fraction value
                var fractionS = fraction * scale;					// Fraction Y-axis placement in pixels
                var fractionText = Ext.util.Format.number(fraction * 100, '0.0%');	// Rounded fraction value (displayed above the bar)
                var ciWidth = config.width / 2;					// Width of the CI lower/upper lines
                var barX = config.x + (config.width / 2);	// Center X-axis point of the bar
                var barY = config.y;							// Top edge Y-axis point of the bar
                var minY = Math.max(lineWidth, lowerS);						// Lowest safe/visible Y-axis point for the bar
                var maxY = Math.min((canvasHeight - lineWidth), upperS);		// Upper safe/visible Y-axis point for the bar
  
                // TODO: Remove
                //console.log('Render: index:' + index + ', field: ' + field + ', fraction+lower+upper:' + fraction, lower, upper);
  
                if (!ciSprite)
                  ciSprite = ciSprites[index] = surface.add({ type: 'path' });
                // TODO: Remove partial CI, only display whole
                if (upperS > maxY) {
                  ciSprite.setAttributes({
                    path: [
                      'M', barX, maxY,
                      'L', barX, minY,
                      'M', barX - (ciWidth / 2), minY,
                      'h', ciWidth
                    ],
                    stroke: '#58585a',
                    lineWidth: lineWidth,
                    zIndex: 10000
                  });
                } else {
                  ciSprite.setAttributes({
                    path: [
                      'M', barX - (ciWidth / 2), maxY,
                      'h', ciWidth,
                      'M', barX, maxY,
                      'L', barX, minY,
                      'M', barX - (ciWidth / 2), minY,
                      'h', ciWidth
                    ],
                    stroke: '#58585a',
                    lineWidth: lineWidth,
                    zIndex: 10000
                  });
                }
                ciSprite.show();
              } else {
                if (ciSprite)
                  ciSprite.hide();
              }
            } // if record
  
            /***** Handle the percentage sprites *****/
            if (!surface.myPercentageSprites) surface.myPercentageSprites = {};
            var percentageSprites = surface.myPercentageSprites[field];
            if (!percentageSprites) percentageSprites = surface.myPercentageSprites[field] = [];
            var percentageSprite = percentageSprites[index];
            if (!percentageSprite) percentageSprite = percentageSprites[index] = surface.add({ type: 'text', fontSize:13, zIndex: 11000, scalingY: -1 });
            var percentageY = maxY ? maxY: config.y;
            var percentageX = config.x - percentageSprite.attr.bbox.plain.width/2;
            percentageSprite.setAttributes({
              x: percentageX + 25,
              y: percentageY + 20,
              text: !(isNoData || isTooFewData) ? Ext.util.Format.number(record.data['fraction'+suffix] * 100, '0.0%') : ''
            });
            percentageSprite.show();
  
            /***** Check PAR and color the bars accordingly *****/
            var changes = {
              strokeStyle: 'none'
            };
            var isPar = record.data.par;
            var isParN = record.data.parN;
            var color = sprite.attr.fillStyle;
            var darkGreenish = '#359aa3';
            var lightGreenish = '#359aa3' // '#89c1c7';
            var darkOrangish = '#f67e09';
            var lightOrangish = '#f67e09' // '#ebb281';
  
            if (isPar === null) isPar = true;	// Default colors if PAR isn't set
            if (isParN === null) isParN = true;
  
            if (color === darkGreenish || color === lightGreenish) {			// TODO: "isNationalField" instead? (Check suffix?)
              changes.fillStyle = isParN ? darkGreenish : lightGreenish;
            } else if (color === darkOrangish || color === lightOrangish) {
              changes.fillStyle = isPar ? darkOrangish : lightOrangish;
            }
  
            return changes;
          }, //renderer
          listeners: {
            itemclick: function (series, item, event) {
              //console.log('itemclick:');
              //console.dir(item);
              //console.dir(series);
              _current.selectedYearIndex = item.index;
              selectYear(item.record.data, _current.indicatorName);
              //selectYear(item.record.data.year);
              //doClickYearCallback(item.record.data);
              //selectYear(-1, item.record.data);
            }
          }
        }] //series
        /*,
        listeners: {
          initialize: function(me, eOpts) {
            var axes = me.getAxes();
            var axisY = axes[0];
            axisY.setMaximum(40);
          }
        }
        */
      }); //chart5Year
  
      // Read incoming data and transform and add to result array.
      // Will be called twice, the final array will contain both regional and national data.
      var transformData = function (unitCode, newData, unitData) {
        var result = unitData || [];
        var suffix = unitCode === 0 ? 'N' : '';
  
        //var maxUpper = 0.0;
        for (var key in newData.years) {
          if (typeof result[key] === 'undefined')
            result[key] = {};
  
          if (unitData === null) {
            var emptyData = {
              year: newData.years[key].year,
              noData: true,
              fraction: 0.0,
              freq30: 0.0,
              freq180: 0.0,
              lower: 0.0,
              upper: 0.0,
              count: 0,
              coverage: 0.0,
              par: false,
              te: false,
              tt: false
            };
            // Set default values for the unit's data
            // There should be space alotted for the unit's bars even if not displayed
            result[key] = emptyData;
          }
          var tooFewData = newData.years[key].fraction === 'NA';
          var noData = (newData.years[key].fraction === 'NaN') || tooFewData ;
          
          var fraction = noData ? 0.0 : newData.years[key].fraction;
          var opCount = noData ? 0 : newData.years[key].op_count;
          var coverage = noData ? 0.0 : newData.years[key].coverage;
          var lower = noData ? 0.0 : newData.years[key].lower;
          var upper = noData ? 0.0 : newData.years[key].upper;
  
          result[key]['noData' + suffix] = noData;
          result[key]['tooFewData' +  suffix] = tooFewData;
          result[key]['year' + suffix] = newData.years[key].year;
          result[key]['fraction' + suffix] = fraction;
          result[key]['freq30' + suffix] = newData.years[key].freq_30;
          result[key]['freq180' + suffix] = newData.years[key].freq_180;
          result[key]['lower' + suffix] = lower;
          result[key]['upper' + suffix] = upper;
          result[key]['count' + suffix] = opCount;
          result[key]['coverage' + suffix] = coverage;
          result[key]['par' + suffix] = newData.years[key].par;
          result[key]['te'] = newData.te;
          result[key]['tt'] = newData.tt;
  
          //if (upper > maxUpper)
          //	maxUpper = upper;
        }
  
        //result['maxUpper' + suffix] = maxUpper;
        //console.log('Added maxUpper' + suffix + ' = ' + maxUpper);
  
        return result;
      }; //transformData
  
      // Get 5 year data for specified unit and national data recursively
      var updateChart5YearData = function (unitCode, unitData) {
        var isNational = (unitCode === 0);
        var includeTE = _current.te ? 1 : 0;
        var includeTT = _current.tt ? 1 : 0;
        var url = serverPrefix + '/stratum/api/statistics/ton/trendfemar/';
  
        Ext.Ajax.request({
          url: url,
          method: 'get',
          cors: true,
          params: {
            apiKey: _apiKey,
            group: unitCode,
            indicatorId: _current.indicatorId,
            includeTE: includeTE,
            includeTT: includeTT
          },
          success: function (response, opts) {
            var responseData = Ext.decode(response.responseText).data;
            var myData = transformData(unitCode, responseData, unitData);
  
            if (unitCode === 0) {
              // Get the object's values and load the values into the chart
              var values = Ext.Object.getValues(myData);
  
              // Check the maximum CI value and change the Y-axis accordingly
              var maxUpper = 0.0;
              var maxFraction = 0.0;
              //console.dir(values);
              Ext.each(values, function (v) {
                if (v.fraction > maxFraction)
                  maxFraction = v.fraction;
                if (v.fractionN > maxFraction)
                  maxFraction = v.fractionN;
                if (v.upper > maxUpper)
                  maxUpper = v.upper;
                if (v.upperN > maxUpper)
                  maxUpper = v.upperN;
              });
  
              //console.log('maxUpper=' + maxUpper + ', maxFraction=' + maxFraction + ', ci=' + _current.ci);
  
              var maxY = (_current.ci) ? (maxUpper + 0.01) : (maxFraction + 0.01);
              // Add max value to all years, used in 1-year chart
              Ext.each(values, function (v) {
                v.maxY = maxY;
              });
  
              chart5Year.axes[0]._maximum = maxY;
              chart5Year.updateLayout();
              chart5Year.store.loadData(values);
              chart5Year.store.loadData(chart5Year.store.getRange());
  
              // Make sure to update the 1 year, description and half-year-charts too!
              // Set them to the last year by default
              if (_current.selectedYearIndex === -1)
                _current.selectedYearIndex = values.length - 1;
              selectYear(values[_current.selectedYearIndex], _current.indicatorName);
  
              //var selectedValue = values[values.length-1];
              //selectYear(selectedValue.year);
              //doClickYearCallback(selectedValue);
            } else {
              // Recursively get the national data and add to the current unit's data
              updateChart5YearData(0, myData);
            }
          },
          failure: function (response, opts) {
            console.log('updateChart5YearData error indicatorId:' + _current.indicatorId + ', unitCode:' + unitCode
              + ' error:' + response.status + ', ' + response.responseText);
          }
        });
      }; //updateChart5YearData
  
      chart5Year.getLegend = function () {
        return legend;
      };
  
      // Update the indicator chart with regional and national data.
      // This function will be called twice (once recursively)
      chart5Year.updateData = function () {
        if (_current.indicatorId === 0) {
          chart5Year.store.loadData(chart5Year.store.getRange());
          return;
        }
  
        updateChart5YearData(_current.unitCode, null);
        chart5Year.store.loadData(chart5Year.store.getRange());
      }; //updateData
  
      chart5Year.setDoClickYearCallback = function (callback) {
        doClickYearCallback = callback;
      };
  
      return chart5Year;
    }; //createChart5Year
  
  
    /**************************************************************************
     * Detailed chart of chosen indicator and year
     **************************************************************************/
    var createChart1Year = function () {
      var chart1Year = Ext.create('Ext.chart.CartesianChart', {
        itemId: 'OneYearTrend--',
        width: '25%',
        height: 250,
        align: 'bottom',
        padding: '20 0 0 0',
        innerPadding: {
          top: 40
        },
        colors: ['#359AA3', '#F67E09'],
        background: 'white',
        animation: false,
        store: {
          fields: []
        },
        axes: [{
          hidden: true,
          minimum: 0,
          type: 'numeric',
          fields: ['fractionN', 'fraction'],
          position: 'left',
          style: {
            axisLine: false
          }
        }, {
          type: 'category',
          fields: 'year',
          position: 'bottom'
        }],
        series: [{
          type: 'bar',
          stacked: false,
          title: ['Riket', 'Vald enhet'],
          xField: 'year',
          yField: ['fractionN', 'fraction'],
          /*
          label: {
            field: ['fractionN', 'fraction'],
            display: 'outside',
            orientation: 'horizontal',
            calloutColor: 'none',
            renderer: function (v) {
              return (v === 0) ? '' : Ext.util.Format.number(v * 100, '0.0 %');
            }
          },
          */
          renderer: function (sprite, config, rendererData, index) {
            var record = rendererData.store.getData().items[index];
            var field = sprite._field;
            var surface = sprite.getSurface();
            var isNationalField = (field === 'fractionN');
            var suffix = isNationalField ? 'N' : '';
  
            if (record) {
              // Show 'inga data' if no data
              if (!surface.myTextSprites)
                surface.myTextSprites = {};
              var textSprites = surface.myTextSprites[field];
              if (!textSprites)
                textSprites = surface.myTextSprites[field] = [];
              var textSprite = textSprites[index];
              var isNoData = record.data['noData' + suffix];
              var isTooFewData = record.data['tooFewData' + suffix];
              var isNational = (_current.unitCode === 0);
  
              // Show 'inga data' if:
              // - There's no data for the current bar
              //   AND
              //   - is a national bar
              //   - or a clinic bar and the user has chosen to see a clinic's data
              if ((isNoData || isTooFewData) && (isNationalField || !isNational)) {
                if (!textSprite)
                  textSprite = textSprites[index] = surface.add({ type: 'text' });
                textSprite.setAttributes({
                  text: isTooFewData?'För få\ndata':'Inga\ndata',
                  x: config.x + 12,
                  y: 25,
                  fill: 'black', //'red',
                  fontSize: 12,
                  zIndex: 10001,
                  scalingY: -1
                });
                textSprite.show();
              } else {
                if (textSprite)
                  textSprite.hide();
              }
  
              // Handle the CI
              if (!surface.myCISprites)
                surface.myCISprites = {};
              var ciSprites = surface.myCISprites[field];
              if (!ciSprites)
                ciSprites = surface.myCISprites[field] = [];
              var ciSprite = ciSprites[index];
  
              if (_current.ci && !isNoData) {
                var scale = sprite.attr.scalingY;
                var lineWidth = 1;
                var canvasHeight = sprite.attr.innerHeight;
                var lower = record.data['lower' + suffix];
                var lowerS = lower * scale;
                var upper = record.data['upper' + suffix];
                var upperS = upper * scale;
                var fraction = record.data['fraction' + suffix];
                var fractionS = fraction * scale;
                var fractionText = Ext.util.Format.number(fraction * 100, '0.0%');
                var ciWidth = config.width / 2;
                var barX = config.x + (config.width / 2);
                var barY = config.y;
                var minY = Math.max(lineWidth, lowerS);
                var maxY = Math.min((canvasHeight - lineWidth), upperS);
  
                if (!ciSprite)
                  ciSprite = ciSprites[index] = surface.add({ type: 'path' });
                ciSprite.setAttributes({
                  path: [
                    'M', barX - (ciWidth / 2), maxY,
                    'h', ciWidth,
                    'M', barX, maxY,
                    'L', barX, minY,
                    'M', barX - (ciWidth / 2), minY,
                    'h', ciWidth
                  ],
                  stroke: '#58585a',
                  lineWidth: lineWidth,
                  zIndex: 10000
                });
                ciSprite.show();
              } else {
                if (ciSprite)
                  ciSprite.hide();
              }
            }
  
            /***** Handle the percentage sprites *****/
            if (!surface.myPercentageSprites) surface.myPercentageSprites = {};
            var percentageSprites = surface.myPercentageSprites[field];
            if (!percentageSprites) percentageSprites = surface.myPercentageSprites[field] = [];
            var percentageSprite = percentageSprites[index];
            if (!percentageSprite) percentageSprite = percentageSprites[index] = surface.add({ type: 'text', fontSize:13, zIndex: 11000, scalingY: -1 });
            var percentageX = config.x - percentageSprite.attr.bbox.plain.width/2;
            var percentageY = maxY ? maxY: config.y;
            percentageSprite.setAttributes({
              x: percentageX + 25,
              y: percentageY + 20,
              text: !(isNoData || isTooFewData) ? Ext.util.Format.number(record.data['fraction'+suffix] * 100, '0.0%') : ''
            });
            percentageSprite.show();
  
            // Check PAR and color the bars accordingly
            var changes = {
              strokeStyle: 'none'
            };
            var par = record.data['par' + suffix];
            if (par === null) par = true;
            var color = sprite.attr.fillStyle;
            var darkGreenish = '#359aa3';
            var lightGreenish = '#359aa3' // '#89c1c7';
            var darkOrangish = '#f67e09';
            var lightOrangish = '#f67e09' // '#ebb281';
  
            if (color === darkGreenish || color === lightGreenish) {
              changes.fillStyle = par ? darkGreenish : lightGreenish;
            } else if (color === darkOrangish || color === lightOrangish) {
              changes.fillStyle = par ? darkOrangish : lightOrangish;
            }
  
            return changes;
          }
        }]
      }); //chart1Year
  
      chart1Year.updateData = function (data) {
        if (_current.indicatorId === 0) {
          return;
        }
        // Set the Y-axis scale according to max number (fraction or CI upper level)
        if (data.length && data[0].maxY)
          chart1Year.axes[0]._maximum = data[0].maxY;
        chart1Year.updateLayout();
        chart1Year.store.loadData(data);
        chart1Year.store.loadData(chart1Year.store.getRange());
      };
  
      return chart1Year;
    }; //createChart1Year
  
  
    /**************************************************************************
     * Display information about chosen indicator and year (same as popup)
     **************************************************************************/
    var createChart1YearDescription = function () {
      var component = Ext.create('Ext.Component', {
        itemId: 'chartDescription',
        cls: 'ton-chart-description',
        width: '30%',
        align: 'bottom',
        padding: '0 10 0 10',
        margin: '45 10 0 10',
        bodyPadding: 5,
        style: {
          'background-color': '#d3e8ea',
          border: 'solid 1px #c3d8da'
        },
        html: 'Information'
      });
  
      component.updateDescription = function (data) {
        if (_current.indicatorId === 0) {
          return;
        }
  
        var text = '';
        if (data.noData) {
          if (_current.unitName === '(Riket)') {
            text = '<p>Ingen enhet vald</p>';
          } else {
            text = '<p><span style="color:#359aa3">' + _current.unitName + '</span><br>'
              + 'Data saknas för enheten för<br>det valda året</p>';
          }
          component.setMargin('130 10 0 10');
        } else {
          component.setMargin('45 10 0 10');
          var template = '<p><span style="color:#359aa3">{0}</span><br>'
            + 'Andel: {1}<br>'
            + 'Antal: {2} operationer<br>'
            + 'Operationsteknik: {3}<br>'
            + 'Svarsfrekvens 30 d: {4}<br>'
            + 'Svarsfrekvens 6 mån: {5}<br>'
            + 'Täckningsgrad: {6}<br>'
            //+ '<br>Up {8}, Low {9}<br>' // TEMP
            //+ 'UpN {10}, LowN {11}<br>' // TEMP
            //+ 'FractN {12}' // TEMP
            + (_current.indicatorId === 1 ? /*'<br>Matchad, PAR: {7}'*/ '' : '')
            + '</p>';
  
          var fraction = Ext.util.Format.number(data.fraction * 100, '0.0%');
          var freq30 = Ext.util.Format.number(data.freq30 * 100, '0%');
          var freq180 = Ext.util.Format.number(data.freq180 * 100, '0%');
          var coverage = Ext.util.Format.number(data.coverage * 100, '0%') || '-';
          var par = data.par ? 'ja' : 'nej';
          var te = _current.te;
          var tt = _current.tt;
          var total = data.count==='NA'?'?':data.count;
          
          var opTech = (te ? 'TE+TEA' : '') + (te && tt ? '/' : '') + (tt ? 'TT+TTA' : '');
          if (opTech === '') opTech = '-';
  
          /*
          var fractN = Ext.util.Format.number(data.fractionN * 100, '0.0%');
          var up = Ext.util.Format.number(data.upper * 100, '0.0%');
          var low = Ext.util.Format.number(data.lower * 100, '0.0%');
          var upN = Ext.util.Format.number(data.upperN * 100, '0.0%');
          var lowN = Ext.util.Format.number(data.lowerN * 100, '0.0%');
          */
          text = Ext.String.format(template, _current.unitName, fraction,
            total, opTech, freq30, freq180, coverage, par);
          //text = Ext.String.format(template, _current.unitName, fraction,
          //	data.count, opTech, freq30, freq180, coverage, par 
          //		,up, low, upN, lowN, fractN); // TEMP
        }
  
        chart1YearDescription.setHtml(text);
      }; //update
  
      return component;
    }; //createChart1YearDescription
  
  
    /**************************************************************************
     * Detailed chart displaying 6-month periods of chosen indicator and year
     **************************************************************************/
    var createChartHalfYear = function () {
      var chartHalfYear = Ext.create('Ext.chart.CartesianChart', {
        itemId: 'indicatorChartHalfYear',
        width: '45%',
        height: 250,
        align: 'bottom',
        //padding: '20 0 0 0',
        innerPadding: {
          top: 40
        },
        colors: ['#359AA3', '#F67E09'], // darkGreenish, darkOrangish
        background: 'white',
        animation: false,
        store: {
          fields: []
        },
        axes: [{
          hidden: true,
          minimum: 0,
          type: 'numeric',
          fields: ['fractionN', 'fraction'],
          position: 'left',
          style: {
            axisLine: false
          }
        }, {
          type: 'category',
          fields: 'period',
          position: 'bottom',
        }],
        series: [{
          type: 'bar',
          stacked: false,
          title: ['Riket', 'Vald enhet'],
          xField: 'period',
          yField: ['fractionN', 'fraction'],
          /*
          label: {
            field: ['fractionN', 'fraction'],
            display: 'outside',
            orientation: 'horizontal',
            calloutColor: 'none',
            renderer: function (v) {
              return (v === 0) ? '' : Ext.util.Format.number(v * 100, '0.0%');
            }
          },
          */
          tooltip: {
            trackMouse: true,
            renderer: function (tooltip, rec, item) {
              var text = 'Andel: {0}<br>'
                + 'Totalt: {1} operationer<br>'
                + 'Operationsteknik: {2}<br>'
                + 'Svarsfrekvens 30 d: {3}<br>'
                + 'Svarsfrekvens 6 mån: {4}<br>'
              var suffix = (item.field === 'fraction') ? '' : 'N';
              var fraction = Ext.util.Format.number(rec.data['fraction' + suffix] * 100, '0.0%');
              var total = rec.data['count' + suffix];
              if(total==='NA'){total='?'};
              var opTech = (rec.data.te === 1 ? 'TE' : '') + (rec.data.te === 1 && rec.data.tt === 1 ? '+' : '') + (rec.data.tt === 1 ? 'TT' : '');
              var freq30 = Ext.util.Format.number(rec.data['freq30' + suffix] * 100, '0%');
              var freq180 = Ext.util.Format.number(rec.data['freq180' + suffix] * 100, '0%');
              text = Ext.String.format(text, fraction, total, opTech, freq30, freq180);
              tooltip.setHtml(text);
            }
          },
          renderer: function (sprite, config, rendererData, index) {
            var record = rendererData.store.getData().items[index];
            var field = sprite._field;						// Name of current field (source value for the bar)
            var surface = sprite.getSurface();				// Ext.draw.engine.Canvas
            var isNationalField = (field === 'fractionN');
            var suffix = isNationalField ? 'N' : '';
            var isAvailable = true; //(_current.indicatorId === 2 || _current.indicatorId === 3);
  
            if (record) {
              /***** Show 'inga data' if there are no data for each bar *****/
              if (!surface.myTextSprites)
                surface.myTextSprites = {};
              var textSprites = surface.myTextSprites[field];
              if (!textSprites)
                textSprites = surface.myTextSprites[field] = [];
              var textSprite = textSprites[index];
              var isNoData = record.data['noData' + suffix];
              var isTooFewData = record.data['tooFewData' + suffix];
              var isNational = (_current.unitCode === 0);
  
              // Show 'inga data' if:
              // - There's no data for the current bar and the chart is available for this indicator
              //   AND
              //   - is a national bar
              //   - or a clinic bar and the user has chosen to see a clinic's data
              if ((isNoData || isTooFewData) && isAvailable && (isNationalField || !isNational)) {
                if (!textSprite)
                  textSprite = textSprites[index] = surface.add({ type: 'text' });
                textSprite.setAttributes({
                  text: isTooFewData?'För få\ndata':'Inga\ndata',
                  x: config.x + 10,
                  y: 25,
                  fill: 'black', //'red',
                  fontSize: 12,
                  zIndex: 10001,
                  scalingY: -1
                });
                textSprite.show();
              } else {
                if (textSprite)
                  textSprite.hide();
              }
  
              /***** Handle the CI (konfidensintervall) *****/
              if (!surface.myCISprites)
                surface.myCISprites = {};
              var ciSprites = surface.myCISprites[field];
              if (!ciSprites)
                ciSprites = surface.myCISprites[field] = [];
              var ciSprite = ciSprites[index];
  
              if (_current.ci && !record.data['noData' + suffix]) {
                var scale = sprite.attr.scalingY;				// Scale of Y-axis (multiplay with value to get pixels)
                var lineWidth = 1;								// Width of the lines
                var canvasHeight = sprite.attr.innerHeight;			// Height of the chart in canvas
                var lower = record.data['lower' + suffix];		// CI lower value
                var lowerS = lower * scale;					// CI lower Y-axis placement in pixels
                var upper = record.data['upper' + suffix];		// CI upper value
                var upperS = upper * scale;					// CI upper Y-axis placement in pixels
                var fraction = record.data['fraction' + suffix];	// The fraction value
                var fractionS = fraction * scale;					// Fraction Y-axis placement in pixels
                var fractionText = Ext.util.Format.number(fraction * 100, '0.0%');	// Rounded fraction value (displayed above the bar)
                var ciWidth = config.width / 2;					// Width of the CI lower/upper lines
                var barX = config.x + (config.width / 2);	// Center X-axis point of the bar
                var barY = config.y;							// Top edge Y-axis point of the bar
                var minY = Math.max(lineWidth, lowerS);						// Lowest safe/visible Y-axis point for the bar
                var maxY = Math.min((canvasHeight - lineWidth), upperS);		// Upper safe/visible Y-axis point for the bar
  
                if (!ciSprite)
                  ciSprite = ciSprites[index] = surface.add({ type: 'path' });
                // TODO: Remove partial CI, only display whole
                if (upperS > maxY) {
                  ciSprite.setAttributes({
                    path: [
                      'M', barX, maxY,
                      'L', barX, minY,
                      'M', barX - (ciWidth / 2), minY,
                      'h', ciWidth
                    ],
                    stroke: '#58585a',
                    lineWidth: lineWidth,
                    zIndex: 10000
                  });
                } else {
                  ciSprite.setAttributes({
                    path: [
                      'M', barX - (ciWidth / 2), maxY,
                      'h', ciWidth,
                      'M', barX, maxY,
                      'L', barX, minY,
                      'M', barX - (ciWidth / 2), minY,
                      'h', ciWidth
                    ],
                    stroke: '#58585a',
                    lineWidth: lineWidth,
                    zIndex: 10000
                  });
                }
                ciSprite.show();
              } else {
                if (ciSprite)
                  ciSprite.hide();
              }
  
              /***** Handle the percentage sprites *****/
            if (!surface.myPercentageSprites) surface.myPercentageSprites = {};
            var percentageSprites = surface.myPercentageSprites[field];
            if (!percentageSprites) percentageSprites = surface.myPercentageSprites[field] = [];
            var percentageSprite = percentageSprites[index];
            if (!percentageSprite) percentageSprite = percentageSprites[index] = surface.add({ type: 'text', fontSize:13, zIndex: 11000, scalingY: -1 });
            var percentageX = config.x - percentageSprite.attr.bbox.plain.width/2;
            var percentageY = maxY ? maxY: config.y;
            percentageSprite.setAttributes({
              x: percentageX + 25,
              y: percentageY + 20,
              text: !(isNoData || isTooFewData) ? Ext.util.Format.number(record.data['fraction'+suffix] * 100, '0.0%') : ''
            });
            percentageSprite.show();
  
            } //if record
  
            // Handle a special sprite to display if this chart is available or not
            //console.log('isAvailable:' + isAvailable + ', field:' + field + ', index:' + index);
  
            var myAvailableSprite = surface.myChartAvailable;
            if (!myAvailableSprite)
              myAvailableSprite = surface.myChartAvailable = surface.add({ type: 'text' });
            // Only display one sprite for 'Chart not available'
            if (index === 0 && field === 'fractionN') {
              if (isAvailable) {
                //console.log('... no hide');
                if (myAvailableSprite)
                  myAvailableSprite.hide();
              } else {
                //console.log('... yes, display');
                //console.dir(myAvailableSprite);
                myAvailableSprite.setAttributes({
                  text: 'Data på halvårsnivå finns ej\ntillgänglig för denna indikator.',
                  x: config.x,
                  y: 40,
                  fill: 'red',
                  fontSize: 16,
                  zIndex: 10010,
                  scalingY: -1
                });
                myAvailableSprite.show();
              }
            }
            var changes = {
              strokeStyle: 'none'
            };
            
            var par = record.data['par' + suffix];
            if (par === null) par = true;
            var color = sprite.attr.fillStyle;
            var darkGreenish = '#359aa3';
            var lightGreenish = '#89c1c7';
            var darkOrangish = '#f67e09';
            var lightOrangish = '#ebb281';
  
            if (color === darkGreenish || color === lightGreenish) {
              changes.fillStyle = par ? darkGreenish : lightGreenish;
            } else if (color === darkOrangish || color === lightOrangish) {
              changes.fillStyle = par ? darkOrangish : lightOrangish;
            }
  
            return changes
            
          } //renderer
        }] //series
      }); //chartHalfYear
  
      /*
       * OBS! Only indicator 2 and 3 have information on half year basis (no PAR-data for indicator 1)
       *      For indicator 1 and 4, only null is returned from R, handle it here
       * Incoming data: first unitData and then nationalData, add them together,
       * both have this format:
       * {
       * 		a: {					// jan-jun
       *			op_count: 108,		// Number of patients
       *			fraction: 0.14815,	// Fraction of selected indicator (the value displayed in bar)
       *			freq_30:  0.58696,	// Response frequency, 30 days
       *			freq_180: 0.32065,	// Response frequency, 180 days
       *			lower:    0.08711,	// Lower CI
       *			upper:    0.22941	// Upper CI
       *  	},
       *		b: {					// jul-dec
       *			// Same as 'a'
       *		}
       *		id: '10018',			// '0 for national, otherwise UnitCode
       *		indicatorId: '2',		// Id of selected Indicator
       *		te: 1,					// TE-operation, 1 for true, 0 for false
       *		tt: 0,					// TT-operation
       * 		year: '2016'			// Chosen year
       * }
       *
       * Goal: This function is called twice, first with unit data and second with national,
       *		 In the second call the result of the first is included in unitData.
       *		 If national data is sent in the first call, there is no unit data, include empty!
       *       Create an array with one object for each time period, suffix national data
       *		 with 'N' and add information about year, tt and te for use in popup.
       */
      var transformData = function (unitCode, year, newData, unitData) {
        var result = unitData || [];
        var isNational = (unitCode === 0);
        var suffix = isNational ? 'N' : '';
        var isNA = (newData === null);
  
        var periods = ['a', 'b']; // Each time period is within these objects
        var periodText = [' januari\u2013juni', ' juli\u2013december']; // u2013 = tankestreck
  
        for (var key in periods) {
          var keyName = periods[key];
          
          if (typeof result[key] === 'undefined')
            result[key] = {};
  
          if (unitData === null) {
            var emptyData = {
              period: year + periodText[key],
              year: year,
              isNA: isNA,
              te: false,
              tt: false,
              noData: true,
              count: 0,
              fraction: 0.0,
              lower: 0.0,
              upper: 0.0,
              freq30: 0.0,
              freq180: 0.0
            };
            result[key] = emptyData;
          }
          var isPartiallyNA = !isNA && getValue(newData[keyName].fraction) === 'NA';
          result[key]['period'] = year + periodText[key];
          result[key]['year'] = year;
          result[key]['isNA'] = isNA;
          result[key]['te'] = isNA ? 0 : newData.te;
          result[key]['tt'] = isNA ? 0 : newData.tt;
          result[key]['tooFewData' + suffix] = isPartiallyNA;
          result[key]['noData' + suffix] = isNA
            || (newData[keyName].op_count === 'NaN')
            || isPartiallyNA
            || (newData[keyName].op_count === 0);
          result[key]['count' + suffix] = isNA ? 0 : getValue(newData[keyName].op_count);
          result[key]['fraction' + suffix] = isNA ||isPartiallyNA ? 0.0 : getValue(newData[keyName].fraction);
          result[key]['lower' + suffix] = isNA ? 0.0 : getValue(newData[keyName].lower);
          result[key]['upper' + suffix] = isNA ? 0.0 : getValue(newData[keyName].upper);
          result[key]['freq30' + suffix] = isNA ? 0.0 : getValue(newData[keyName].freq_30);
          result[key]['freq180' + suffix] = isNA ? 0.0 : getValue(newData[keyName].freq_180);
          result[key]['par' + suffix] = isNA ? true : getValue(newData[keyName].par);
        }
  
        return result;
      }; //transformData
  
      // Get half year data for specified unit and year, and national data recursively
      updateChartHalfYearData = function (unitCode, year, unitData) {
        var includeTE = _current.te ? 1 : 0;
        var includeTT = _current.tt ? 1 : 0;
        var url = serverPrefix + '/stratum/api/statistics/ton/trendettar/'; // trendettar3
  
        Ext.Ajax.request({
          url: url,
          method: 'get',
          cors: true,
          params: {
            apiKey: _apiKey,
            group: unitCode,
            indicatorId: _current.indicatorId,
            includeTE: includeTE,
            includeTT: includeTT,
            year: year
          },
          success: function (response, opts) {
            var responseData = Ext.decode(response.responseText).data;
            var myData = transformData(unitCode, year, responseData, unitData);
  
            //console.log('updateChartHalfYearData: success. unitCode=' + unitCode + (unitCode !== 0 ? ' One more call' : ''));
            //console.dir(myData);
  
            if (unitCode === 0) {
              var values = Ext.Object.getValues(myData);
  
              var maxUpper = 0.0;
              var maxFraction = 0.0;
              //console.dir(values);
              Ext.each(values, function (v) {
                if (v.fraction > maxFraction)
                  maxFraction = v.fraction;
                if (v.fractionN > maxFraction)
                  maxFraction = v.fractionN;
                if (v.upper > maxUpper)
                  maxUpper = v.upper;
                if (v.upperN > maxUpper)
                  maxUpper = v.upperN;
              });
  
              var maxY = (_current.ci) ? (maxUpper + 0.01) : (maxFraction + 0.01);
              // Add max value to all years, used in 1-year chart
              Ext.each(values, function (v) {
                v.maxY = maxY;
              });
  
              chartHalfYear.axes[0]._maximum = maxY;
              chartHalfYear.updateLayout();
              chartHalfYear.store.loadData(values);
              chartHalfYear.store.loadData(chartHalfYear.store.getRange());
            } else {
              updateChartHalfYearData(0, year, myData);
            }
          },
          failure: function (response, opts) {
            console.log('updateChartHalfYearData error indicatorId:' + _current.indicatorId + ', unitCode:' + unitCode
              + ', year:' + year + ', error:' + response.status + ', ' + response.responseText);
          }
        });
      }; //updateChartHalfYearData
  
      var getValue = function (value) {
        return (value === 'NaN') ? 0 : value;
      };
  
      chartHalfYear.updateData = function (data) {
        if (_current.indicatorId === 0) {
          return;
        }
  
        updateChartHalfYearData(_current.unitCode, data.year, null);
        //chartHalfYear.store.loadData(chartHalfYear.store.getRange());
      }; //updateData
  
      return chartHalfYear;
    }; //createChartHalfYear
  
  
    /**************************************************************************
     * Panel for Indicator details
     * Container for 5 year, 1 year and half-year charts for chosen indicator
     **************************************************************************/
    var createIndicatorDetailsPanel = function () {
      //console.profile('createIndicatorDetailsPanel');
  
      Ext.util.CSS.removeStyleSheet('ton-charts-details');
      Ext.util.CSS.createStyleSheet(
        '.details-divider { '
        + '		border-top: solid 2px #e0e0e0; '
        + '		border-bottom: solid 2px #e0e0e0; '
        + '		padding-top: 10px; '
        + '		padding-bottom: 10px '
        + '} '
        
        + '.details-header { color: #359aa3; font-weight: 500 } '
        + '.x-btn-over.x-btn-default-small, .x-btn.x-btn-pressed.x-btn-default-small {'
        + '		background-color: inherit;'
        + '		outline: none;'
        + '		text-decoration: none;'
        + ' }'
        
        + '.ton-chart-description:before {'
          + '  position: absolute;'
          + '  bottom: 50%;'
        + '  height: 0;'
              + '  width: 0;'
              + '  left: -36px;'
          + '  border: 18px solid transparent;'
          + '  border-bottom-color: rgb(211, 232, 234);'
          + '  content: "";'
          + '  transform: rotate(-90deg) translate(-50%);'
        + ' }'
        
        , 'ton-charts-details'
      );
  
      // Create a panel with checkboxes to filter the chosen indicator
      var createFilterPanel = function () {
        var filterPanel = Ext.create('Ext.container.Container', {
          itemId: 'Filters--',
          layout: 'hbox',
          width: '100%',
          style: {
            background: '#d3e8ea',
          },
          padding: '5 10 5 10',
          defaults: {
            padding: '5 5 5 5'
          },
          items: [{
            xtype: 'label',
            text: 'Operationsteknik:',
            padding: '11 0 0 0'
          }, {
            xtype: 'checkboxfield',
            itemId: 'te',
            boxLabel: 'TE+TEA',
            checked: _current.te,
            listeners: {
              change: function (checkbox, value) {
                _current.te = value;
                _current.selectedYearIndex = -1;
                detailsPanel.updateIndicator();
              }
            }
          }, {
            xtype: 'checkboxfield',
            itemId: 'tt',
            boxLabel: 'TT+TTA',
            checked: _current.tt,
            listeners: {
              change: function (checkbox, value) {
                _current.tt = value;
                _current.selectedYearIndex = -1;
                detailsPanel.updateIndicator();
              }
            }
          }, {
            xtype: 'checkboxfield',
            itemId: 'ci',
            padding: '4 0 0 15',
            boxLabel: 'Konfidensintervall 95%',
            checked: _current.ci,
            listeners: {
              change: function (checkbox, value) {
                _current.ci = value;
                detailsPanel.updateIndicator();
              }
            }
          }, {
            xtype: 'label',
            style: 'cursor: pointer; color: #359aa3; font-size:12pt',
            html: '<span class="fa fa-info-circle" aria-hidden="true" data-qtip="'
            + 'Blödningsresultat visas med konfidensintervall. '
            + 'Konfidensintervallet visar om det finns en statistiskt '
            + 'signifikant skillnad mellan staplarna. Om staplarnas '
            + 'intervall inte överlappar varandra finns det en skillnad. '
            + 'Konfidensintervallet är beroende av antalet operationer. '
            + 'Därför har kliniker med många operationer snävare '
            + 'konvidensintervall. Gränserna visar ett intervall som med '
            + '95% sannolikhet innehåller den riktiga procentandelen.'
            + '"></span>'
          }]
        });
  
        return filterPanel;
      }; // createFilterPanel
  
      var chart5Year = createChart5Year();
      var chart5YearLegend = chart5Year.getLegend();
  
      /*** Main indicator details panel ***/
      var detailsPanel = Ext.create('Ext.container.Container', {
        itemId: 'TrendTab--',
        title: 'Trend',
        layout: 'auto',
        margin: '0 00 20 0',
        style: {
          backgroundColor: 'white'
        },
        items: [
          {
            xtype: 'button',
            cls: 'nav-back-button fa fa-arrow-left',
            tooltip: 'visa alla indikatorer',
            listeners: {
              click: function () {
                Ext.ComponentQuery.query('#IndicatorSelector--')[0].select(0);
                Ext.ComponentQuery.query('#IndicatorSelector--')[0].fireEvent('select', Ext.ComponentQuery.query('#IndicatorSelector--')[0]);
              }
            }
          },
          {
            itemId: 'Header--',
            xtype: 'container',
            layout: 'hbox',
            margin: '10 0 0 0',
            items: [
              filterPanel = createFilterPanel(),
            ]
          },
          chart5Year,
          {
            xtype: 'container',
            itemId: 'TrendDetails--',
            cls: 'details-divider',
            layout: {
              type: 'vbox',
              align: 'center'
              //pack: 'center'
            },
            items: [{
              xtype: 'component',
              itemId: 'IndicatorName--',
              cls: 'details-header',
              html: 'Indikatornamn'
            }, {
              xtype: 'component',
              itemId: 'Divider--',
              cls: 'details-header-underline',
              width: '100%',
              html: '<hr style="border-bottom: 1px solid rgba(40, 109, 125, 0.50); width: 80%" />'
            }, {
              xtype: 'container',
              itemId: 'Charts--',
              layout: 'hbox',
              width: '90%',
              items: [
                chart1Year = createChart1Year(),
                chart1YearDescription = createChart1YearDescription(),
                // qqq chartHalfYear = createChartHalfYear()
              ]
            }]
          } //,
          //indicatorDescription = createIndicatorDescription(1)
        ],
        listeners: {
          show:  function() {
            this.up().up().down('#Descriptions--').updateDescription();
          }
        }
      }); //Indicators panel
  
      var doSelectYear = function (data, name) {
        chart1Year.updateData([data]);
        chart1YearDescription.updateDescription(data);
        // qqq chartHalfYear.updateData(data);
        Ext.ComponentQuery.query('#IndicatorName--')[0].setHtml(name + ', ' + data.year);
      };
      chart5Year.setDoClickYearCallback(doSelectYear);
  
      /*********************** Panel external functions ********************/
  
      // Called by tabs-panel which is called by main-container, when the User changes the Unit
      detailsPanel.updateUnit = function () {
        chart5Year.updateData();
        if (chart5Year.series && chart5Year.series.length > 0) {
          if (_current.unitCode === '0') {
            chart5Year.setConfig('colors', ['#359AA3', 'white']);
            chart5Year.series[0].setTitle(['Riket', '']);
          } else {
            chart5Year.setConfig('colors', ['#359AA3', '#F67E09']);
            chart5Year.series[0].setTitle(['Riket', _current.unitName]);
          }
        }
        chart5Year.store.loadData(chart5Year.store.getRange());
      };
  
      // Called by tabs-panel which is called by main-container, when the User changes the Indicator
      // Also called if checkboxes for TE and TT are changed
      detailsPanel.updateIndicator = function () {
        /*if (_current.indicatorId === 1 || _current.indicatorId === 4) {
          if (detailsPanel.down('#te').getValue() !== true) {
            detailsPanel.down('#te').setValue(true);
            _current.te = true;
          }
          if (detailsPanel.down('#tt').getValue() !== true) {
            detailsPanel.down('#tt').setValue(true);
            _current.tt = true;
          }
        }*/
        chart5Year.updateData();
        detailsPanel.down('#IndicatorName--').setHtml(_current.indicatorName);
        //indicatorDescription.updateDescription();
      };
  
      return detailsPanel;
    }; // createIndicatorDetailsPanel()
  
  
    /**************************************************************************
     * Panel for displaying data for all clinics regarding a chosen indicator
     **************************************************************************/
    var createAllClinicsPanel = function () {
      var _min = Infinity;
      var _max = Infinity;
  
      /*
      var allClinicsPanel = Ext.create('Ext.container.Container', {
        title: 'Alla kliniker (TE)',
        html: '<span style="color:red">Ej implementerad</span>'
      });
      */
  
      var allUnitsChart = Ext.create('Ext.chart.CartesianChart', {
        itemId: 'ComparisonChart--',
        //minHeight: 700,
        flipXY: true,
        innerPadding: {
          right: 20
        },
        colors: ['#9BBB59'],
        store: {
          fields: []
        },
        axes: [{
          type: 'category',
          dashSize: 0,
          position: 'left',
          //calloutColor: 'rgba(0,0,0,0)',
          style: {
            majorTickSize: 0
          },
          labelInSpan: true,
          label: {
            textAlign: 'left',
            fontSize: 12,
            borderBottom: 1
          },
          renderer: function (axis, label, layout, lastLabel) {
            if (label === 'Riket' || label === _current.unitName) {
              label = label.toUpperCase();
            }
            return Ext.util.Format.ellipsis(label, 30);	// TODO: Workaround?
          }
        }, {
          type: 'numeric',
          position: 'bottom',
          grid: true,
          minimum: 0,
          majorTickSteps: 10,
          minorTickSteps: 10,
          grid: {
            odd: {
              'stroke-width': 0
            }
          },
          style: {
            minStepSize: 5
          },
          limits: [{ // Limits are also updated before loadData
            value: _min * 100,
            line: {
              strokeStyle: 'blue',
              lineDash: [4, 4]
            }
          }, {
            value: _max * 100,
            line: {
              strokeStyle: 'red',
              lineDash: [4, 4]
            }
          }],
          renderer: function (axis, label, layout, lastLabel) {
            return Ext.util.Format.number(label, '0%');
          }
        }],
        series: [{
          type: 'bar',
          xField: 'label',
          yField: 'fraction',
          style: {
            minGapWidth: 5,
            stroke: 'none',
            barWidth: 28,
          },
          renderer: function (sprite, config, rendererData, index) {
            var record = rendererData.store.getData().items[index];
            var field = sprite._field;						// Name of current field (source value for the bar)
            var surface = sprite.getSurface();				// Ext.draw.engine.Canvas
  
            if (record) {
              /***** Show 'inga data' if there are no data for each bar *****/
              if (!surface.myTextSprites)
                surface.myTextSprites = {};
              var textSprites = surface.myTextSprites[field];
              if (!textSprites)
                textSprites = surface.myTextSprites[field] = [];
              var textSprite = textSprites[index];
  
              if (record.data['noData']) {
                if (!textSprite)
                  textSprite = textSprites[index] = surface.add({ type: 'text' });
                textSprite.setAttributes({
                  text: 'Inga data',
                  x: config.x - 15,
                  y: 35,
                  fill: 'black',
                  fontSize: 12,
                  zIndex: 10001,
                  rotationRads: Math.PI / 2
                });
                textSprite.show();
              } else {
                if (textSprite)
                  textSprite.hide();
              }
  
              /***** Handle the CI (konfidensintervall) *****/
              if (!surface.myCISprites)
                surface.myCISprites = {};
              var ciSprites = surface.myCISprites[field];
              if (!ciSprites)
                ciSprites = surface.myCISprites[field] = [];
              var ciSprite = ciSprites[index];
  
              // Don't draw CI if there's no data OR if it's the special blank label
              if (!record.data['noData'] && record.data['label'].length > 1) {
                var scale = sprite.attr.scalingY;				// Scale of Y-axis (multiplay with value to get pixels)
                var lineWidth = 1;								// Width of the lines
                var canvasHeight = sprite.attr.innerHeight;			// Height of the chart in canvas
                var lower = record.data['lower'];				// CI lower value
                var lowerS = lower * scale;					// CI lower Y-axis placement in pixels
                var upper = record.data['upper'];				// CI upper value
                var upperS = upper * scale;					// CI upper Y-axis placement in pixels
                var fraction = record.data['fraction'];			// The fraction value
                var fractionS = fraction * scale;					// Fraction Y-axis placement in pixels
                var fractionText = Ext.util.Format.number(fraction * 100, '0.0%');	// Rounded fraction value (displayed above the bar)
                var ciWidth = config.width / 2;					// Width of the CI lower/upper lines
                var barX = config.x + (config.width / 2);	// Center X-axis point of the bar
                var barY = config.y;							// Top edge Y-axis point of the bar
                var minY = Math.max(lineWidth, lowerS);						// Lowest safe/visible Y-axis point for the bar
                var maxY = Math.min((canvasHeight - lineWidth), upperS);		// Upper safe/visible Y-axis point for the bar
  
                if (!ciSprite)
                  ciSprite = ciSprites[index] = surface.add({ type: 'path' });
                // TODO: Remove partial CI, only display whole
                if (upperS > maxY) {
                  ciSprite.setAttributes({
                    path: [
                      'M', barX, maxY,
                      'L', barX, minY,
                      'M', barX - (ciWidth / 2), minY,
                      'h', ciWidth
                    ],
                    stroke: '#58585a',
                    lineWidth: lineWidth,
                    zIndex: 10000
                  });
                } else {
                  ciSprite.setAttributes({
                    path: [
                      'M', barX - (ciWidth / 2), maxY,
                      'h', ciWidth,
                      'M', barX, maxY,
                      'L', barX, minY,
                      'M', barX - (ciWidth / 2), minY,
                      'h', ciWidth
                    ],
                    stroke: '#58585a',
                    lineWidth: lineWidth,
                    zIndex: 10000
                  });
                }
                ciSprite.show();
              } else {
                if (ciSprite)
                  ciSprite.hide();
              }
            } // if record
  
            /***** Check type, if unit is better, worse or the same as national data *****/
            //var store = rendererData.store;
            //var record = store.getAt(index);
            if (record == null) {
              return {
                strokeStyle: 'none'
              };
            }
            var highlight = (record.data.label === 'Riket' || record.data.label === _current.unitName);
            
            switch (record.data.type) {
              case 'same':
                return highlight ? { fill: 'rgb(255, 172, 51)' } : { fill: 'rgb(255, 223, 178)' };  // orginal: yellowish 'rgba(255, 149, 0, 0.3)'  // correct: rgb(255, 223, 178)
              case 'better':
                return highlight ? { fill: 'rgb(15, 142, 68)' } : { fill: 'rgb(104, 186, 139)' };      // original: greenish 'rgba(53, 163, 100, 0.8)' // correct: rgb(104, 186, 139)
              case 'worse':
                return highlight ? { fill: 'rgb(234, 43, 25)'} : { fill: 'rgb(239, 108, 95))' };  // original: reddish  'rgba(233, 57, 41, 0.8)'  // correct: rgb(239, 108, 95)
              default:
                return { fill: 'rgba(53, 53, 53, 0.5)' };   // original: greyish                            //
            }
          } //series renderer
        }]
      });
  
      //var clinicsIndicatorDescription = createIndicatorDescription(2)
      
      var allClinicsPanel = Ext.create('Ext.container.Container', {
        itemId: 'ComparisonTab--',
        title: 'Alla kliniker',
        width: '100%',
        items: [
          {
            xtype: 'button',
            cls: 'nav-back-button fa fa-arrow-left',
            tooltip: 'visa alla indikatorer',
            listeners: {
              click: function () {
                Ext.ComponentQuery.query('#IndicatorSelector--')[0].select(0);
                Ext.ComponentQuery.query('#IndicatorSelector--')[0].fireEvent('select', Ext.ComponentQuery.query('#IndicatorSelector--')[0]);
              }
            }
          },
          {
            xtype: 'panel',
            itemId: 'allClinicsLegend',
            cls: 'ton-legend-all-clinics',
            updateLegend: function() {
              var timeIntervals = ['perioden 2015-2017', 'perioden 2015-2017', 'perioden 2015-2017', '2017'];
              
              var greenTexts = ['Färre återinläggningar', 'Mindre smärta', 'Högre grad symptomfrihet', 'Bättre täckningsgrad'];
              var orangeTexts = ['Nära riksnittet', 'Nära riksnittet', 'Nära riksnittet', 'Nära riksnittet'];
              var redTexts = ['Fler återinläggningar', 'Mer smärta', 'Lägre grad av symptomfrihet', 'Sämre täckningsgrad'];
  
              var greenText = greenTexts[_current.indicatorId-1];
              var orangeText = orangeTexts[_current.indicatorId-1];
              var redText = redTexts[_current.indicatorId-1];
              var timeText = timeIntervals[_current.indicatorId-1];
  
              this.setHtml('<div class="ton-legend-timeframe">Uppgifterna avser ' + timeText + '. Konfidensintervall 95%: <div class="ton-legend-state-confidence-interval"></div>Rikets<div class="ton-legend-confidence-interval"><div class="ton-legend-confidence-interval-bar"></div></div>Enhetens</div><div class="ton-legend-colors"><div class="ton-circle ton-green"></div>' + greenText + '<div class="ton-circle ton-orange"></div>' + orangeText + '<div class="ton-circle ton-red"></div>' + redText + '</div>');
              // console.log('updating legend');
            }	
          },
          allUnitsChart //,
          //clinicsIndicatorDescription
        ],
        listeners: {
          show:  function() {
            this.up().up().down('#Descriptions--').updateDescription();
          }
        }
      }); //allClinicsPanel
  
      // Return a function that merges an object with an anonymous object with a property type
      var flattener = function (type) {
        return function (obj) {
          var flatten = Ext.Object.merge(
            obj,
            //obj.group, 
            { type: type }
          );
          return flatten;
        }
      };
  
      var transformData = function (newData) {
        // Transform and flatten
        var better = newData.better.map(flattener('better'));
        var same = newData.same.map(flattener('same'));
        var worse = newData.worse.map(flattener('worse'));
  
        /*
        var getEmptyLineObj = function(id) {
          return {
            id: id, 
            label: ' ', 
            fraction: 0.0, 
            lower: 0.0, 
            upper: 0.0,
            type: ''
          };
        };
        */
  
        /*
        var emptyLineObj = function(id) {
          this.id = id;
          this.label = '';
          this.fraction = 0.0;
          this.lower = 0.0;
          this.upper = 0.0;
          this.type = '';
        };
        */
  
        var concatenated2 = [].concat(
          better,
          {
            id: 1000,
            label: ' ',
            fraction: 0,
            lower: 0,
            upper: 0,
            type: ''
          },
          same,
          {
            id: 2000,
            label: '',
            fraction: 0,
            lower: 0,
            upper: 0,
            type: ''
          },
          worse
        );
  
        var concatenated = concatenated2.reverse();
  
        var mapped = concatenated.map(
          function (i) {
            i.noData = (i.label.length > 1) && (i.fraction === 0);
            i.fraction = i.fraction * 100;
            i.lower = i.lower * 100;
            i.upper = i.upper * 100;
            return i;
          }
        );
  
        return mapped;
      }; //transformData
  
      var updateAllClinicsData = function () {
        var url = serverPrefix + '/stratum/api/statistics/ton/allaklinikerte/';
  
        Ext.Ajax.request({
          url: url,
          method: 'get',
          cors: true,
          params: {
            apiKey: _apiKey,
            indicatorId: _current.indicatorId
          },
          success: function (response, opts) {
            var responseData = Ext.decode(response.responseText).data;
            _min = responseData.country.lower;
            _max = responseData.country.upper;
            var myData = transformData(responseData);
  
            // Check the maximum CI value and change the Y-axis accordingly
            var maxUpper = 0.0;
            var maxFraction = 0.0;
  
            Ext.each(myData, function (v) {
              if (v.fraction > maxFraction)
                maxFraction = v.fraction;
              if (v.upper > maxUpper)
                maxUpper = v.upper;
            });
  
            //var maxY = maxUpper + 0.01;
            maxUpper /= 20;
            var maxY = 20 * maxUpper.toFixed(0);
            if (maxY > 100) maxY = 100;
            allUnitsChart.axes[1]._maximum = maxY;
  
            // Update the limit lines
            var limits = allUnitsChart.axes[1].getLimits();
            limits[0].value = _min * 100;
            limits[1].value = _max * 100;
            allUnitsChart.axes[1].setLimits(limits);
            allUnitsChart.updateLayout();
  
            allUnitsChart.store.loadData(myData);
            allUnitsChart.store.loadData(allUnitsChart.store.getRange());
  
            allUnitsChart.setSize('100%', (myData.length * 28) + 28);
          },
          failure: function (response, opts) {
            console.log('updateAllClinicsData error indicatorId:' + _current.indicatorId
              + ' error:' + response.status + ', ' + response.responseText);
          }
        });
  
      }; //updateAllClinicsData
  
      allClinicsPanel.updateData = function () {
        //var chart = allClinicsPanel.down('#allUnitsChart');
        if (_current.indicatorId === 0) {
          allUnitsChart.store.loadData(allUnitsChart.store.getRange());
          return;
        };
  
        updateAllClinicsData(); // INPUT?
        allUnitsChart.store.loadData(allUnitsChart.store.getRange());
        //clinicsIndicatorDescription.updateDescription();
        this.up().down('#allClinicsLegend').updateLegend();
      }; //updateData
  
      return allClinicsPanel;
    }; //createAllClinicsPanel
  
  
    /**************************************************************************
     * Panel for displaying data for a clinic's patients
     **************************************************************************/
    var createPatientsPanel = function () {
  
      Ext.util.CSS.removeStyleSheet('ton-patients');
      Ext.util.CSS.createStyleSheet(''
        + '	.ton-patients div, .ton-patients .x-column-header-text {'
        + '		font-size: 12px;'
        + '	}'
  
        + '.ton-patients .x-grid-cell-inner:hover {'
        + '		white-space: normal;'
        + ' }'
  
        + '	.ton-patients .x-column-header {'
        + '		background-color: rgba(53, 153, 163, 0.3);;'
        + '	}'
  
        + '	.ton-patients .x-grid-cell {'
        + ' 	border: solid 1px #979797;'
        + '		padding-left: 5px;'
        + '	}'
  
        + '	.ton-patients .x-grid-cell {'
        + ' 	border-bottom: none;'
        + '	}'
  
        + '	.ton-patients table:last-child .x-grid-cell {'
        + ' 	border-bottom: 1px solid #979797;'
        + '	}'
  
        , 'ton-patients');
  
      var patientsPanel = Ext.create('Ext.container.Container', {
        itemId: 'PatientsTab--',
        title: 'Patienter',
        cls: 'ton-patients',
        
        items: [
          {
            xtype: 'button',
            cls: 'nav-back-button fa fa-arrow-left',
            tooltip: 'visa alla indikatorer',
            listeners: {
              click: function () {
                Ext.ComponentQuery.query('#IndicatorSelector--')[0].select(0);
                Ext.ComponentQuery.query('#IndicatorSelector--')[0].fireEvent('select', Ext.ComponentQuery.query('#IndicatorSelector--')[0]);
              }
            }
          },
          {
            itemId: 'PatientsGrid--',
            margin: '30px 0 30px 0;',
            xtype: 'gridpanel',
            store: {
              fields: [],
              data: [
                {
                  number: '20010123-1234',
                  date: '2015-01-24',
                  diagnosis: 'Lorem ipsum',
                  method: '<ul><li>TE</li></ul>',
                  age: '14',
                  gender: 'Kvinna',
                  comments: 'Sed posure consectuer est at lobortis.Sed posure consectuer est at lobortis.Sed posure consectuer est at lobortis'
                },
                {
                  number: '20010123-1234',
                  date: '2015-01-24',
                  diagnosis: 'Lorem ipsum',
                  method: '<ul><li>TE</li></ul>',
                  age: '14',
                  gender: 'Kvinna',
                  comments: 'Sed posure consectuer est at lobortis.Sed posure consectuer est at lobortis.Sed posure consectuer est at lobortis'
                },
                {
                  number: '20010123-1234',
                  date: '2015-01-24',
                  diagnosis: 'Lorem ipsum',
                  method: '<ul><li>TE</li></ul>',
                  age: '14',
                  gender: 'Kvinna',
                  comments: 'Sed posure consectuer est at lobortis.Sed posure consectuer est at lobortis.Sed posure consectuer est at lobortis'
                },
                {
                  number: '20010123-1234',
                  date: '2015-01-24',
                  diagnosis: 'Lorem ipsum',
                  method: '<ul><li>TE</li></ul>',
                  age: '14',
                  gender: 'Kvinna',
                  comments: 'Sed posure consectuer est at lobortis.Sed posure consectuer est at lobortis.Sed posure consectuer est at lobortis'
                }
              ]
            },
            columns: [{
              text: 'Personnummer',
              dataIndex: 'number',
              width: 120
            }, {
              text: 'Operationsnummer',
              dataIndex: 'date',
              width: 145
            }, {
              text: 'Diagnos',
              dataIndex: 'diagnosis',
              flex: 1
            }, {
              text: 'Operationsmetod, operationsteknik och hermostasteknik',
              dataIndex: 'method',
              flex: 1
            }, {
              text: 'Ålder',
              dataIndex: 'age',
              width: 70
            }, {
              text: 'Kön',
              dataIndex: 'gender',
              width: 70
            }, {
              text: 'Kommentarer',
              dataIndex: 'comments',
              flex: 1
            }
            ],
            width: '100%',
          }
        ]
      });
  
      return patientsPanel;
    }; //createPatientsPanel
  
  
    /**************************************************************************
     * Container with Panels for chart details, overview of units and table data
     **************************************************************************/
    var createTabsPanel = function () {
      Ext.util.CSS.removeStyleSheet('ton-tabs');
      Ext.util.CSS.createStyleSheet(
        '.ton-tab .x-tab-bar { '
        + '		background-color: white; '
        + '}'
        + '.ton-tab a:first-of-type { '
        + '  margin-left: 5px;'
        + '}'
        + '.ton-tab .x-tab-bar-default-top>.x-tab-bar-body-default {'
	    + '  padding: 6px;'
		+ '}'
        + '.ton-tab .x-tab-bar-body { '
        + '		border-bottom: 1px solid green;'
        + '} '
        + '.ton-tab .x-tab { '
        + '		background-color: rgba(53, 153, 163, 0.2); '
        + '		border-radius: 3px 3px 0px 0px; '
        + '		border-left: solid 1px #359aa3; '
        + '		border-top: solid 1px #359aa3; '
        + '		border-right: 1px solid #359aa3; '
        + '     border-bottom: 1px solid #359aa3;'
        + '		top: 1px !important;'
        + '} '
        + '.ton-tab .x-tab.x-tab-active.x-tab-default { '
        + '		border-left: solid 1px #359aa3; '
        + '		border-top: solid 1px #359aa3; '
        + '		border-right: solid 1px #359aa3; '
        + '		border-bottom: solid 1px white; '
        + '		background-color: white; '
        + '		outline: none;'
        + '} '
        + '.ton-tab .x-tab-inner-default { '
        + '		color: #286d7d; '
        + '		font: 500 18px open_sans, helvetica, arial, sans-serif; '
        + '		padding: 5px 10px 0px 10px; '
        + '		height: 35px; '
        + '} '
        + '.ton-tab .x-tab.x-tab-active.x-tab-default .x-tab-inner-default { '
        + '		color: #286d7d; '
        + '} '
        + '.ton-tab .x-tab-bar .x-box-inner {'
        + '		overflow: visible !important;'
        + '		border-bottom: solid 1px #359aa3;'
        + '	}'
        + '.ton-tab .x-tab-default-top.x-tab-focus.x-tab-active {'
        + '		box-shadow: none;'
        + '}'
        , 'ton-tabs'
      );
  
      var indicatorDetails = null;
      var tabsPanel = Ext.create('Ext.tab.Panel', {
        itemId: 'Tabs--',
        activeTab: 0,
        plain: false,
        cls: 'ton-tab',
        items: [
          indicatorDetails = createIndicatorDetailsPanel(),
          allClinics = createAllClinicsPanel(),
          // patients = createPatientsPanel()
        ],
      });
  
      tabsPanel.setTab = function (id) {
        tabsPanel.setActiveTab(id);
      };
  
      tabsPanel.updateUnit = function () {
        indicatorDetails.updateUnit();
        allClinics.updateData();
        // TODO: Check logged in state, hide/show tabs?
      };
  
      tabsPanel.updateIndicator = function () {
        indicatorDetails.updateIndicator();
        allClinics.updateData();
        // TODO: Check logged in state, hide/show tabs?
      };
  
      return tabsPanel;
    }; //createTabsPanel()
  
  
    /**************************************************************************
     * Indicator description
     **************************************************************************/
    // Create a panel with description depending on chosen indicator
    var createIndicatorDescription = function () {
      Ext.util.CSS.removeStyleSheet('ton-indicator-description');
      Ext.util.CSS.createStyleSheet(
        '.upper { text-transform: uppercase } '
        + '.half-container { width: 300px;  float: left; min-height: 400px; } '
        + '.half-container.left { margin-right: 70px } '
        + '.half-container p { font-size: 13px; line-height: 19px } '
        , 'ton-indicator-description'
      );
  
      var descriptionPanel = Ext.create('Ext.container.Container', {
        itemId: 'Descriptions--',
        layout: 'hbox',
        items: [{
          xtype: 'label',
          itemId: 'IndicatorDescription--',
          cls: 'half-container left',
          html: '<h2>Indikatorbeskrivning</h2>'
        }, {
          xtype: 'label',
          itemId: 'ParDescription--',
          cls: 'half-container',
          html: '<h2>PAR-beskrivning</h2>'
        }]
      });
  
      descriptionPanel.updateDescription = function () {
        var text1 = null,
          text2 = null;
        switch (_current.indicatorId) {
          case 1:
            text1 = '<h2 class="upper">Om indikatorn</h2>'
              + '<p style="font-weight:400">Indikatorn visar andelen patienter som har lagts in på '
              + 'sjukhus för blödning inom 30 dagar efter operationen.'
              // + 'av alla patienter som har opererats med tonsillektomi / '
              //+ 'eller tonsillektomi+abrasio på en klinik.'
            text2 = '&nbsp;';
            /*
            text2 = '<h2 class="upper">Uppgifterna matchas med par</h2>'
              + '<p style="font-weight:400">Uppgifterna är hämtade från två nationella register. '
              + 'Det ger en mer korrekt sammanställning av hur många '
              + 'operationer som har utförts och hur många som har '
              + 'återinlagts för blödning.</p>'
              + '<p style="font-weight:400">I 30-dagarsenkäter efterfrågas inläggning p g a blödning. '
              + 'Säkerheten i dessa '
              + 'uppgifter är helt beroende av svarsfrekvensen på 30-dagarsenkäten. '
              + 'Säkrare data avseende återinläggning p g a blödning erhålls genom '
              + 'matchning med Socialstyrelsens patientregister. Genom denna '
              + 'matchning redovisas en näst intill helt säker uppgift om inläggning '
              + 'p g a blödning, men först i augusti året efter redovisat år. ';
              if(this.up().down('#Tabs--').getActiveTab().itemId==='TrendTab--') {
                text2 = text2 
                + 'Dessa data redovisas för 2012 och framåt, icke matchad data visas '
                + 'i blekare staplar i diagrammet ovan. Totalt antal operationer är baserat på matchade data då sådana finns, annars endast operationer rapporterade till kvalitetsregistret.</p>';
              }
              */
            break;
          case 2:
            text1 = '<h2 class="upper">Om indikatorn</h2>'
              + '<p style="font-weight:400">Indikatorn visar andelen patienter som uppger att de har '
              + 'kontaktat sjukvården på grund av smärta efter operationen, av '
              + 'alla som har besvarat 30-dagarsenkäten.</p><p style="font-weight:400">Data i detta diagram uppdateras dagligen. Det kan därför finnas skillnader mellan dessa data och kliniktabellerna som uppdateras mindre ofta.';
            text2 = '&nbsp;';
            break;
          case 3:
            text1 = '<h2 class="upper">Om indikatorn</h2>'
              + '<p style="font-weight:400">Indikatorn visar andelen patienter som har svarat '
              + '"Besvären borta" eller "Jag har blivit ganska bra från mina '
              + 'besvär", av alla patienter som har besvarat 6-månadersenkäten.</p>';
            text2 = '&nbsp;';
            break;
          case 4:
            text1 = '<h2 class="upper">Om indikatorn</h2>'
              + '<p style="font-weight:400">Indikatorn visar andelen patienter som har registrerats i '
              + 'Tonsillregistret, av alla tonsilloperationer som har identifierats '
              + 'från Tonsillregistret eller Patientregistret.</p>';
            text2 = '&nbsp;';
            break;
        };
        descriptionPanel.down('#IndicatorDescription--').setHtml(text1); // detailsPanel
        descriptionPanel.down('#ParDescription--').setHtml(text2); // detailsPanel
      }; //updateDescription
  
      return descriptionPanel;
    }; //createIndicatorDescription
  
  
    /**************************************************************************
     * Main Container for the Widget, connecting panels and messages
     **************************************************************************/
    var choicesPanel = null;
    var statisticsPanel = null;
    var indicatorsPanel = null;
    var tabsPanel = null;
    var indicatorDescriptionPanel = null;
    var tonsill = Ext.create('Ext.container.Container', {
      itemId: 'Application--',
      layout: 'fit',
      renderTo: _container,
      items: [
        {
          xtype: 'component',
          itemId: 'IntroText--',
          html: '<p>Här jämför du mottagningens och regionens resultat med genomsnittet för riket i'
          + ' Tonsilloperationsregistrets kvalitetsindikatorer. Presenterade data avser alla tonsilloperationer, alltså tonsillektomi med eller utan abrasio, respektive tonsillotomi med eller utan abrasio. Genom att klicka på en indikator kan mer specifierade data studeras.</p>'
        },
        choicesPanel = createChoicesPanel(),
        {
          xtype: 'container',
          itemId: 'Results--',
          layout: 'card',
          activeItem: 0,
          items: [{
            xtype: 'container',
            itemId: 'Overview--',
            layout: 'auto',
            items: [
              statisticsPanel = createStatisticsPanel(),
              indicatorsPanel = createIndicatorsPanel()
            ],
            listeners: {
              activate: function () {
                var color = Ext.ComponentQuery.query('polar')[0].getColors()[0];
                var name = _current.unitName;
                var legend = '<div class="x-legend-inner"><div style="width: 180px;" class="x-legend-container">' +
                  '<div  class="x-legend-item">' +
                  '<span class="x-legend-item-marker" style="background: ' + color + '"></span><span>' + name + '</span>' +
                  '</div></div></div>';
                Ext.ComponentQuery.query('polar')[0].getLegend().update(legend);
                Ext.ComponentQuery.query('polar')[1].getLegend().update(legend);
                Ext.ComponentQuery.query('polar')[2].getLegend().update(legend);
              }
            }
          }, {
            xtype: 'container',
            itemId: 'Details--',
            layout: 'auto',
            items: [
              tabsPanel = createTabsPanel(),
              indicatorDescriptionPanel = createIndicatorDescription()
            ]
          }]
        }]
    });
  
    // Sets the state and displays the correct 'card' of the main container
    var setState = function (isStateOverview) {
      _current.isStateOverview = isStateOverview; // (indicatorId === '0');
  
      tonsill.down('#Results--').getLayout().setActiveItem(isStateOverview ? 0 : 1);
    };
  
    // This function is set as the callback function in choicesPanel,
    // called when user changes the Unit in the choicesPanel
    var doChangeUnit = function (code, name, isInitialization) {
      // Call panels who need to be updated when the selected Unit changes
      _current.unitCode = code;
      _current.unitName = name;
  
      if (isInitialization) {
        choicesPanel.updateUnit();
      }
  
      statisticsPanel.updateUnit();
      indicatorsPanel.updateUnit();
      tabsPanel.updateUnit();
    };
    choicesPanel.setChangeUnitCallback(doChangeUnit);
  
    var changeIndicatorClass = function(indicator) {
      Ext.get(_container).removeCls('indicator-0');
      Ext.get(_container).removeCls('indicator-1');
      Ext.get(_container).removeCls('indicator-2');
      Ext.get(_container).removeCls('indicator-3');
      Ext.get(_container).removeCls('indicator-4');
      Ext.get(_container).addCls('indicator-'+indicator);
    }
    // Callback function in ,
    // called when the user changes the Indicator
    var doChangeIndicator = function (id, name, isPanelClick) {
      _current.indicatorId = id;
      _current.indicatorName = name;
      setState(id === 0);
  
      if (isPanelClick) {
        // User clicked a chart panel to choose indicator, update the drowdown
        choicesPanel.updateIndicator();
      }
  
      if (_current.isStateOverview) {
        tabsPanel.setTab(0);
      } else {
        tabsPanel.updateIndicator();
        indicatorDescriptionPanel.updateDescription();
      }
      changeIndicatorClass(id);
    };
    choicesPanel.setChangeIndicatorCallback(doChangeIndicator);
    indicatorsPanel.setDoClickIndicatorCallback(doChangeIndicator);
  
    // Set the default indicator and unit
    doChangeUnit(_unitCode, _unitName, true);
    doChangeIndicator(_indicatorId, _indicatorName);
  };
  
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
  
                      //dom.scrollTop = me.trackingScrollTop;
                      //dom.scrollLeft = me.trackingScrollLeft;
                  }
              }
          },
      }
  });
  
  
  Ext.onReady(function () {
    // Temporary during test: Require url to end with #tontest
    //if (window.location.hash.indexOf('tontest') === -1) return;
  
    // Make qtip tooltips available (a div/label with the data-qtip property
    // will automatically display a popup), used in the CI checkbox (i) button
    Ext.tip.QuickTipManager.init();
    // and set the automatic hide timer to indefinite (default is 5 sec.)
    Ext.apply(Ext.tip.QuickTipManager.getQuickTip(), {
      dismissDelay: 0
    });
    // Create the widget
    TonsillWidget();
  });
