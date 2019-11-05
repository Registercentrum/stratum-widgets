
widgetConfig = {};

Ext.define('Shpr.store.Spider', {
  extend: 'Ext.data.Store',
  alias: 'store.spider',
  storeId: 'spider',
  fields: []
});

Ext.define('Shpr.view.Filter', {
  extend: 'Ext.form.field.ComboBox',
  xtype: 'shprfilter',
  alias: 'view.shprfilter',
  cls: 'shpr-select',
  labelWidth: 85,
  forceSelection: false,
  typeAhead: true,
  queryMode: 'local',
  minChars: 1,
  anyMatch: true,
  autoSelect: false,
  caseSensitive: false,
  checkChangeEvents: ['change', 'keyup']
});

Ext.define('Shpr.view.RadioGroup', {
  extend: 'Ext.form.RadioGroup',
  xtype: 'shprradiogroup',
  fieldLabel: 'Kön',
  labelWidth: 85,
  width: '100%',
  height: 30,
  layout: 'hbox',
  value: 0
})

Ext.define('Shpr.chart.Casemix', {
  extend: 'Ext.chart.CartesianChart',
  xtype: 'shprcasemix',
  border: false,
  colors: ['#CA097C', '#00ADEF'],
  cls: 'shpr-casemix',
  flipXY: true,
  captions: {
    title: {
      text: 'Casemix',
      align: 'left',
      style: {
        color: '#c5c5c5'
      }
    }
  },
  store: {
    data: []
  },
  axes: [
    {
      type: 'numeric',
      title: {
        text: 'Normaliserad andel    ',
        fontSize: 12
      },
      position: 'bottom',
      fields: ['unit_value', 'comparison_value'],
      maximum: 1,
      majorTickSteps: 2,
      renderer: function (axis, label, context) {
        return label
      }
    },
    {
      type: 'category',
      position: 'left',
      fields: ['indicator'],
      hidden: false,
      renderer: function (axis, label, context) {
        var translations = {prop_female: 'Kvinnor', prop_older_60: 'Över 60', prop_older_85: 'Över 85', prop_acute_fracture: 'Akuta frakturer', prop_dementia: 'Icke-dementa', prop_charnley: 'Charnley'}
        return translations[label]
      }
    }
  ],
  series: [
  {
    type: 'bar',
    stacked: false,
    xField: 'indicator',
    yField: ['unit_value', 'comparison_value'],
    
    style: {   
      fillOpacity: .5,
      strokeOpacity: 1,
      lineWidth: 1,
      maxBarWidth: 30,
    }
  }]
})

Ext.define('Shpr.chart.Time', {
  extend: 'Ext.chart.CartesianChart',
  xtype: 'shprtime',
       border: false,
       colors: ['#E388BE', '#83D6F5'],
       height: 145,
       innerPadding: {
        top: 5,
        left: 5,
        right: 5
      },
       insetPadding: '20 35 20 20',
       cls: 'shpr-timechart',
       legend: {
        type: 'dom'
      },
       border: false,
       store: {
         storeId: 'timechart',
         data: [],
       },
         axes: [{
            type: 'numeric',
            position: 'left',
            fields: ['y_unit', 'y_comparison', 'y_unit_lower', 'y_unit_upper', 'y_comparison_lower', 'y_comparison_upper'],
            style: {
               strokeStyle: '#9aa8bc'
            },

            label: {
                strokeOpacity: 0.2,
                fillStyle: '#9aa8bc'
            },
            
            renderer: function (axis, label, context) {
              if(axis.getChart().usePercentages) {
                return (label * 100).toFixed(1) + '%'
              }
              return label.toFixed(2)
            }
        }, {
            type: 'category',
            position: 'bottom',
            fields: 'year',
            style: {
              strokeStyle: '#9aa8bc'
            },
            label: {
                fillStyle: '#9aa8bc',
                strokeOpacity: 0.2,
            }
        }],
        series: [
          {
          xField: 'year',
          type: 'area',
          tooltip: {
              width: 0,
              height:0,
              style: {
                backgroundColor: 'rgba(0, 0, 0, 0)',
                borderColor: 'rgba(0, 0, 0, 0)',
              }
          },
          yField: ['y_unit_lower', 'y_unit_upper'],
          colors: ['rgba(0, 0, 0, 0)', 'rgba(202, 9, 124, 0.1)'],
          showInLegend: false,
          style: {
              strokeOpacity: 0
            }
          },
          {
          xField: 'year',
          type: 'area',
          tooltip: {
              width: 0,
              height:0,
              style: {
                backgroundColor: 'rgba(0, 0, 0, 0)',
                borderColor: 'rgba(0, 0, 0, 0)',
              }
          },
          yField: ['y_comparison_lower', 'y_comparison_upper'],
          colors: ['rgba(0, 0, 0, 0)', 'rgba(0, 173, 239, 0.1)'],
          showInLegend: false,
          style: {
              strokeOpacity: 0
            }
          },
          {
            type: 'line',
            xField: 'year',
            yField: 'y_unit',
            style: {
              lineWidth: 2
            },
            marker: {
              scaling: 1.5
            },
            tooltip: {
              style: {
                  backgroundColor: '#890552',
                  borderColor: '#890552',
              },
              autoHide: true,
              dismissDelay: 0,
              renderer: function(tooltip, record, context) {
                return tooltip.setHtml('Antal: ' + record.get('n_unit'))
              }
            }
          },
          {
            type: 'line',
            xField: 'year',
            yField: 'y_comparison',
            style: {
              lineWidth: 2
            },
            marker: {
              scaling: 1.5
            },
            tooltip: {
              style: {
                backgroundColor: '#057eaa',
                  borderColor: '#057eaa'
                },
              autoHide: true,
              dismissDelay: 0,
              renderer: function(tooltip, record, context) {
                return tooltip.setHtml('Antal: ' + record.get('n_comparison'))
              }
            }
          }
       ]
});

