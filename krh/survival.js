
Ext.util.CSS.removeStyleSheet('shpr-companymodule');
Ext.util.CSS.createStyleSheet(''

  + '.scw-main ul {'
  + '  padding: 0;'
  + '}'

  + '.scw-main ul>li {'
  + '  list-style: initial;'
  + '}'

  + '.scw-header {'
  + '  width: 100%;'
  + '  padding: 0 0 0 2px;'
  + '  font-weight: normal;'
  + '  margin: 0 0 18px 0;'
  + '  display: inline-block;'
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

  + '.scw-download-button span, .scw-download-image-button span {'
  + '  font-family: FontAwesome, open_sans;'
  + '  font-weight: normal;'
  + '  font-size: 13px;'
  + '}'

  + '.scw-grid .x-grid-row-summary .x-grid-cell:nth-child(3), '
  + '.scw-grid .x-grid-row-summary .x-grid-cell:nth-child(4), '
  + '.scw-grid .x-grid-row-summary .x-grid-cell:nth-child(5) '
  + '{'
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

  + '.scw-article-list-panel {'
  + '  margin: 10px; 0 0 10px;'
  + '  font-size: 10px;'
  + '  color: grey;'
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
  + '}', 'shpr-company');

Ext.apply(Ext.data.SortTypes, {
  asAllPlacedFirst: function (str) {
  if(str==='Alla') return "0"
    return str
  }
})

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

