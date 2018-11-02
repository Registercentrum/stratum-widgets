
NewContext = {
  init: function () {
    this.createForm();
    this.getUnits();
    this.getContexts();
  },

  getCookie: function (name) {
    var value = '; ' + document.cookie;
    var parts = value.split('; ' + name + '=');
    var result;
    if (parts.length === 2) result = parts.pop().split(';').shift();
    if (parts.length === 3) result = parts.pop() && parts.pop().split(';').shift();
    return result;
  },

  getParameterByName: function (name) {
    var filteredName = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + filteredName + '=([^&#]*)', 'i');
    var results = location.hash ? regex.exec(location.hash) : regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  },

  getApiKey: function (url) {
    return !(url === 'rc-utv.rcvg.local' || url === 'demo.registercentrum.se') ? 'r-NYROaDruQ=' : 'Yj0IKgS-VQQ=';
  },

  getUnits: function () {
    var baseURL = window.location.hostname;
    var apikey = this.getApiKey(baseURL);
    if (true) {
      var me = this;
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
          var units = Ext.decode(this.responseText);
          Ext.getCmp('combo').getStore().loadRawData(units);
          var sid = parseInt(me.getParameterByName('sID'), 10);
          var unit;
          if (me.matchedUnits[sid]) {
            unit = me.matchedUnits[sid];
            unit && Ext.getCmp('combo').setValue(unit);
          } else {
            unit = me.getCookie('enhet');
            unit && parseInt(unit, 10);
            unit && Ext.getCmp('combo').setValue(unit);
          }
        }
      };
      xhttp.open('GET', '//' + baseURL + '/stratum/api/metadata/units/register/151?apikey=' + apikey, true);
      xhttp.send();
    }
  },

  getContexts: function () {
    var baseURL = window.location.hostname;
    if (Profile.Context) {
      var me = this;
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
          var contexts = Ext.decode(this.responseText);
          me.contexts = contexts.data.filter(function (context) { return context.Unit.Register.RegisterID === 151; });
        }
      };
      xhttp.open('GET', '//' + baseURL + '/stratum/api/authentication/contexts', true);
      xhttp.send();
    }
  },

  login: function (contextId, unitId) {
    document.cookie = 'enhet=' + unitId;
    var baseURL = window.location.hostname;
    if (contextId) {
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
          if (location.hostname === 'stratum.registercentrum.se') {
            Stratum.setLocation('page', { id: 2265 });
            Stratum.reload(true);
            location.reload();
          } else {
            window.location.href = '/registrering/#!page?id=2265';
          }
        }
      };
      var data = { 'Context': { 'ContextID': contextId } };
      data = JSON.stringify(data);
      xhttp.open('PUT', '//' + baseURL + '/stratum/api/authentication/context', true);
      xhttp.setRequestHeader('Content-Type', 'application/json');
      xhttp.send(data);
    } else {
      unitId = parseInt(Ext.getCmp('combo').getValue(), 10);
      if (!unitId) return;
      NewContext.ensureContext(unitId);
    }
  },

  ensureContext: function (unitId) {
    var cacheBuster = '?_=' + new Date().getTime();
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        NewContext.secureLogin(unitId);
      }
      if (this.readyState === 4 && this.status !== 200) {
        var errorElement = document.getElementsByClassName('shlrsw-error')[0];
        errorElement.className = 'shlrsw-error';
      }
    };

    xhttp.open('GET', 'https://stratum.registercentrum.se/api/authentication/context/ensure/' + unitId + cacheBuster, true);
    xhttp.withCredentials = true;
    xhttp.send();
  },

  secureLogin: function (unitId) {
    var cacheBuster = '?_=' + new Date().getTime();
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        var result = this.response && Ext.decode(this.response).data.Unit.UnitID;
        if (result !== unitId) {
          NewContext.loadContexts(unitId);
          return;
        }
        if (location.hostname === 'stratum.registercentrum.se') {
          Stratum.setLocation('page', { id: 2265 });
          Stratum.reload(true);
          location.reload();
        } else {
          window.location.href = '/registrering/#!page?id=2265';
        }
      }
    };

    xhttp.open('GET', 'https://stratum.registercentrum.se/api/authentication/login' + cacheBuster, true);
    xhttp.withCredentials = true;
    xhttp.send();
  },

  loadContexts: function () {
    var me = this;
    var baseURL = window.location.hostname;
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        var contexts = Ext.decode(this.responseText);
        me.contexts = contexts.data.filter(function (context) { return context.Unit.Register.RegisterID === 151; });
        var context = NewContext.isUnitAvailable();
        context && NewContext.switchContext(context);
      }
    };
    xhttp.open('GET', '//' + baseURL + '/stratum/api/authentication/contexts', true);
    xhttp.send();
  },

  switchContext: function (contextId) {
    var xhttp = new XMLHttpRequest();
    var baseURL = window.location.hostname;
    xhttp.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        if (location.hostname === 'stratum.registercentrum.se') {
          Stratum.setLocation('page', { id: 2265 });
          Stratum.reload(true);
          location.reload();
        } else {
          window.location.href = '/registrering/#!page?id=2265';
        }
      }
    };
    var data = { 'Context': { 'ContextID': contextId } };
    data = JSON.stringify(data);
    xhttp.open('PUT', '//' + baseURL + '/stratum/api/authentication/context', true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.send(data);
  },

  isUnitAvailable: function () {
    if (!this.contexts) return false;
    var validContext = this.contexts.filter(function (context) { return context.Unit.UnitID === Ext.getCmp('combo').getValue(); });
    return validContext[0] && validContext[0].ContextID;
  },

  createForm: function () {
    Ext.create('Ext.form.Panel', {
      width: '100%',
      height: 320,
      cls: 'shlrsw',
      renderTo: (typeof Stratum !== 'undefined') && Stratum.containers ? Stratum.containers['SHLR/NewContext'] : 'contentPanel',
      items: [
        {
          html: 'För att registrera ett hjärtstopp, börja med att legitimera dig.<br/>' 
          + '1. Sätt in ditt SITHS-kort i datorn.<br/>'
          + '2. Klicka OK i rutan Bekräfta certifikat.<br/>'
          + '3. Skriv in SITHS-kortets pinkod för legitimering.</br>'
          + '4. Sedan väljer du ditt sjukhus.<br/>Välj sjukhus här:<br/>'
        },
        {
          xtype: 'combobox',
          id: 'combo',
          cls: 'shlrsw-selector',
          width: '50%',
          emptyText: 'Välj sjukhus',
          queryMode: 'local',
          checkChangeEvents: ['change', 'keyup'],
          store: {
            fields: [],
            proxy: {
              type: 'ajax',
              reader: {
                type: 'json',
                rootProperty: 'data'
              }
            },
            data: [],

            sorters: [{
              property: 'UnitName',
              direction: 'ASC'
            }],

            sortOnLoad: true,

          },
          displayField: 'UnitName',
          valueField: 'UnitID'
        },
        {
          html: 'När du valt sjukhus i rutan ovanför går du vidare till registrering.<br/>' 
          + '<a onclick="NewContext.login(NewContext.isUnitAvailable(), Ext.getCmp(\'combo\').getValue());">Gå vidare till registrering här</a>.<br/>'
          + 'Det kan ta ett par sekunder innan registreringsapplikationen öppnar sig.<br/>'
          + 'Observera att knappen ”Logga in” längst uppe till höger på webbsidan endast används av dem som registrerar Uppföljning och PROM.<br/>'
          + '<div class="shlrsw-error shlrsw-hidden">Det fungerade inte. Försäkra dig om att ditt SITHS-kort sitter i.</div>',
          cls: 'link-label'
        }
      ]
    });
  },

  matchedUnits: {
    1: 4956,
    2: 4957,
    3: 4958,
    4: 4959,
    5: 4960,
    6: 4961,
    7: 4962,
    8: 4963,
    9: 4964,
    10: 4965,
    11: 4966,
    12: 4967,
    13: 4968,
    15: 4969,
    16: 4970,
    17: 4971,
    18: 4972,
    19: 4973,
    20: 4974,
    21: 4975,
    22: 4976,
    23: 4977,
    24: 4978,
    25: 4979,
    26: 4980,
    27: 4981,
    28: 4982,
    29: 4983,
    30: 4984,
    31: 4985,
    32: 4986,
    33: 4987,
    34: 4988,
    35: 4989,
    36: 4990,
    37: 4991,
    38: 4992,
    39: 4993,
    40: 4994,
    41: 4995,
    42: 4996,
    43: 4997,
    44: 4998,
    45: 4999,
    46: 5000,
    47: 5001,
    48: 5002,
    49: 5003,
    50: 5004,
    51: 5005,
    52: 5006,
    53: 5007,
    54: 5008,
    56: 5009,
    57: 5010,
    58: 5011,
    59: 5012,
    60: 5013,
    61: 5014,
    62: 5606,
    63: 5016,
    64: 5017,
    65: 5018,
    66: 5019,
    67: 5020,
    68: 5021,
    69: 5022,
    70: 5023,
    72: 5024,
    73: 5025,
    75: 5026,
    76: 5027,
    77: 5028,
    78: 5029,
    79: 5030,
    80: 5031,
    81: 5032,
    82: 5033,
    83: 5034,
    84: 5035,
    85: 5605,
    86: 5036,
    87: 5037,
    88: 5038,
    89: 5039,
    90: 5040,
    92: 5041
  },
};

Ext.util.CSS.removeStyleSheet('shlrsw');
Ext.util.CSS.createStyleSheet('' 
  + '.shlrsw .shlrsw-selector div {height: 40px; border-radius: 3px; border-color: #5399a4; margin: 10px 0}'
  + '.shlrsw .link-label {display: inline-block;}'
  + '.shlrsw .link-label a {cursor: pointer;}'
  + '.shlrsw .shlrsw-selector input {color: #5399a4}'
  + '.shlrsw-hidden {visibility: hidden}'
  + '.shlrsw-error {color: red; margin-top: 5px;}'
  + '.shlrsw .x-panel-default, .x-panel-body-default{ border:none;}', 'shlrsw');

NewContext.init();