Ext.define('Shpr.controller.Spider', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.spider',

  updateCharts: function () {
    var controller = this
    var view = this.getView()
    var spiderchart   = view.down('polar')
    var timechart   = view.down('shprtime')
    var missingData   = view.down('#missingData')
    var casemixchart   = view.down('shprcasemix')
    var indicator = view.down('#indicatorFilter').getValue()
    var spiderurl = controller.createUrl(view, 'compass')
    var timeurl = controller.createTimeUrl(view, indicator)
    
    controller.requests +=1 
    view.down('#timeSpinner').show()
    controller.disableInvalidFilters(view)
    view.down('#indicatorFilter').getStore().clearFilter()
    view.down('#indicatorFilter').getFilters().add(controller.filterUnits.bind(controller))
    controller.updateDependentSelection()
    controller.updateDependentExplantions()

    Ext.Ajax.request({
      type: 'ajax',
      method: 'get',
      cors: true,
      url: spiderurl,
      autoAbort: true,
      success: function (response) {
        var result = Ext.decode(response.responseText).data
        result = controller.transformData(result)
        if(result.case_mix) {
          missingData.hide()
          spiderchart.show()
          casemixchart.show()
          // spiderchart.setSprites([])
          spiderchart.getStore().loadData(result.compass)
          casemixchart.getStore().loadData(result.case_mix)
          controller.updateLegend(view)
          if(!spiderchart.sprites)Ext.defer(function () {spiderchart.setSprites(controller.sprites)}, 500)
        } else {
          missingData.show()
          spiderchart.hide()
          casemixchart.hide()
        }
      }
    });

    Ext.Ajax.request({
      type: 'ajax',
      method: 'get',
      cors: true,
      url: timeurl,
      success: function (response) {
        var result = Ext.decode(response.responseText).data
        result = controller.transformTimeData(result)
        timechart.usePercentages = indicator === 'reop2yrs' || indicator === 'rev5yrs' || indicator === 'rev10yrs' || indicator === 'coverage' || indicator === 'mort90' || indicator === 'rev1yrs'
        timechart.show()
        var minimum = controller.findMinimum(result)
        if(timechart.usePercentages && !(indicator === 'reop2yrs')){
          timechart.getAxes()[0].setMinimum(minimum)
        } else if(indicator === 'satis') {
          timechart.getAxes()[0].setMinimum(3)
        } else {
          timechart.getAxes()[0].setMinimum(0)
        }
        if(controller.isSomeUnitDataMissing(result)) {
          timechart.getSeries()[0].setStyle({fillOpacity: 0})
        } else {
          timechart.getSeries()[0].setStyle({fillOpacity: 0.5})
        }
        if(controller.isSomeComparisonDataMissing(result)) {
          timechart.getSeries()[1].setStyle({fillOpacity: 0})
        } else {
          timechart.getSeries()[1].setStyle({fillOpacity: 0.5})
        }
        timechart.getStore().loadData(result);
        controller.requests -=1
        if(controller.requests<1) {
          view.down('#timeSpinner').hide()
        }
      },
      failure: function (response){
        controller.requests -=1
        if(controller.requests<1) {
          view.down('#timeSpinner').hide()
        }
      }
    })
  },

  message: function (indicator) {
    this.getView().up().up().down('#indicatorFilter').setValue(indicator)
    this.updateCharts.apply(this.getView().up().up().getController())
  },

  findMinimum: function (data) {
    var findMinimumUnitValue = (min, current) => current.y_unit < min ? current.y_unit : min
    var findMinimumComparisionValue = (min, current) => current.y_comparison < min ? current.y_comparison : min
    var minimum = data.reduce(findMinimumUnitValue, 1)
    minimum = data.reduce(findMinimumComparisionValue, minimum)
    return minimum
  },

  updateDependentSelection: function () {
    var me = this
    var view = me.getView()
    var options = view.down('#indicatorFilter').getStore().getData().items
    var value = view.down('#indicatorFilter').getValue()
    var diagnosis = view.down('#diagnosisFilter').getValue()
    var eligible = options.filter(function(item){return item.data.ValueCode === value}).length
    if(eligible)return
    view.down('#diagnosisFilter').getDisplayValue() !== 'Fraktur' && view.down('#indicatorFilter').setValue('satis')
    view.down('#diagnosisFilter').getDisplayValue() === 'Fraktur' && view.down('#indicatorFilter').setValue('coverage')
  },

  updateDependentExplantions: function () {
    var me = this
    var view = me.getView()
    var diagnosis = view.down('#diagnosisFilter').getDisplayValue()
    if(diagnosis === 'Fraktur') {
      view.down('#arthrosisExplantions').setHidden(true)
      view.down('#fractureExplantions').setHidden(false)
    } else {
      view.down('#arthrosisExplantions').setHidden(false)
      view.down('#fractureExplantions').setHidden(true)
    }
  },

  isSomeUnitDataMissing: function(data) {
    var result = false
    data.forEach(function(item) {
      if(item.y_unit === 'NA') result = true
    })
   return result
  },

  isSomeComparisonDataMissing: function(data) {
    var result = false
    data.forEach(function(item) {
      if(item.y_comparison === 'NA') result = true
    })
   return result
  },

  filterUnits: function(item) {
    var view = this.getView()
    if(this.getView().itemId!== 'spider') {
      view = this.getView().up('#spider')
    }
    var include = false
    var diagnosis = view.down('#diagnosisFilter').getValue()
    return (diagnosis === 1 && item.data.Arthritis) || (diagnosis === 3 && item.data.Fracture)
  },

  chooseTheCommonPatient:  function(){
    var view = this.getView()
    view.down('#diagnosisFilter').setValue(1)
    view.down('#sexFilter').setValue({sex: 'all'})
    view.down('#fixationFilter').setValue({fixation: 'all'})
    view.down('#ageLowerFilter').setValue(55)
    view.down('#ageUpperFilter').setValue(84)
    view.down('#bmiLowerFilter').setValue(0)
    view.down('#bmiUpperFilter').setValue(30)
    view.down('#asaOneFilter').setValue(true)
    view.down('#asaTwoFilter').setValue(true)
    view.down('#asaThreeFilter').setValue(false)
    view.down('#asaFourFilter').setValue(false)
    view.down('#charnleyAFilter').setValue(true)
    view.down('#charnleyBFilter').setValue(true)
    view.down('#charnleyCFilter').setValue(true)
  },

  chooseAllPatients:  function(){
    var view = this.getView()
    view.down('#diagnosisFilter').setValue(1)
    view.down('#sexFilter').setValue({sex: 'all'})
    view.down('#fixationFilter').setValue({fixation: 'all'})
    view.down('#ageLowerFilter').setValue(0)
    view.down('#ageUpperFilter').setValue(120)
    view.down('#bmiLowerFilter').setValue(0)
    view.down('#bmiUpperFilter').setValue(100)
    view.down('#asaOneFilter').setValue(true)
    view.down('#asaTwoFilter').setValue(true)
    view.down('#asaThreeFilter').setValue(true)
    view.down('#asaFourFilter').setValue(true)
    view.down('#charnleyAFilter').setValue(true)
    view.down('#charnleyBFilter').setValue(true)
    view.down('#charnleyCFilter').setValue(true)
  },


  enableAllFilters: function (view) {
    view.down('#commonPatient').enable()
    view.down('#sexFilter').enable()
    view.down('#fixationFilter').enable()
    view.down('#ageFilter').enable()
    view.down('#bmiFilter').enable()
    view.down('#asaFilter').enable()
    view.down('#charnleyFilter').enable()
  },

  disableInvalidFilters: function (view) {
    this.enableAllFilters(view)
    var indicator = view.down('#indicatorFilter').getValue()
    switch (indicator) {
      case 'rev10yrs':
        view.down('#bmiFilter').disable()
        view.down('#asaFilter').disable()
        view.down('#charnleyFilter').disable()
        break
      case 'coverage':
      case 'adverse_events':
        view.down('#commonPatient').disable()
        view.down('#sexFilter').disable()
        view.down('#fixationFilter').disable()
        view.down('#ageFilter').disable()
        view.down('#bmiFilter').disable()
        view.down('#asaFilter').disable()
        view.down('#charnleyFilter').disable()
        break
    }
    var diagnosis = view.down('#diagnosisFilter').getValue()
    if(diagnosis === 3) view.down('#commonPatient').disable()
  },

  transformData: function (data) {
    if(!data.compass){
      data.compass = {}
      return data
    }
    var translations = {
      satisfaction: 'Tillfredställelse', 
      paingain: '                                  Minskad smärta\n                                    efter 1 år',
      eqvasgain: '                              EQ-VAS vinst\n                            efter 1 år',
      surv1yr: 'Implantatöverlevnad                            \n             efter 1 år                                    ',
      surv5yrs:  'Implantatöverlevnad                            \n              efter 5 år                                    ',
      surv10yrs: 'Implantatöverlevnad                            \n              efter 10 år                                   ',
      coverage: 'Täckningsgrad',
      prop_reop2yrs: 'Reoperation                  \ninom 2 år               ',
      prop_reop6m: 'Reoperation                  \ninom 6 månader               ',
      adverse_events: '                                           Oönskade händelser \n                                          inom 90 dagar',
      mort90days: '                        Mortalitet \n                        90 dagar'
    }
    var compass = data.compass;
    compass.forEach(function(item){
      item.indicator = translations[item.indicator]
      item.background = 1
    })
    data.compass = compass
    return data
  },

  transformTimeData: function (data) {
    data.forEach(function(item){
      item.y_unit_upper = item.y_unit_upper - item.y_unit_lower
      item.y_comparison_upper = item.y_comparison_upper - item.y_comparison_lower
    })
    return data;
  },

  createUrl: function (view, area) {
    var comparison = view.down('#comparisonFilter').getValue()
    var unit      = view.down('#unitFilter').getValue()
    var indicator = view.down('#diagnosisFilter').getValue()
    var url = '/stratum/api/statistics/shpr/kpl_' + area + '?unit=' + unit + '&comparison=' + comparison + '&diagnosis=' + indicator + '&apikey=' + this.apikey
    return url
  },

  createTimeUrl: function (view, area) {
    var comparison = view.down('#comparisonFilter').getValue()
    var unit      = view.down('#unitFilter').getValue()
    var diagnosis = view.down('#diagnosisFilter').getValue()
    var indicator = view.down('#indicatorFilter').getValue()
    var sex       = view.down('#sexFilter').getValue().sex
    var fixation  = view.down('#fixationFilter').getValue().fixation
    var ageLower  = view.down('#ageLowerFilter').getValue()
    var ageUpper  = view.down('#ageUpperFilter').getValue()
    var bmiLower  = view.down('#bmiLowerFilter').getValue()
    var bmiUpper  = view.down('#bmiUpperFilter').getValue()
    var asaOne    = view.down('#asaOneFilter').getValue() === true ? '1,' : ''
    var asaTwo    = view.down('#asaTwoFilter').getValue() === true ? '2,' : ''
    var asaThree  = view.down('#asaThreeFilter').getValue() === true ? '3,' : ''
    var asaFour   = view.down('#asaFourFilter').getValue() === true ? '4,' : ''
    var charnleyOne    = view.down('#charnleyAFilter').getValue() === true ? '1,' : ''
    var charnleyTwo    = view.down('#charnleyBFilter').getValue() === true ? '2,' : ''
    var charnleyThree  = view.down('#charnleyCFilter').getValue() === true ? '3,' : ''
   
    var asa = '[' + asaOne + asaTwo + asaThree + asaFour +']'
    var charnley = '[' + charnleyOne + charnleyTwo + charnleyThree +']'
    
    var base = '/stratum/api/statistics/shpr/kpl_' + area + '?unit=' + unit + '&comparison=' + comparison + '&diagnosis=' + diagnosis
    var baseFilters = '&gender=' + sex + '&fixation=' + fixation + '&age_lower=' + ageLower + '&age_upper=' + ageUpper
    var extendedFilters = '&bmi_lower=' + bmiLower + '&bmi_upper=' + bmiUpper + '&asa=' + asa + '&charnley=' + charnley
    var apikey = '&apikey=' + this.apikey
    var url = base
    
    if( indicator === 'rev10yrs') {
      url =  base + baseFilters
    } else if( indicator === 'reop2yrs' || indicator === 'rev5yrs' || indicator === 'eqvasgain' || indicator === 'paingain') {
      url =  base + baseFilters + extendedFilters
    }
    url += apikey
    return url
  },

  updateLegend: function (view) {
    var comparison = view.down('#comparisonFilter').getDisplayValue()
    var unit      = view.down('#unitFilter').getDisplayValue()
    var polarchart   = view.down('polar')
    var timechart   = view.down('shprtime')
    polarchart.getSeries()[0].setTitle(unit || (Profile.Context ? Profile.Context.Unit.UnitName : 'Riket'))
    polarchart.getSeries()[1].setTitle(comparison || 'Riket')
    timechart.getSeries()[2].setTitle(unit || (Profile.Context ? Profile.Context.Unit.UnitName : 'Riket'))
    timechart.getSeries()[3].setTitle(comparison || 'Riket')
  },

  exportTable: function (element) {
    var tag = element.el.dom;
    if (!tag) return;
    var content = this.createContentToDownload();
    var blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);

    /* IE downloads directly, use the download attribute for others */
    if (window.navigator.msSaveBlob) {
      window.navigator.msSaveBlob(blob, 'registreringar.csv');
    } else {
      tag.setAttribute('href', url);
    }
  },

  createContentToDownload: function () {
    var indicator = this.getView().down('#indicatorFilter').getDisplayValue()
    var headers = 'År; Resultat; Antal;\n';
    var content = '';
    content += indicator + '\n' +headers;
    
    var data = Ext.data.StoreManager.lookup('timechart');
    for (var i in data.data.items) {
      if (i === '') continue;
      for (var item in data.data.items[i].data) {
        if (!(item === 'year' || item === 'y_unit' || item === 'n_unit')) continue;
        var value = data.data.items[i].data[item];
        content += value + ';'; 
      }
      content += '\n';
    }
    
    /* Set BOM to let Excel know what the content is */
    content = '\ufeff' + content;
    return content;
  }
});

