
Ext.application({
  name: 'app',
  units: [],
  launch: function () {
    var target = (typeof Stratum.containers !== 'undefined') ? Stratum.containers["SPOQ/utdata_DDH"] : 'contentPanel';

    Ext.create('Ext.container.Container', {
      items: {
        html: ''
          + '<div style="height: 2500px;">'
          + '<h2>Antal höfter med DDH fördelat på kön och ålder vid diagnostillfället (fördelat per diagnos sent  upptäckt eller komplikation)</h2>'
          + '<div id="utdataDDH"></div><div id="utdataDDH2"></div>'
          + '<h2>Undersökningsmetod efter den neonatalt utförda screeningen på BB hos barn med senupptäckt höftledsluxation</h2>'
          + '<div id="utdataDDHscreening"></div>'
          + '<div id="utdataDDHscreening2"></div>'
          + '<h2>Reposition av senupptäckt höftledsluxation?</h2>'
          + '<div id="utdataDDHscreeningB"></div>'
          + '<div id="utdataDDHscreeningB2"></div>'
          + '</div>',
      },
      renderTo: target
    });
  },
});

//grå:'#E3E4E5', lila:'#6F6789', orange:'#EA9430', mörkbblå:'#0075A4', ljusblå:#77C7D2 grön:'#C6D069'
var configDDH = {
  url: '/stratum/api/statistics/spoq/agesexdistr/?apikey=bK3H9bwaG4o=&rinvoke=1&registerid=2174',
  isPercentage: false,
  validYnames: ['Pojkar', 'Flickor'],
  categoryAttrib: 'Diagnos, ålderskategori',
  isBarChart: true,
  legendText: 'Kön',
  fixedColors: ['#0479A6', '#992B4E'],
  rotateText: false,
  withCredentials: true
}
var configDDHscreening = {
  url: '/stratum/api/statistics/spoq/tmpscreening/?apikey=bK3H9bwaG4o=&rinvoke=1&registerid=2174&sortorder=2',
  isPercentage: true,
  validYnames: ['%'],
  categoryAttrib: 'screening',
  isBarChart: true,
  legendText: '',
  //colors: ['#70688A', '#C6D069', '#0075A4','#EA9430', '#D0D1D2', '#77C7D2'],
  fixedColors: ['#77C7D2'],
  rotateText: true,
  withCredentials: true
}
var configDDHscreeningB = {
  url: '/stratum/api/statistics/spoq/tmpscreening/?apikey=bK3H9bwaG4o=&rinvoke=1&registerid=2174&sortorder=3',
  isPercentage: true,
  validYnames: ['%'],
  categoryAttrib: 'DDH_Lux_OpOpenRepos',
  isBarChart: true,
  legendText: '',
  //colors:['#E3E4E5', '#6F6789', '#C6D069'],		
  fixedColors: ['#77C7D2'],
  rotateText: false,
  withCredentials: true
}
var renderStatistics = Repository.Local.Methods.renderStatistics;
renderStatistics(true, 'utdataDDH', configDDH);
renderStatistics(false, 'utdataDDH2', configDDH);
renderStatistics(true, 'utdataDDHscreening', configDDHscreening);
renderStatistics(false, 'utdataDDHscreening2', configDDHscreening);
renderStatistics(true, 'utdataDDHscreeningB', configDDHscreeningB);
renderStatistics(false, 'utdataDDHscreeningB2', configDDHscreeningB);
