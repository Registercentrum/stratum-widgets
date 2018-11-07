
Ext.util.CSS.removeStyleSheet('shpr-companymodule');
Ext.util.CSS.createStyleSheet(''

  + '.scw-header {'
  + '  width: 100%;'
  + '  padding: 0 0 0 2px;'
  + '  font-weight: normal;'
  + '  margin: 0 0 18px 0;'
  + '}'

  + '.scw-label {'
  + '  width: 16.6667%;'
  + '  padding-left: 2px;'
  + '  display: inline-block;'
  + '}'

  + '.scw-select {'
  + '  height: 42px;'
  + '  border-radius: 3px;'
  + '  background-color: #f9f9f9;'
  + '  border: solid 1px #b7b7b7;'
  + '  width: 16.6667%;'
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

  + '.scw-download-button span {'
  + '  font-family: FontAwesome, open_sans;'
  + '  font-weight: normal;'
  + '  font-size: 13px;'
  + '}'

  + '.scw-grid .x-grid-row-summary .x-grid-cell:nth-child(3), .scw-grid .x-grid-row-summary .x-grid-cell:nth-child(4), .scw-grid .x-grid-row-summary .x-grid-cell:nth-child(5), .scw-grid .x-grid-row-summary .x-grid-cell:nth-child(6), .scw-grid .x-grid-row-summary .x-grid-cell:nth-child(7) {'
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

Ext.define('shpr.revisions.MainController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.revisions.main',

  updateGrid: function () {
    var view = this.getView();
    var spinner = Ext.ComponentQuery.query('#spinnerPanel')[0];
    var message = Ext.ComponentQuery.query('#missingDataPanel')[0];

    var operationType = view.down('#operationDropdown').getValue();
    var protesis = view.down('#protesisDropdown').getValue();
    var revision = view.down('#revisionDropdown').getValue();
    var articleType = view.down('#articleTypeDropdown').getValue();
    var articleNumber = view.down('#articleNumberDropdown').getValue();
    var revisionReason = view.down('#causeDropdown').getValue();
    if (articleNumber === 'Alla') articleNumber = 'alla';

    var startDate = view.down('#startDate').getValue().toLocaleDateString();
    var endDate = view.down('#endDate').getValue().toLocaleDateString();

    /* IE hack */
    startDate = startDate.replace(/[^ -~]/g, '');
    endDate = endDate.replace(/[^ -~]/g, '');

    view.down('#dataPanel').updateGrid([]);
    spinner && spinner.show();
    message && message.hide();

    Ext.Ajax.request({
      type: 'ajax',
      method: 'get',
      cors: true,
      url: '/stratum/api/statistics/shpr/supplier-mod4?operationstyp=' + operationType + '&protestyp=' + protesis + '&rev_type=' + revision + '&artikeltyp=' + articleType + '&article_nr=' + articleNumber + '&rev_reason=' + revisionReason + '&start_datum=' + startDate + '&slut_datum=' + endDate,
      success: function (response) {
        spinner && spinner.hide();
        var result = Ext.decode(response.responseText).data;
        var gridData = result[0][0];
        var articles = result[1][0];
        if (articles.length !== 1) {
          view.down('#articleNumberDropdown').getStore().loadData(articles);
          view.down('#dataPanel').updateGrid(gridData);
          view.down('#dataPanel').view.features[0].collapseAll();
        } else {
          message && message.show();
        }
      }
    });
  },

  updateStartDate: function () {
    var view = this.getView();
    var startDate = view.down('#startDate').getValue();
    var endDate = view.down('#endDate').getValue();
    if (startDate < new Date('1999-01-01')) view.down('#startDate').setValue(new Date('1999-01-01'));
    if (this.isDifferenceLessThan28Days()) {
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
    if (this.isDifferenceLessThan28Days()) {
      startDate.setTime(endDate.getTime() - 27 * 24 * 60 * 60 * 1000);
      view.down('#startDate').setValue(startDate);
    }
    this.updateGrid();
  },

  isDifferenceLessThan28Days: function () {
    var view = this.getView();
    var startDate = view.down('#startDate').getValue();
    var endDate = view.down('#endDate').getValue();
    var dayInSeconds = 24 * 60 * 60 * 1000;
    var diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (dayInSeconds));
    return diffDays + 1 < 28;
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
    var view = this.getView();
    var selections = this.getSelections();
    var dateFormat = language === 'Swedish' ? 'Y-m-d' : 'd/m/Y';
    var content = '';
    content += 'Operationstyp; Protestyp; Revisionstyp; Artikeltyp; Artikel; Revisionsorsak; Startdatum; Slutdatum;\n';
    content += selections.operation + ';';
    content += selections.protesis + ';';
    content += selections.revision + ';';
    content += selections.articleType + ';';
    content += selections.article === '' ? 'Alla;' : selections.article + ';';
    content += selections.revisionReason + ';';
    content += Ext.Date.format(selections.startDate, dateFormat) + ';';
    content += Ext.Date.format(selections.endDate, dateFormat) + ';';
    content += '\n\n';

    var headers = view.down('#dataPanel');
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

  getSelections: function () {
    var selections = {};

    selections.operation = this.getView().down('#operationDropdown').getDisplayValue();
    selections.protesis = this.getView().down('#protesisDropdown').getDisplayValue();
    selections.revision = this.getView().down('#revisionDropdown').getDisplayValue();
    selections.articleType = this.getView().down('#articleTypeDropdown').getDisplayValue();
    selections.article = this.getView().down('#articleNumberDropdown').getDisplayValue();
    selections.revisionReason = this.getView().down('#causeDropdown').getDisplayValue();
    selections.startDate = this.getView().down('#startDate').getValue();
    selections.endDate = this.getView().down('#endDate').getValue();
    return selections;
  },

  translateContent: function (content, translations) {
    var newContent = content;
    for (var item in translations) {
      newContent = newContent.replace(new RegExp(item + '(?![A-z])', 'g'), translations[item]);
    }
    return newContent;
  },

  categoryTranslations: {
    'Alla': 'All',
    'Antal': 'Quantity',
    'Artikel': 'Item',
    'Artikelnummer': 'Item Number',
    'Artikeltyp': 'Type of Implant',
    'Aseptisk': 'Aseptic',
    'aseptiska': 'aseptic',
    'av annat slag': 'of other than cup or stem',
    'Beskrivning': 'Description',
    'Caput': 'Head',
    'Caputliner': 'Dual mobility liner',
    'cuprevision': 'cup revision',
    'dagar': 'days',
    'Djup': 'Deep',
    'Enhet': 'Unit',
    'Första': 'First',
    'förstagångsrevisioner': 'first time revisions',
    'Halv': 'Hemi',
    'infektion': 'infection',
    'Insatta': 'Inserted',
    'Klinik': 'Unit',
    'lossning': 'loosening',
    'Luxation': 'Dislocation',
    'Mer': 'More',
    'Operationstyp': 'Type of Surgery',
    'orsaker': 'causes',
    'Plugg': 'Plug',
    'Primär': 'Primary',
    'Protestyp': 'Type of Prothesis',
    'Reviderade': 'Revised',
    'Revisionsorsak': 'Cause of Revision',
    'Revisionstyp': 'Type of Revision',
    'Riket': 'Sweden',
    'Samtliga': 'All',
    'Stam': 'Stem',
    'stamrevision': 'stem revision',
    'år': 'years',
    'än': 'than',
    'Startdatum': 'Start Date',
    'Slutdatum': 'End Dat'
  },

  dataTranslations: {
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
  controller: 'revisions.main',
  itemId: 'mainView',
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
      text: 'Revisionstyp'
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
      xtype: 'label',
      cls: 'scw-label',
      text: 'Revisionsorsak'
    },
    {
      xtype: 'rcfilter',
      itemId: 'operationDropdown',
      cls: 'scw-select',
      valueField: 'operationCode',
      displayField: 'operationName',
      value: '1',
      sortfield: 'operationName',
      sortdirection: 'DESC',
      selectCallback: 'updateGrid',
      store: {
        fields: ['operationCode', 'operationName'],
        data: [
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
      value: '1',
      sortfield: 'protesisName',
      sortdirection: 'DESC',
      selectCallback: 'updateGrid',
      store: {
        fields: ['protesisCode', 'protesisName'],
        data: [
          { protesisCode: '1', protesisName: 'Total' },
          { protesisCode: '2', protesisName: 'Halv' }
        ]
      }
    },
    {
      xtype: 'rcfilter',
      itemId: 'revisionDropdown',
      cls: 'scw-select',
      valueField: 'rev_type',
      displayField: 'beskrivning',
      value: 'alla',
      sortfield: 'beskrivning',
      sortdirection: 'DESC',
      selectCallback: 'updateGrid',
      store: {
        fields: ['rev_type', 'beskrivning'],
        data: [
          { rev_type: 'alla', beskrivning: 'Alla förstagångsrevisioner' },
          { rev_type: 1, beskrivning: 'Första stamrevision' },
          { rev_type: 2, beskrivning: 'Första cuprevision' },
          { rev_type: 3, beskrivning: 'Första revision av annat slag' }
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
      cls: 'scw-select',
      valueField: 'artikelnummer',
      displayField: 'artikelnummer',
      value: 'Alla',
      sortfield: 'artikelnummer',
      sortdirection: 'DESC',
      selectCallback: 'updateGrid',
      store: {
        fields: ['artikelnummer']
      }
    },
    {
      xtype: 'rcfilter',
      itemId: 'causeDropdown',
      cls: 'scw-select  scw-select-last',
      valueField: 'causeCode',
      displayField: 'causeName',
      value: 'alla',
      sortfield: 'causeName',
      sortdirection: 'DESC',
      selectCallback: 'updateGrid',
      store: {
        fields: ['causeCode', 'causeName'],
        data: [
          { causeCode: 'alla', causeName: 'Alla' },
          { causeCode: 1, causeName: 'Aseptisk lossning' },
          { causeCode: 2, causeName: 'Djup infektion' },
          { causeCode: 3, causeName: 'Luxation' },
          { causeCode: 4, causeName: 'Alla aseptiska orsaker' }
        ]
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
        fieldLabel: 'Operationsdatum<div class="scw-info"><div data-qtip="De datum som väljs måste utgöra en period på minst ett år och ligga i spannet mellan 1999-01-01 och dagens datum.">i</div></div>mellan',
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
        groupField: 'artikeltyp',
        fields: [],
        data: []

      },
      features: [{
        id: 'group',
        ftype: 'groupingsummary',
        groupHeaderTpl: '{name}',
        hideGroupedHeader: true,
        enableGroupingMenu: false,
        startCollapsed: true
      }],
      columns: [
        {
          text: 'Artikelnummer',
          dataIndex: 'artikelnummer',
          flex: 2
        },
        {
          text: 'Beskrivning',
          dataIndex: 'beskrivning',
          flex: 4
        },
        {
          text: 'Artikeltyp',
          dataIndex: 'artikeltyp',
          width: 90
        },
        {
          text: 'Insatta',
          dataIndex: 'antal_insatta',
          width: 70,
          field: {
            xtype: 'numberfield'
          },
          summaryType: 'sum'
        },
        {
          text: 'Reviderade',
          dataIndex: 'antal_reviderade',
          width: 100,
          field: {
            xtype: 'numberfield'
          },
          summaryType: 'sum'
        },
        {
          text: '0-90 dagar',
          dataIndex: 'zero_to_90',
          width: 95,
          field: {
            xtype: 'numberfield'
          },
          summaryType: 'sum'
        },
        {
          text: '91 dagar -  2 år',
          dataIndex: 'ninetyone_to_2yrs',
          width: 120,
          field: {
            xtype: 'numberfield'
          },
          summaryType: 'sum'
        },
        {
          text: 'Mer än 2 år',
          dataIndex: 'over_2yrs',
          width: 105,
          field: {
            xtype: 'numberfield'
          },
          summaryType: 'sum'
        }
      ],
      updateGrid: function (data) {
        var store = {
          storeId: 'overviewStore',
          fields: [],
          groupField: 'artikeltyp',
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
    var target = (typeof Stratum.containers !== 'undefined') ? Stratum.containers['KRH/RevisionScope'] : 'contentPanel';
    var main = Ext.create('shpr.view.Main', {
      renderTo: target
    });
    if (!window.navigator.msSaveBlob) {
      main.down('#exportTableSwedish').setHref(' ');
      main.down('#exportTableEnglish').setHref(' ');
    }
    main.getController().updateGrid();
    Ext.apply(Ext.QuickTips.getQuickTip(), {
      dismissDelay: 0
    });
  }
});
//
//! SHPRs företagsmodul: revisionsutfall
