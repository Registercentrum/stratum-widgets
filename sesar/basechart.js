
Ext.define('Sesar.chart.Time', {
  extend: 'Ext.chart.CartesianChart',
  xtype: 'sesartime',
  cls: 'sesar-timechart',
  border: false,
  colors: ['#DD4C39', '#0791AB'],
  padding: '10 0 0 0',
  insetPadding: '0 35 20 10',
  touchAction: {
    panY: true,
  },
  innerPadding: {
    top: 10,
    left: 10,
    right: 10,
    bottom: 10
  },
  legend: {
    type: 'dom'
  },
  store: {
    data: [],
  },
  axes: [{
    type: 'numeric',
    title: {
      text: '',
    },
    titleMargin: 20,
    position: 'left',
    fields: ['Clinic_Mean', 'State_Mean'],
    style: {
      strokeStyle: '#9aa8bc',
      axisLine: false
    },
    label: {
      strokeOpacity: 0.2,
      fillStyle: '#9aa8bc'
    },

    renderer: function (axis, label, context, previous) {
      var precision = axis.getChart().precision || 0
      if (axis.getChart().usePercentages) {
        return (label * 100).toFixed(precision) + '%'
      }
      return label.toFixed(precision)
    }
  },
  {
    type: 'category',
    position: 'bottom',
    fields: 'Year',
    style: {
      strokeStyle: '#9aa8bc',
      axisLine: false
    },
    label: {
      fillStyle: '#9aa8bc',
      strokeOpacity: 0.2,
    },
  }],
  series: [
    {
      type: 'line',
      title: 'Kliniken',
      xField: 'Year',
      yField: 'Clinic_Mean',
      useDarkerStrokeColor: false,
      style: {
        lineWidth: 4,
      },
      marker: {
        type: 'circle',
        size: 4,
        radius: 7,
        fillOpacity: 1,
        'stroke-width': 3,
        strokeStyle: '#fff'
      },
      tooltip: {
        style: {
          backgroundColor: '#DD4C39',
          borderColor: '#DD4C39',
        },
        autoHide: true,
        dismissDelay: 0,
        renderer: function (tooltip, record, context) {
          var text = record.get('Clinic_Numerator')
          text = text === 'NA' ? 'För få uppgifter för att visa' : text
          return tooltip.setHtml('Antal: ' + text)
        }
      }
    },
    {
      type: 'line',
      title: 'Riket',
      xField: 'Year',
      yField: 'State_Mean',
      useDarkerStrokeColor: false,
      style: {
        lineWidth: 4
      },
      marker: {
        type: 'circle',
        size: 4,
        radius: 7,
        fillOpacity: 1,
        'stroke-width': 3,
        strokeStyle: '#fff'
      },
      tooltip: {
        style: {
          backgroundColor: 'rgb(25, 149, 173)',
          borderColor: 'rgb(25, 149, 173)'
        },
        autoHide: true,
        dismissDelay: 0,
        renderer: function (tooltip, record, context) {
          return tooltip.setHtml('Antal: ' + record.get('State_Denominator'))
        }
      }
    }
  ]
})

