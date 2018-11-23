
//Caching of data currently disabled due to context switches...
Repository.Local.LVRASTMA = /*Repository.Local.LVRASTMA ||*/ {
  overviewAstma: {
      '3101': {
          indicator: '<=19',
          descName: 'patienter med registrerat <b>AKT under 20</b>',
          upperLimit: 0,
          invert: true,
          desc: 'AKT',
          colors: ['#9BBB59', '#C0504D']
      },
      '3104': {
          indicator: 'Röker',
          descName: 'som <b>röker</b>',
          upperLimit: 0,
          invert: true,
          desc: 'Astmapatienters Rökvanor',
          colors: ["#4F6228", "#9BBB59", "#C0504D"]
      },
      '3105': {
          indicator: 'Erhållit utbildning',
          descName: 'som erhållit <b>utbildning</b>',
          upperLimit: 80,
          lowerLimit: 40,
          desc: 'Andel astmapatienter som någon gång erhållit Patientutbildning',
          colors: ['#C0504D', '#9BBB59']
      },
      '3106': {
          indicator: 'Registrerade',
          descName: 'Registreringsandel',
          desc: 'Andel astmapatienter med någon registrering',
          hidden: true
      },
      '3107': {
          indicator: '<80%',
          descName: 'FEV 1% <b><80%</b>',
          upperLimit: 0,
          invert: true,
          desc: 'Andel astmapatienter med FEV1% av förväntat <80%',
          colors: ['#C0504D', '#9BBB59']
      },
      '3121': {
          indicator: 'Ja',
          descName: 'har <b>luftvägsallergi</b>',
          desc: 'Luftvägsallergi'
      }
  }
};
  Ext.fly('mainContainer').mask('Laddar data ...');
  Repository.Local.Methods.initialize(Repository.Local.LVRASTMA.overviewAstma, function() {
      var lvrastma = Repository.Local.LVRASTMA;

      //Create big Gauge for registration ratio
      Ext.create('Ext.container.Container', {
          margin: '10px 10px',
          renderTo: 'mainContainer',
          layout: {
              type: 'vbox',
              align: 'center'
          },
          items: [{
              xtype: 'container',
              data: lvrastma.overviewAstma['3106'] || [],
              tpl: '{descName}',
              style: {
                  fontSize: '20px'
              },
              margin: '0 0 10px 0'
          }, {
              xtype: 'heatgauge',
              width: 120,
              height: 60,
              valueField: 'value',
              background: '#fff',
              lowerLimitField: 'lowerLimit',
              upperLimitField: 'upperLimit',
              store: Ext.create('Ext.data.JsonStore', {
                  fields: ['value', 'lowerLimit', 'upperLimit'],
                  data: [lvrastma.overviewAstma['3106']]
              })
          }, {
              xtype: 'container',
              data: lvrastma.overviewAstma['3106'],
              tpl: '{[Ext.util.Format.number(values.value || 0, "0%")]}',
              margin: '0 2px 0 10px',
              style: {
                  fontSize: '24px'
              }
          }]
      });
      /*
       * Create hidden bar chart for comparison with the registry
       * shown when clicking on gauges...
       */
      var chart = Ext.create('Ext.chart.Chart', {
          store: Ext.create('Ext.data.Store', {
              fields: ['unit', 'value']
          }),
          // theme: 'LVRTheme',
          hidden: true,
          animate: true,
          shadow: false,
          columnWidth: 1,
          height: 400,
          insetPadding: {
              top: 55,
              right: 25,
              left: 25,
              bottom: 25
          },
          margin: 2,
          style: {
              border: '1px solid #ddd',
              borderRadius: '3px'
          },
          legend: {
              dock: 'bottom'
                  // boxStrokeWidth: 0
          },
          axes: [{
              type: 'numeric',
              position: 'left',
              minimum: 0,
              grid: true,
              dashSize: 0,
              renderer: Ext.util.Format.numberRenderer('0%')
          }, {
              type: 'category',
              position: 'bottom',
              fields: ['unit']
          }]
      });
      Ext.create('Ext.container.Container', {
          renderTo: 'mainContainer',
          layout: {
              type: 'column',
              align: 'center'
          },
          items: Repository.Local.Methods.getSmallGaugesInits(lvrastma.overviewAstma, chart, true)
      });
      Ext.fly('mainContainer').unmask();
  });
