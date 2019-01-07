
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
              window.Stratum.containers['QRegPV/TableDataKS']) ||
          'main-container';
      Repository.Local.Methods.initialize(function(_m) {
          var currYear = _m.getCurrentYear(),
              currMonth = _m.getCurrentMonth(),
              clinicComboPrimary,
              clinicComboSecondary,
              clinicChangeFn,
              indicatorRenderer,
              tableStore,
              qregTable,
              setColumnText;

          tableStore = _m.getMainStore({
              triggerLoadFn: true,
              filter: function(item) {
                  return (
                      item.get('Q_Month') === currMonth &&
                      item.get('Q_Year') === currYear &&
                      Ext.String.startsWith(
                          item.get('Q_Indicator'),
                          _m.getIndicatorType()
                      )
                  );
              },
              sorters: [
                  {
                      property: 'Q_Indicator',
                      direction: 'ASC',
                  },
              ],
          });
          clinicComboPrimary = Ext.create('QRegPV.ClinicCombo', {
              isPrimary: true,
          });
          clinicComboSecondary = Ext.create('QRegPV.ClinicCombo');
          Ext.create('QRegPV.ConfigContainer', {
              margin: '0 0 20px 0',
              renderTo: container,
              layout: {
                  type: 'vbox',
                  align: 'stretch',
              },
              items: [clinicComboPrimary, clinicComboSecondary],
          });
          indicatorRenderer = function(val, col, record, rowIndex, colIndex) {
              var indicator;
              if (!record.get('Q_Unit_' + (colIndex - 1))) {
                  return '-';
              }
              indicator = record.get('Q_Indicator');
              //TODO: Indicator ids for count should not be hard coded here...
              return indicator === '2023' || indicator === '1022'
                  ? val
                  : Ext.util.Format.number(val, '0.0');
          };
          qregTable = Ext.create('Ext.grid.Panel', {
              store: tableStore,
              enableColumnHide: false,
              enableColumnMove: false,
              enableLocking: false,
              sealedColumns: true,
              plugins: ['clipboard'],
              selModel: {
                  type: 'spreadsheet',
                  columnSelect: true,
                  rowSelect: false,
              },
              border: true,
              sortableColumns: false,
              margin: '0 0 20px 0',
              columns: [
                  {
                      text: 'Indikator',
                      dataIndex: 'IndicatorName',
                      flex: 2,
                  },
                  {
                      text: 'Unit_0',
                      align: 'right',
                      dataIndex: 'Q_Varde_0',
                      renderer: indicatorRenderer,
                      flex: 1,
                  },
                  {
                      text: 'Unit_1',
                      align: 'right',
                      dataIndex: 'Q_Varde_1',
                      renderer: indicatorRenderer,
                      flex: 1,
                  },
              ],
              width: '100%',
              renderTo: container,
          });

          setColumnText = function(text) {
              var me = this;
              var col = Ext.Array.findBy(qregTable.columns, function(c) {
                  return c.dataIndex === me.columnDataIndex;
              });
              if (col) {
                  col.tooltip = text;
                  col.setText(text);
              }
          };
          clinicChangeFn = function() {
              setColumnText.call(this, this.getRawValue());
          };
          clinicComboPrimary.addSingleListener('select', clinicChangeFn);
          clinicComboSecondary.addSingleListener('select', clinicChangeFn);

          clinicChangeFn.call(clinicComboPrimary);
          clinicChangeFn.call(clinicComboSecondary);
      });
  }
})();
