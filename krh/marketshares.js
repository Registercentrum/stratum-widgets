
Ext.util.CSS.removeStyleSheet('shpr-companymodule');
Ext.util.CSS.createStyleSheet(''

  + '.scw-header {'
  + '  width: 100%;'
  + '  padding: 0 0 0 2px;'
  + '  font-weight: normal;'
  + '  margin: 0 0 18px 0;'
  + '  display: inline-block'
  + '}'

  + '.scw-label {'
  + '  width: 25%;'
  + '  padding-left: 2px;'
  + '  display: inline-block;'
  + '}'

  + '.scw-select {'
  + '  height: 42px;'
  + '  border-radius: 3px;'
  + '  background-color: #f9f9f9;'
  + '  border: solid 1px #b7b7b7;'
  + '  width: 25%;'
  + '  padding-right: 5px;'
  + '  float: left;'
  + '  border: none;'
  + '}'

  + '.scw-select div {'
  + '  border-radius: 3px;'
  + '  vertical-align: top;'
  + '}'

  + '.scw-select-last {'
  + '  padding-right: 0px;'
  + '}'

  + '.scw-download-button {'
  //  + '  visibility: hidden;'
  + '}'

  + '.scw-download-button span {'
  + '  font-family: FontAwesome, open_sans;'
  + '  font-weight: normal;'
  + '  font-size: 13px;'
  + '}'

  + '.scw-grid .x-grid-row-summary .x-grid-cell:nth-child(3), .scw-grid .x-grid-row-summary .x-grid-cell:nth-child(4), .scw-grid .x-grid-row-summary .x-grid-cell:nth-child(5) {'
  + '  border-top: 1px black solid;'
  + '}'

  + '.scw-missing-data-panel {'
  + '  margin: 30px auto;'
  + '  width: 210px;'
  + '}'

  + '.scw-spinner {'
  + '  display: initial;'
  + '}'

  + '.scw-spinner.inactive {'
  + '  display: none;'
  + '}'

  + '.scw-qtip {'
  + '  width: 16px;'
  + '  height: 16px;'
  + '  display: inline-block;'
  + '  margin-bottom: 10px;'
  + '}'

  + '.scw-info {'
  + '  position: relative;'
  + '  display: inline-block;'
  + '  margin-right: 20px;'
  + '}'

  + '.scw-info div {'
  + '  height: 12px;'
  + '  width: 12px;'
  + '  border-radius: 12px;'
  + '  border: 1px solid #3e9bbc;'
  + '  text-align: center;'
  + '  color: white;'
  + '  font-family: robotoslab;'
  + '  font-size: 10px;'
  + '  font-weight: 500;'
  + '  font-style: italic;'
  + '  background: #3e9bbc;'
  + '  display: inline-block;'
  + '  line-height: 10px;'
  + '  letter-spacing: 1.5px;'
  + '  position: absolute;'
  + '  top: -18px;'
  + '  left: 1px;'
  + '}', 'shpr-companymodule');

Ext.apply(Ext.QuickTips.getQuickTip(), {
  dismissDelay: 0
});

