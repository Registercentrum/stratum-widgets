
Ext.util.CSS.removeStyleSheet('shpr-company');
Ext.util.CSS.createStyleSheet(''

  + '.scw-header {'
  + '  width: 100%;'
  + '  padding: 0 0 0 2px;'
  + '  font-weight: normal;'
  + '  margin: 0 0 18px 0;'
  + '}'

  + '.scw-label {'
  + '  width: 20%;'
  + '  padding-left: 2px;'
  + '  display: inline-block;'
  + '}'

  + '.scw-select {'
  + '  height: 42px;'
  + '  border-radius: 3px;'
  + '  background-color: #f9f9f9;'
  + '  border: solid 1px #b7b7b7;'
  + '  width: 20%;'
  + '  padding-right: 5px;'
  + '  float: left;'
  + '  border: none;'
  + '}'

  + '.scw-select div {'
  + '  border-radius: 3px;'
  + '}'

  + '.scw-select-last {'
  + '  padding-right: 0px;'
  + '}'

  + '.scw-download-area span {'
  + '  color: grey;'
  + '  font-size: 15px;'
  + '  font-weight: 100;'
  + '}'

  + '.scw-download-area div {'
  + '  border: none;'
  + '}'

  + '.scw-spinner {'
  + '  display: initial;'
  + '}'

  + '.scw-spinner.inactive {'
  + '  display: none;'
  + '}'

  + '.scw-grid .x-grid-row-summary .x-grid-cell:nth-child(4) {'
  + '  border-top: 1px black solid;'
  + '}'

  + '.scw-download-button span {'
  + '  font-family: FontAwesome, open_sans;'
  + '  font-weight: normal;'
  + '  font-size: 13px;'
  + '}'

  + '.scw-missing-data-panel {'
  + '  margin: 30px auto;'
  + '  width: 210px;'
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
  // + '  font-weight: 500;'
  + '  font-style: italic;'
  + '  background: #3e9bbc;'
  + '  display: inline-block;'
  + '  line-height: 10px;'
  + '  padding-right: 2px;'
  // + '  letter-spacing: 1.5px;'
  + '  position: absolute;'
  + '  top: -18px;'
  + '  left: 1px;'
  + '}', 'shpr-company');

Ext.apply(Ext.QuickTips.getQuickTip(), {
  dismissDelay: 0
});

