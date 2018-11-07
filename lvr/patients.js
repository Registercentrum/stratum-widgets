
Ext.define('LvrStore', {
  extend: 'Ext.data.Store',
  // Maintains order as set by the server
  grouper: {
      property: 'indicator',
      sorterFn: function (a, b) {
          return a;
      },
  },

  fields: [
      { name: 'indicator', mapping: 'Tabell' },
      { name: 'total', mapping: 'Antal' },
      { name: 'ratio', mapping: 'Andel' },
      { name: 'result', mapping: 'Utfall' },
      { name: 'total-state', mapping: 'Antal registret' },
      { name: 'ratio-state', mapping: 'Andel registret' },
      { name: 'diagnosis', mapping: 'Diagnos' }
  ],
  proxy: {
      type: 'ajax',
      url: '/stratum/api/statistics/lvr/patientoversikt',
      cors: true,
      withCredentials: true,
      reader: {
          type: 'json',
          rootProperty: 'data',
      },
      extraParams: {
          // apikey: API_KEY,
          // unitid: UNIT_ID, 
          // diagnos: DIAGNOSIS,
      },
      withCredentials: true,
      pageParam: false,
      startParam: false,
      limitParam: false
  },

});

Ext.define('LvrPanel', {
  extend: 'Ext.grid.Panel',
  columnWidth: 1,
  width: '100%',
  features: [{ ftype: 'grouping', hideGroupedHeader: true, groupHeaderTpl: '{name}', collapsible: false,  align: 'right' }],

  margin: {
      bottom: 20
  },
  disableSelection: true,
  columns: [
      // { text: 'Tabell', cellWrap: true, flex: 1, dataIndex: 'indicator' },
      { text: '', cellWrap: true, flex: 1, minWidth: 240, dataIndex: 'result' },
      { text: 'Antal', cellWrap: true, flex: 1, dataIndex: 'total', align: 'right' },
      { text: 'Andel', cellWrap: true, flex: 1, dataIndex: 'ratio', align: 'right' },
      { text: 'Antal registret', cellWrap: true, flex: 1, minWidth: 135, dataIndex: 'total-state', align: 'right' },
      { text: 'Andel registret', cellWrap: true, flex: 1, minWidth: 135, dataIndex: 'ratio-state', align: 'right' },
  ],
});

Ext.onReady(function () {
  var diagnosStore = Ext.create('LvrStore', {});
  var kolStore = Ext.create('LvrStore', {});
  var astmaStore = Ext.create('LvrStore', {});
  var target = (typeof Stratum.containers != 'undefined') ? Stratum.containers["LVR/Patients"] : 'main-container';
  
  //Show spinner
  var container = Ext.fly(target);
  if (container) {
      container.mask('Laddar data ...');
  }

  Ext.Ajax.request({
      type: 'ajax',
      method: 'get',
      cors: true,
      withCredentials: true,
      url: '/stratum/api/statistics/lvr/patientoversikt',
      success: function (response, opts) {

          // Insert additional rows into the table
          var isExtendedVersion = response.responseText.search(/CAT\ saknas[^}]*},/) > 0;
          if (isExtendedVersion) {
              var splicePositionCAT = response.responseText.indexOf('{"Section":"KOL","Tabell":"Stadiumf');
              var insertTextCAT = '{"Section":"KOL","Tabell":"CAT","Utfall":"*Av patienter med uppgift om CAT","Antal":"","Andel":"","Antal registret":"","Andel registret":"","Enhet":""},';
              response.responseText = [response.responseText.slice(0, splicePositionCAT), insertTextCAT, response.responseText.slice(splicePositionCAT)].join('');

              var splicePositionACT = response.responseText.indexOf('{"Section":"Astma","Tabell":"K');
              var insertTextACT = '{"Section":"Astma","Tabell":"ACT","Utfall":"*Av patienter med uppgift om ACT","Antal":"","Andel":"","Antal registret":"","Andel registret":"","Enhet":""},';

              response.responseText = [response.responseText.slice(0, splicePositionACT), insertTextACT, response.responseText.slice(splicePositionACT)].join('');
          }

          response.responseText = response.responseText.replace(/NA/g, '');

          //Insert data into stores
          diagnosStore.loadRawData(response);
          diagnosStore.filter('Section', 'Diagnos');
          kolStore.loadRawData(response);
          kolStore.filter('Section', 'Kol');
          astmaStore.loadRawData(response);
          astmaStore.filter('Section', 'Astma');
          Ext.create('LvrPanel', { renderTo: target, store: diagnosStore, title: 'Diagnos' });
          Ext.create('LvrPanel', { renderTo: target, store: kolStore, title: 'Kol' });

          //Show last table in case of extended information
          if (response.responseText.indexOf('astma') > 0) {
              Ext.create('LvrPanel', { renderTo: target, store: astmaStore, title: 'Astma' });
          }

          // Remove spinner
          var container = Ext.fly(target);
          if (container) {
              container.unmask();
          }
      }
  });

});

//! Forgot to change sourceUrl?
