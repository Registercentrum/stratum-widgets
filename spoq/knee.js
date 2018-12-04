
var containerHtml = ''
  + '<h1>Antal knäskador fördelat på kön och ålder (år) vid skadetillfället</h1>'
  + '<div id="utdataKna"></div>'
  + '<div id="utdataKna2"></div>'
  + '<h1>Fördelning av diagnostiska metoder och kombinationer av dessa</h1>'
  + '<div id="utdataKnascreening"></div>'
  + '<div id="utdataKnascreening2"></div> '
  + '<h1>Fördelning av primär behandling vid de tre vanligaste knäskadorna</h1>'
  + '<div id="utdataKnaOpMethods"></div>'
  + '<div id="utdataKnaOpMethods2"></div>';
try {
  Ext.create('Ext.container.Container', {
    renderTo: (Stratum.containers && Stratum.containers['SPOQ/utdata_kna']) || 'contentPanel',
    html: containerHtml,
    listeners: {
      afterRender: function () {
        var configKna = {
          url: '/stratum/api/statistics/spoq/agesexdistr/?registerid=2171',
          isPercentage: false,
          validYnames: ['Pojkar', 'Flickor'],
          categoryAttrib: 'Ålderskategori',
          isBarChart: true,
          legendText: 'Kön',
          fixedColors: ['#0479A6', '#992B4E'],
          rotateText: false
        };
        var configKnascreening = {
          url: '/stratum/api/statistics/spoq/tmpscreening/?registerid=2171&sortorder=2',
          isPercentage: true,
          validYnames: ['%'],
          categoryAttrib: 'diagnmetod',
          isBarChart: true,
          legendText: '',
          fixedColors: ['#77C7D2'],
          rotateText: true
        };
        var configKnaOpMethods = {
          url: '/stratum/api/statistics/spoq/tmpscreening/?registerid=2171&sortorder=3',
          isPercentage: true,
          validYnames: ['Kirurgisk behandling', 'Icke-kirurgisk behandling', 'Ingen specifik behandling'],
          categoryAttrib: 'commondiagn',
          isBarChart: true,
          fixedColors: ['#EA9430', '#6F6789', '#77C7D2'],
          legendText: ' ',
          rotateText: false
        };
        var renderStatistics = Repository.Local.Methods.renderStatistics;
        renderStatistics(true, 'utdataKna', configKna);
        renderStatistics(false, 'utdataKna2', configKna);

        renderStatistics(true, 'utdataKnascreening', configKnascreening);
        renderStatistics(false, 'utdataKnascreening2', configKnascreening);

        renderStatistics(true, 'utdataKnaOpMethods', configKnaOpMethods);
        renderStatistics(false, 'utdataKnaOpMethods2', configKnaOpMethods);
      },
    },
  });
} catch (error) { location.reload(); }