Ext.define('shpr.controller.MainController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.main',

  updateGrid: function () {
    var view = this.getView();
    var clinic = view.down('#clinicDropdown').getValue();
    var operationType = view.down('#operationDropdown').getValue();
    var protesis = view.down('#protesisDropdown').getValue();
    var articleType = view.down('#articleTypeDropdown').getValue();
    var articleNumber = view.down('#articleNumberDropdown').getValue();

    if (clinic === 'Riket') clinic = '1000';
    if (articleNumber === 'Alla') articleNumber = 'alla';

    var startDate = view.down('#startDate').getValue().toLocaleDateString();
    var endDate = view.down('#endDate').getValue().toLocaleDateString();

    /* IE hack */
    startDate = startDate.replace(/[^ -~]/g, '');
    endDate = endDate.replace(/[^ -~]/g, '');

    view.down('#dataPanel').updateGrid([]);
    var spinner = view.down('#spinnerPanel');
    var message = view.down('#missingDataPanel');
    spinner && spinner.show();
    message && message.hide();

    Ext.Ajax.request({
      type: 'ajax',
      method: 'get',
      cors: true,
      url: '/stratum/api/statistics/shpr/supplier-mod1?enhet=' + clinic + '&operationstyp=' + operationType + '&protestyp=' + protesis + '&artikeltyp=' + articleType + '&article_nr=' + articleNumber + '&start_datum=' + startDate + '&slut_datum=' + endDate,
      success: function (response) {
        var data = Ext.decode(response.responseText).data;
        spinner && spinner.hide();
        if (data[1][0].length !== 1) {
          view.down('#dataPanel').updateGrid(data[0][0]);
          var articles = view.down('#articleNumberDropdown');
          articles.getStore().loadData(data[1][0]);
        } else {
          message && message.show();
        }
      }
    });
  },

  updateStartDate: function () {
    var view = this.getView();
    var startDate = view.down('#startDate').getValue();
    var endDate = view.down('#startDate').getValue();
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
    var selections = this.getSelections();
    var dateFormat = language === 'Swedish' ? 'Y-m-d' : 'd/m/Y';
    var headers = 'Enhet; Operationstyp; Protestyp; Artikeltyp; Artikel;Startdatum; Slutdatum;\n';
    var content = '';
    content += headers;
    content += selections.clinic + ';';
    content += selections.operation + ';';
    content += selections.protesis + ';';
    content += selections.articleType + ';';
    content += selections.article === '' ? 'Alla;' : selections.article + ';';
    content += Ext.Date.format(selections.startDate, dateFormat) + ';';
    content += Ext.Date.format(selections.endDate, dateFormat) + ';';
    content += '\n\n';
    headers = this.getView().down('#dataPanel');
    for (var column in headers.el.component.columns) {
      if (column === '') continue;
      content += headers.el.component.columns[column].titleEl.component.initialConfig.text + ';';
    }
    content += '\n';
    content = language === 'Swedish' ? content : this.translateContent(content, this.categoryTranslations);
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
    content = language === 'Swedish' ? content : this.translateContent(content, this.dataTranslations);
    /* Set BOM to let Excel know what the content is */
    content = '\ufeff' + content;
    return content;
  },

  translateContent: function (content, translations) {
    var newContent = content;
    for (var item in translations) {
      newContent = newContent.replace(new RegExp(item + '(?![A-z])', 'g'), translations[item]);
    }
    return newContent;
  },

  getSelections: function () {
    var selections = {};
    var view = this.getView();
    selections.clinic = view.down('#clinicDropdown').getDisplayValue();
    selections.operation = view.down('#operationDropdown').getDisplayValue();
    selections.protesis = view.down('#protesisDropdown').getDisplayValue();
    selections.articleType = view.down('#articleTypeDropdown').getDisplayValue();
    selections.article = view.down('#articleNumberDropdown').getDisplayValue();
    selections.startDate = view.down('#startDate').getValue();
    selections.endDate = view.down('#endDate').getValue();
    return selections;
  },

  categoryTranslations: {
    'Alla': 'All',
    'Antal': 'Quantity',
    'Artikel': 'Item',
    'Artikelnummer': 'Item Number',
    'Artikeltyp': 'Type of Implant',
    'Beskrivning': 'Description',
    'Caput': 'Head',
    'Caputliner': 'Dual Mobility Liner',
    'Enhet': 'Unit',
    'Halv': 'Hemi',
    'Klinik': 'Unit',
    'Operationstyp': 'Type of Surgery',
    'Plugg': 'Plug',
    'Primär': 'Primary',
    'Protestyp': 'Type of Prothesis',
    'Riket': 'Sweden',
    'Samtliga': 'All',
    'Stam': 'Stem',
    'Startdatum': 'Start Date',
    'Slutdatum': 'End Date'
  },

  dataTranslations: {
    'Riket': 'Sweden',
    'caput': 'head',
    'stam': 'stem',
    'plugg': 'plug',
    'caputliner': 'dual mobility liner',
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

Ext.define('shpr.view.Main', {
  extend: 'Ext.container.Container',
  controller: 'main',
  id: 'ShprMain',
  items: [
    {
      xtype: 'label',
      width: '100%',
      cls: 'scw-header',
      text: 'Data inmatad efter senast publicerade årsrapport skall användas med stor försiktighet då den inte är komplett eller validerad.'
    },
    {
      xtype: 'label',
      cls: 'scw-label',
      text: 'Enhet'
    },
    {
      xtype: 'label',
      cls: 'scw-label',
      text: 'Operationstyp'
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
      text: 'Artikel'
    },
    {
      xtype: 'rcfilter',
      itemId: 'clinicDropdown',
      cls: 'scw-select',
      valueField: 'P_Unit',
      displayField: 'sjukhus',
      value: '0',
      sortfield: 'sjukhus',
      sortdirection: 'DESC',
      selectCallback: 'updateGrid',

      store: {
        fields: ['P_Unit', 'sjukhus'],
        autoLoad: true,
        proxy: {
          type: 'ajax',
          method: 'get',
          cors: true,
          url: '/stratum/api/statistics/shpr/supplier-mod-hospitals',
          reader: {
            type: 'json',
            rootProperty: 'data[0]'
          }
        }
      }
    },
    {
      xtype: 'rcfilter',
      itemId: 'operationDropdown',
      cls: 'scw-select',
      valueField: 'operationCode',
      displayField: 'operationName',
      value: 'alla',
      sortfield: 'operationName',
      sortdirection: 'DESC',
      fields: ['operationName', 'operationCode'],
      selectCallback: 'updateGrid',
      store: {
        fields: ['operationCode', 'operationName'],
        data: [
          { operationCode: 'alla', operationName: 'Alla' },
          { operationCode: 1, operationName: 'Primär' },
          { operationCode: 2, operationName: 'Revision' }
        ]
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
      fields: ['protesisName', 'protesisCode'],
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
      xtype: 'rcfilter',
      itemId: 'articleTypeDropdown',
      cls: 'scw-select',
      valueField: 'articleTypeCode',
      displayField: 'articleTypeName',
      value: 'alla',
      sortfield: 'articleTypeName',
      sortdirection: 'DESC',
      fields: ['articleTypeName', 'articleTypeCode'],
      selectCallback: 'updateGrid',
      store: {
        fields: ['articleTypeCode', 'articleTypeName'],
        data: [
          { articleTypeCode: 'alla', articleTypeName: 'Alla' },
          { articleTypeCode: 'caput', articleTypeName: 'Caput' },
          { articleTypeCode: 'cup', articleTypeName: 'Cup' },
          { articleTypeCode: 'liner', articleTypeName: 'Liner' },
          { articleTypeCode: 'stam', articleTypeName: 'Stam' },
          { articleTypeCode: 'plugg', articleTypeName: 'Plugg' },
          { articleTypeCode: 'caputliner', articleTypeName: 'Caputliner' }
        ]
      }
    },
    {
      xtype: 'rcfilter',
      itemId: 'articleNumberDropdown',
      cls: 'scw-select scw-select-last',
      valueField: 'artikelnumer',
      displayField: 'artikelnumer',
      value: 'Alla',
      sortfield: 'artikelnumer',
      sortdirection: 'DESC',
      selectCallback: 'updateGrid',
      store: {
        fields: ['artikelnumer']
      }
    },
    {
      xtype: 'toolbar',
      itemId: 'dateToolbar',
      dock: 'top',
      layout: {
        type: 'hbox',
        align: 'stretch'
      },
      filtering: false,
      items: [{
        xtype: 'datefield',
        width: 315,
        itemId: 'startDate',
        value: Ext.Date.add(new Date(), Ext.Date.YEAR, -1),
        fieldLabel: 'Operationsdatum<div class="scw-info"><div data-qtip="De datum som väljs måste utgöra en period på minst 28 dagar och ligga i spannet mellan 1999-01-01 och dagens datum.">i</div></div>mellan',
        labelWidth: 200,
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
        labelWidth: 35,
        labelStyle: 'padding: 5px 0 0 0;',
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
          download: 'registrations.csv'
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
        fields: ['sjukhus', 'artikel', 'beskrivning', 'artikelnummer', 'antal'],
        groupField: 'sjukhus',
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
          text: 'Klinik',
          dataIndex: 'sjukhus',
          flex: 3
        },
        {
          text: 'Artikelnummer',
          dataIndex: 'artikelnumer',
          flex: 2
        },
        {
          text: 'Beskrivning',
          dataIndex: 'beskrivning',
          flex: 4
        },
        {
          text: 'Artikeltyp',
          dataIndex: 'artikel',
          width: 90
        },
        {
          text: 'Antal',
          dataIndex: 'antal',
          width: 70,
          align: 'right',
          field: {
            xtype: 'numberfield'
          },
          summaryType: 'sum'
        }

      ],
      updateGrid: function (data) {
        var store = {
          storeId: 'overviewStore',
          fields: ['sjukhus', 'artikel', 'beskrivning', 'artikelnumer', 'antal'],
          groupField: 'sjukhus',
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
    var target = (typeof Stratum !== 'undefined') ? Stratum.containers['KRH/ComponentsUsed'] : 'output';
    var main = Ext.create('shpr.view.Main', {
      renderTo: target
    });
    if (!window.navigator.msSaveBlob) {
      main.down('#exportTableSwedish').setHref(' ');
      main.down('#exportTableEnglish').setHref(' ');
    }
    main.getController().updateGrid();
  }
});
//
//! SHPRs företagsmodul: volymer