Ext.define('RC.ui.Multiselect', {
  extend: 'Ext.form.field.Tag',
  xtype: 'rcmultiselect',
  cls: 'scw-select rc-multiselect',
  queryMode: 'local',
  multiSelect: true,
  stacked: true,

  initComponent: function () {
    this.oldChoices = [this.value]
    this.createStyleSheet()
    this.callParent()
  },

  listeners: {
    select: function (combo, record) {
      this.updateDropdown(record)
      if (this.deselect) {
        if (this.skippedDuplicate) {
          combo.fireEvent('update')
          this.skippedDuplicate = false
          this.deselect = false
        } else {
          this.skippedDuplicate = true
        }
      } else {
        if (this.getPicker().isVisible()) {
          this.postponed = true
        } else {
          combo.fireEvent('update')
          this.postponed = false
        }
      }
    },
    collapse: function (combo) {
      if (this.postponed) {
        combo.fireEvent('update')
        this.postponed = false
      }
    },
    beforedeselect: function () {
      if (!this.getPicker().isVisible()) {
        this.deselect = true
      }
    },
  },

  createStyleSheet: function () {
    var existingStyle = document.getElementById('rc-multiselect')
    if (existingStyle) return
    Ext.util.CSS.createStyleSheet(''

      + '.rc-multiselect .x-form-text-wrap {'
      + '  overflow: visible;'
      + '}'

      + '.rc-multiselect .x-tagfield {'
      + '  overflow: hidden !important;'
      + '}'

      + '.rc-multiselect li.x-tagfield-item {'
      + '  border: none;'
      + '  background-color: transparent;'
      + '  margin: 0px 4px 0px 0;'
      + '}'

      + '.rc-multiselect li:hover {'
      + '  border: none !important;'
      + '  background-color: initial;'
      + '}'

      + '.rc-multiselect li:last-child {'
      + '  height: 0;'
      + '  width: 0;'
      + '  float: left;'
      + '}'

      + '.rc-multiselect li div:last-child {'
      + '   display: none;'
      + '}'

      + '.rc-multiselect .x-form-text-default .x-tagfield-input-field {'
      + '  height: 0;'
      + '  padding: 0;'
      + '}'

      + '.rc-multiselect li:hover div:last-child {'
      + '  display:initial;'
      + '}', 'rc-multiselect');
  },

  updateDropdown: function (record) {
    var newChoices = this.enumerateNewChoices(record);
    var removeDefault = (newChoices.length > 1 && newChoices[0] === this.default)
    var addition = this.checkForAdditions(newChoices);
    var deletion = this.checkForDeletions(newChoices);
    this.oldChoices = newChoices;
    if (addition || (deletion && this.getPicker().isVisible())) {
      if (!window.event.ctrlKey || removeDefault) {
        this.oldChoices = [];
        this.oldChoices.push(addition || deletion);
        this.clearValue();
        this.setValue(addition || deletion);
        !window.event.ctrlKey && this.collapse();
      }
    }
  },

  checkForAdditions: function (record) {
    for (var item in record) {
      if (!this.oldChoices.includes(record[item])) {
        return record[item];
      }
    }
    return '';
  },

  checkForDeletions: function (record) {
    for (var item in this.oldChoices) {
      if (!record.includes(this.oldChoices[item])) {
        return this.oldChoices[item];
      }
    }
    return '';
  },

  enumerateNewChoices: function (record) {
    var newChoices = [];
    for (var item in record) {
      if (item === '') continue;
      newChoices.push(record[item].data[this.valueField]);
    }
    return newChoices;
  },

  reset: function () {
    this.select(this.default)
    this.oldChoices = [this.default]
    this.deselect = false
  }
})

