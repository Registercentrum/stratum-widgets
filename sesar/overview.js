
Stratum.require(['multiselect'])
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
  + '}'

  + '.sesar-select div {'
  + '  border-radius: 3px;'
  + '}'

  + '.sesar-select label {'
  + '  white-space: nowrap;'
  + '  padding-top: 11px;'
  + '  color: #3F73A6;'
  + '  color: #2f5880;'
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

  + '.ton-tab a:nth-child(1) { '
  //+ '  left: 65px !important;'
  + '}'

  + '.ton-tab a:nth-child(2) { '
  //+ '  left: 252px !important;'
  //+ '  left: 280px !important;'
  + '}' 

  + '.ton-tab a:nth-child(3) { '
  //+ '  left: 409px !important;'
  //+ '  left: 464px !important;'
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
  
  + '.sesar-tooltip-orange {'
  + '  background-color: #E9724C;'
  + '  border-color: #E9724C;'
  + '}'

  + '.sesar-tooltip-blue {'
  + '  background-color: #26879B;'
  + '  border-color: #26879B;'
  + '}'

  + '.sesar-icon {'
  + '  color: #00528F !important;'
  + '}'

  + '.sesar-progressbar {'
  + '  border-radius: 22px;'
  + '}'
  
  + '.sesar-progressbar .x-progress-bar {'
  //+ '  background-image: linear-gradient(-45deg, #00528F 25%, transparent 25%, transparent 50%, #00528F 50%, #00528F 75%, transparent 75%, transparent);'
  //+ '  background-position: 0rem -244rem;'
  //+ '  background-size: 1.5rem 1.5rem;'
  // + '  animation: stripes 3s linear infinite;'
  + '  background-color: #77818c !important;'
  //+ '  background: linear-gradient(to bottom, rgba(235, 189, 138, 1), rgba(252, 238, 213, 1)) !important;'
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
            
Ext.define('Sesar.chart.Time', {
  extend: 'Ext.chart.CartesianChart',
  xtype: 'sesartime',
     border: false,
     colors: ['#E388BE', '#83D6F5'],
     colors: ['#DD4C39', '#0791AB'],
     //colors: ['#E16E28', '#40CADA'],
     //colors: ['#E16E28', '#0791AB'],
     //colors: ['#DC6910', '#0ba1af'],
     
     innerPadding: {
      top: 10,
      left: 10,
      right: 10,
      bottom: 10
     },
     insetPadding: '20 35 20 30',
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
         if(axis.getChart().usePercentages) {
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
        // colors: ['#D44A9C'],
        // colors: ['rgb(230, 112, 48)'],
        useDarkerStrokeColor: false,
        style: {
          lineWidth: 4,
        },
        marker: {
          type: 'circle',
          size: 4,
          radius: 7,
          // fill: '#D44A9C',
          fillOpacity: 1,
          'stroke-width': 3,
          strokeStyle: '#fff'  
                    },
        /*marker: {
          scaling: 1.5
        },*/
        tooltip: {
          style: {
            backgroundColor: '#DD4C39',
            borderColor: '#DD4C39',
          },
          autoHide: true,
          dismissDelay: 0,
          renderer: function(tooltip, record, context) {
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
        // colors: ['#3CBFEF'],
        // colors: ['rgb(25, 149, 173)'],
        useDarkerStrokeColor: false,
        style: {
          lineWidth: 4
        },
        marker: {
          type: 'circle',
          size: 4,
          radius: 7,
          // fill: '#3CBFEF',
          fillOpacity: 1,
          'stroke-width': 3,
          strokeStyle: '#fff'  
        },
        /*marker: { 
          scaling: 1.5
        },*/
        tooltip: {
          style: {
            backgroundColor: 'rgb(25, 149, 173)',
              borderColor: 'rgb(25, 149, 173)'
            },
          autoHide: true,
          dismissDelay: 0,
          renderer: function(tooltip, record, context) {
            return tooltip.setHtml('Antal: ' + record.get('State_Denominator'))
          }
        }
      }
   ]
})

Ext.define('Sesar.chart.AgeGroups', {
  extend: 'Ext.chart.CartesianChart',
  xtype: 'sesarage',
  border: false,
     colors: ['#E388BE', '#83D6F5'],
     colors: ['#DD4C39', '#0791AB'],
     innerPadding: {
      top: 10,
      left: 10,
      right: 10,
      bottom: 10
     },
     insetPadding: '20 35 20 30',
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
       fields: ['Clinic_Mean'],
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
         if(axis.getChart().usePercentages) {
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
        // title: 'Kliniken',
        // colors: ['#D44A9C'],
        // colors: ['rgb(230, 112, 48)'],
        // colors: ['#E9724C', 'blue'],
        useDarkerStrokeColor: false,
        style: {
          lineWidth: 4,
          maxBarWidth: 40
        },
        tooltip: {
          style: {
            backgroundColor: '#DD4C39',
            borderColor: '#DD4C39',
          },
          autoHide: true,
          dismissDelay: 0,
          renderer: function(tooltip, record, context) {
            var text = record.get('Clinic_Numerator')
            text = text === 'NA' ? 'För få uppgifter för att visa' : text
            return tooltip.setHtml('Antal: ' + text)
          }
        }
     }
  ]
})

