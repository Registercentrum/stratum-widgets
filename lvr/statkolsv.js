
(function() {
  var s, OVWidget = {
      settings: {},
      init: function() {
          s = this.settings;
          Repository.Local.Methods._initOnce();
          Ext.fly('mainContainer').mask('Laddar data ...');
      },
      /**
       * Returns an array containing week strings on the format 2014-38
       */
      getListOfWeeks: function(nWeeksFromToday) {
          var currentDate = new Date(),
              i, weeks = [];
          for (i = 0; i < nWeeksFromToday; i++) {
              weeks.push(Ext.Date.format(Ext.Date.subtract(currentDate, Ext.Date.DAY, 7 * i), 'Y-W'));
          }
          return weeks;
      },
      /**
       * @param {Object} weekStatistics an object of type {'2012-09': 4, '2012-10': 45, ..}
       */
      sumWeeks: function(nWeeksFromToday, weekStatistics) {
          var weeks = this.getListOfWeeks(nWeeksFromToday),
              sum = 0;
          Ext.each(weeks, function(week) {
              sum += weekStatistics[week] || 0;
          });
          return sum;
      },
      _calculateSelectedIndicator: function(id) {
          var currIndicator = s.indicators[id],
              clinic = 'ClinicALL=0',
              sum = currIndicator.sums[clinic],
              selectedIndicator = currIndicator[clinic][currIndicator.indicator];
          if (!currIndicator) {
              return;
          }
          currIndicator.value = sum > 0 && selectedIndicator ? 100 * selectedIndicator / sum : 0;
      },
      _dataCollectedCallback: function(data, id, callback) {
          if (typeof id !== 'undefined' && s.indicators[id] && data) {
              Ext.mergeIf(s.indicators[id], data);
              OVWidget._calculateSelectedIndicator(id);
          }
          if (typeof s.nCallbacks === 'number' && --s.nCallbacks <= 0) {
              delete s.nCallbacks;
              Ext.isFunction(callback) && callback(s.indicators);
          }
      },
      getData: function(opts) {
          var clinicAll;

          if (!opts || !opts.url) {
              return; //callback
          }

          clinicAll = opts.singleUnit ? 'ClinicALL=0' : 'ClinicALL=1';
          opts._retData = opts._retData || {
              sums: {}
          };
          opts._retData.sums[clinicAll] = 0;
          opts._retData[clinicAll] = {};
          Ext.Ajax.request({
              //TODO: Fix relative path
              method: 'get',
              url: '/api/aggregate/LVR/Inpatient/' + (opts.singleUnit ? 'Unit/' : 'Total/') + opts.url + '/week(InpDate)',
              success: function(response) {
                  var rData = Ext.decode(response.responseText);

                  Ext.Object.each(rData.data, function(value, weekValues) {
                      opts._retData.sums[clinicAll] += opts._retData[clinicAll][value === 'null' ? 'Okänt' : value] = (OVWidget.sumWeeks(65, weekValues));
                  });
                  // OVWidget.print(Ext.encode(opts._retData));
                  if (!opts.singleUnit) {
                      //Get unit specific data from api by recursive call
                      opts.singleUnit = true;
                      OVWidget.getData(opts);
                  } else {
                      OVWidget._dataCollectedCallback(opts._retData, opts.id, opts.callback);
                  }
              },
              failure: function() {
                  OVWidget._dataCollectedCallback(null, null, opts.callback);
              }
          });
      },
      getAllData: function(callbackFn) {
          s.nCallbacks = 0;
          Ext.Object.each(s.indicators, function(id, indicator) {
              s.nCallbacks += typeof indicator.sums === 'undefined' ? 1 : 0; //check if indicator data is already loaded
          });
          Ext.Object.each(s.indicators, function(id, indicator) {
              if (typeof indicator.sums === 'undefined') {
                  OVWidget.getData({
                      url: indicator.url,
                      id: id,
                      callback: callbackFn
                  });
              }
          });
          if (s.nCallbacks === 0) {
              callbackFn(s.indicators);
          }
      }
  };
  OVWidget.init();

  //Caching of data currently disabled due to context switches...
  s.indicators = Repository.Local.LVRSVKOL = /*Repository.Local.LVRSVKOL ||*/ {
      'a01': {
          indicator: 'Ja',
          descName: 'behandlats med antibiotika vid missfärgad sputa',
          desc: 'Antibiotika vid missfärgad sputa',
          upperLimit: 80,
          url: 'count(InpSputum(1))/InpAntibiotics',
          colors: ['#9BBB59', '#C0504D']
      },
      'a02': {
          indicator: 'Ja',
          descName: 'har erhållit NIV-behandling vid uppfylld indikation',
          desc: 'NIV-behandling vid uppfylld indikation',
          upperLimit: 80,
          url: 'count(InpNIVFulfilled(1))/InpNIVorBPAP',
          colors: ['#9BBB59', '#C0504D']
      },
      'a03': {
          indicator: 'Okänt',
          descName: 'saknar svar om åtgärd vid BMI<22',
          desc: 'Åtgärd vid BMI<22',
          upperLimit: 20,
          invert: true,
          url: 'count(InpBMI(22))/InpActionLowBMI',
          colors: ['#4F6228', '#9BBB59']
      },
      'a04': {
          indicator: 'Ja',
          descName: 'avlidna under vårdtillfälle',
          desc: 'Avlidna under vårdtillfälle',
          upperLimit: 10,
          invert: true,
          url: 'Count/InpDeceased/',
          colors: ['#C0504D', '#9BBB59']
      },
      'a05': {
          indicator: 'Nej',
          descName: 'utan planerad uppföljning efter inneliggande vård',
          desc: 'Planerad uppföljning efter inneliggande vård',
          upperLimit: 10,
          invert: true,
          url: 'Count/InpFollowup',
          colors: ['#4F6228', '#9BBB59', '#C0504D']
      },
      'a06': {
          indicator: 'Ja',
          upperLimit: 90,
          descName: 'rökare som erbjudits rökavvänjning',
          desc: 'Rökare som erbjudits rökavvänjning',
          url: 'count(InpSmoking(1))/InpSmokingCessation',
          colors: ['#9BBB59', '#C0504D']
      }
  };

  OVWidget.getAllData(function(data) {
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
                      insetPadding: {top: 55, right: 25, left: 25, bottom: 25},
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
          items: Repository.Local.Methods.getSmallGaugesInits(data, chart, true)
      });
      Ext.fly('mainContainer').unmask();
  });
}());