Ext.define('shpr.market.MainController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.market.main',

  updateGrid: function () {
    var view = this.getView();
    var region = view.down('#regionDropdown').getValue();
    var protesis = view.down('#protesisDropdown').getValue();
    var articleType = view.down('#articleTypeDropdown').getValue();
    var fixation = view.down('#fixationDropdown').getValue();
    
    // var startDate = view.down('#startDate').getValue().toLocaleDateString();
    // var endDate = view.down('#endDate').getValue().toLocaleDateString();

    var startDate = Ext.Date.format(view.down('#startDate').getValue(),  'Y-m-d')
    var endDate = Ext.Date.format(view.down('#endDate').getValue(),  'Y-m-d')

    /* IE hack */
    startDate = startDate.replace(/[^ -~]/g, '');
    endDate = endDate.replace(/[^ -~]/g, '');

    view.down('#dataPanel').updateGrid([]);
    var message = view.down('#missingDataPanel');
    var spinner = view.down('#spinnerPanel');

    message && message.hide();
    spinner && spinner.show();

    Ext.Ajax.request({
      type: 'ajax',
      method: 'get',
      cors: true,
      url: '/stratum/api/statistics/shpr/supplier-mod2?landsting=' + region + '&protestyp=' + protesis + '&artikeltyp=' + articleType + '&fixation=' + fixation + '&start_datum=' + startDate + '&slut_datum=' + endDate,
      success: function (response) {
        var result = Ext.decode(response.responseText).data;
        spinner && spinner.hide();
        if (result.length !== 0) {
          view.down('#dataPanel').updateGrid(result[0]);
        } else {
          message.show();
        }
      }
    });
  },

  updateStartDate: function () {
    var view = this.getView();
    var startDate = view.down('#startDate').getValue();
    var endDate = view.down('#endDate').getValue();
    if (startDate < new Date('1999-01-01')) view.down('#startDate').setValue(new Date('1999-01-01'));
    if (this.isDifferenceLessThanThirtyDays()) {
      endDate.setTime(startDate.getTime() + 27 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000);
      view.down('#endDate').setValue(endDate);
    }
    this.updateGrid();
  },

  updateEndDate: function () {
    var view = this.getView();
    var startDate = view.down('#startDate').getValue();
    var endDate = view.down('#endDate').getValue();
    if (endDate > new Date()) view.down('#endDate').setValue(new Date());
    if (this.isDifferenceLessThanThirtyDays()) {
      startDate.setTime(endDate.getTime() - 27 * 24 * 60 * 60 * 1000);
      view.down('#startDate').setValue(startDate);
    }
    this.updateGrid();
  },

  isDifferenceLessThanThirtyDays: function () {
    var view = this.getView();
    var startDate = view.down('#startDate').getValue();
    var endDate = view.down('#endDate').getValue();
    var dayInSeconds = 24 * 60 * 60 * 1000;
    var diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (dayInSeconds));
    return diffDays < 27;
  },

  exportTable: function (element) {
    var tag = element.el.dom;
    if (!tag) return;

    var content = this.createContentToDownload(element.itemId.replace('exportTable', ''));
    var blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);

    /* IE downloads directly, use the download attribute for others */
    if (window.navigator.msSaveBlob) {
      window.navigator.msSaveBlob(blob, 'registreringar.csv');
    } else {
      tag.setAttribute('href', url);
    }
  },

  createContentToDownload: function (language) {
    var selectedValues = this.getSelections();
    var dateFormat = language === 'Swedish' ? 'Y-m-d' : 'd/m/Y';
    var content = '';
    content += 'Region; Protestyp; Artikeltyp; Fixation; Startdatum; Slutdatum;\n';
    content += selectedValues.region + ';';
    content += selectedValues.protesis + ';';
    content += selectedValues.articleType + ';';
    content += selectedValues.fixation + ';';
    content += Ext.Date.format(selectedValues.startDate, dateFormat) + ';';
    content += Ext.Date.format(selectedValues.endDate, dateFormat) + ';';
    content += '\n\n';
    var headers = Ext.ComponentQuery.query('#dataPanel')[Ext.ComponentQuery.query('#dataPanel').length - 1];
    for (var column in headers.el.component.columns) {
      if (column === '') continue;
      content += headers.el.component.columns[column].titleEl.component.initialConfig.text + ';';
    }
    content += '\n';
    var data = Ext.data.StoreManager.lookup('overviewStore');
    for (var i in data.data.items) {
      if (i === '') continue;
      for (var item in data.data.items[i].data) {
        if (item === 'id') continue;
        var value = data.data.items[i].data[item];
        content += value + ';';
      }
      content += '\n';
    }
    content = language === 'Swedish' ? content : this.translateContent(content);
    /* Set BOM to let Excel know what the content is */
    content = '\ufeff' + content;
    return content;
  },

  getSelections: function () {
    var view = this.getView();
    var selections = {};
    selections.region = view.down('#regionDropdown').getDisplayValue();
    selections.protesis = view.down('#protesisDropdown').getDisplayValue();
    selections.articleType = view.down('#articleTypeDropdown').getDisplayValue();
    selections.fixation = view.down('#fixationDropdown').getDisplayValue();
    selections.startDate = view.down('#startDate').getValue();
    selections.endDate = view.down('#endDate').getValue();
    return selections;
  },

  translateContent: function (content) {
    var newContent = content;
    var translations = this.categoryTranslations;
    for (var item in translations) {
      newContent = newContent.replace(new RegExp(item + '(?![A-z])', 'g'), translations[item]);
    }
    return newContent;
  },

  categoryTranslations: {
    'Artikeltyp': 'Type of Implant',
    'Antal egna': 'Quantity Company',
    'Antal alla': 'Quantity All',
    'Marknadsandel': 'Market Share in Sweden',
    'Protestyp': 'Type of Prothesis',
    'Riket': 'Sweden',
    'Samtliga': 'All',
    'Caput': 'Head',
    'caput': 'head',
    'Plugg': 'Plug',
    'plugg': 'plug',
    'Stam': 'Stem',
    'stam': 'stem',
    'Caputliner': 'Dual Mobility Liner',
    'caputliner': 'dual mobility liner',
    'Ocementerad': 'Non-cemented',
    'Cementerad': 'Cemented',
    'Omvänd hybrid': 'Reversed hybrid',
    'Ytersättning': 'Resurfacing',
    'Inte specificerad': 'Not specified',
    'Inte specificerat': 'Not specified',
    'Alla': 'All',
    'Startdatum': 'Start Date',
    'Slutdatum': 'End Dat'
  }
});