Ext.define('Sesar.chart.AgeGroups', {
  extend: 'Ext.chart.CartesianChart',
  xtype: 'sesarage',
  touchAction: {
    panY: true,
  },
  border: false,
  colors: ['#E388BE', '#83D6F5'],
  colors: ['#DD4C39', '#0791AB'],
  padding: '10 0 0 0',
  innerPadding: {
    top: 10,
    right: 10,
    bottom: 10
  },

  insetPadding: '0 35 20 10',
  cls: 'sesar-timechart',
  legend: {
    type: 'dom'
  },
  border: false,
  store: {
    data: [],
  },
  axes: [{
    type: 'numeric',
    position: 'left',
    titleMargin: 20,
    style: {
      strokeStyle: '#9aa8bc',
      axisLine: false
    },
    label: {
      strokeOpacity: 0.2,
      fillStyle: '#9aa8bc'
    },

    renderer: function (axis, label, context, previous) {
      var precision = axis.getChart().precision || 0
      if (axis.getChart().usePercentages) {
        return (label * 100).toFixed(precision) + '%'
      }
      return label.toFixed(precision)
    }
  },
  {
    type: 'category',
    position: 'bottom',
    fields: ['Agegroups'],
    style: {
      strokeStyle: '#9aa8bc',
      axisLine: false
    },
    label: {
      fillStyle: '#9aa8bc',
      strokeOpacity: 0.2,
    },
  }],
  series: [
    {
      type: 'bar',
      title: ['Kliniken', 'Riket'],
      stacked: false,
      xField: 'Agegroups',
      yField: ['Clinic_Mean', 'State_Mean'],
      useDarkerStrokeColor: false,
      style: {
        lineWidth: 4,
        maxBarWidth: 40
      },
      tooltip: {
        renderer: function (tooltip, record, context) {
          var field = context.field.replace(/_[A-z]*/, '')
          var text = record.get(field + '_Numerator')
          text = text === 'NA' ? 'För få uppgifter för att visa' : text
          if (field === 'State') {
            tooltip.setUserCls('sesar-tooltip-blue')
          } else {
            tooltip.setUserCls('sesar-tooltip-red')
          }
          return tooltip.setHtml('Antal: ' + text)
        }
      }
    }
  ]
})

Ext.define('Sesar.chart.Comparison', {
  extend: 'Ext.chart.CartesianChart',
  xtype: 'sesarcomparison',
  touchAction: {
    panY: true,
  },
  border: false,
  background: '#ccc',
  colors: ['#E388BE', '#83D6F5'],
  callout: 'none',
  padding: '10 0 0 0',
  innerPadding: {
    top: 10,
    left: 10,
    right: 40,
    bottom: 0
  },
  insetPadding: '0 5 20 0',
  cls: 'sesar-timechart',
  border: false,
  store: {
    data: [],
    sorters: []
  },
  flipXY: true,
  axes: [
    {
      type: 'numeric',
      position: 'bottom',
      fields: ['Mean'],
      style: {
        strokeStyle: '#9aa8bc',
        axisLine: false
      },
      label: {
        strokeOpacity: 0.2,
        fillStyle: '#9aa8bc'
      },

      renderer: function (axis, label, context, previous) {
        var precision = axis.getChart().precision || 0
        if (axis.getChart().usePercentages) {
          return (label * 100).toFixed(precision) + '%'
        }
        return label.toFixed(precision)
      }
    },
    {
      type: 'category',
      position: 'left',
      fields: ['UnitName'],
      style: {
        strokeStyle: '#9aa8bc',
        axisLine: false
      },
      label: {
        fillStyle: '#9aa8bc',
        strokeOpacity: 0.2,
      },
    }],
  series: [
    {
      type: 'bar',
      title: 'Kliniken',
      xField: 'UnitName',
      yField: 'Mean',
      colors: ['#26879B'],
      useDarkerStrokeColor: false,
      label: {
        display: 'outside',
        color: '#333',
        field: 'Mean',
        calloutColor: 'none',
        renderer: function (text, sprite, config, rendererData, index) {
          var chart = this.getChart()
          var precision = chart.precision || 0
          if (chart.usePercentages) {
            return typeof text === 'number' ? (text * 100).toFixed(precision) + '%' : ''
          }
          return typeof text === 'number' ? text.toFixed(precision) : ''
        }
      },
      style: {
        lineWidth: 4,
        maxBarWidth: 20
      },

      renderer: function (sprite, config, rendererData, index) {
        var record = rendererData.store.getAt(index)
        if(record && record.data.Mean === 'NA') {
           return {
            fillStyle: '#26000',
            stroke: '#260000'
          }
        } else if(record && record.data.UnitCode === 'NA'){
          return {
            fillStyle: '#FED766',
            stroke: '#FED766'
          }
        } else if (record && record.data.UnitCode === this.getChart().up('#mainView').getController().filters.clinic) {
          return {
            fillStyle: '#DD4C39',
            stroke: '#DD4C39'
          }
        } else {
          return {
            fillStyle: '#26879B',
            stroke: '#26879B'
          }
        }
      },
      tooltip: {
        renderer: function (tooltip, record, context) {
          tooltip.setHtml('Antal: ' + record.get('Denominator'))
          if (record && record.data.UnitCode === this.getChart().up('#mainView').getController().filters.clinic) {
            tooltip.setUserCls('sesar-tooltip-red')
          } else if (record && record.data.UnitCode === 'NA') {
            tooltip.setUserCls('sesar-tooltip-yellow')
          } else {
            tooltip.setUserCls('sesar-tooltip-blue')
          }
          return
        }
      }
    }
  ]
})