Ext.define('Sesar.chart.Comparison', {
  extend: 'Ext.chart.CartesianChart',
  xtype: 'sesarcomparison',
  border: false,
  background: '#ccc',
  colors: ['#E388BE', '#83D6F5'],
  // height: 345,
  callout: 'none',
  innerPadding: {
    top: 10,
    left: 10,
    right: 30,
    bottom: 10
  },
  // insetPadding: '20 35 20 0',
  cls: 'sesar-timechart',
  border: false,
  store: {
    data: [],
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
      if(axis.getChart().usePercentages) {
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
        colors: ['#D44A9C'],
        colors: ['rgb(230, 112, 48)'],
        colors: ['#E9724C'],
        useDarkerStrokeColor: false,
        label: {
          display: 'outside',
          color: '#333',
          field: 'Mean',
          calloutColor: 'none',
          renderer: function (text, sprite, config, rendererData, index) {
            var chart = this.getChart()
            var precision = chart.precision || 0
            if(chart.usePercentages) {
              return typeof text === 'number' ? (text * 100).toFixed(precision) + '%' : ''
            }
            return typeof text === 'number' ? text.toFixed(precision) : ''
          }
        },
        style: {
          lineWidth: 4,
          maxBarWidth: 30
        },

        renderer: function(sprite, config, rendererData, index) {
          var record = rendererData.store.getAt(index)
          if(record && record.data.UnitName === this.getChart().up('#mainView').getController().filters.clinicName){
            return {
              fillStyle: '#26879B',
              stroke: '#26879B'
            }
          } else {
            return {
            fillStyle: '#E9724C',
              stroke: '#E9724C'
            }
          }
        },
        tooltip: {
          autoHide: true,
          dismissDelay: 0,
          renderer: function(tooltip, record, context) {
            tooltip.setHtml('Antal: ' + record.get('Denominator'))
            if(record && record.data.UnitName === this.getChart().up('#mainView').getController().filters.clinicName){
              tooltip.setUserCls('sesar-tooltip-blue')
            } else {
              tooltip.setUserCls('sesar-tooltip-orange')
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
    var report     = view.down('#reportFilter').getValue()
    var sex        = view.down('#sexFilter').getValue()
    var clinic     = view.down('#clinicFilter').getValue()
    var startyear  = view.down('#startyearFilter').getDisplayValue()
    var endyear    = view.down('#endyearFilter').getDisplayValue()
    var clinicName = view.down('#clinicFilter').getDisplayValue()
    
    !Ext.Object.isEmpty(Ext.Ajax.requests) && Ext.Ajax.abort(controller.currentRequest)

    if(!isTabChange) {
      controller.status = {time: false, age: false, comparison: false}
    }

    controller.tab = typeof tab === 'string' && tab || controller.tab
    controller.filters = {start: startyear, end: endyear, report: report, sex: sex, clinic: clinic, clinicName: clinicName || (Profile.Context && Profile.Context.Unit.UnitName)}
   
    switch(controller.tab) { 
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
    if(this.status[tab]) {
      this.updateProgress(false) 
      return
    }
    chart = view.down('sesar' + tab)
    url   = this.createUrl(type, this.filters)
    url   = tab === 'comparison' ? url.replace(/&clinic=[0-9]*/, '') : url
    this.fetchData(chart, url, this.filters.report, controller, tab)
    this.updateProgress(true)
  },

  updateProgress: function(run) {
    var progress = this.getView().down('progressbar')
    progress.reset()
    run && progress.wait({
      interval: 100,
      duration: 3000,
      increment: 30
    })
  },

  fetchData: function(chart, url, report, controller, tab) {
    controller.currentRequest = Ext.Ajax.request({
      type: 'ajax',
      method: 'get',
      cors: true,
      url: url,
      success: function (response) {
        var result = Ext.decode(response.responseText).data
        chart.usePercentages = Ext.Array.contains(controller.percentageReports, report)
        chart.precision = report === 'ess' || report === 'cardiovascular' || report === 'metabol' ? 1 : 0
        chart.precision = report === 'weight' ? 2 : chart.precision
        chart.getStore().loadData(result)
        controller.status[tab] = true
      }
    })
  },

  createUrl: function (type, filters) {
    return '/stratum/api/statistics/sesar/sesarw-publicstatistics-' + type + '?startyear=' + filters.start + '&stopyear=' + filters.end + '&indicator=' + filters.report + '&sex=' + filters.sex + '&clinic=' + filters.clinic + '&apikey=KbxAwmlwLM4='
  },

  percentageReports: ['severe_osa', 'mild_osa', 'cardiovascular', 'metabol', 'prespitory', 'psyk', 'cpap_sever_osa', 'apne_mild_osa', 'weight', 'apnetype', 'four'],

  dirtyTabs: {time: true, age: true, comparison: true}
})

Ext.define('Sesar.view.Filter', {
  extend: 'Ext.form.field.ComboBox',
  xtype: 'sesarfilter',
  alias: 'view.sesarfilter',
  cls: 'sesar-select',
  labelWidth: 65,
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
    layout: 'hbox',
    border: false,
    items: [
    {
      xtype: 'sesarfilter',
      itemId: 'reportFilter',
      displayField: 'ValueName',
      valueField: 'ValueCode',
      fieldLabel: 'Rapport:',
      width: '99%', // Ext.is.Phone ? '99%' : '50%',
      height: 40,
      labelStyle: 'text-align: right;',
      labelWidth: 65,
      value: 'eval',
      listConfig: {
        maxHeight: 600
      },
      listeners: {
        beforeselect: function () {var disabled = arguments[1].getData().Category === true; return !disabled },
        select: 'updateCharts'
      },
      tpl: Ext.create('Ext.XTemplate',
        '<ul class="x-list-plain"><tpl for=".">',
            '<tpl if="Category">',
            '<li role="option" class="x-boundlist-item sesar-category">{ValueName}</li>',
            '<tpl else>',
            '<li role="option" class="x-boundlist-item">{ValueName}</li>',
            '</tpl>',
        '</tpl></ul>'
    ),
      store: {
        fields: ['ValueCode', 'ValueName'],
        data: [
          { ValueName: 'Väntetider', ValueCode: 'Category', Category: true },
          { ValueName: 'Utredning', ValueCode: 'eval' },
          { ValueName: 'Cpap', ValueCode: 'cpap' },
          { ValueName: 'Skena', ValueCode: 'apne' },
          { ValueName: 'Undersökning', ValueCode: 'Category', Category: true },
          { ValueName: 'Apnéindex (AHI)', ValueCode: 'ahi' },
          { ValueName: 'Oxygensaturationsindex (ODI)', ValueCode: 'odi' },
          { ValueName: 'Sömnighetskattning (Ess)', ValueCode: 'ess' },
          { ValueName: 'Andel svår OSA', ValueCode: 'severe_osa' },
          { ValueName: 'Andel mild OSA', ValueCode: 'mild_osa' },
          { ValueName: 'Andel CV', ValueCode: 'cardiovascular' },
          { ValueName: 'Andel metabol', ValueCode: 'metabol' },
          { ValueName: 'Andel respisratorisk', ValueCode: 'prespiratory' },
          { ValueName: 'Andel psyk', ValueCode: 'psyk' },
          { ValueName: 'Behandling', ValueCode: 'Category', Category: true },
          { ValueName: 'Andel cpap vid svårt OSA', ValueCode: 'cpap_sever_osa' },
          { ValueName: 'Andel skena vid mild OSA', ValueCode: 'apne_mild_osa' },
          { ValueName: 'Andel viktreduktion vid övervikt', ValueCode: 'weight' },
          { ValueName: 'Resultat', ValueCode: 'Category', Category: true },
          { ValueName: 'Mandibulär framskjutning', ValueCode: 'mandfix' },
          { ValueName: 'Andel apnébettskenor av typen bitblock', ValueCode: 'apnetype' },
          { ValueName: 'Reduktion ESS (Patienter med CPAP)', ValueCode: 'ESSchange_CPAP' },
          { ValueName: 'Reduktion ESS (Patienter med apnébettskena)', ValueCode: 'ESSchange_apne' },
          { ValueName: 'Andel patienter som använder CPAP-maskinen mer än 4h', ValueCode: 'four' },
        ],
        /*
        sorters: {
          property: 'ValueCode',
          direction: 'ASC'
        }
        */
      }
    }
    ]
  }, 
  {
    xtype: 'panel',
    padding: '20 6 0 0',
    layout: 'hbox',
    border: false,
    items: [
    {
      xtype: 'sesarfilter',
      itemId: 'clinicFilter',
      displayField: 'UnitName',
      valueField: 'UnitCode',
      fieldLabel: 'Klinik:',
      labelStyle: 'text-align: right;',
      //flex: 1,
      width: '99%',
      listeners: {
        select: 'updateCharts'
      },
      labelWidth: 65,
      value: Profile.Context ? Profile.Context.Unit.UnitCode : 'alla',
      store: {
        fields: ['UnitCode', 'UnitName'], 
        autoLoad: true,
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
    }                                    
    ]
  },
  {
    xtype: 'panel',
    padding: '20 6 0 0',
    layout: 'hbox',
    border: false,
    items: [{
      xtype: 'sesarfilter',
      itemId: 'startyearFilter',
      checkChangeEvents: ['change'],
      width: '33%',
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
          { ValueName: '2018', ValueCode: 'year2018' },
          // { ValueName: '2019', ValueCode: 'year2019' },
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
      width: '33%',
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
          { ValueName: '2018', ValueCode: 'year2018' },
          // { ValueName: '2019', ValueCode: 'year2019' },
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
      width: '33%',
      displayField: 'ValueName',
      valueField: 'ValueCode',
      fieldLabel: 'Kön:',
      labelWidth: 65,
      // width: Ext.is.Phone ? '99%' : '50%',
      height: 40,
      labelStyle: 'text-align: right;',
      value: 'both',
      listeners: {
        select: 'updateCharts'
      },
      store: {
        fields: ['ValueCode', 'ValueName'],
        data: [
          { ValueName: 'Båda', ValueCode: 'both'},
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
        show:  function () {
          this.up('#mainView').getController().updateCharts('time')
        }
      }
    },
    {
       xtype: 'sesarage',
       iconCls: 'sesar-icon x-fa fa-child',
      title: Ext.is.Phone ? '' : 'Åldersgrupper',
      tabConfig: {
        width: 182
      },
      height: 400,
      listeners: {
        show:  function () {
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
        show:  function () {
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

Ext.application({
  name: 'Sesar',
  units: [],
  launch: function () {
    var target = (typeof Stratum !== 'undefined' && Stratum.containers) ? Stratum.containers['SESAR/OverviewEval'] : 'contentPanel'
    var main = Ext.create('Sesar.view.Main', {renderTo: target})
    main.getController().tab = 'time'
    main.getController().status = {time: false, age: false, comparison: false}
    main.getController().updateCharts()
    main.down('sesarcomparison').getSeries()[0].getLabel().getTemplate().setCalloutLine({length: 20, color: 'rgba(0,0,0,0)'})
  },
})
