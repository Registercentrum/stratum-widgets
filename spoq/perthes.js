
var containerHtml = ''
  + '<div>'
  + '<h1>Antal höfter med LCPD fördelat på kön och ålder (år) vid diagnostillfället</h1>'
  + '<div id="utdataPerthes"></div>'
  + '<div id="utdataPerthes2"></div>'
  + '<h1>Operationsmetod vid primäroperation</h1>'
  + '<div id="utdataPerthesOpmethods"></div>'
  + '<div id="utdataPerthesOpmethods2"></div>'
  + '</div>';

Ext.create('Ext.container.Container', {
  renderTo: (Stratum.containers && Stratum.containers['SPOQ/utdata_perthes']) || 'main-container',
  html: containerHtml,
  listeners: {
    afterRender: function () {
      var configPerthes = {
        url: '/stratum/api/statistics/spoq/agesexdistr/?registerid=2190',
        isPercentage: false,
        validYnames: ['Pojkar', 'Flickor'],
        categoryAttrib: 'Ålderskategori',
        isBarChart: true,
        legendText: 'Kön',
        fixedColors: ['#0479A6', '#992B4E'],
        rotateText: false
      };

      var configPerthesOpMethods = {
        url: '/stratum/api/statistics/spoq/tmpscreening/?registerid=2190&sortorder=3',
        isPercentage: false,
        validYnames: ['n'],
        categoryAttrib: 'opmetod',
        isBarChart: true,
        fixedColors: ['#0075A4'],
        legendText: '',
        rotateText: true
      };
      
      var renderStatistics = Repository.Local.Methods.renderStatistics;
      renderStatistics(true, 'utdataPerthes', configPerthes);
      renderStatistics(false, 'utdataPerthes2', configPerthes);
      renderStatistics(true, 'utdataPerthesOpmethods', configPerthesOpMethods);
      renderStatistics(false, 'utdataPerthesOpmethods2', configPerthesOpMethods);
    },
  },
});