Ext.define('Sesar.controller.Main', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.main',

  updateCharts: function (tab) {
    var chart, url
    var controller = this
    var view = this.getView()
    var isTabChange = typeof tab === 'string'
    var report = view.down('#reportFilter').getValue()
    var sex = view.down('#sexFilter').getValue()
    var clinic = view.down('#clinicFilter').getValue()
    var startyear = view.down('#startyearFilter').getDisplayValue()
    var endyear = view.down('#endyearFilter').getDisplayValue()
    var clinicName = view.down('#clinicFilter').getDisplayValue()

    !Ext.Object.isEmpty(Ext.Ajax.requests) && Ext.Ajax.abort(controller.currentRequest)

    if (!isTabChange) {
      controller.status = { time: false, age: false, comparison: false }
    }

    controller.tab = typeof tab === 'string' && tab || controller.tab
    controller.filters = { start: startyear, end: endyear, report: report, sex: sex, clinic: clinic, clinicName: clinicName || (Profile.Context && Profile.Context.Unit.UnitName) }

    switch (controller.tab) {
      case 'time':
        controller.updateData(controller.tab, 'clinics-over-time', view, controller)
        break
      case 'age':
        controller.updateData(controller.tab, 'clinics', view, controller)
        break
      case 'comparison':
        controller.updateData(controller.tab, 'allclinics', view, controller)
        break
    }
  },

  updateData: function (tab, type, view, controller) {
    if (this.status[tab]) {
      this.updateProgress(false)
      return
    }
    chart = view.down('sesar' + tab)
    url = this.createUrl(type, this.filters)
    url = tab === 'comparison' ? url.replace(/&clinic=[A-z0-9]*/, '') : url
    tab === 'comparison' && chart.setHeight(400) && chart.getStore().setSorters([this.sortAsc]) && chart.getStore().loadData({})
    this.fetchData(chart, url, this.filters.report, controller, tab)
    this.updateProgress(true)
  },

  updateProgress: function (run) {
    var progress = this.getView().down('progressbar')
    progress.reset()
    run && progress.wait({
      interval: 100,
      duration: 3000,
      increment: 30
    })
  },

  fetchData: function (chart, url, report, controller, tab) {
    controller.currentRequest = Ext.Ajax.request({
      type: 'ajax',
      method: 'get',
      cors: true,
      url: url,
      success: function (response) {
        var result = Ext.decode(response.responseText).data
        var config = controller.reportConfigs[report]
        var captions = Ext.clone(controller.defaultTexts)
        captions.header.text = config.caption
        captions.subheader.text = config.subcaption
        chart.usePercentages = config.percentage
        chart.precision = config.precision || 0
        chart.setCaptions(Ext.Object.merge({},controller.captions, captions))
        tab === 'comparison' && chart.setHeight(result.length*28+50)
        chart.getStore().loadData(result)
        controller.status[tab] = true
      }
    })
  },

  createUrl: function (type, filters) {
    return '/stratum/api/statistics/sesar/sesarw-publicstatistics-' + type + '?startyear=' + filters.start + '&stopyear=' + filters.end + '&indicator=' + filters.report + '&sex=' + filters.sex + '&clinic=' + filters.clinic + '&apikey=KbxAwmlwLM4='
  },
  defaultTexts: {
    header: {
      text: ' '
    },
    subheader: {
      text: ' '
    },
    about: {
      text: ' '
    }
  },

  captions: {
    header: {
      text: ' ',
      docked: 'top',
      align: 'center',
      style: {
        fontSize: 18,
        fontWeight: 'normal',
        fontFamily: 'open_sans',
        color: 'darkslategrey',
      }
    },
    subheader: {
      text: ' ',
      docked: 'top',
      align: 'center',
      style: {
        fontSize: 18,
        fontWeight: 'normal',
        fontFamily: 'open_sans',
        color: 'darkslategrey'
      }
    },
    about: {
      text: ' ',
      docked: 'bottom',
      align: 'center',
      style: {
        fontSize: 12,
        fontWeight: 'lighter',
        fontFamily: 'open_sans',
        color: 'darkslategrey'
      }
    },
  },

  reportConfigs: {
    eval: { caption: 'Väntetider från remiss till diagnos', subcaption: 'medelvärde antal dagar', axis: 'dagar', precision: 0, percentage: false },
    cpap: { caption: 'Väntetider från diagnos till terapistart CPAP', subcaption: 'medelvärde antal dagar', axis: 'dagar', precision: 0, percentage: false },
    apne: { caption: 'Väntetider från diagnos till terapistart apnébettskena', subcaption: 'medelvärde antal dagar', axis: 'dagar', precision: 0, percentage: false },
    ahi: { caption: 'Genomsnittligt AHI vid utredningsbesök', subcaption: '.', axis: 'index', precision: 1, percentage: false },
    odi: { caption: 'Genomsnittligt ODI vid utredningsbesök', subcaption: '.', axis: 'index', precision: 1, percentage: false },
    ess: { caption: 'Självskattad dagsömnighet (ESS)', subcaption: 'vid utredningsbesök', axis: 'index', precision: 1, percentage: false },
    severe_osa: { caption: 'Andel patienter med svår sömnapné', subcaption: 'vid utredningsbesök', axis: 'andel', precision: 0, percentage: true },
    mild_osa: { caption: 'Andel patienter med mild sömnapné', subcaption: 'vid utredningsbesök', axis: 'andel', precision: 0, percentage: true },
    cardiovascular: { caption: 'Andel patienter med kardiovaskulär', subcaption: 'sjukdom vid utredningsbesök', axis: 'andel', precision: 0, percentage: true },
    metabol: { caption: 'Andel patienter med metabol sjukdom ', subcaption: 'vid utredningsbesök', axis: 'andel', precision: 1, percentage: true },
    prespiratory: { caption: 'Andel patienter med respiratorisk', subcaption: 'sjukdom vid utredningsbesök', axis: 'andel', precision: 1, percentage: true },
    psyk: { caption: 'Andel patienter med psykisk', subcaption: 'sjukdom vid utredningsbesök', axis: 'andel', precision: 0, percentage: true },
    cpap_severe_osa: { caption: 'Andel patienter som rekommenderats', subcaption: 'CPAP vid svår sömnapné (AHI>=30)', axis: 'andel', precision: 0, percentage: true },
    apne_mild_osa: { caption: 'Andel patienter som rekommenderats', subcaption: 'apnébettskena vid mild sömnapné (AHI 5 - <15)', axis: 'andel', precision: 0, percentage: true },
    weight: { caption: 'Andel patienter med BMI >= 30 som rekommenderats', subcaption: 'aktiv överviktsbehandling', axis: 'andel', precision: 0, percentage: true },
    mandfix: { caption: 'Mandibulär framskjutning av', subcaption: 'apnébettskena, medelvärde (mm)', axis: 'mm', precision: 1, percentage: false },
    apnetype: { caption: 'Andel av apnébettskenor', subcaption: 'som är tvådelade (bitblock)', axis: 'förändring', precision: 0, percentage: true },
    ESSchange_CPAP: { caption: 'Genomsnittlig förändring av ESS för', subcaption: 'patienter behandlade med CPAP', axis: 'förändring', precision: 1, percentage: false },
    ESSchange_apne: { caption: 'Genomsnittlig förändring av ESS för', subcaption: 'patienter behandlade med apnébettskena', axis: 'förändring', precision: 1, percentage: false },
    four: { caption: 'Andel patienter med CPAP som använder den', subcaption: '>=  4 timmar per natt', axis: 'andel', precision: 0, percentage: true }
  },

  sortDesc: function (a, b) {
    if(a.data.Mean === 'NA') return -1
    if(b.data.Mean === 'NA') return 1
    return a.data.Mean-b.data.Mean       
  },

  sortAsc: function (a, b) {
    if(a.data.Mean === 'NA') return -1
    if(b.data.Mean === 'NA') return 1
    return b.data.Mean-a.data.Mean       
  },

  dirtyTabs: { time: true, age: true, comparison: true }
})