Ext.define('Shpr.view.Main', {
  extend: 'Ext.container.Container',
  alias: 'view.main',
  controller: 'spider',
  itemId: 'spider',
  items: [
    {
      xtype: 'panel',
      border: false,
      style: {
        marginBottom: '20px'
      },
      layout: {
        type: 'hbox',
        align: 'left'
      },
      items: [
        {
          itemId: 'diagnosisFilter',
          xtype: 'shprfilter',
          displayField: 'ValueName',
          valueField: 'ValueCode',
          fieldLabel: 'Diagnos:',
          width: Ext.is.Phone ? '99%' : '50%',
          height: 40,
          labelStyle: 'text-align: right;',
          value: 1,
          listeners: {
            select: 'updateCharts'
          },
          store: {
            fields: ['ValueCode', 'ValueName'],
            data: [
              { ValueName: 'Primär artros', ValueCode: 1 },
              { ValueName: 'Fraktur', ValueCode: 3 },
            ],
            sorters: {
              property: 'ValueCode',
              direction: 'ASC'
            }
          }
        }
      ]
    },
    {
      xtype: 'panel',
      border: false,
      style: {
        marginBottom: '20px'
      },
      layout: {
        type: Ext.is.Phone ?  'vbox' : 'hbox',
        align: 'left'
      },
      items: [
        {
          itemId: 'unitFilter',
          xtype: 'shprfilter',
          displayField: 'Unit',
          valueField: 'P_Unit',
          fieldLabel: 'Enhet:',
          labelStyle: 'text-align: right;',
          height: 40,
          width: Ext.is.Phone ? '99%' : '50%',
          value:  Profile.Context ? Profile.Context.Unit.UnitCode : 1001,
          listeners: {
            select: 'updateCharts'
          },
          
          tpl: Ext.create(
            'Ext.XTemplate',
            '<tpl for=".">',
            '<li class="{[this.getClass(values)]}">{Unit}</li>',
            '</tpl>',
            {
              getClass: function (rec) {
                return rec.type === 'county' ? 'x-boundlist-item shpr-county-item' : 'x-boundlist-item';
              }
            }
          ),
          
          store: {
            fields: ['P_Unit', 'Unit', 'type'],
            autoLoad: true,
            proxy: {
              type: 'ajax',
              url: '/stratum/api/statistics/shpr/kpl_units_choice?apikey=KbxAwmlwLM4=',
              withCredentials: true,
              reader: {
                type: 'json',
                rootProperty: 'data'
              }
            }
          }
        },
        {
          itemId: 'comparisonFilter',
          xtype: 'shprfilter',
          displayField: 'Unit',
          valueField: 'P_Unit',
          fieldLabel: 'Jämförelse:',
          labelStyle: 'text-align: right;',
          height: 40,
          width: Ext.is.Phone ? '99%' : '49%',
          value: 0,
          listeners: {
            select: 'updateCharts'
          },
          tpl: Ext.create(
            'Ext.XTemplate',
            '<tpl for=".">',
            '<li class="{[this.getClass(values)]}">{Unit}</li>',
            '</tpl>',
            {
              getClass: function (rec) {
                return rec.type === 'county' ? 'x-boundlist-item shpr-county-item' : 'x-boundlist-item';
              }
            }
          ),
          store: {
            fields: ['P_Unit', 'Unit'],
            autoLoad: true,
            proxy: {
              type: 'ajax',
              url: '/stratum/api/statistics/shpr/kpl_units_choice?apikey=KbxAwmlwLM4=',
              withCredentials: true,
              reader: {
                type: 'json',
                rootProperty: 'data'
              }
            }
          }
        }
      ]
    },
    {
      xtype: 'component',
      itemId: 'missingData',
      hidden: true,
      html: '<div style="margin: 175px 0; width: 100%;"><div style="width: 40px; margin: 10px auto;"><icon class="fa fa-ban" style="color: #852728; font-size: 40px;margin: auto;"></icon></div><div style="width: 204px; margin: auto;">För liten mängd data tillgänglig</div></div>'
    },
     {
      xtype: 'panel',
      border: false,
      style: {
        marginBottom: '20px'
      },
      layout: {
        type: Ext.is.Phone ?  'vbox' : 'hbox',
        align: 'left'
      },
      items: [
      {
      xtype: 'tbspacer',
      width: '20%',
      height: 0,
      margin: '0 0 0 0'
    },
    {
      xtype: 'polar',
      controller: 'spider',
      width: Ext.is.Phone ? '100%' : '60%',
      height: 400,
      plugins: {
                spriteevents: true
            },
      border: false,
      insetPadding: {
        left: 0,
        right: 0,
        top: 30,
        bottom: 30
      },
      
      // interactions: 'rotate',
      border: false,
      touchAction: {
        panY: true,
      },
      cls: 'shpr-radar',
      legend: {
        type: 'dom'
      },
      /*
      sprites: [
      {
        type: 'text',
        // text: 'Implantatöverlevnad',
        // text: 'Implantatöverlevnad                            \n              efter 10 år                                   ',
        text: '', 
        x: 210,
        y: 65,
        value: 1
      }],
      */
      listeners: {
        /*
          redraw: function () {
            var func = this.getController().message.bind(this) 
             Ext.defer(func, 500)
          },*/
         spriteclick: function (item, event) {
             var sprite = item && item.sprite;
             this.getController().message(sprite.value)
         },
         spritemouseover: function(item, event) {
             var sprite = item && item.sprite
             if(sprite.value){
               sprite.setAttributes({fillStyle: 'rgba(0,0,0,1)'})
               sprite.repaint()
             }
             
         },
         spritemouseout: function(item, event) {
             var sprite = item && item.sprite
             if(sprite.value){
               sprite.setAttributes({fillStyle: 'rgba(0,0,0,0.01)'})
               sprite.repaint()
             }
             
         }
     },
      
      store: {
        fields: ['indicator', 'unit_value', 'comparison_value'],
        data: []
      },
   
      series: [{
        type: 'radar',
        angleField: 'indicator',
        radiusField: 'unit_value',
        title: Profile.Context ? Profile.Context.Unit.UnitName : 'Riket ',
        colors: ['#CA097C'],
        rotation: -90,
        style: {   
           fillOpacity: .5,
           strokeOpacity: 1,
           lineWidth: 1
        }
       }, {
       type: 'radar',
       angleField: 'indicator',
       radiusField: 'comparison_value',
       title: 'Riket',
       rotation: -90,
       colors: ['#00ADEF'],
      
       style: {
           fillOpacity: .5,
           strokeOpacity: 1,
           lineWidth: 1
       }
      }, {
       type: 'radar',
       angleField: 'indicator',
       radiusField: 'background',
       rotation: -90,
       showInLegend: false,
       colors: ['#c5c5c5'],
       style: {
           fillOpacity: .05,
           strokeOpacity: 1,
           lineWidth: 0.5
       }
      }],
      axes: [{
        type: 'category',
        position: 'angular',
        fields: 'indicator',
        rotation: 30,
        style: {
           estStepSize: 1,
           strokeStyle: '#fff',
        },
        grid: {
          stroke: '#ccc'
        }
      }]
    },
    
    {
      xtype: 'shprcasemix',
      width: Ext.is.Phone ? '100%' : '20%',
      height: 250,
      insetPadding: '10 30 10 10',
      margin: Ext.is.Phone ? 0 : '109px 0 0 0'
    }]},
    {
      xtype: 'panel',
      border: false,
      items: [
      {
        xtype: 'panel',
        layout: 'hbox',
        border: false,
        items: [
      {
          itemId: 'indicatorFilter',
          xtype: 'shprfilter',
          cls: 'shpr-indicatorfilter shpr-select',
          displayField: 'ValueName',
          valueField: 'ValueCode',
          fieldLabel: 'Femårstrend för',
          width: Ext.is.Phone ? '99%' : '49%',
          height: 40,
          labelWidth: 130,
          labelStyle: 'text-align: right;',
          value: 'satis',
          listeners: {
            select: 'updateCharts'
          },
          store: {
            fields: ['ValueCode', 'ValueName'],
            data: [
              { ValueName: 'Tillfredställelse',                ValueCode: 'satis',          Arthritis: true,  Fracture: false},
              { ValueName: 'Minskad smärta efter 1 år',        ValueCode: 'paingain',       Arthritis: true,  Fracture: false},
              { ValueName: 'EQ-VAS vinst efter 1 år',          ValueCode: 'eqvasgain',      Arthritis: true,  Fracture: false},
              { ValueName: 'Oönskade händelser inom 90 dagar', ValueCode: 'adverse_events', Arthritis: true,  Fracture: true},
              { ValueName: 'Täckningsgrad',                    ValueCode: 'coverage',       Arthritis: true,  Fracture: true},
              { ValueName: 'Reoperation inom 2 år',            ValueCode: 'reop2yrs',       Arthritis: true,  Fracture: false},
              { ValueName: 'Reoperation inom 6 månader',       ValueCode: 'reop6m',         Arthritis: false, Fracture: true},
              { ValueName: 'Implantatöverlevnad efter 5 år',   ValueCode: 'rev5yrs',        Arthritis: true,  Fracture: false},
              { ValueName: 'Implantatöverlevnad efter 10 år',  ValueCode: 'rev10yrs',       Arthritis: true,  Fracture: false},
              { ValueName: 'Mortalitet 90 dagar',              ValueCode: 'mort90',         Arthritis: false, Fracture: true},
              { ValueName: 'Implantatöverlevnad efter 1 år',   ValueCode: 'rev1yrs',        Arthritis: false, Fracture: true},
            ],
            sorters: {
              property: 'ValueCode',
              direction: 'ASC'
            },
            filters: [
              function (item) {
                if (!widgetConfig.excludedIndicators) return true;
                return !Ext.Array.contains(widgetConfig.excludedIndicators, item.data.ValueCode);
              }
            ]
          },
        },
        {
          xtype: 'button',
          itemId: 'exportTableSwedish',
          cls: 'shpr-download-button',
          width: 100,
          margin: '0 0 0 30',
          autoEl: {
            tag: 'a',
            download: 'kpl.csv'
          },
          text: '&#xf019 Excel',
          listeners: {
            click: 'exportTable'
          }
        },
        {
          xtype: 'button',
          itemId: 'timeSpinner',
          width: 40,
          height: 40,
          border: false,
          style: {
            background: 'white'
          },
          iconCls: 'fa fa-cog fa-spin timechart-spinner'
        }
        ]},
      {
        xtype: 'shprtime',
        columnWidth: 1,
        height: 300,
        margin: '0px 0 20px 0'
      },
      {
        xtype: 'panel',
        layout: 'vbox',
        collapsible: true,
        collapsed: true,
        title: 'Mer detaljerad filtrering av femårstrend',
        border: false,
        padding: '0 20px 0 20px',
        margin: '20px 0 0px 0',
        items: [
        {
          xtype: 'tbspacer',
          height: 15
        },
        {
          xtype: 'fieldcontainer',
          itemId: 'commonPatient',
          fieldLabel: 'Förinställda',
          labelWidth: 85,
          items: [
        {
          xtype: 'button',
          text: 'Den vanlige patienten',
          handler: 'chooseTheCommonPatient',
          cls: 'shpr-button'
        },
        {
          xtype: 'button',
          text: 'Alla patienter',
          handler: 'chooseAllPatients',
          cls: 'shpr-button'
        }
        ]
        },
        {
          xtype: 'shprradiogroup', 
          itemId: 'sexFilter',
          listeners: {
            change: 'updateCharts'
          },
          defaults: {
            xtype: 'radio',
            name: 'sex',
            width: 140
          },
          items: [{
           boxLabel: 'Samtliga',
           itemId: 'radioitem-sex-all',
           inputValue: 'all',
           checked: true
          },{
           boxLabel: 'Män',
           itemId: 'radioitem-sex-male',
           inputValue: 1
          },{
           boxLabel: 'Kvinnor',
           itemId: 'radioitem-sex-female',
           inputValue: 2
          }]
        },        
        {
          xtype: 'shprradiogroup',
          itemId: 'fixationFilter',
          fieldLabel: 'Fixation',
          listeners: {
            change: 'updateCharts'
          },
          defaults: {
            xtype: 'radio',
            name: 'fixation',
            width: 140
          },
          items: [{
            boxLabel: 'Samtliga',
            inputValue: 'all',
            checked: true
          }, {
            boxLabel: 'Cementerad',
            itemId: 'radioitem-fixation-cemented',
            inputValue: 1
          }, {
            boxLabel: 'Ocementerad',
            itemId: 'radioitem-fixation-uncemented',
            inputValue: 2
          }, {
            boxLabel: 'Hybrid',
            itemId: 'radioitem-fixation-hybrid',
            inputValue: 3
          }]
        }, {
          xtype: 'fieldcontainer',
          itemId: 'ageFilter',
          fieldLabel: 'Åldrar',
          labelWidth: 85,
          layout: 'hbox',
          defaults: {
            xtype: 'numberfield',
            name: 'age',
            width: 165,
            minValue: 0,
            labelStyle: 'text-align: right;',
            listeners: {
            blur: 'updateCharts'
          },
          },
          items: [{
            itemId: 'ageLowerFilter',
            fieldLabel: 'Från och med',
            value: 0
          }, {
            itemId: 'ageUpperFilter',
            fieldLabel: 'Till och med',
            value: 120
          }]
        }, {
          xtype: 'fieldcontainer',
          itemId: 'bmiFilter',
          fieldLabel: 'BMI',
          labelWidth: 85,
          layout: 'hbox',
          defaults: {
            xtype: 'numberfield',
            name: 'age',
            width: 165,
            minValue: 0,
            labelStyle: 'text-align: right;',
            listeners: {
            blur: 'updateCharts'
          },
          },
          items: [{
            itemId: 'bmiLowerFilter',
            fieldLabel: 'Från och med',
            value: 10
          }, {
            itemId: 'bmiUpperFilter',
            fieldLabel: 'Till och med',
            value: 50
          }]
        }, {
          xtype: 'fieldcontainer',
          itemId: 'asaFilter',
          fieldLabel: 'ASA-grad',
          width: '100%',
          labelWidth: 85,
          layout: 'hbox',
          defaults: {
            xtype: 'checkbox',
            padding: '0 25 0 0',
            name: 'asa',
            listeners: {
              change: 'updateCharts'
            },
          },
          items: [{
            itemId: 'asaOneFilter',
            boxLabel: '1',
            inputValue: 1,
            checked: true
          }, {
            itemId: 'asaTwoFilter',
            boxLabel: '2',
            inputValue: 2,
            checked: true
          }, {
            itemId: 'asaThreeFilter',
            boxLabel: '3',
            inputValue: 3,
            checked: true
          }, {
            itemId: 'asaFourFilter',
            boxLabel: '4',
            inputValue: 4,
            checked: true
          }]
          }, {
          xtype: 'fieldcontainer',
          width: '100%',
          itemId: 'charnleyFilter',
          fieldLabel: 'Charnley-klass',
          labelWidth: 85,
          layout: 'hbox',
          defaults: {
            xtype: 'checkboxfield',
            padding: '0 25 0 0',
            name: 'charnley',
            listeners: {
              change: 'updateCharts'
            },
          },
          items: [{
            itemId: 'charnleyAFilter',
            boxLabel: 'A',
            checked: true
          }, {
            itemId: 'charnleyBFilter',
            boxLabel: 'B',
            checked: true
          }, {
            itemId: 'charnleyCFilter',
            boxLabel: 'C',
            checked: true
          }]
        }],
       },
       {
        xtype: 'panel',
        layout: 'vbox',
        collapsible: true,
        collapsed: false,
        title: 'Förklaringar av begrepp',
        border: false,
        padding: '0 20px 0 20px',
        margin: '20px 0 80px 0',
        items: [
        {
          xtype: 'tbspacer',
          height: 15
        },
        {
          itemId: 'arthrosisExplantions',
          cls: 'shpr-terms',
          hidden: true,
          html: '<div><b>Tillfredsställelse</b>: Patienttillfredsställelse vid 1-årsuppföljningen. En skala från 1-5 används där 1 är mycket missnöjd och 5 är mycket nöjd.</div>'
              + '<div><b>Minskad smärta efter 1 år</b>: Värdet beräknas genom att subtrahera värdet på smärta preoperativt med värdet som angavs ett år efter operationen. En skala från 1-5 används där 1 är ingen smärta och 5 är svår smärta.</div>'
              + '<div><b>EQ-VAS vinst efter 1 år</b>: Förbättring i självskattad hälsa på en skala mellan 1-100. Värdet beräknas genom att subtrahera EQ VAS-värdet preoperativt med EQ VAS ett år efter operationen. </div>'
              + '<div><b>Oönskade händelse inom 90 dagar</b>: Oönskad händelse inom 90 dagar enligt senaste länkningen med Patientregistret på Socialstyrelsen. Anges som andel.</div>'
              + '<div><b>Täckningsgrad</b>: Täckningsgrad (completeness) på individnivå enligt senaste länkningen med Patientregistret på Socialstyrelsen. Anges som andel.</div>'
              + '<div><b>Reoperation inom 2 år</b>: Anger all form av reoperation inom två år efter primäroperation och under den senaste fyraårsperioden. Anges som andel.</div>'
              + '<div><b>Implantatöverlevnad efter 5 år</b>: Protesöverlevnad efter fem år med Kaplan-Meier statistik. Anges som sannolikhet.</div>'
              + '<div><b>Implantatöverlevnad efter 10 år</b>: Protesöverlevnad efter tio år med Kaplan-Meier statistik.  Anges som sannolikhet.</div>'
              + '<br>'
              + '<div style="width: 100%">Varje variabel har skalats om till värden från 0 till 1. Det sämsta värdet (0, 0) för variablerna tilldelades origo och det bästa värdet (1, 0) i periferin. Gränsvärdena bestäms genom att ta det högsta respektive lägsta medelvärdet (på enhetsnivå) plus/minus en standardavvikelse. Ju större den ytan blir i denna figur, desto gynnsammare resultat har den aktuella enheten.</div>',
          width: '100%',
          border: false
        },
        {
          itemId: 'fractureExplantions',
          cls: 'shpr-terms',
          hidden: false,
          html: '<div><b>Täckningsgrad</b>: Täckningsgrad (completeness) på individnivå enligt senaste länkningen med Patientregistret på Socialstyrelsen. Anges som andel.</div>'
              + '<div><b>Oönskade händelser inom 90 dagar</b>: Oönskade händelser enligt senaste samkörningen med Patientregistret. Dessa definieras som kardio- och cerebrovaskulära tillstånd, tromboembolisk sjukdom, pneumoni, ulcus och urinvägsinfektion om dessa lett till återinläggning eller död. Dessutom ingår alla typer av omoperation av höften. Anges som andel.</div>'
              + '<div><b>Mortalitet 90 dagar</b>: I internationell litteratur används denna variabel för att belysa mortalitet efter höftproteskirurgi. Anges som andel.'
              + '<div><b>Reoperation inom 6 månader</b>: Reoperation inom sex månader. Alla öppna, efterföljande ingrepp i aktuell höft. Anges som andel.</div>'
              + '<div><b>Implantatöverlevnad efter 1 år</b>: Protesöverlevnad efter ett år med Kaplan-Meier statistik. Anges som sannolikhet.</div>'
              + '<br>'
              + '<div style="width: 100%">Varje variabel har skalats om till värden från 0 till 1. Det sämsta värdet (0, 0) för variablerna tilldelades origo och det bästa värdet (1, 0) i periferin. Gränsvärdena bestäms genom att ta det högsta respektive lägsta medelvärdet (på enhetsnivå) plus/minus en standardavvikelse. Ju större den ytan blir i denna figur, desto gynnsammare resultat har den aktuella enheten.</div>',
          width: '100%',
          border: false
        }
        ]
        }
      ]
    },
    {
      xtype: 'panel',
      itemId: 'spinner',
      width: '100%',
      height: 162,
      hidden: true,
      border: false,
      html: '<div class="spinner"><div class="rect1"></div><div class="rect2"></div><div class="rect3"></div><div class="rect4"></div><div class="rect5"></div></div>'
    }
  ]
});

