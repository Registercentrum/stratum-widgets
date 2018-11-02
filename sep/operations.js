
Ext.define('Septum.view.Line', {
  extend: 'Ext.chart.Chart',
  animate: true,
  shadow: false,
  height: 600,
  insetPadding: 0,
  width: '100%',
  innerPadding: {
    top: 20,
    left: 0,
    right: 30
  },

  colors: ['#efc94c', '#16dbff', '#cc2b72'],

  store: {
    fields: [],
    autoLoad: true,
    proxy: {
      type: 'ajax',
      withCredentials: true,
      reader: {
        type: 'json',
        rootProperty: 'data'
      }
    },
  },

  legend: {
    docked: 'bottom',
    border: false,
  },

  listeners: {
    render: function () {
      var year = new Date().getFullYear();
      this.series[2].setTitle(year);
      this.series[1].setTitle(year - 1);
      this.series[0].setTitle(year - 2);
    }
  },

  axes: [
    {
      type: 'numeric',
      minimum: 0,
      position: 'left',

      title: {
        text: 'Kumulativt antal registrerade operationer',
      },
      titleMargin: 40,

      style: {
        strokeStyle: '#ccc',
        marginRight: '30px'
      }
    },
    {
      type: 'category',
      position: 'bottom',
      title: 'Tid (veckor)              ',
      titleMargin: 40,
      fields: 'vecka',
      renderer: function (v) {
        return v % 10 === 0 ? v : '';
      },
      style: {
        strokeStyle: '#ccc'
      }
    }
  ],

  series: [
    {
      type: 'line',
      style: {
        lineWidth: 2
      },
      useDarkerStrokeColor: false,
      axis: 'left',
      xField: 'vecka',
      yField: 'year1',
      minimum: 100
    },
    {
      type: 'line',
      style: {
        lineWidth: 2
      },
      useDarkerStrokeColor: false,
      axis: 'left',
      xField: 'vecka',
      yField: 'year2',
    },
    {
      type: 'line',
      highlight: true,
      style: {
        lineWidth: 2
      },
      useDarkerStrokeColor: false,
      axis: 'left',
      xField: 'vecka',
      yField: 'year3',
    },
  ]
});

Ext.application({
  name: 'Septum',
  units: [],
  launch: function () {
    var target = (typeof Stratum !== 'undefined' && Stratum.containers) ? Stratum.containers['SEP/Operations'] : 'contentPanel';
    var unit = Profile && Profile.Context !== null ? Profile.Context.Unit.UnitName : 'Riket';
    var url = '/stratum/api/statistics/Sep/m1m2/?apikey=bK3H9bwaG4o=&idnr=';

    Ext.create('Septum.view.Line', {
      renderTo: target,
      unit: unit,
      store: { proxy: { url: url + WidgetConfig.id } },
    });
  },
});

Ext.util.CSS.removeStyleSheet('septum');
Ext.util.CSS.createStyleSheet(
  ' '
  + '  .x-legend-item {'
  + '    max-width: 260px;'
  + '    float: left;'
  + '    text-overflow: clip;'
  + '  }', 'septum'
);

//! Septums nya utdata 2017