Ext.define('Sesar.view.Filter', {
  extend: 'Ext.form.field.ComboBox',
  xtype: 'sesarfilter',
  alias: 'view.sesarfilter',
  cls: 'sesar-select',
  labelWidth: 65,
  editable: Ext.is.Phone ? false : true,
  forceSelection: false,
  typeAhead: true,
  queryMode: 'local',
  minChars: 1,
  anyMatch: true,
  autoSelect: false,
  caseSensitive: false,
  checkChangeEvents: ['change', 'keyup'],
})

Ext.define('Sesar.view.Main', {
  extend: 'Ext.container.Container',
  alias: 'view.main',
  controller: 'main',
  itemId: 'mainView',
  items: [
    {
      xtype: 'panel',
      padding: '0 6 0 0',
      layout: 'vbox',
      style: {
        marginBottom: Ext.is.Phone ? '0px' : '0px'
      },
      border: false,
      items: [
        {
          xtype: 'sesarfilter',
          itemId: 'reportFilter',
          displayField: 'ValueName',
          valueField: 'ValueCode',
          fieldLabel: 'Rapport:',
          width: '99%', 
          labelStyle: 'text-align: right;',
          labelWidth: 65,
          value: widgetConfig.selected,
          listConfig: {
            maxHeight: 600
          },
          listeners: {
            beforeselect: function () { var disabled = arguments[1].getData().Category === true; return !disabled },
            select: 'updateCharts'
          },
          
          htmlEncode: true,
          store: {
            fields: ['ValueCode', 'ValueName'],
            filters: [
              function(item) {
                return widgetConfig.category === item.data.Category
              }
            ],
            data: [
              { ValueName: 'Väntetider till sömnapnédiagnos', ValueCode: 'eval', Category: 'WaitingPeriods' },
              { ValueName: 'Väntetider till CPAP-start', ValueCode: 'cpap', Category: 'WaitingPeriods' },
              { ValueName: 'Väntetider till apnébettskena-start', ValueCode: 'apne', Category: 'WaitingPeriods' },
              { ValueName: 'Antal andningsstörningar/timme (AHI)', ValueCode: 'ahi', Category: 'ExaminationResults' },
              { ValueName: 'Antal desaturationer/timme (ODI)', ValueCode: 'odi', Category: 'ExaminationResults' },
              { ValueName: 'Självskattad dagsömnighet (ESS)', ValueCode: 'ess', Category: 'ExaminationResults' },
              { ValueName: 'Andel med svår sömnapné', ValueCode: 'severe_osa', Category: 'ExaminationResults' },
              { ValueName: 'Andel med mild sömnapné', ValueCode: 'mild_osa', Category: 'ExaminationResults' },
              { ValueName: 'Andel med kardiovaskulär sjukdom', ValueCode: 'cardiovascular', Category: 'ExaminationResults' },
              { ValueName: 'Andel med metabol sjukdom', ValueCode: 'metabol', Category: 'ExaminationResults' },
              { ValueName: 'Andel med respiratorisk sjukdom', ValueCode: 'prespiratory', Category: 'ExaminationResults' },
              { ValueName: 'Andel med psykisk sjukdom', ValueCode: 'psyk', Category: 'ExaminationResults' },
              { ValueName: 'Andel som rekommenderats CPAP vid svår sömnapné (AHI >= 30)', ValueCode: 'cpap_severe_osa', Category: 'TherapyChoice' },
              { ValueName: 'Andel som rekommenderats apnébettskena vid mild sömnapné (AHI 5 - <15)', ValueCode: 'apne_mild_osa', Category: 'TherapyChoice' },
              { ValueName: 'Andel med BMI >= 30 som rekommenderats aktiv överviktsbehandling', ValueCode: 'weight', Category: 'TherapyChoice' },
              { ValueName: 'Mandibulär framskjutning av apnébettskena', ValueCode: 'mandfix', Category: 'TherapyOutcomes' },
              { ValueName: 'Andel av apnébettskenor som är tvådelade (bitblock)', ValueCode: 'apnetype', Category: 'TherapyOutcomes' },
              { ValueName: 'Förändring av ESS vid behandling med CPAP', ValueCode: 'ESSchange_CPAP', Category: 'TherapyOutcomes' },
              { ValueName: 'Förändring av ESS vid behandling med apnébettskena', ValueCode: 'ESSchange_apne', Category: 'TherapyOutcomes' },
              { ValueName: 'Andel med CPAP som använder den >=  4 timmar per natt', ValueCode: 'four', Category: 'TherapyOutcomes' },
            ]
          }
        },
        {
          xtype: 'sesarfilter',
          itemId: 'clinicFilter',
          displayField: 'UnitName',
          valueField: 'UnitCode',
          fieldLabel: 'Klinik:',
          labelStyle: 'text-align: right;',
          width: '99%',
          listeners: {
            select: 'updateCharts'
          },
          labelWidth: 65,
          htmlEncode: true,
          value: Profile.Context ? Profile.Context.Unit.UnitCode : 'alla',
          store: {
            fields: ['UnitCode', 'UnitName'],
            autoLoad: true,
            data: [{ UnitName: 'Välj en enhet', UnitCode: 'alla' }],
            proxy: {
              type: 'ajax',
              url: '/stratum/api/metadata/units/register/117?apikey=KbxAwmlwLM4=',
              withCredentials: true,
              reader: {
                type: 'json',
                rootProperty: 'data'
              },
            },
            listeners: {
              load: function (store) {
                store.add({ UnitName: 'Välj en enhet', UnitCode: 'alla' })
                store.sort({ property: 'UnitName', direction: 'ASC' })
              }
            }
          }
        }, 
      ]
    },
    {
      xtype: 'panel',
      padding: '0 6 0 0',
      style: {
        marginBottom: '20px'
      },
      layout: Ext.is.Phone && (window.innerHeight > window.innerWidth) ? 'vbox' : 'hbox',
      border: false,
      items: [
      {
        xtype: 'sesarfilter',
        itemId: 'startyearFilter',
        checkChangeEvents: ['change'],
        width: Ext.is.Phone && (window.innerHeight > window.innerWidth) ? '99%' : '33%',
        fieldLabel: 'Från',
        labelStyle: 'text-align: right;',
        labelWidth: 65,
        value: 'year2014',
        displayField: 'ValueName',
        valueField: 'ValueCode',
        listeners: {
          select: 'updateCharts'
        },
        store: {
          fields: ['ValueCode', 'ValueName'],
          data: [
            { ValueName: '2014', ValueCode: 'year2014' },
            { ValueName: '2015', ValueCode: 'year2015' },
            { ValueName: '2016', ValueCode: 'year2016' },
            { ValueName: '2017', ValueCode: 'year2017' },
            { ValueName: '2018', ValueCode: 'year2018' }
          ],
          sorters: {
            property: 'ValueCode',
            direction: 'ASC'
          }
        }
      },
      {
        xtype: 'sesarfilter',
        itemId: 'endyearFilter',
        width: Ext.is.Phone && (window.innerHeight > window.innerWidth) ? '99%' : '33%',
        fieldLabel: 'Till',
        labelStyle: 'text-align: right;',
        labelWidth: 65,
        value: 'year2018',
        displayField: 'ValueName',
        valueField: 'ValueCode',
        listeners: {
          select: 'updateCharts',
        },
        store: {
          fields: ['ValueCode', 'ValueName'],
          data: [
            { ValueName: '2014', ValueCode: 'year2014' },
            { ValueName: '2015', ValueCode: 'year2015' },
            { ValueName: '2016', ValueCode: 'year2016' },
            { ValueName: '2017', ValueCode: 'year2017' },
            { ValueName: '2018', ValueCode: 'year2018' }
          ],
          sorters: {
            property: 'ValueCode',
            direction: 'ASC'
          }
        }
      },
      {
        xtype: 'sesarfilter',
        itemId: 'sexFilter',
        width: Ext.is.Phone && (window.innerHeight > window.innerWidth) ? '99%' : '33%',
        displayField: 'ValueName',
        valueField: 'ValueCode',
        fieldLabel: 'Kön:',
        labelWidth: 65,
        height: 40,
        labelStyle: 'text-align: right;',
        value: 'both',
        listeners: {
          select: 'updateCharts'
        },
        store: {
          fields: ['ValueCode', 'ValueName'],
          data: [
            { ValueName: 'Båda', ValueCode: 'both' },
            { ValueName: 'Män', ValueCode: 'man' },
            { ValueName: 'Kvinnor', ValueCode: 'woman' },
          ],
          sorters: {
            property: 'ValueCode',
            direction: 'ASC'
          }
        }
      }]
    },
    {
      xtype: 'tabpanel',
      cls: 'ton-tab',
      plain: false,
      border: false,
      padding: 0,
      margin: '20px 0 0 0',
      bodyStyle: {
        border: 0,
      },
      items: [
        {
          xtype: 'sesartime',
          title: Ext.is.Phone ? '' : 'Utveckling över tid',
          iconCls: 'sesar-icon x-fa fa-calendar',
          border: false,
          height: 400,
          listeners: {
            show: function () {
              this.up('#mainView').getController().updateCharts('time')
            }
          }
        },
        {
          xtype: 'sesarage',
          iconCls: 'sesar-icon x-fa fa-child',
          title: Ext.is.Phone ? '' : 'Åldersgrupper',
          tabConfig: {
            width: Ext.is.Phone ? 42 : 182
          },
          height: 400,
          listeners: {
            show: function () {
              this.up('#mainView').getController().updateCharts('age')
            }
          }
        },
        {
          xtype: 'sesarcomparison',
          title: Ext.is.Phone ? '' : 'Jämförelse mellan kliniker',
          iconCls: 'sesar-icon x-fa fa-balance-scale',
          height: 800,
          listeners: {
            show: function () {
              this.up('#mainView').getController().updateCharts('comparison')
            }
          }
        }
      ],
    },
    {
      xtype: 'progressbar',
      margin: 10,
      maxHeight: 5,
      cls: 'sesar-progressbar'
    }
  ]
})
window.addEventListener("orientationchange", function(){location.reload()});
Sesar.controller.inputCss =  Ext.os.deviceType === 'Phone' ? 'font-size: 16px;' : ''  
Ext.util.CSS.removeStyleSheet('shpr')
Ext.util.CSS.createStyleSheet(
  ' '

  + '.sesar-select .x-form-item-body {'
  + '  height: 40px;'
  + '  border-radius: 3px;'
  + '}'

  + '.sesar-select input {'
  + '  color: #3F73A6;'
  + '  color: #2f5880;'
  + '  padding: 9px 14px;'
  + Sesar.controller.inputCss 
  + '}'

  + '.sesar-select div {'
  + '  border-radius: 3px;'
  + '}'

  + '.sesar-select label {'
  + '  white-space: nowrap;'
  + '  padding-top: 11px;'
  + '  color: #3F73A6;'
  + '  color: #2f5880;'
  + Sesar.controller.inputCss 
  + '}'

  + '.sesar-select .x-form-trigger {'
  + '  vertical-align: middle;'
  + '  color: #3F73A6;'
  + '}'

  + '.ton-tab .x-tab-bar { '
  + '  background-color: white; '
  + '}'

  + '.ton-tab a:first-of-type { '
  + '  margin-left: 64px;'
  + '}'

  + '.ton-tab .x-tab-bar-default-top>.x-tab-bar-body-default {'
  + '  padding: 6px;'
  + '}'

  + '.ton-tab .x-tab-bar-body { '
  + '  border-bottom: 1px solid green;'
  + '}'

  + '.ton-tab .x-tab { '
  + '  background-color: #E7F1FF;'
  + '  border-radius: 3px 3px 0px 0px; '
  + '  border-left: solid 1px #00528F; '
  + '  border-top: solid 1px #00528F; '
  + '  border-right: 1px solid #00528F; '
  + '  border-bottom: 1px solid #00528F;'
  + '  top: 1px !important;'
  + '}'

  + '.ton-tab .x-tab.x-tab-active.x-tab-default { '
  + '  border-left: solid 1px #00528F; '
  + '  border-top: solid 1px #00528F; '
  + '  border-right: solid 1px #00528F; '
  + '  border-bottom: solid 1px white; '
  + '  background-color: white; '
  + '  outline: none;'
  + '}'

  + '.ton-tab .x-tab-inner-default { '
  + '  color: #00528F; '
  + '  font: 400 16px open_sans, helvetica, arial, sans-serif; '
  + '  padding: 5px 10px 0px 10px; '
  + '  height: 35px; '
  + '} '

  + '.ton-tab .x-tab.x-tab-active.x-tab-default .x-tab-inner-default { '
  + '  color: #00528F; '
  + '} '

  + '.ton-tab .x-tab-bar .x-box-inner {'
  + '  overflow: visible !important;'
  + '  border-bottom: solid 1px #359aa3;'
  + '	}'

  + '.ton-tab .x-tab-default-top.x-tab-focus.x-tab-active {'
  + '  box-shadow: none;'
  + '}'

  + '.sesar-tooltip-red {'
  + '  background-color: #DD4C39;'
  + '  border-color: #DD4C39;'
  + '}'

  + '.sesar-tooltip-blue {'
  + '  background-color: #26879B;'
  + '  border-color: #26879B;'
  + '}'

  + '.sesar-tooltip-yellow {'
  + '  background-color: #FED766;'
  + '  border-color: #FED766;'
  + '}'

  + '.sesar-tooltip-yellow .x-tip-body-default {'
  + '  color: black;'
  + '}'
  
  + '.sesar-icon {'
  + '  color: #00528F !important;'
  + '}'

  + '.sesar-progressbar {'
  + '  border-radius: 22px;'
  + '}'

  + '.sesar-progressbar .x-progress-bar {'
  + '  background-color: #77818c !important;'
  + '}'

  + ' .sesar-category {'
  + '     padding-top: 10px;'
  + '     padding-bottom: 6px;'
  + '     border-top: 1px dashed #000;'
  + '     font-weight: normal;'
  + '     margin-top: 5px;'
  + '  background-color: #e0e0e0;'
  + '  color: #606060;'
  + '  cursor: default;'
  + ' }'
  , 'siber'
)
