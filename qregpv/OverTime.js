
(function() {
  if (
      window.Repository &&
      window.Repository.Local &&
      window.Repository.Local.Methods &&
      window.Repository.Local.Methods.initializedMethods
  ) {
      init();
  } else {
      Ext.Ajax.request({
          url: '/stratum/api/metadata/registers/125',
          method: 'GET',
          params: {
              APIKey: 'bK3H9bwaG4o=',
          },
          callback: function(o, success, resp) {
              var data = Ext.decode(resp.responseText).data;

              var widgetScript = Ext.decode(data.WidgetScript);
              widgetScript.relURL = '/stratum/';
              widgetScript.initializedMethods = true;

              window.Repository = { Local: { Methods: widgetScript } };
              window.Profile = window.Profile || {};
              init();
          },
      });
  }
  function init() {
      var container =
          (window.Stratum &&
              window.Stratum.containers &&
              window.Stratum.containers['QRegPV/OverTimeKS']) ||
          'main-container';
      Repository.Local.Methods.initialize(function(_m) {
          var mainChart,
              clinicComboPrimary,
              clinicComboSecondary,
              currYear = _m.getCurrentYear(),
              startYear = currYear - 5,
              configContainer,
              indicatorSelection,
              mainStore,
              clinicChangeFn,
              dataTable;

          mainStore = _m.getMainStore({
              beforeLoadFn: function() {
                  mainChart && mainChart.setLoading('Laddar...');
              },
              onLoadFn: function(store, records) {
                  mainChart && mainChart.setLoading(false);
              },
              triggerLoadFn: true,
              startDate: Ext.Date.format(
                  Ext.Date.add(_m.getCurrentDate(), Ext.Date.YEAR, -5),
                  'Y-m-d'
              ),
              filter: function(item) {
                  return (
                      item.get('Q_Year') > startYear &&
                      _m.getCurrentId() === item.get('Q_Indicator')
                  );
              },
              sorters: [
                  {
                      property: 'Date',
                      direction: 'ASC',
                  },
              ],
          });
          mainStore.on('filterchange', addMarginToAxis);

          function addMarginToAxis() {
              var axisLimits = getMaxMinAxisValues(mainStore);
              var numericAxis = mainChart.getAxis(0);
              numericAxis.setMaximum(axisLimits.maximum);
              numericAxis.setMinimum(axisLimits.minimum);
              mainChart.updateAxes();
          }

          function getMaxMinAxisValues(store) {
              var margin = 5;
              var min = 100;
              var max = 0;
              store.each(function(x) {
                  max = Math.max(max, x.get('Q_Varde_0'), x.get('Q_Varde_1'));
                  min = Math.min(min, x.get('Q_Varde_0'), x.get('Q_Varde_1'));
              });
              return {
                  minimum: Math.max(0, min - margin),
                  maximum: Math.min(100, max + margin),
              };
          }
          indicatorSelection = Ext.create('QRegPV.IndicatorCombo', {
              emptyText: 'Välj indikator ...',
              store: Ext.create('Ext.data.Store', {
                  model: Ext.create('Ext.data.Model', {
                      fields: [
                          {
                              name: 'valueName',
                          },
                          {
                              name: 'valueCode',
                          },
                      ],
                  }),
                  data: Ext.Array.map(
                      Ext.Array.sort(_m.getIndicatorType(), function(a, b) {
                          var ax = _m.getIndicatorName(a),
                              bx = _m.getIndicatorName(b);
                          return ax === bx ? 0 : ax > bx ? 1 : -1;
                      }),
                      function(item) {
                          return {
                              valueName: _m.getIndicatorName(item),
                              valueCode: item,
                          };
                      }
                  ),
              }),
              displayField: 'valueName',
              valueField: 'valueCode',
              value: _m.qregPVSettings.selectedIndicator,
              listeners: {
                  select: function(aCombo, aSelection) {
                      var newValue = aSelection.get('valueCode');
                      _m.qregPVSettings.selectedIndicator = newValue;
                      mainStore.clearFilter(true);
                      mainStore.filterBy(function(item) {
                          return (
                              item.get('Q_Year') > startYear &&
                              newValue === item.get('Q_Indicator')
                          );
                      });
                      var indicatorName = _m.getIndicatorName(newValue);
                      dataTable.setTitle(indicatorName);
                      mainChart.setTitle(indicatorName);
                      dataTable.doLayout();
                  },
              },
          });

          clinicComboPrimary = Ext.create('QRegPV.ClinicCombo', {
              isPrimary: true,
          });
          clinicComboSecondary = Ext.create('QRegPV.ClinicCombo', {});

          mainChart = Ext.create('Ext.chart.Chart', {
              animate: true,
              shadow: false,
              plugins: {
                  ptype: 'chartitemevents',
                  moveEvents: true,
              },
              colors: [_m.getPrimaryColor(), _m.getSecondaryColor()],
              store: mainStore,
              height: 480,
              title: _m.getIndicatorName(_m.getCurrentId()),
              legend: {
                  docked: 'bottom',
              },
              listeners: {
                  beforedestroy: function() {
                      mainStore.un('filterchange', addMarginToAxis);
                  },
              },
              axes: [
                  {
                      type: 'numeric',
                      position: 'left',
                      fields: ['Q_Varde_0', 'Q_Varde_1'],
                      renderer: Ext.util.Format.numberRenderer('0 %'),
                      dashSize: 0,
                      grid: true,
                  },
                  {
                      type: 'time',
                      position: 'bottom',
                      fromDate: Ext.Date.parse(startYear + '-', 'Y-'),
                      renderer: Ext.util.Format.dateRenderer('Y-F'),
                      step: [Ext.Date.MONTH, 1],
                      label: {
                          rotate: {
                              degrees: -90,
                          },
                          fontSize: 11,
                      },
                      fields: ['Date'],
                  },
              ],
              series: [
                  {
                      type: 'line',
                      cls: 'testcls',
                      axis: 'left',
                      xField: 'Date',
                      yField: ['Q_Varde_0'],
                      marker: {
                          type: 'circle',
                          radius: 2,
                          lineWidth: 0,
                      },
                      label: {
                          display: 'insideEnd',
                          hidden: true,
                          fontSize: 9,
                          field: 'Q_Namnare_0',
                          contrast: true,
                          rotate: {
                              degrees: 45,
                          },
                          renderer: function(v) {
                              return typeof v === 'number'
                                  ? 'n=' + Ext.util.Format.number(v, '0,000')
                                  : '';
                          },
                      },
                      listeners: {
                          itemmouseup: function noop() {},
                      },
                  },
                  {
                      type: 'line',
                      cls: 'testcls',
                      axis: 'left',
                      xField: 'Date',
                      yField: ['Q_Varde_1'],
                      marker: {
                          type: 'circle',
                          radius: 2,
                          lineWidth: 0,
                      },
                      label: {
                          display: 'insideEnd',
                          hidden: true,
                          fontSize: 9,
                          field: 'Q_Namnare_1',
                          contrast: true,
                          rotate: {
                              degrees: 45,
                          },
                          renderer: function(v) {
                              return typeof v === 'number'
                                  ? 'n=' + Ext.util.Format.number(v, '0,000')
                                  : '';
                          },
                      },
                      listeners: {
                          itemmouseup: function noop() {},
                      },
                  },
              ],
          });
          function storeDataToTabell(data) {
              var res = [];

              Ext.Array.each(data, function(rowObj) {
                  rowObj['Date'].setDate(1);
                  res.push({
                      Datum: rowObj['Date'],
                      // "År": rowObj['Q_Year'],
                      // "Månad": rowObj['Q_Month'],
                      Andel: rowObj['Q_Varde_0'],
                  });
              });

              return res;
          }
          dataTable = Ext.create('Ext.grid.Panel', {
              // title: _m.getIndicatorName(_m.getCurrentId()),
              header: {
                  items: [
                      Ext.create('Ext.button.Button', {
                          html:
                              '<img width="56" height="62" title="" alt="" src="data:image/png;base64,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" />',
                          ui: 'none',
                          frame: false,
                          handler: function() {
                              var panel = this.up('gridpanel');
                              var store = panel.getStore();
                              var data = Ext.Array.pluck(
                                  store.data.items,
                                  'data'
                              );
                              var cleanedData = storeDataToTabell(data);
                              var filename =
                                  'QRegPV-' +
                                  _m.getIndicatorName(_m.getCurrentId()) +
                                  '-' +
                                  new Date().toLocaleDateString();
                              var csvPayload = _m.jsonToCSV(
                                  cleanedData,
                                  filename
                              );
                              var element = document.createElement('a');
                              element.setAttribute('href', csvPayload.data);
                              element.setAttribute(
                                  'download',
                                  csvPayload.filename
                              );

                              element.style.display = 'none';
                              document.body.appendChild(element);

                              element.click();

                              document.body.removeChild(element);
                          },
                      }),
                  ],
                  style: {
                      backgroundColor: '#fff',
                  },
              },
              store: Ext.create('Ext.data.ChainedStore', {
                  source: Ext.StoreManager.lookup('QRegPV.MainStore'),
                  sorters: [
                      {
                          property: 'Date',
                          direction: 'DESC',
                      },
                  ],
              }),
              columns: [
                  // {
                  //     text: 'Datum',
                  //     dataIndex: 'Date',
                  //     flex: 2,
                  //     renderer: function(value) {
                  //         return Ext.Date.format(value, 'Y / F');
                  //     }
                  // },
                  {
                      text: 'År',
                      dataIndex: 'Q_Year',
                      flex: 1,
                      sortable: false,
                  },
                  {
                      text: 'Månad',
                      dataIndex: 'Q_Month',
                      flex: 1,
                      sortable: false,
                      renderer: function(value) {
                          return Ext.Date.monthNames[value - 1];
                      },
                  },
                  {
                      text: 'Andel',
                      dataIndex: 'Q_Varde_0',
                      flex: 1,
                      renderer: Ext.util.Format.numberRenderer('0.0'),
                  },
              ],
              width: 400,
          });

          //Init clinic comboboxes
          clinicChangeFn = function() {
              var series = mainChart.getSeries()[this.isPrimary ? 0 : 1],
                  val = this.getValue(),
                  titles;

              if (!Ext.isArray(series.getTitle())) {
                  series.setTitle(['Val saknas']);
              } else {
                  series.setTitle('Val Saknas');
              }

              if (val) {
                  titles = series.getTitle();
                  titles = this.getRawValue();
                  series.setTitle(titles);
              }
              dataTable && dataTable.updateLayout();
          };

          clinicComboPrimary.addSingleListener('select', clinicChangeFn);
          clinicComboSecondary.addSingleListener('select', clinicChangeFn);

          clinicChangeFn.call(clinicComboPrimary);
          clinicChangeFn.call(clinicComboSecondary);
          mainChart.refreshLegendStore();
          mainStore.loadNewUnitData();
          configContainer = Ext.create('QRegPV.ConfigContainer', {
              margin: '0 0 20px 0',
              layout: {
                  type: 'vbox',
                  align: 'stretch',
              },
              items: [
                  indicatorSelection,
                  clinicComboPrimary,
                  clinicComboSecondary,
              ],
          });
          Ext.create('Ext.container.Container', {
              renderTo: container,
              layout: {
                  type: 'vbox',
                  align: 'stretch',
              },
              items: [
                  configContainer,
                  Ext.create('QRegPV.CountView', {
                      hypertoni: _m.isHypertoni(),
                  }),
                  mainChart,
                  dataTable,
              ],
          });
      });
  }
})();
//# sourceURL=QRegPV/OverTimeKS
