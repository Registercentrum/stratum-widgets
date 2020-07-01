
Ext.util.CSS.removeStyleSheet('shpr-company');
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
  + '  font-style: italic;'
  + '  background: #3e9bbc;'
  + '  display: inline-block;'
  + '  line-height: 10px;'
  + '  letter-spacing: 1.75px;'
  + '  position: absolute;'
  + '  top: -18px;'
  + '  left: 1px;'
  + '}', 'shpr-company');

Ext.apply(Ext.QuickTips.getQuickTip(), {
  dismissDelay: 0
});

Ext.apply(Ext.data.SortTypes, {
  asAllPlacedFirst: function (str) {
    if(str==='Alla') return "0"
    return str
  }
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
      if(this.deselect) {
        if(this.skippedDuplicate) {
          combo.fireEvent('update')  
          this.skippedDuplicate = false
          this.deselect = false
        } else {
          this.skippedDuplicate = true
        }
      } else {
        if(this.getPicker().isVisible()){
          this.postponed = true
        } else {
          combo.fireEvent('update')  
          this.postponed = false
        }
      } 
    },
    collapse: function (combo) {
      if(this.postponed){
        combo.fireEvent('update')
        this.postponed = false
      }
    },
    beforedeselect: function () {
      if(!this.getPicker().isVisible()){
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
    var removeDefault = (newChoices.length >1 && newChoices[0] === this.default)
    var addition = this.checkForAdditions(newChoices);
    var deletion = this.checkForDeletions(newChoices);
    this.oldChoices = newChoices;
    if (addition || (deletion && this.getPicker().isVisible())) {
      if (!window.event.ctrlKey || removeDefault) {
        this.oldChoices = [];
        this.oldChoices.push(addition||deletion);
        this.clearValue();
        this.setValue(addition||deletion);
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
  
  reset: function (){
    this.select(this.default)
    this.oldChoices = [this.default]
    this.deselect = false
  }
})

Ext.define('shpr.volume.MainController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.volume.main',

  updateGrid: function () {
    var view = this.getView();
    var clinic = view.down('#clinicDropdown').getValue();
    var operationType = view.down('#operationDropdown').getValue();
    var diagnosis = view.down('#diagnosisDropdown').getValue();
    var protesis = view.down('#protesisDropdown').getValue();
    var articleType = view.down('#articleTypeDropdown').getValue();
    var articleGroup = view.down('#articleGroupDropdown').getValue();
    var articleNumber = view.down('#articleNumberDropdown').getValue();

    if (articleNumber === 'Alla') articleNumber = 'alla';

    var startDate = Ext.Date.format(view.down('#startDate').getValue(),  'Y-m-d')
    var endDate = Ext.Date.format(view.down('#endDate').getValue(),  'Y-m-d')

    /* IE hack */
    startDate = startDate.replace(/[^ -~]/g, '');
    endDate = endDate.replace(/[^ -~]/g, '');

    view.down('#dataPanel').updateGrid([]);
    var spinner = view.down('#spinnerPanel');
    var message = view.down('#missingDataPanel');
    spinner && spinner.show();
    message && message.hide();

    view.oldparameters = view.newparameters;
    view.newparameters = operationType + protesis + articleType + startDate + endDate;
    if (view.oldparameters !== view.newparameters) {
      articleGroup = 'alla'
      articleNumber = 'alla';
    }
    
    view.oldgroup = view.newgroup
    view.newgroup = articleGroup + ''
    if (view.oldgroup !== view.newgroup) articleNumber = 'alla'
    var baseUrl = '/stratum/api/statistics/shpr/supplier-mod1?'
    Ext.Ajax.request({
      type: 'ajax',
      method: 'get',
      cors: true,
      url: baseUrl
         + 'enhet=' + clinic
         + '&operationstyp=' + operationType 
         + '&diagnos=' + diagnosis 
         + '&protestyp=' + protesis 
         + '&artikeltyp=' + articleType 
         + '&article_group=' + articleGroup
         + '&article_nr=' + articleNumber 
         + '&start_datum=' + startDate 
         + '&slut_datum=' + endDate,
      success: function (response) {
        spinner && spinner.hide();
        var result = Ext.decode(response.responseText).data;
        var gridData = result[0][0];
        var articles = result[1][0];
        var groups = result[2][0].map(function(item){return {articleGroupCode: item.artikelgrupp, articleGroupName: item.article_group_description}})
        if (view.oldparameters !== view.newparameters) {
          view.down('#articleNumberDropdown').getStore().loadData(articles);
          view.down('#articleNumberDropdown').reset()
          view.down('#articleGroupDropdown').getStore().loadData(groups);
          view.down('#articleGroupDropdown').reset()
        }
        if (view.oldgroup !== view.newgroup) {
          view.down('#articleNumberDropdown').getStore().loadData(articles);
          view.down('#articleNumberDropdown').reset()
        }

        if (articles.length !== 1) {
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
    var separator = language === 'Swedish' ? ';' : ';';
    var selections = this.getSelections();
    var dateFormat = language === 'Swedish' ? 'Y-m-d' : 'd/m/Y';
    var headers = 'Enhet; Operationstyp; Protestyp; Artikeltyp; Artikel;Startdatum; Slutdatum;\n';
    var content = '';
    content += headers;
    content += selections.clinic + separator;
    content += selections.operation + separator;
    content += selections.protesis + separator;
    content += selections.articleType + separator;
    content += selections.article === '' ? 'Alla;' : selections.article + separator;
    content += Ext.Date.format(selections.startDate, dateFormat) + separator;
    content += Ext.Date.format(selections.endDate, dateFormat) + separator;
    content += '\n\n';
    headers = this.getView().down('#dataPanel');
    for (var column in headers.el.component.columns) {
      if (column === '') continue;
      content += headers.el.component.columns[column].titleEl.component.initialConfig.text + separator;
    }
    content += '\n';
    content = language === 'Swedish' 
            ? content 
            : this.translateContent(content, this.categoryTranslations);
    var data = Ext.data.StoreManager.lookup('overviewStore');
    for (var i in data.data.items) {
      if (i === '') continue;
      for (var item in data.data.items[i].data) {
        if (item === 'id') continue;
        var value = data.data.items[i].data[item];
        content += value + separator;
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
    'Slutdatum': 'End Dat'
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

Ext.define('shpr.volume.view.Main', {
  extend: 'Ext.container.Container',
  controller: 'volume.main',
  itemId: 'krhMain',
  cls: 'scw-main',
  items: [{
    xtype: 'container',
    items: [
    {
      xtype: 'container',
      items: [
      {
        xtype: 'label',
        width: '100%',
        cls: 'scw-header',
        text: 'Data inmatad efter senast publicerade årsrapport skall användas'
            + ' med stor försiktighet då den inte är komplett eller validerad. Det är i de flesta av menyerna möjligt att välja flera alternativ samtidigt genom att hålla nere ctrl-knappen när man klickar.'
      },
      {
        xtype: 'label',
        cls: 'scw-label',
        html: 'Enhet'
      },
      {
        xtype: 'label',
        cls: 'scw-label',
        text: 'Operationstyp'
      },
      {
        xtype: 'label',
        cls: 'scw-label',
        html: 'Diagnos'
      },
      {
        xtype: 'label',
        cls: 'scw-label',
        text: 'Protestyp'
      },
      {
        xtype: 'rcmultiselect',
        itemId: 'clinicDropdown',
        valueField: 'P_Unit',
        displayField: 'sjukhus',
        value: 999,
        default: 999,

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
        },

        listeners: {
          update: function () {
            this.up('#krhMain').getController().updateGrid()
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
        xtype: 'rcmultiselect',
        itemId: 'diagnosisDropdown',
        valueField: 'diagnosisCode',
        displayField: 'diagnosisName',
        value: 'alla',
        default: 'alla',
        listeners: {
          update: function () {
            this.up('#krhMain').getController().updateGrid()
          }
        },
        store: {
          fields: ['diagnosisCode', 'diagnosisName'],
          data: [
            { diagnosisCode: 'alla', diagnosisName: 'Alla' },
            { diagnosisCode: 1, diagnosisName: 'Primär artros' },
            { diagnosisCode: 2, diagnosisName: 'Inflammatorisk ledsjukdom' },
            { diagnosisCode: 3, diagnosisName: 'Akut trauma, höftfraktur' },
            { diagnosisCode: 4, diagnosisName: 'Följdtillstånd barnsjukdom' },
            { diagnosisCode: 5, diagnosisName: 'Idiopatisk nekros' },
            { diagnosisCode: 6, diagnosisName: 'Följdtillstånd efter trauma/fraktur' },
            { diagnosisCode: 7, diagnosisName: 'Tumör' },
            { diagnosisCode: 8, diagnosisName: 'Annan sekundär artros' },
            { diagnosisCode: 9, diagnosisName: 'Akut trauma, övriga' },
            { diagnosisCode: 10, diagnosisName: 'Övrigt' }
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
      ]
    },
    {
      xtype: 'container',
      items: [
      
      {
        xtype: 'label',
        cls: 'scw-label',
        html: 'Artikeltyp'
      },
      {
        xtype: 'label',
        cls: 'scw-label',
        html: 'Artikelgrupp'
      },
      {
        xtype: 'label',
        cls: 'scw-label',
        html: 'Artikel'
      },
      {
        xtype: 'label',
        cls: 'scw-label',
        html: ''
      },
      
      {
        xtype: 'rcmultiselect',
        itemId: 'articleTypeDropdown',
        queryMode: 'local',
        multiSelect: true,
        stacked: true,
        valueField: 'articleTypeCode',
        displayField: 'articleTypeName',
        value: 'alla',
        default: 'alla',
        listeners: {
          update: function () {
            this.up('#krhMain').getController().updateGrid()
          }
        },
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
        xtype: 'rcmultiselect',
        itemId: 'articleGroupDropdown',
        valueField: 'articleGroupCode',
        displayField: 'articleGroupName',
        value: 'alla',
        default: 'alla',
        listeners: {
          update: function() {
            this.up('#krhMain').getController().updateGrid()
          }
        },
        store: {
          fields: ['articleGroupCode',{
            name: 'articleGroupName',
            sortType: 'asAllPlacedFirst'
          }],
          data: [
            { articleGroupCode: 'alla', articleGroupName: 'Alla' }
          ],
          
          sorters: [{
            property: 'articleGroupName',
            direction: 'ASC'
          }]
        }
      },
      {
        xtype: 'rcmultiselect',
        itemId: 'articleNumberDropdown',
        valueField: 'artikelnumer',
        displayField: 'artikelnumer',
        value: 'Alla',
        default: 'Alla',
        listeners: {
          update: function () {
            this.up('#krhMain').getController().updateGrid()
          }
        },
        store: {
          fields: [{
            name: 'artikelnumer',
            sortType: 'asAllPlacedFirst'
            }],
          data: [
            { artikelnummer: 'Alla' }
          ],
          
          sorters: [{
            property: 'artikelnumer',
            direction: 'ASC'
          }]
        }
      }
      ]
    }
    ],
  },
  {
    xtype: 'container',
    items: [{
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
        fieldLabel: 'Operationsdatum'
                  + '<div class="scw-info">'
                  + '<div data-qtip="De datum som väljs måste utgöra en period på minst 28 dagar '
                  + 'och ligga i spannet mellan 1999-01-01 och dagens datum.">i'
                  + '</div>'
                  + '</div>',
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
          width:80,
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
      html: '<div class="spinner">'
          + '<div class="rect1"></div>'
          + '<div class="rect2"></div>'
          + '<div class="rect3"></div>'
          + '<div class="rect4"></div>'
          + '<div class="rect5"></div>'
          + '</div>'
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
  }]
});

Ext.application({
  name: 'shpr',
  units: [],
  launch: function () {
    var target = (typeof Stratum.containers !== 'undefined') 
                    ? Stratum.containers['KRH/ComponentsUsed'] 
                    : 'contentPanel';
    var main = Ext.create('shpr.volume.view.Main', {
      renderTo: target
    });
    if (!window.navigator.msSaveBlob) {
      main.down('#exportTableSwedish').setHref(' ');
      main.down('#exportTableEnglish').setHref(' ');
    }
    main.getController().oldChoices = {};
    main.getController().oldChoices.articleType = ['alla'];
    main.getController().oldChoices.articleNumber = ['Alla'];
    main.getController().oldChoices.diagnosis = ['alla'];
    main.getController().oldChoices.diagnosis = ['alla'];
    // main.getController().oldChoices.clinic = ['alla'];
    main.getController().updateGrid();
  }
});

//! SHPRs företagsmodul: volymer