Ext.define('shpr.graph.MainController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.graph.main',
  updateGrid: function () {
    var view = this.getView();
    var diagnosis = view.down('#diagnosisDropdown').getValue();
    var protesis = view.down('#protesisDropdown').getValue();
    var revisiontype = view.down('#revisionDropdown').getValue();
    var cause = view.down('#causeDropdown').getValue();
    var stems = view.down('#stemDropdown').getValue();
    var stemArticles = view.down('#stemArticlesDropdown').getValue();
    var cups = view.down('#cupDropdown').getValue();
    var cupArticles = view.down('#cupArticlesDropdown').getValue();
    var method = view.down('#methodDropdown').getValue();
    
    if (stemArticles[0] === 'Alla') stemArticles[0] = 'alla';
    if (cupArticles[0] === 'Alla') cupArticles[0] = 'alla';

    // var startDate = view.down('#startDate').getValue().toLocaleDateString();
    // var endDate = view.down('#endDate').getValue().toLocaleDateString();

    var startDate = Ext.Date.format(view.down('#startDate').getValue(), 'Y-m-d');
    var endDate = Ext.Date.format(view.down('#endDate').getValue(), 'Y-m-d');

    startDate = this.stripControlCharacters(startDate);
    endDate = this.stripControlCharacters(endDate);

    view.down('#survival').hide();
    view.down('#incidens').hide();

    var message = view.down('#missingDataPanel');
    var spinner = view.down('#spinnerPanel');
    var controller = this;
    message && message.hide();
    spinner && spinner.show();

    view.oldparameters = view.newparameters;
    view.newparameters = diagnosis + protesis + revisiontype + cause + method + startDate + endDate;
    if (view.oldparameters !== view.newparameters) {
      stemArticles = 'alla';
      cupArticles = 'alla';
    }
    view.oldstems = view.newstems
    view.newstems = stems
    if(view.oldstems !== view.newstems) {
      stemArticles = 'alla';
    }
    view.oldcups = view.newcups
    view.newcups = cups
    if(view.oldcups !== view.newcups) {
      cupArticles = 'alla';
    }

    var baseUrl = '/stratum/api/statistics/shpr/supplier-mod3?'
    Ext.Ajax.request({
      type: 'ajax',
      method: 'get',
      cors: true,
      url: baseUrl
        + 'protestyp=' + protesis
        + '&diagnos=' + diagnosis
        + '&rev_type=' + revisiontype
        + '&rev_reason=' + cause
        + '&stam=' + stems
        + '&article_nr_stam=' + stemArticles
        + '&cup=' + cups
        + '&article_nr_cup=' + cupArticles
        + '&method=' + method
        + '&start_datum=' + startDate
        + '&slut_datum=' + endDate,
      success: function (response) {
        var result = Ext.decode(response.responseText).data;
        spinner && spinner.hide();
        var graph = method === 'KM' ? 'survival' : 'incidens';

        if (result.length !== 0) {
          var data = result[0][0];
          var stems = result[1][0];
          var cups = result[2][0];
          var revisions = result[3][0];
          var stemArticles = result[4][0];
          var cupArticles = result[5][0];

          Ext.getStore(graph).updateGrid(data);
          view.down('#' + graph).show();

          if (stems.length !== 0) {
            var stemDropdown = view.down('#stemDropdown');
            stemDropdown.getStore().loadData(stems);
            //stemDropdown.reset()
          }
          if (cups.length !== 0) {
            var cupDropdown = view.down('#cupDropdown');
            cupDropdown.getStore().loadData(cups);
            //cupDropdown.reset()
          }
          if (revisions.length !== 0) {
            var revisionChoices = view.down('#revisionDropdown');
            revisionChoices.getStore().loadData(revisions);
          }
          if (stemArticles) {
            var articleList = controller.createArticleList(stemArticles, cupArticles);
            var html = '<div class="scw-article-list-panel">' + articleList + '</div>'
            view.down('#articleListPanel').setHtml(html);

            var stemArticlesDropdown = view.down('#stemArticlesDropdown');
            if(view.oldparameters !== view.newparameters || view.oldstems !== view.newstems) {
              stemArticlesDropdown.getStore().loadData(stemArticles)
              stemArticlesDropdown.reset()
            }
          }
          if (cupArticles) {
            var cupArticlesDropdown = view.down('#cupArticlesDropdown');
            if(view.oldparameters !== view.newparameters || view.oldcups !== view.newcups) {
              cupArticlesDropdown.getStore().loadData(cupArticles)
              cupArticlesDropdown.reset()
            }
          }
          if (view.down('#lowerLimit').getValue()) {
            view.down('#' + graph).getAxis(0).setMinimum(parseFloat(view.down('#lowerLimit').getValue()) / 100);
          } else if (graph === 'survival') {
            view.down('#' + graph).getAxis(0).setMaximum(1);
            view.down('#survival').getAxis(0).setMinimum(Math.min(data[data.length - 1].lower, 0.9));
          }
          if (view.down('#upperLimit').getValue()) {
            view.down('#' + graph).getAxis(0).setMaximum(parseFloat(view.down('#upperLimit').getValue()) / 100);
          } else if (graph === 'incidens') {
            view.down('#incidens').getAxis(0).setMinimum(0);
            view.down('#incidens').getAxis(0).setMaximum(data[data.length - 1].upper);
          }
        } else {
          view.down('#articleListPanel').setHtml('<div class="scw-article-list-panel"></div>');
          Ext.getStore(graph).updateGrid([]);
          message.show();
        }
      }
    });
  },

  updateMethod: function () {
    this.getView().down('#lowerLimit').setValue();
    this.getView().down('#upperLimit').setValue();
    this.updateGrid();
  },

  updateStartDate: function () {
    var view = this.getView();
    var startDate = view.down('#startDate').getValue();
    var endDate = view.down('#endDate').getValue();
    if (startDate < new Date('1999-01-01')) view.down('#startDate').setValue(new Date('1999-01-01'));
    if (this.isDifferenceLessThanOneYear()) {
      endDate.setTime(Ext.Date.add(startDate, Ext.Date.YEAR, +1));
      view.down('#endDate').setValue(endDate);
    }
    this.updateGrid();
  },

  updateEndDate: function () {
    var view = this.getView();
    var startDate = view.down('#startDate').getValue();
    var endDate = view.down('#endDate').getValue();
    if (endDate > new Date()) view.down('#endDate').setValue(new Date());
    if (this.isDifferenceLessThanOneYear()) {
      startDate.setTime(Ext.Date.add(endDate, Ext.Date.YEAR, -1));
      view.down('#startDate').setValue(startDate);
    }
    this.updateGrid();
  },

  isDifferenceLessThanOneYear: function () {
    var view = this.getView();
    var startDate = view.down('#startDate').getValue();
    var endDate = view.down('#endDate').getValue();

    return startDate > Ext.Date.add(endDate, Ext.Date.YEAR, -1);
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
    var method = this.getView().down('#methodDropdown').getValue();
    var graph = method === 'KM' ? 'survival' : 'incidens';
    selections.headers = 'Diagnos; Protestyp; Stam; Cup; Revisionstyp; Orsak; Beräkningsmodell; Startdatum; Slutdatum;\n';
    var content = '';
    content += selections.headers;
    content += selections.diagnosis + ';';
    content += selections.protesis + ';';
    content += selections.stem + ';';
    content += selections.cup + ';';
    content += selections.revisiontype + ';';
    content += selections.cause + ';';
    content += selections.method + ';';
    content += Ext.Date.format(selections.startDate, dateFormat) + ';';
    content += Ext.Date.format(selections.endDate, dateFormat) + ';';
    content += '\n\n';

    var dataHeaders = graph === 'survival'
      ? 'Överlevnad; '
      + 'År(tid); Lägre gräns 95% konfidensintervall; '
      + 'Övre gräns 95% konfidensintervall; '
      + 'At risk; Antal reviderade; Konfidens'
      : 'Andel reviderade; '
      + 'Andel avlidna; '
      + 'År(tid); '
      + 'Reviderade - lägre gräns 95% konfidensintervall; '
      + 'Avlidna - lägre gräns 95% konfidensintervall; '
      + 'Reviderade - övre gräns 95% konfidensintervall; '
      + 'Avlidna - övre gräns 95% konfidensintervall; '
      + 'At risk; Revision - Antal händelser; '
      + 'Dödsfall - Antal händelser';
    content += dataHeaders;
    var data = Ext.data.StoreManager.lookup(graph);
    content += '\n';
    for (var i in data.data.items) {
      if (i === '') continue;
      for (var item in data.data.items[i].data) {
        if (item === 'id' || item === 'confidence_death' || item === 'confidence_revision') continue;
        var value = data.data.items[i].data[item];
        content += value + ';';
      }
      content += '\n';
    }
    content += '\n';

    var choices = this.getView().down('#articleListPanel').html
    choices = choices.replace('<div class="scw-article-list-panel">', '')
    choices = choices.replace('</div>', '')
    choices = choices.replace(/<br\/>/g, '');

    content += choices.replace(/Cupar.*/).replace('undefined');
    content += '\n';
    content += choices.replace(/((?!Cupar).)*/).replace('undefined', '');
    content += '\n';

    content = language === 'Swedish' ? content : this.translateContent(content);

    /* Set BOM to let Excel know what the content is */
    content = '\ufeff' + content;
    return content;
  },

  getSelections: function () {
    var selections = {};
    var view = this.getView();
    selections.protesis = view.down('#protesisDropdown').getDisplayValue();
    selections.stem = view.down('#stemDropdown').getDisplayValue();
    selections.cup = view.down('#cupDropdown').getDisplayValue();
    selections.diagnosis = view.down('#diagnosisDropdown').getDisplayValue();
    selections.cause = view.down('#causeDropdown').getDisplayValue();
    selections.method = view.down('#methodDropdown').getDisplayValue();
    selections.revisiontype = view.down('#revisionDropdown').getDisplayValue();
    selections.startDate = view.down('#startDate').getValue();
    selections.endDate = view.down('#endDate').getValue();

    return selections;
  },

  translateContent: function (content) {
    var newContent = content;
    var translations = {
      'Diagnos': 'Diagnosis',
      'Protestyp': 'Type of Prothesis',
      'Stam': 'Stem',
      'Revisionstyp': 'Type of Revision',
      'Orsak': 'Cause',
      'Beräkningsmodell': 'Calculation Method',
      'Överlevnad': 'Survival',
      'Lägre gräns 95% konfidensintervall': 'Lower limit 95% confidence interval',
      'Övre gräns 95% konfidensintervall': 'Upper limit 95% confidence interval',
      'Antal reviderade': 'Number of revised',
      'Konfidens': 'Confidence',
      'Primär artros': 'Primary osteoarthritis',
      'Inflammatorisk ledsjukdom': 'Inflammtory joint disease',
      'Akut trauma, höftfraktur': 'Acute trauma, hip fracture',
      'Följdtillstånd barnsjukdom': 'Sequelae childhood hip disease',
      'Idiopatisk nekros': 'Femoral head necrosis',
      'Följdtillstånd efter trauma/fraktur': 'Sequelae trauma/fracture',
      'Tumör': 'Tumor',
      'Annan sekundär artros': 'Other secondary osteoarthritis',
      'Akut trauma, övriga': 'Acute trauma, others',
      'Övrigt': 'Other',
      'Halv': 'Hemi',
      'Alla företagets': 'Company stems',
      'Andra tillverkare': 'Other manufacturers',
      'Alla förstagångsrevisioner': 'All first time revisions',
      'Första stamrevision': 'First stem revision',
      'Första cuprevision': 'First cup revision',
      'Första revision av annat slag': 'First revision of other than stem or cup',
      'Aseptisk lossning': 'Aseptic loosening',
      'Djup infektion': 'Deep infection',
      'Luxation': 'Dislocation',
      'Alla aseptiska orsaker': 'All aseptic causes',
      'Kumalativ incidens': 'Cumulative incidence',
      'Alla': 'All',
      'År': 'Year',
      'tid': 'time',
      'Startdatum': 'Start Date',
      'Slutdatum': 'End Date',
      'Stammar': 'Stems',
      'Cupar': 'Cups'
    };
    for (var item in translations) {
      newContent = newContent.replace(new RegExp(item + '(?![A-z])', 'g'), translations[item]);
    }
    return newContent;
  },

  exportImage: function () {
    var graph;
    var config;
    var view = this.getView();
    var currentGraph = view.down('#methodDropdown').getValue();

    if (currentGraph === 'KM') {
      config = { filename: 'Implantatoverlevnad', defaultUrl: '/' };
      graph = '#survival';
    } else {
      config = { filename: 'Revision' };
      graph = '#incidens';
    }
    view.down(graph).setSprites({ type: 'text', text: this.createImageLegend(), x: 0, y: 430, height: 30, textAlign: 'left' });
    view.down(graph).redraw();
    view.down(graph).download(config);
    // view.down(graph).setSprites();
    view.down(graph).redraw();
  },

  createImageLegend: function () {
    var selections = this.getSelections();
    var text = '';
    text += 'Diagnos: ' + selections.diagnosis + ', ';
    text += 'Protestyp: ' + selections.protesis + ', ';
    text += 'Stam: ' + selections.stem + ', ';
    text += 'Cup: ' + selections.cup + ', ';
    text += 'Revisionstyp: ' + selections.revisiontype + ', ';
    text += 'Orsak: ' + selections.cause + ', ';
    text += 'Beräkningsmodell: ' + selections.method;
    return text;
  },

  createArticleList: function (stems, cups) {
    var list = 'Stammar:<br/>';
    stems = stems.slice(2)
    for (var item in stems) {
      list += stems[item].article_stem + ', ';
    }
    cups = cups.slice(2)
    list += '<br/><br/>'
    list += 'Cupar:<br/>'
    for (item in cups) {
      list += cups[item].article_cup + ', ';
    }
    return list;
  },


  updateAxes: function () {
    var view = this.getView();
    var graph = view.down('#methodDropdown').getValue() === 'KM' ? 'survival' : 'incidens';
    var data = Ext.getStore(graph).getData().items;
    if (data.length === 0) return;
    if (view.down('#lowerLimit').getValue()) {
      view.down('#' + graph).getAxis(0).setMinimum(parseFloat(view.down('#lowerLimit').getValue()) / 100);
    } else if (graph === 'survival') {
      view.down('#' + graph).getAxis(0).setMaximum(1);
      view.down('#survival').getAxis(0).setMinimum(Math.min(data[data.length - 1].data.lower, 0.9));
    }
    if (view.down('#upperLimit').getValue()) {
      view.down('#' + graph).getAxis(0).setMaximum(parseFloat(view.down('#upperLimit').getValue()) / 100);
    } else if (graph === 'incidens') {
      view.down('#incidens').getAxis(0).setMinimum(0);
      view.down('#incidens').getAxis(0).setMaximum(data[data.length - 1].data.upper);
    }
    view.down('#' + graph).redraw();
  },

  updatePart: function (record, part, code) {
    var newChoices = this.enumerateNewChoices(record, code);
    var addition = this.checkForAdditions(newChoices, part);
    var deletion = this.checkForDeletions(newChoices, part);
    this.oldChoices[part] = newChoices;
    if (addition || deletion) {
      if (!window.event.ctrlKey) {
        var newValue = addition || deletion;
        this.oldChoices[part] = [];
        this.oldChoices[part].push(newValue);
        this.getView().down('#' + part + 'Dropdown').clearValue();
        this.getView().down('#' + part + 'Dropdown').setValue(newValue);
        this.getView().down('#' + part + 'Dropdown').collapse();
      }
    }
    this.updateGrid();
  },

  checkForAdditions: function (record, part) {
    for (var item in record) {
      if (!this.oldChoices[part].includes(record[item])) {
        return record[item];
      }
    }
    return '';
  },

  checkForDeletions: function (record, part) {
    for (var item in this.oldChoices[part]) {
      if (!record.includes(this.oldChoices[part][item])) {
        return this.oldChoices[part][item];
      }
    }
    return '';
  },

  enumerateNewChoices: function (record, code) {
    var newChoices = [];
    for (var item in record) {
      if (item === '') continue;
      newChoices.push(record[item].data[code]);
    }
    return newChoices;
  },

  // IE adds superfluous characters to dates
  stripControlCharacters: function (date) {
    return date.replace(/[^ -~]/g, '');
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

Ext.define('shpr.store.Survival', {
  extend: 'Ext.data.Store',
  alias: 'store.survival',
  storeId: 'survival',

  fields: ['year', 'surv'],
  proxy: {
    type: 'ajax',
    method: 'get',
    cors: true,
    url: '',
    reader: {
      type: 'json',
      rootProperty: 'data'
    }
  },
  updateGrid: function (data) {
    /* Calculate delta values for confidence interval */
    for (var i in data) {
      if (i === '') continue;
      data[i].confidence = data[i].upper - data[i].lower;
    }
    this.loadData(data);
  }
});

Ext.define('shpr.store.Incidens', {
  extend: 'Ext.data.Store',
  alias: 'store.incidens',
  storeId: 'incidens',

  fields: ['year', 'revision', 'death'],
  proxy: {
    type: 'ajax',
    method: 'get',
    cors: true,
    url: '',
    reader: {
      type: 'json',
      rootProperty: 'data'
    }
  },
  updateGrid: function (data) {
    for (var i in data) {
      if (i === '') continue;
      data[i].confidence_death = data[i].upper_death - data[i].lower_death;
      data[i].confidence_revision = data[i].upper_revision - data[i].lower_revision;
    }
    this.loadData(data);
  }
});

Ext.define('shpr.graph.view.Main', {
  extend: 'Ext.container.Container',
  controller: 'graph.main',
  itemId: 'mainView',
  cls: 'scw-main',
  items: [
    {
      xtype: 'label',
      cls: 'scw-header',
      text: 'Implantatöverlevnad avser första revision efter primäroperation. '
        + 'Data inmatad efter senast publicerade årsrapport skall användas '
        + 'med stor försiktighet då den inte är komplett eller validerad. Det är i de flesta av menyerna möjligt att välja flera alternativ samtidigt genom att hålla nere ctrl-knappen när man klickar.'
    },
    {
      xtype: 'container',
      items: [
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
          xtype: 'label',
          cls: 'scw-label',
          text: 'Revisionstyp'
        },
        {
          xtype: 'label',
          cls: 'scw-label',
          text: 'Revisionsorsak'
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
              this.up('#mainView').getController().updateGrid()
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
          xtype: 'rcmultiselect',
          itemId: 'causeDropdown',
          valueField: 'causeCode',
          displayField: 'causeName',
          value: 'alla',
          default: 'alla',
          listeners: {
            update: function(){
              this.up('#mainView').getController().updateGrid()
            }
          },
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
        }
      ]
    },
    {
      xtype: 'container',
      items: [

        {
          xtype: 'label',
          cls: 'scw-label',
          html: 'Stam - artikelgrupp'
        },
        {
          xtype: 'label',
          cls: 'scw-label',
          html: 'Stam - artikel'
        },
        {
          xtype: 'label',
          cls: 'scw-label',
          html: 'Cup - artikelgrupp'
        },
        {
          xtype: 'label',
          cls: 'scw-label',
          html: 'Cup - artikel'
        },
        {
          xtype: 'rcmultiselect',
          itemId: 'stemDropdown',
          valueField: 'P_FemStem_S_StratumCode',
          displayField: 'beskrivning_stam',
          value: 'alla',
          default: 'alla',
          listeners: {
            update: function () {
              this.up('#mainView').getController().updateGrid()
            }
          },
          store: {
            fields: ['P_FemStem_S_StratumCode', 'beskrivning_stam'],
            data: {
              P_FemStem_S_StratumCode: 'alla',
              beskrivning_stam: 'Alla företagets'
            }
          }
        },
        {
          xtype: 'rcmultiselect',
          itemId: 'stemArticlesDropdown',
          valueField: 'article_stem',
          displayField: 'article_stem',
          value: 'Alla',
          default: 'Alla',
          listeners: {
            update: function () {
              this.up('#mainView').getController().updateGrid()
            }
          },
          store: {
            fields: [{
              name: 'article_stem',
              sortType: 'asAllPlacedFirst'
              }],
            data: [
              { article_stem: 'Alla' }
            ],
            
            sorters: [{
              property: 'article_stem',
              direction: 'ASC'
            }]
          }
        },
        {
          xtype: 'rcmultiselect',
          itemId: 'cupDropdown',
          valueField: 'P_AcetCup_C_StratumCode',
          displayField: 'beskrivning_cup',
          value: 'alla',
          default: 'alla',
          listeners: {
            update: function () {
              this.up('#mainView').getController().updateGrid()
            }
          },
          store: {
            fields: ['P_AcetCup_C_StratumCode', 'beskrivning_cup'],
            data: {
              P_AcetCup_C_StratumCode: 'alla',
              beskrivning_cup: 'Alla företagets'
            }
          }
        },
        {
          xtype: 'rcmultiselect',
          itemId: 'cupArticlesDropdown',
          valueField: 'article_cup',
          displayField: 'article_cup',
          value: 'Alla',
          default: 'Alla',
          listeners: {
            update: function () {
              this.up('#mainView').getController().updateGrid()
            }
          },
          store: {
            fields: [{
              name: 'article_cup',
              sortType: 'asAllPlacedFirst'
              }],
            data: [
              { article_cup: 'Alla' }
            ],
            
            sorters: [{
              property: 'article_cup',
              direction: 'ASC'
            }]
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
          html: 'Beräkningsmodell'
            + '<div class="scw-info">'
            + '<div data-qtip="Om implantatet kommer revideras ger Kaplan-Meier kurvan'
            + ' sannolikheten att revisionen inträffar efter en viss tidpunkt.'
            + ' <br/><br/>Kumulativa incidensen ger andelen implantat som reviderats'
            + ' och andelen patienter som dött fram till en viss tidpunkt.">i'
            + '</div></div>'
        },
        {
          xtype: 'label',
          cls: 'scw-label',
          html: ''
        },
        {
          xtype: 'label',
          cls: 'scw-label',
          html: ''
        },
        {
          xtype: 'label',
          cls: 'scw-label',
          html: ''
        },
        {
          xtype: 'rcfilter',
          itemId: 'methodDropdown',
          cls: 'scw-select',
          valueField: 'methodCode',
          displayField: 'methodName',
          value: 'KM',
          sortfield: 'methodName',
          sortdirection: 'DESC',
          selectCallback: 'updateMethod',
          store: {
            fields: ['methodCode', 'methodName'],
            data: [
              { methodCode: 'KI', methodName: 'Kumulativ incidens' },
              { methodCode: 'KM', methodName: 'Kaplan-Meier' }
            ]
          }
        }
      ]
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
      items: [
        {
          xtype: 'datefield',
          width: 320,
          itemId: 'startDate',
          value: Ext.Date.add(new Date(), Ext.Date.YEAR, -1),
          fieldLabel: 'Operationsdatum'
            + '<div class="scw-info">'
            + '<div data-qtip="Avser datum för primäroperation. '
            + 'De datum som väljs måste utgöra en period på minst ett år'
            + ' och ligga i spannet mellan 1999-01-01 och dagens datum.">i'
            + '</div></div>mellan',
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
          xtype: 'textfield',
          itemId: 'lowerLimit',
          width: 175,
          name: 'lowerpercentage',
          fieldLabel: 'Y-axel, undre gräns',
          labelWidth: 130,
          allowBlank: false,
          labelStyle: 'padding: 8px 0 0 0;',
          listeners: {
            change: 'updateAxes'
          }
        },
        {
          xtype: 'textfield',
          itemId: 'upperLimit',
          width: 122,
          name: 'upperpercentage',
          fieldLabel: 'övre gräns',
          labelWidth: 75,
          allowBlank: false,
          labelStyle: 'padding: 8px 0 0 0;',
          listeners: {
            change: 'updateAxes'
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
          text: '&#xf019 Bild',
          cls: 'scw-download-image-button',
          listeners: {
            click: 'exportImage'
          }
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
      xtype: 'cartesian',
      controller: 'graph.main',
      itemId: 'survival',
      width: '100%',
      hidden: true,
      height: 500,
      insetPadding: '20px 40px 30px 20px',
      legend: {
        type: 'sprite'
      },
      store: {
        type: 'survival'
      },
      axes: [{
        type: 'numeric',
        title: 'Implantatöverlevnad',
        fields: ['lower', 'surv', 'upper', 'confidence'],
        position: 'left',
        grid: false,
        renderer: function (axis, label) { return (label * 100).toFixed(1) + '%'; }
      }, {
        type: 'numeric',
        title: 'Tid (år)',
        fields: 'year',
        position: 'bottom',
        grid: false
      }],
      series: [
        {
          title: 'Konfidensintervall',
          xField: 'year',
          type: 'area',
          yField: ['lower', 'confidence'],
          showInLegend: false,
          colors: ['rgba(4,4,4,0)', 'rgba(60, 182, 206, 0.1)'],
          style: {
            strokeOpacity: 0
          },
          highlightCfg: {
            scaling: 2
          }
        },
        {
          title: 'Implantatöverlevnad',
          xField: 'year',
          type: 'line',
          showInLegend: true,
          selectionTolerance: 10,
          yField: 'surv',
          colors: ['#3cb6ce'],
          marker: {
            opacity: 0,
            scaling: 0.01,
            radius: 4,
            animation: {
              duration: 10,
              easing: 'easeOut'
            }
          },
          highlightCfg: {
            opacity: 1,
            scaling: 1
          },
          tooltip: {
            trackMouse: true,
            renderer: function (tooltip, record) {
              var title = record.get('surv') * 100;
              tooltip.setHtml('Implantatöverlevnad: ' + title.toFixed(2) + '%<br/>'
                + 'Tid (år): ' + record.get('year').toFixed(2) + '<br/>'
                + 'Antal reviderade: ' + record.get('n_event') + '<br/>'
                + 'Antal "at risk": ' + record.get('at_risk'));
            }
          }
        }
      ]
    },
    {
      xtype: 'chart',
      controller: 'graph.main',
      itemId: 'incidens',
      width: '100%',
      height: 500,
      insetPadding: '20px 40px 30px 20px',
      legend: {
        type: 'sprite',
        listeners: {
          itemclick: function () {
            /* The line and the confidence area are two separate series, this assures that they are in sync when toggled */
            var chart = this.up().up();
            chart.series[2]._hidden ? chart.series[1].setHidden(true) : chart.series[1].setHidden(false);
            chart.series[3]._hidden ? chart.series[0].setHidden(true) : chart.series[0].setHidden(false);

            /* Reset the maximum value on the Y-axis after changes in what series are shown */
            if (chart.series[2]._hidden) chart.axes[0].setMaximum(chart.series[2].getStore().max('upper_death') * 1.1);
            else if (chart.series[3]._hidden) chart.axes[0].setMaximum(chart.series[2].getStore().max('upper_revision') * 1.1);
            else chart.axes[0].setMaximum(Math.max(chart.series[2].getStore().max('upper_revision'), chart.series[2].getStore().max('upper_death')) * 1.1);
            this.up().up().redraw();
            return true;
          }
        }
      },
      store: {
        type: 'incidens'
      },
      colors: ['#e98300', '#3cb6ce'],
      axes: [{
        type: 'numeric',
        title: 'Incidens',
        fields: ['revision', 'lower_revision', 'upper_revision', 'death', 'lower_death', 'upper_death'],
        position: 'left',
        grid: false,
        renderer: function (axis, label) { return (label * 100).toFixed(1) + '%'; }
      }, {
        type: 'numeric',
        title: 'Tid (år)',
        fields: 'year',
        position: 'bottom',
        grid: false,
        label: {
          rotate: {
            degrees: 0
          }
        }
      }],
      series: [
        {
          title: 'Konfidensintervall, avlidna',
          xField: 'year',
          type: 'area',
          yField: ['lower_death', 'confidence_death'],
          showInLegend: false,
          colors: ['rgba(4,4,4,0)', 'rgba(60, 182, 206, 0.1)'],
          style: {
            strokeOpacity: 0
          },
          highlightCfg: {
            scaling: 2
          }
        },
        {
          title: 'Konfidensintervall, reviderade',
          xField: 'year',
          type: 'area',
          yField: ['lower_revision', 'confidence_revision'],
          showInLegend: false,
          colors: ['rgba(4,4,4,0)', 'rgba(233, 131, 0, 0.1)'],
          style: {
            strokeOpacity: 0
          },
          highlightCfg: {
            scaling: 2
          }
        },
        {
          type: 'line',
          title: 'Revision',
          xField: 'year',
          yField: 'revision',
          style: {
            stroke: '#e98300'
          },
          marker: {
            opacity: 0,
            scaling: 0.01,
            animation: {
              duration: 200,
              easing: 'easeOut'
            }
          },
          highlightCfg: {
            opacity: 1,
            scaling: 1
          },
          tooltip: {
            trackMouse: true,
            renderer: function (tooltip, record) {
              tooltip.setHtml(''
                + 'Andel reviderade: ' + (record.get('revision') * 100).toFixed(2) + '%<br/>'
                + 'Tid (år): ' + record.get('year').toFixed(2) + '<br/>'
                + 'Antal reviderade: ' + record.get('n_event_rev') + '<br/>'
                + 'Antal patienter ”at risk”: ' + record.get('at_risk') + '<br/>');
            }
          }
        },
        {
          type: 'line',
          title: 'Avlidna',
          selectionTolerance: 4,
          xField: 'year',
          yField: 'death',
          style: {
            stroke: '#3cb6ce'
          },
          marker: {
            opacity: 0,
            scaling: 0.01,
            animation: {
              duration: 200,
              easing: 'easeOut'
            }
          },
          highlightCfg: {
            opacity: 1,
            scaling: 1
          },
          tooltip: {
            trackMouse: true,
            renderer: function (tooltip, record) {
              tooltip.setHtml(''
                + 'Andel avlidna: ' + (record.get('death') * 100).toFixed(2) + '%<br/>'
                + 'Tid (år): ' + record.get('year').toFixed(2) + '<br/>'
                + 'Antal avlidna: ' + record.get('n_event_death') + '<br/>'
                + 'Antal patienter ”at risk”: ' + record.get('at_risk') + '<br/>');
            }
          }
        }
      ]
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
    },
    {
      xtype: 'panel',
      title: {
        text: 'Ingående artiklar',
        style: {
          fontSize: '14px',
          color: '#666',
          fontWeight: 'normal'
        }
      },
      header: {
        titlePosition: 1
      },
      itemId: 'articleListPanel',
      collapsed: true,
      collapsible: true,
      hidden: false,
      border: false,
      html: '<div class="scw-article-list-panel"></div>'
    }
  ]
});

Ext.define('Novanti.overrides.chart.legend.SpriteLegend', {
  override: 'Ext.chart.legend.SpriteLegend',


  isXType: function (xtype) {
    return xtype === 'sprite';
  },


  getItemId: function () {
    return this.getId();
  }
});

Ext.application({
  name: 'shpr',
  units: [],
  viewcontrollers: [
    //  'DetailsController'
  ],
  launch: function () {
    var target = (typeof Stratum.containers !== 'undefined') ? Stratum.containers['KRH/Survival'] : 'contentPanel';
    var main = Ext.create('shpr.graph.view.Main', {
      renderTo: target
    });
    if (!window.navigator.msSaveBlob) {
      main.down().next('toolbar').down('#exportTableSwedish').setHref(' ');
      main.down().next('toolbar').down('#exportTableEnglish').setHref(' ');
      // main.down('#exportTableSwedish').setHref(' ');
      // main.down('#exportTableEnglish').setHref(' ');
    }
    main.getController().updateGrid();
    var stemChoices = main.down('#stemDropdown');
    stemChoices.setValue('alla');
    var cupChoices = main.down('#cupDropdown');
    cupChoices.setValue('alla');
    this.addInclude();
    main.getController().oldChoices = {};
    main.getController().oldChoices.stem = ['alla'];
    main.getController().oldChoices.cup = ['alla'];
    main.getController().oldChoices.diagnosis = ['alla'];
    Ext.apply(Ext.QuickTips.getQuickTip(), {
      dismissDelay: 0
    });
  },

  /* eslint no-extend-native: 0 */
  addInclude: function () {
    if (!Array.prototype.includes) {
      Object.defineProperty(Array.prototype, 'includes', {
        value: function (searchElement, fromIndex) {
          if (this === null) {
            throw new TypeError('"this" is null or not defined');
          }

          // 1. Let O be ? ToObject(this value).
          var o = Object(this);

          // 2. Let len be ? ToLength(? Get(O, "length")).
          var len = o.length >>> 0;

          // 3. If len is 0, return false.
          if (len === 0) {
            return false;
          }

          // 4. Let n be ? ToInteger(fromIndex).
          //    (If fromIndex is undefined, this step produces the value 0.)
          var n = fromIndex | 0;

          // 5. If n = 0, then
          //  a. Let k be n.
          // 6. Else n < 0,
          //  a. Let k be len + n.
          //  b. If k < 0, let k be 0.
          var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

          function sameValueZero(x, y) {
            return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
          }

          // 7. Repeat, while k < len
          while (k < len) {
            // a. Let elementK be the result of ? Get(O, ! ToString(k)).
            // b. If SameValueZero(searchElement, elementK) is true, return true.
            if (sameValueZero(o[k], searchElement)) {
              return true;
            }
            // c. Increase k by 1.
            k++;
          }

          // 8. Return false
          return false;
        }
      });
    }
  }
});
