
(function (aProfileName) {
  var container = (Stratum.containers && Stratum.containers['RC/SubjectOverview']) || 'SubjectOverviewContainer';
  var SO = Repository.Local.Methods[isTemplate(aProfileName) ? 'SubjectOverview' : aProfileName];
  var data; // Holds both feed from subject overview and statistics gathered about this data.

  function getSubjectHeading() {
    return [{
      header: 'Person',
      dataIndex: 'SubjectKey',
      width: 120,
      /* locked: true, */
      menuDisabled: true
    }];
  }

  function createFieldName(anIndex) {
    return 'F' + (+anIndex + 1);
  }

  function createGridHeaders() {
    var ha = getSubjectHeading().concat(SO.headingProvider());
    var ih;
    var hc;

    for (ih in ha) {
      hc = ha[ih];
      hc.menuDisabled = true;
      hc.draggable = false;
      if (hc.dataIndex !== 'SubjectKey') {
        hc.dataIndex = createFieldName(ih - 1);
      }
    }
    return ha;
  }

  function loadStyleSheet() {
    Ext.util.CSS.removeStyleSheet('sow');
    Ext.util.CSS.createStyleSheet(''
      + '.so-button-selected { background-color: #707070  !important; border-color: #4c4c4c; } '
      + '.so-button-selected span {  color: #fff !important; } '
      + '.so-button-selected:focus { outline: none; }'
      + '.so-empty-field::placeholder {color: #bbb !important;}'
      + '.so-filter-field input {font-family: "FontAwesome", open_sans}'
      + '.so-filter-field input::placeholder {color: white}'
      + '.so-button .x-btn-glyph { display: none; }'
      + '.so-button .so-visible.x-btn-glyph { display: inline-block; }'
      + '@media print { td { border: 1px solid black; } }',
    'sow');
  }

  function createSummaryRow(aDataset, aCount) {
    this.down('#summary').setText(Ext.String.format(
      '{0} rader av {1} visas',
      aCount.toLocaleString(),
      data.statistics ? data.statistics.total.toLocaleString() : ''
    ));
  }

  function createSummaryBar() {
    var statusRow = SO && SO.statusProvider ? SO.statusProvider : createSummaryRow;

    return Ext.widget('toolbar', {
      dock: 'bottom',
      padding: 5,
      layout: {
        type: 'hbox',
        align: 'stretch'
      },
      items: [{
        xtype: 'label',
        itemId: 'summary',
        text: '?',
        flex: 1
      }],

      setCount: statusRow
    });
  }

  function createDateFilter() {
    var filter = Ext.widget('toolbar', {
      dock: 'top',
      layout: {
        type: 'hbox',
        align: 'stretch'
      },
      filtering: false,
      items: [{
        xtype: 'datefield',
        width: 150,
        itemId: 'fromDate',
        value: Ext.Date.add(new Date(), Ext.Date.YEAR, -1),
        fieldLabel: 'Från',
        labelWidth: 35,
        format: 'Y-m-d',
        altFormats: 'ymd|Ymd',
        listeners: {
          change: function () {
            if (this.up().filtering) return;
            clearTimeButtons();
            this.up().filterStore();
          }
        }
      },
      {
        xtype: 'datefield',
        width: 140,
        itemId: 'toDate',
        value: new Date(),
        fieldLabel: 'Till',
        labelWidth: 25,
        format: 'Y-m-d',
        altFormats: 'ymd|Ymd',
        listeners: {
          change: function () {
            if (this.up().filtering) return;
            clearTimeButtons();
            this.up().filterStore();
          }
        }
      },
      {
        xtype: 'button',
        itemId: 'all',
        cls: 'so-button',
        flex: 1,
        minWidth: 60,
        text: 'Alla',
        glyph: 'xf013@FontAwesome',
        listeners: {
          click: function () {
            this.up().filtering = true;
            this.up().showSpinner(this);
            clearTimeButtons();
            this.up().down('#fromDate').setValue('1900-01-01');
            this.up().down('#toDate').setValue(new Date());
            this.up().filterStore(this.up().hideSpinner, this, 'Alla');
            this.el.addCls('so-button-selected');
            this.up().filtering = false;
          }
        }
      },
      {
        xtype: 'button',
        itemId: 'thisYear',
        cls: 'so-button',
        flex: 1,
        minWidth: 50,
        text: 'Årets',
        listeners: {
          click: function () {
            this.up().filtering = true;

            clearTimeButtons();
            this.up().down('#fromDate').setValue((new Date()).getFullYear() + '0101');
            this.up().down('#toDate').setValue(new Date());
            this.up().filterStore();
            this.el.addCls('so-button-selected');
            this.up().filtering = false;
          }
        }
      },
      {
        xtype: 'button',
        itemId: 'thisMonth',
        cls: 'so-button',
        flex: 1,
        minWidth: 80,
        text: 'Månadens',
        listeners: {
          click: function () {
            this.up().filtering = true;
            clearTimeButtons();
            var date = new Date((new Date()).getFullYear() + '');
            var value = Ext.Date.add(date, Ext.Date.MONTH, (new Date()).getMonth());
            this.up().down('#fromDate').setValue(value);
            this.up().down('#toDate').setValue(new Date());
            this.up().filterStore();
            this.el.addCls('so-button-selected');
            this.up().filtering = false;
          }
        }
      },
      {
        xtype: 'button',
        itemId: 'oneYear',
        flex: 1,
        minWidth: 45,
        text: '1 år',

        cls: 'so-button',
        listeners: {
          click: function () {
            this.up().filtering = true;
            clearTimeButtons();
            var today = new Date();
            var oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            this.up().down('#fromDate').setValue(oneYearAgo);
            this.up().down('#toDate').setValue(today);
            this.up().filterStore();
            this.el.addCls('so-button-selected');
            this.up().filtering = false;
          }
        }
      },
      {
        xtype: 'button',
        itemId: 'printTable',
        flex: 1,
        autoEl: {
          tag: 'a',
        },
        minWidth: 65,
        text: 'Skriv ut',
        listeners: {
          click: function () {
            printTable();
          }
        }
      },
      {
        xtype: 'button',
        itemId: 'exportTable',
        flex: 1,
        minWidth: 80,
        autoEl: {
          tag: 'a',
          download: 'registreringar.csv',
        },
        text: 'Ladda ner',
        listeners: {
          click: function () {
            exportTable();
          }
        }
      }],

      showSpinner: function (button) {
        var icons = Ext.query('#' + button.id + ' .x-btn-glyph');
        if (!icons) return;
        var icon = icons[icons.length - 1];
        var classes = icon.getAttribute('class');
        classes += ' fa-spin so-visible';
        icon.setAttribute('class', classes);
        button.setText('');
      },

      hideSpinner: function (button, text) {
        var icons = Ext.query('#' + button.id + ' .x-btn-glyph');
        if (!icons) return;
        var icon = icons[icons.length - 1];
        var classes = icon.getAttribute('class');
        classes = classes.replace(' fa-spin so-visible', '');
        icon.setAttribute('class', classes);
        button.setText(text);
      },

      filterStore: function (aCallback, button, text) {
        var store = Ext.data.StoreManager.lookup('overviewStore');
        var fromDate = this.down('#fromDate').getValue().toISOString();
        var toDate = this.down('#toDate').getValue().toISOString();

        Ext.Function.defer(function () {
          store.loadData(createStoreFeed(data.feed, fromDate, toDate));

          if (aCallback) {
            aCallback(button, text);
          }
        }, 10);
      }
    });
    if (!window.navigator.msSaveBlob) {
      filter.down('#exportTable').setHref(' ');
    }
    return filter;
  }

  function clearTimeButtons() {
    var buttons = Ext.ComponentQuery.query('button[cls=so-button]');
    for (var button in buttons) {
      if (buttons[button].el.dom != null) {
        buttons[button].removeCls('so-button-selected');
      }
    }
  }

  function createTimeFilter() {
    var dn = new Date();
    var lo = Ext.Date.format(Ext.Date.add(dn, Ext.Date.YEAR, -1), 'Y-m-d');
    var hi = Ext.Date.format(dn, 'Y-m-d');

    return Ext.widget('toolbar', {
      dock: 'top',
      padding: 5,
      layout: {
        type: 'vbox',
        align: 'stretch'
      },
      items: [{
        xtype: 'dateslider',
        itemId: 'timeline',
        minDate: lo,
        maxDate: hi,
        values: [lo, hi],
        listeners: {
          changecomplete: function () {
            this.up('toolbar').filterStore();
          }
        }
      }, {
        xtype: 'container',
        layout: 'hbox',
        items: [{
          xtype: 'label',
          itemId: 'minlabel',
          text: '?',
          flex: 1
        }, {
          xtype: 'label',
          itemId: 'maxlabel',
          text: '?',
          style: 'text-align: right',
          flex: 1
        }]
      }],
      listeners: {
        loaded: function () {
          var tl = this.down('#timeline');
          var ll = this.down('#minlabel');
          var hl = this.down('#maxlabel');

          this.filterStore(function () {
            if (data.statistics.grand) {
              tl.setMinDate(data.statistics.minDate);
              tl.setMaxDate(data.statistics.maxDate);
              ll.setText(data.statistics.minDate);
              hl.setText(data.statistics.maxDate);
            }
          });
          if (SO.defaultSort) {
            var store = Ext.data.StoreManager.lookup('overviewStore');
            store.model.getField(SO.defaultSort.property).sortType = SO.defaultSort.sortType;
            store.sort(SO.defaultSort.property, SO.defaultSort.direction);
          }
          if (SO.defaultPeriod) {
            var periods = {
              Alla: '#all',
              Årets: '#thisYear',
              Månadens: '#thisMonth',
              '1 år': '#oneYear'
            };
            var elements = Ext.ComponentQuery.query(periods[SO.defaultPeriod]);
            elements[elements.length - 1].fireEvent('click');
          }
        }
      },

      filterStore: function (aCallback) {
        var sc = Ext.data.StoreManager.lookup('overviewStore');
        var tl = this.down('#timeline');
        var low = tl.getLoValue() + 'T00:00:00'; // Time part is needed to include same day.
        var high = tl.getHiValue() + 'T23:59:59'; // Ditto for upper date limit.

        tl.setLoading('Filtrerar ...');
        Ext.Function.defer(function () { // To make loading mask show.
          sc.loadData(createStoreFeed(data.feed, low, high));
          tl.setLoading(false);
          if (aCallback) {
            aCallback();
          }
        }, 10);
      }

    });
  }

  function createFilterFields() {
    var ha = getSubjectHeading().concat(SO.headingProvider());
    var hc;
    var ih;
    var fn;

    function processKeys(aField) {
      var gp = aField.up('toolbar');
      var sc = Ext.data.StoreManager.lookup('overviewStore');
      var fv = aField.getValue() || undefined; // To match undefined lastQuery.
      var fd = aField.getName().replace('filter', '');
      var fa = Ext.Array.filter(sc.getFilters().items, function (aFilter) { return aFilter.getId() !== fd; }); // To reinstall all filters except the current one.

      if (fv !== aField.lastQuery) {
        gp.setLoading('Filtrerar ...');
        Ext.Function.defer(function () { // Defer to make loading mask show.
          sc.clearFilter();
          if (fv) {
            fa.push({
              id: fd,
              property: fd,
              value: fv,
              anyMatch: true,
              root: 'data'
            });
          }
          if (fa.length > 0) {
            sc.filter(fa);
          }
          gp.setLoading(false);
        }, 10);
      }
      aField.lastQuery = fv;
    }

    for (ih in ha) {
      hc = ha[ih];
      hc.name = 'filter' + (+ih === 0 ? 'SubjectKey' : createFieldName(ih - 1));
      hc.xtype = 'textfield';
      hc.emptyText = '\uF002';
      hc.emptyCls = 'so-empty-field';
      hc.cls = 'so-filter-field';
      hc.style = 'margin: 0;';
      hc.enableKeyEvents = true;
      fn = new Ext.util.DelayedTask();
      hc.listeners = {
        keyup: function (aField) {
          fn.delay(0, processKeys, this, [aField]);
        }
      };
      delete hc.header;
    }
    return Ext.widget('toolbar', {
      dock: 'top',
      padding: 0,
      items: ha
    });
  }

  function createStoreFields() {
    var ha = SO.headingProvider();
    var fa = ['SubjectKey'];
    for (var ih in ha) {
      fa.push(createFieldName(ih));
    }
    return fa;
  }

  function createStoreFilters() {
    var ha = SO.headingProvider();
    var fa = [{ property: 'SubjectKey', value: '' }];
    for (var ih in ha) {
      fa.push({
        property: createFieldName(ih),
        value: ''
      });
    }
    return fa;
  }
  function printTable() {
    var grid = Ext.ComponentQuery.query('#dataPanel').pop().el;
    grid.el.component.print();
  }
  function exportTable() {
    var tag = Ext.ComponentQuery.query('#exportTable')[Ext.ComponentQuery.query('#exportTable').length - 1].el.dom;
    if (!tag) return;

    var content = createContentToDownload();
    var blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);

    /* IE downloads directly, use the download attribute for others */
    if (window.navigator.msSaveBlob) {
      window.navigator.msSaveBlob(blob, 'registreringar.csv');
    } else {
      tag.setAttribute('href', url);
    }
  }

  function createContentToDownload() {
    var content = '';
    var headers = Ext.ComponentQuery.query('#dataPanel')[Ext.ComponentQuery.query('#dataPanel').length - 1];
    for (var column in headers.el.component.columns) {
      content += headers.el.component.columns[column].titleEl.component.initialConfig.header + ';';
    }
    content += '\n';
    var store = Ext.data.StoreManager.lookup('overviewStore');
    for (var i in store.data.items) {
      content += store.data.items[i].data.SubjectKey.substring(8, 21) + ';';
      for (var item in store.data.items[i].data) {
        if (Ext.String.startsWith(item, 'F')) {
          var value = store.data.items[i].data[item].replace(/<span.*?>/, '').replace('</span>', '').replace('&nbsp', ' ');
          content += value + ';';
        }
      }
      content += '\n';
    }
    // Set BOM to let Excel know what the content is
    content = '\ufeff' + content;
    return content;
  }

  function createStoreFeed(anOverview, aMinDate, aMaxDate) {
    var gf = SO.repeatingLevel;
    var ef = Repository.Global.Methods.EncryptNIN || function (x) { return x; };
    var oa = [];
    var lo = '9'; // Higher than any date string in ISO8601 format;
    var hi = '0'; // Ditto for lowest;
    var cr = 0;
    var cg = 0;
    var sk;
    var ro;
    var ie;
    var rc;
    var rs;
    var filterDate = SO.filterDate ? SO.filterDate : 'ModifiedAt';
    if (gf) {
      for (sk in anOverview) {
        ro = anOverview[sk];
        for (ie in ro) {
          cg += 1;
          if (ro[ie].FormName === gf) {
            cr += 1;
            rc = ro[ie];
            if (rc[filterDate] >= aMinDate && rc[filterDate] < aMaxDate) {
              rs = SO.contentProvider(anOverview[sk], +ie, sk);
              if (rs) {
                oa.push(['<a rel="' + sk + '" href="#!subject?key=' + ef(sk) + '">' + sk + '</a>'].concat(rs));
              }
            }
            if (hi < rc[filterDate]) {
              hi = rc[filterDate];
            }
            if (lo > rc[filterDate]) {
              lo = rc[filterDate];
            }
          }
        }
      }
    } else {
      for (sk in anOverview) {
        rs = SO.contentProvider(anOverview[sk], +ie, sk);
        if (rs) {
          oa.push(['<a rel="' + sk + '" href="#!subject?key=' + ef(sk) + '">' + sk + '</a>'].concat(rs));
        }
        cr += 1;
        for (ie in ro) {
          cg += 1;
          if (hi < rc[filterDate]) {
            hi = rc[filterDate];
          }
          if (lo > rc[filterDate]) {
            lo = rc[filterDate];
          }
        }
      }
    }
    // Assign statistics here so when don't have to traverse again (unpleasant side-effect due to optimization).
    if (!data.statistics) {
      data.statistics = {
        total: cr,
        grand: cg,
        minDate: cr ? lo.substring(0, lo.indexOf('T')) : null,
        maxDate: cr ? hi.substring(0, hi.indexOf('T')) : null
      };
    }
    return oa;
  }

  if (!SO || !SO.beforeProcess || !SO.headingProvider || !SO.contentProvider) {
    Ext.fly(container).update('<div class="Closeable Warning">Registreringsöversikt är inte upplagd för detta register eller är felaktigt konfigurerad. Kontakta registrets konfiguratör.</div>');
    return;
  }

  SO.beforeProcess(function () {
    var tl = createTimeFilter();
    var  bs = createSummaryBar();
    var  ff = createFilterFields();
    var  dateFilter = createDateFilter();
    var  afterrender = SO.afterProcess ? SO.afterProcess : function () { };

    Ext.create('Ext.grid.Panel', {
      renderTo: container,
      border: true,
      itemId: 'dataPanel',
      store: {
        id: 'overviewStore',
        fields: createStoreFields(),
        listeners: {
          filterchange: function (aStore) {
            bs.setCount(data, aStore.count());
          },
          datachanged: function (aStore) {
            bs.setCount(data, aStore.count());
          }

        }
      },
      dockedItems: [dateFilter, ff, bs],
      columns: createGridHeaders(),
      emptyText: 'Inga data finns med dessa sökvillkor.',
      columnLines: true,
      rowLines: true,
      enableColumnHide: false,
      enableLocking: false,
      print: function () {
        var headings = '';
        var rows = '';
        for (var column in this.columns) {
          headings += '<th>' + this.columns[column].titleEl.component.initialConfig.header + '</th>';
        }
        for (var i in this.store.data.items) {
          rows += '<tr><td>' + this.store.data.items[i].data.SubjectKey.substring(8, 21) + '</td>';
          for (var item in this.store.data.items[i].data) {
            if (Ext.String.startsWith(item, 'F')) {
              rows += '<td>' + this.store.data.items[i].data[item].replace(/<span.*?>/, '').replace('</span>', '') + '</td>';
            }
          }
          rows += '</tr>';
        }
        var html = new Ext.XTemplate(
          '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
          '<html>',
          '<head>',
          '<meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />',
          '<title>Filtrerade registreringar</title>',
          '<style>body { -webkit-print-color-adjust: exact; } table { width: 100%; border-collapse: collapse; } th {text-align: left; border-bottom: 1px solid #ccc} tr:nth-child(even) {background-color: #EEE;} tr:nth-child(odd) {background-color: #FFF} td {border-bottom: 1px solid #ccc; padding: 5px;}</style>',
          '</head>',
          '<body>',
          '<table>',
          headings,
          rows,
          '</table>',
          '</body>',
          '</html>'
        ).apply(data);

        var win = window.open('', 'printgrid');
        win.document.write(html);
        win.document.close();
        win.focus();
        win.print();
        win.close();
      },
      listeners: {
        boxready: function () {
          var me = this;
          me.setLoading('Hämtar data ...');
          Ext.Ajax.request({
            url: '/stratum/api/overview/subject',
            method: 'get',
            success: function (r) {
              data = {
                feed: Ext.decode(r.responseText).data
              };
              me.setLoading(false);
              tl.fireEvent('loaded'); // Timeline toolbar is responsible for populating the grid store.
            },
            failure: function () {
              me.setLoading(false);
            }
          });
        },
        columnresize: function (aContainer, aColumn, aWidth) {
          var tf = ff.query('[name=filter' + aColumn.dataIndex + ']');
          tf[0].flex = undefined;
          tf[0].setWidth(aWidth);
        },
        afterrender: afterrender
      }
    });
  });
  loadStyleSheet();
})('{{Profile}}');
//! Generisk registreringsöversikt som i listform visar ett fast antal filtrerbara och sorterbara värden från samtliga registreringar på aktuell vårdenhet