Ext.define('shpr.view.Filter', {
  extend: 'Ext.form.field.ComboBox',
  xtype: 'rcfilter',
  alias: 'view.rcfilter',
  forceSelection: false,
  typeAhead: true,
  queryMode: 'local',
  minChars: 1,
  anyMatch: true,
  autoSelect: false,
  caseSensitive: false,
  checkChangeEvents: ['change', 'keyup'],

  constructor: function (config) {
    config.queryMode = 'local';
    config.listeners = { select: config.selectCallback };
    this.callParent(arguments);
  }
});

Ext.define('shpr.market.view.Main', {
  extend: 'Ext.container.Container',
  controller: 'market.main',
  itemId: 'mainView',
  items: [
    {
    xtype: 'container',
      items: [
    {
      xtype: 'label',
      cls: 'scw-header',
      text: 'Data inmatad efter senast publicerade årsrapport skall användas med stor försiktighet då den inte är komplett eller validerad. Marknadsandelar avser endast implantat som används för primäroperationer. Det är i de flesta av menyerna möjligt att välja flera alternativ samtidigt genom att hålla nere ctrl-knappen när man klickar.'
    },
    {
      xtype: 'label',
      cls: 'scw-label',
      text: 'Region'
    },
    {
      xtype: 'label',
      cls: 'scw-label',
      text: 'Protestyp'
    },
    {
      xtype: 'label',
      cls: 'scw-label',
      text: 'Artikeltyp'
    },
    {
      xtype: 'label',
      cls: 'scw-label',
      text: 'Fixation'
    },
    {
      xtype: 'rcmultiselect',
      itemId: 'regionDropdown',
      valueField: 'ValueCode',
      displayField: 'ValueName',
      value: 'alla',
      default: 'alla',
      listeners: {
        update: function (){
          this.up('#mainView').getController().updateGrid()
        }
      },
      store: {
        fields: ['ValueCode', 'ValueName'],
        autoLoad: true,
        proxy: {
          type: 'ajax',
          method: 'get',
          cors: true,
          url: '/stratum/api/metadata/domains/3003?apikey=bK3H9bwaG4o',
          reader: {
            type: 'json',
            rootProperty: 'data.DomainValues'
          }
        },

        listeners: {
          load: function (store) {
            store.sort('ValueName', 'ASC');
            store.insert(0, [{
              ValueName: '(Riket)',
              ValueCode: 'alla'
            },
            {
              ValueName: '(Samtliga)',
              ValueCode: '1000'
            }]);
          }
        }
      }
    },
    {
      xtype: 'rcfilter',
      itemId: 'protesisDropdown',
      cls: 'scw-select',
      valueField: 'protesisCode',
      displayField: 'protesisName',
      value: 'alla',
      sortfield: 'protesisName',
      sortdirection: 'DESC',
      selectCallback: 'updateGrid',
      store: {
        fields: ['protesisCode', 'protesisName'],
        data: [
          { protesisCode: 'alla', protesisName: 'Alla' },
          { protesisCode: '1', protesisName: 'Total' },
          { protesisCode: '2', protesisName: 'Halv' }
        ]
      }
    },
    {
      xtype: 'rcmultiselect',
      itemId: 'articleTypeDropdown',
      valueField: 'articletypeCode',
      displayField: 'articletypeName',
      value: 'alla',
      default: 'alla',
      listeners: {
        update: function () {
          this.up('#mainView').getController().updateGrid()
        }
      },
      store: {
        fields: ['articletypeCode', 'articletypeName'],
        data: [
          { articletypeCode: 'alla', articletypeName: 'Alla' },
          { articletypeCode: 'caput', articletypeName: 'Caput' },
          { articletypeCode: 'cup', articletypeName: 'Cup' },
          { articletypeCode: 'liner', articletypeName: 'Liner' },
          { articletypeCode: 'stam', articletypeName: 'Stam' },
          { articletypeCode: 'plugg', articletypeName: 'Plugg' },
          { articletypeCode: 'caputliner', articletypeName: 'Caputliner' }
        ]
      }
    },
    {
      xtype: 'rcmultiselect',
      itemId: 'fixationDropdown',
      valueField: 'fixationCode',
      displayField: 'fixationName',
      value: 'alla',
      default: 'alla',
      listeners: {
        update: function () {
          this.up('#mainView').getController().updateGrid()
        }
      },
      store: {
        fields: ['fixationCode', 'fixationName'],
        data: [
          { fixationCode: 'alla', fixationName: 'Alla' },
          { fixationCode: 1, fixationName: 'Ocementerad' },
          { fixationCode: 2, fixationName: 'Cementerad' },
          { fixationCode: 3, fixationName: 'Hybrid' },
          { fixationCode: 4, fixationName: 'Omvänd hybrid' },
          { fixationCode: 5, fixationName: 'Ytersättning' },
          { fixationCode: 6, fixationName: 'Inte specifierad' }
        ]
      }
    }]},
    {
      xtype: 'toolbar',
      itemId: 'DateToolbar',
      dock: 'top',
      layout: {
        type: 'hbox',
        align: 'stretch'
      },
      filtering: false,
      items: [{
        xtype: 'datefield',
        width: 320,
        itemId: 'startDate',
        value: Ext.Date.add(new Date(), Ext.Date.YEAR, -1),
        fieldLabel: 'Operationsdatum<div class="scw-info"><div data-qtip="De datum som väljs måste utgöra en period på minst 28 dagar och ligga i spannet mellan 1999-01-01 och dagens datum.">i</div></div>mellan',
        labelWidth: 188,
        format: 'Y-m-d',
        altFormats: 'ymd|Ymd',
        listeners: {
          change: 'updateStartDate'
        }
      },
      {
        xtype: 'datefield',
        width: 150,
        itemId: 'endDate',
        value: new Date(),
        fieldLabel: ' och',
        labelWidth: 30,
        labelStyle: 'padding: 8px 0 0 0;',
        format: 'Y-m-d',
        altFormats: 'ymd|Ymd',
        listeners: {
          change: 'updateEndDate'
        }
      },
      {
        xtype: 'label',
        text: '',
        style: {
          border: 'none'
        },
        flex: 1
      },
      {
        xtype: 'button',
        itemId: 'exportTableSwedish',
        cls: 'scw-download-button',
        autoEl: {
          tag: 'a',
          download: 'registreringar.csv'
        },
        text: '&#xf019 Excel (sv)',
        listeners: {
          click: 'exportTable'
        }
      },
      {
        xtype: 'button',
        itemId: 'exportTableEnglish',
        cls: 'scw-download-button',
        autoEl: {
          tag: 'a',
          download: 'registreringar.csv'
        },
        text: '&#xf019 Excel (en)',
        listeners: {
          click: 'exportTable'
        }
      }
      ]
    },
    {
      xtype: 'grid',
      itemId: 'dataPanel',
      width: '100%',
      cls: 'scw-grid',
      store: {
        storeId: 'overviewStore',
        fields: ['landstings', 'artikel', 'Fixation', 'antal', 'total', 'andel'],
        groupField: 'landstings',
        data: [

        ]
      },
      features: [{
        id: 'group',
        ftype: 'groupingsummary',
        groupHeaderTpl: '{name}',
        hideGroupedHeader: true,
        enableGroupingMenu: false
      }],
      columns: [
        {
          text: 'Region',
          dataIndex: 'landstings',
          flex: 1
        },
        {
          text: 'Artikeltyp',
          dataIndex: 'artikel',
          flex: 1
        },
        {
          text: 'Fixation',
          dataIndex: 'Fixation',
          flex: 1
        },
        {
          itemId: 'owncount',
          text: 'Antal egna',
          dataIndex: 'antal',
          width: 110,
          align: 'right',
          field: {
            xtype: 'numberfield'
          },
          summaryType: 'sum'
        },
        {
          itemId: 'totalcount',
          text: 'Antal alla',
          dataIndex: 'total',
          width: 110,
          align: 'right',
          field: {
            xtype: 'numberfield'
          },
          summaryType: 'sum'
        },
        {
          text: 'Marknadsandel',
          dataIndex: 'andel',
          width: 150,
          align: 'right',
          field: {
            xtype: 'numberfield'
          },
          renderer: function (a) {
            return a + '%';
          },
          summaryRenderer: function (value, summaryData) {
            return (100 * summaryData.owncount / summaryData.totalcount).toFixed(1) + '%';
          }
        }
      ],
      updateGrid: function (data) {
        var store = {
          storeId: 'overviewStore',
          fields: ['landstings', 'artikel', 'Fixation', 'antal', 'total', 'andel'],
          groupField: 'landstings',
          data: data
        };
        this.setStore(store);
      }
    },
    {
      xtype: 'panel',
      itemId: 'spinnerPanel',
      height: 162,
      hidden: true,
      border: false,
      html: '<div class="spinner"><div class="rect1"></div><div class="rect2"></div><div class="rect3"></div><div class="rect4"></div><div class="rect5"></div></div>'
    },
    {
      xtype: 'panel',
      itemId: 'missingDataPanel',
      height: 80,
      hidden: true,
      border: false,
      html: '<div class="scw-missing-data-panel">För liten mängd data tillgänglig.</div>'
    }
  ]
});

Ext.application({
  name: 'shpr',
  units: [],
  viewcontrollers: [
    'DetailsController'
  ],
  launch: function () {
    var target = (typeof Stratum.containers !== 'undefined') ? Stratum.containers['KRH/MarketShares'] : 'contentPanel';
    var main = Ext.create('shpr.market.view.Main', {
      renderTo: target
    });
    if (!window.navigator.msSaveBlob) {
      main.down('#exportTableSwedish').setHref(' ');
      main.down('#exportTableEnglish').setHref(' ');
    }
    main.getController().updateGrid();
  }
});

// ! SHPRs företagsmodul: marknadsandelar