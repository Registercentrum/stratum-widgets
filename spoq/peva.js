
var containerHtml = ''
  + '<div>'
  + '<h2>Antal klumpfötter fördelat på kön och ålder vid första ortopediska bedömning</h2>'
  + '<div id="utdataPEVA"></div>'
  + '<div id="utdataPEVA2"></div>'
  + '<h2>Antal klumpfötter uppdelade efter primär Piraniscore och fördelade på om det finns atypiska tecken eller inte</h2>'
  + '<div id="utdataPevaPiraniAtypisk"></div>'
  + '<div id="utdataPevaPiraniAtypisk2"></div>'
  + '<h2>Antal klumpfötter uppdelat på primär Piraniscore och antal gipsningar</h2>'
  + '<h3>I varje grupp anges också hur stor andel som genomgått akillotenotomi</h3>'
  + '<h3 id="unitHeader1"><b>Aktuell enhet:</b></h3>'
  + '<div id="utdataPevaGrid">'
  + '<p id="unitHeader2" style="white-space: pre;">Piraniscore                       1-2                                    2,5-4                                    4,5-6                                Uppgift saknas</p>'
  + '</div>'
  + '<h3><b>Riket:</b></h3>'
  + '<div id="utdataPevaGrid2">'
  + '<p style="white-space: pre;">Piraniscore                       1-2                                    2,5-4                                    4,5-6                                Uppgift saknas</p>'
  + '</div> '
  + '</div>';
try {
  Ext.create('Ext.container.Container', {
    renderTo: (Stratum.containers && Stratum.containers['SPOQ/utdata_PEVA']) || 'main-container',
    html: containerHtml,
    listeners: {
      afterRender: function () {
        var configPEVA = {
          url:
            '/stratum/api/statistics/spoq/agesexdistr/?apikey=bK3H9bwaG4o=&rinvoke=1&registerid=2177',
          isPercentage: false,
          validYnames: ['Pojkar', 'Flickor'],
          categoryAttrib: 'Ålderskategori',
          isBarChart: true,
          legendText: 'Kön',
          fixedColors: ['#0479A6', '#992B4E'],
          rotateText: false,
        };
        var configPevaPiraniAtypisk = {
          url:
            '/stratum/api/statistics/spoq/tmpscreening/?apikey=bK3H9bwaG4o=&rinvoke=1&registerid=2177&sortorder=2',
          isPercentage: false,
          validYnames: ['Typisk', 'Atypisk'],
          categoryAttrib: 'pirani',
          isBarChart: true,
          fixedColors: ['#6F6789', '#EA9430', '#77C7D2'],
          legendText: ' ',
          rotateText: false,
        };
        var configPevaGrid = {
          url:
            '/stratum/api/statistics/spoq/tmpscreening/?apikey=bK3H9bwaG4o=&rinvoke=1&registerid=2177&sortorder=3',
          isGrid: true,
          categoryAttrib: '',
          validYnames: [],
        };
        if (!Profile.Context) {
          document.getElementById('unitHeader1').style.visibility = 'hidden';
          document.getElementById('unitHeader2').style.visibility = 'hidden';
        }
        var renderStatistics = Repository.Local.Methods.renderStatistics;
        renderStatistics(true, 'utdataPEVA', configPEVA);
        renderStatistics(false, 'utdataPEVA2', configPEVA);
        renderStatistics(
          true,
          'utdataPevaPiraniAtypisk',
          configPevaPiraniAtypisk
        );
        renderStatistics(
          false,
          'utdataPevaPiraniAtypisk2',
          configPevaPiraniAtypisk
        );
        renderStatistics(true, 'utdataPevaGrid', configPevaGrid);
        renderStatistics(false, 'utdataPevaGrid2', configPevaGrid);
      },
    },
  });
} catch (error) { location.reload(); }