Ext.application({
  name: 'Shpr',
  units: [],
  launch: function () {
    var target = (typeof Stratum !== 'undefined' && Stratum.containers) ? Stratum.containers['SHPR/Radar'] : 'contentPanel'
    var main = Ext.create('Shpr.view.Main', {
      renderTo: target
    })
    if (!window.navigator.msSaveBlob) {
      main.down('#exportTableSwedish').setHref(' ');
    }
    var controller = Ext.ComponentQuery.query('#spider')[0].getController()
    controller.api = 'kpl_compass'
    controller.apikey = 'MpuYxfbtp5I='
    controller.requests = 0
    controller.ajaxrequests = []
    controller.sprites = [
      {type: 'text', value: 'rev10yrs', text: '______________                            \n         ______                                   ', x: 110, y: 76, fontSize: 16, zIndex: 100, fillStyle: 'rgba(0,0,0,0.01)'},
      {type: 'text', value: 'rev5yrs',  text: '______________                            \n         ______                                   ', x: 65, y: 190, fontSize: 16, zIndex: 100, fillStyle: 'rgba(0,0,0,0.01)'}
    ]
    controller.updateCharts()
  },
});

Ext.util.CSS.removeStyleSheet('shpr');
Ext.util.CSS.createStyleSheet(
  ' '
  + '.foo {'
  + '  background-color: red;'
  + '}'
  
  + '.numRatingsAxis {'
  + '  white-space: normal;'
  + '  width: 200px;'
  + '}'

  + '.shpr-select .x-form-item-body {'
  + '  height: 40px;'
  + '  border-radius: 3px;'
  + '}'

  + '.shpr-select input {'
  + '  color: #3F73A6;'
  + '  color: #2f5880;'
  + '  padding: 9px 14px;'
  + '}'

  + '.shpr-select div {'
  + '  border-radius: 3px;'
  + '}'

  + '.shpr-timechart .x-panel-body-default {'
  + '  border: none;'
  + '}'

  + '.shpr-select label {'
  + '  white-space: nowrap;'
  + '  padding-top: 11px;'
  + '  color: #3F73A6;'
  + '  color: #2f5880;'
  + '}'

  + '.shpr-county-item {'
  + '  margin-top: 7px;'
  + '  padding-top: 7px;'
  + '  border-top: 1px dashed #000;'
  + '  font-weight: bold;'
  + '  margin-top: 5px;'
  + ' }'

  + '.shpr-radar .x-panel-body-default{'
  + '     border-bottom: 0px;'
  + ' }'

  + '.shpr-indicatorfilter {'
  + '  margin-top: 70px;'
  + '}'

  + '.timechart-spinner {'
  + '  color: #bbb;'
  + '  font-size: 20px;'
  + '}'

  + '.shpr-button, .shpr-button.x-btn.x-btn-focus {'
  + '  background-color: white;'
  + '  padding: 9px 14px;'
  + '  border-color: #ccc;'
  + '  box-shadow: none;'
  + '}'

   + '.shpr-button.x-btn.x-btn-over {'
   + '  background-color: #eee;'
   + '  border-color: #ccc;'
   + '  box-shadow: none !important;'
   + '}'

  + '.shpr-button span {'
  + '  color: #666;'
  + '}'

  + '.shpr-button.x-btn-disabled span {'
  + '  color: white;'
  + '}'

  + '.shpr-button.x-btn.x-btn-focus.x-btn-pressed {'
  + '  background-color: #bbb !important;'
  + '  color: #666;'
  + '}'
  
  + '.shpr-button:hover span {'
  + '  color: ##666;'
  + '}'

  + '.shpr-button.x-btn.x-btn-focus span {'
  + '  color: #666;'
  + '}'

  + '.shpr-divider {'
  + '  border:none;'
  + '  height: 20px;'
  + '  width: 100%;'
  + '  height: 50px;'
  + '  margin-top: 0;'
  + '  border-bottom: 1px solid #1f1209;'
  + '  box-shadow: 0 20px 20px -20px #333;'
  + '  margin: -50px auto 30px;'
  + '}'

  + '.shpr-terms b {'
  + '  color: #6d7984;'
  + '}'

  + '.shpr-download-button span {'
  + '  font: normal 14px/22px Open Sans, sans-serif;'
  + '  font-family: FontAwesome, open_sans;'
  + '  font-weight: normal;'
  
  + '  color: #7b7878;'
  + '}'

  + '.shpr-download-button {'
  + '  color: black;'
  + '  background-color: white;'
  + '  border-color: #ccc;'
  + '  margin-left: 5px;'
  + '  padding: 8px 0;'
  + '}'

   + '.shpr-download-button.x-btn-over {'
   + '  background-color: #ccc;'
   + '}'

   + '.shpr-download-button.x-btn-focus {'
   + '  background-color: white !important;'
   + '}'
   
  + '.shpr-select .x-form-trigger {'
  + '  vertical-align: middle;'
  + '  color: #3F73A6;'
  + '}', 'siber'
);