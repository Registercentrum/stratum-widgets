
Ext.Loader.loadScript({
  url: '/stratum/extjs/scripts/exporter.js',
  onLoad: function () { }
});

Ext.Loader.loadScript({
  url: '/stratum/extjs/scripts/pivot.js',
  onLoad: function () { onReady(); }
});
 
var params = {
    ContextID: 32558,
    IsActive: true,
    /*
    Role: {
      RoleID: 903,
    }
    */
}


Ext.Ajax.request({
  url: 'http://w10-076.rcvg.local/stratum/api/metadata/contexts/32558',
  method: 'PUT',
  jsonData: params,
  withCredentials: true,
  success: function (result, request){
    console.log(Ext.decode(result.responseText));
  },
  failure: function (result, request){
    console.log(result.responseText);
  }
});

function onReady() {
  Ext.define('RC.UserAdministration.controller.FileController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.drag-file',

    afterRender: function (view) {
      var body = view.body;

      if (window.File && window.FileList && window.FileReader) {
        this.target = new Ext.drag.Target({
          element: body,
          listeners: {
            scope: this,
            dragenter: this.onDragEnter,
            dragleave: this.onDragLeave,
            drop: this.onDrop,
            dragover: this.beforeDrop
          }
        });
      } else {
        body.down('.drag-file-label').setHtml(
          'File dragging is not supported by your browser'
        );
        body.el.addCls('nosupport');
      }
    },

    onDragEnter: function () {
      this.getView().body.addCls('active');
    },

    onDragLeave: function () {
      this.getView().body.removeCls('active');
    },

    beforeDrop: function () {
      return true;
    },

    onDrop: function (target, info) {
      var view = this.getView();
      var body = view.body;
      // var icon = body.down('.drag-file-icon');
      var reader = new FileReader();

      body.removeCls('active');
      reader.onload = this.read;
      reader.readAsText(info.files[0]);
    },

    destroy: function () {
      Ext.undefer(this.timer);
      this.target = Ext.destroy(this.target);
      this.callParent();
    },

    read: function (e) {
      var content = e.target.result;
      console.log(content);
    }
  });

  Ext.define('RC.UserAdministration.view.FileDrop', {
    extend: 'Ext.panel.Panel',
    xtype: 'filedrop',
    controller: 'drag-file',
    title: 'File Drag',
    width: 500,
    height: 300,
    bodyPadding: 5,
    layout: 'fit',
    renderTo: 'contentPanel',
    bodyCls: 'drag-file-ct',
    // html: '<div class="drag-file-icon" style="height: 100%; width: 100%";></div>'
  });

  Ext.define('RC.UserAdministration.storage.Data', {
    mixins: ['Ext.mixin.Observable'],
    config: {
      users: [],
      contexts: [],
      units: [],
      observers: []
    },
    constructor: function (config) {
      this.initConfig(config);
      this.callParent(config);
      this.loadData();
    },
    initComponent: function () {
      debugger;
    },
    loadData: function () {
      var controller = this;
      Ext.Promise.all([
        Ext.Ajax.request({ url: '/stratum/api/metadata/users/register/' + Profile.Site.Register.RegisterID }),
        Ext.Ajax.request({ url: '/stratum/api/metadata/contexts/register/' + Profile.Site.Register.RegisterID }),
        Ext.Ajax.request({ url: '/stratum/api/metadata/units/register/' + Profile.Site.Register.RegisterID}),
      ]).then(function (results) {
          var users = Ext.decode(results[0].responseText).data;
          var contexts = Ext.decode(results[1].responseText).data;
          var units = Ext.decode(results[2].responseText).data;

          controller.setUsers(users);
          controller.setContexts(contexts);
          controller.setUnits(units);
          
          controller.getObservers().forEach(function(observer) {
            observer.fireEvent('dataloaded', controller);
          })
        });
    }
  }); 

  Ext.define('RC.UserAdministration.view.Filter', {
    extend: 'Ext.form.field.ComboBox',
    xtype: 'rcfilter',
    alias: 'view.rcfilter',
    forceSelection: false,
    typeAhead: true,
    queryMode: 'local',
    minChars: 1,
    anyMatch: true,
    autoSelect: false,
    caseSensitive: false,
    checkChangeEvents: ['change', 'keyup'],

    constructor: function (config) {
      config.queryMode = 'local';
      config.listeners = { select: config.selectCallback };
      this.callParent(arguments);
    }
  });

  Ext.define('RC.UserAdministration.controller.UserController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.user',
    config: {
      loader: null,
      ownUsers: null,
      ownLoaded: false
    },

    export: function () {
      Ext.util.CSV.delimiter = ';';
      this.getView().saveDocumentAs({ type: 'csv', fileName: 'users.csv' });
    },
    mail: function () { 
      console.log('mailed'); 
    },

    edit: function () { 
      console.log('edited'); 
    },
    
    updateStores: function (dataLoader) {
      var units = dataLoader.getUnits();
      var users = dataLoader.getUsers();
      var contexts = dataLoader.getContexts();
      
      this.loadOwnUnits(units);
      this.loadOwnUsers(users, contexts);
      this.setLoader(dataLoader);
    },

    loadOwnUnits: function (units) {
      var unitFilter = this.getView().down('#unitFilter');
      var unitStore = unitFilter.getStore();
      unitStore.loadData(units);
      unitStore.add({ UnitName: 'Alla', UnitID: 0 });
      unitStore.sort({ property: 'UnitName', direction: 'ASC' });
      unitFilter.setValue(0);
    },

    loadOwnUsers: function (users, contexts) {
      var userStore = this.getView().getStore();
      this.addContexts(users);
      this.join(users, contexts);
      userStore.loadData(users);
      this.updateGrid();
      this.ownUsers = users;
    },

    join: function (a, b) {
      b.forEach(function (context) {
        var user = a.filter(function (item) { return context.User.Username === item.Username; });
        user[0].Contexts.push(context);
      });
    },

    addContexts: function (users) {
      users.forEach(function (item) {
        item.Contexts = [];
      });
    },

    createUserFilter: function (user, role) {
      var filter = function (item) {
        var contexts = item.data.Contexts;
        if (contexts) {
          var isDeveloper = contexts.filter(function (context) { return context.Role.RoleID === 906; }).length !== 0;
          var showDevelopers = role === 906;
          if (isDeveloper && !showDevelopers) { return false; }
          if (user === '') { return true; }
          var unitContexts = contexts.filter(function (context) { 
            return Ext.String.startsWith(context.User.Username, user, true) || Ext.String.startsWith(context.User.FirstName, user, true) || Ext.String.startsWith(context.User.LastName, user, true); 
          });
          var isPartOfUnit = unitContexts.length !== 0;
          return isPartOfUnit;
        }
        return true;
      };
      return filter;
    },

    createUnitFilter: function (unit, role) {
      var filter = function (item) {
        var contexts = item.data.Contexts;
        if (contexts) {
          var isDeveloper = contexts.filter(function (context) { return context.Role.RoleID === 906; }).length !== 0;
          var showDevelopers = role === 906;
          if (isDeveloper && !showDevelopers) { return false; }
          if (unit === 0) { return true; }
          var unitContexts = contexts.filter(function (context) { return context.Unit.UnitID === unit; });
          var isPartOfUnit = unitContexts.length !== 0;
          return isPartOfUnit;
        }
        return true;
      };
      return filter;
    },

    createRoleFilter: function (role) {
      var filter = function (item) {
        var contexts = item.data.Contexts;
        if (contexts && role) {
          var isDeveloper = contexts.filter(function (context) { return context.Role.RoleID === 906; }).length !== 0;
          var roles = contexts.filter(function (context) { return context.Role.RoleID === role && (role === 906 || !isDeveloper); });
          var isInRole = roles.length !== 0;
          return isInRole;
        }
        return true;
      };

      return filter;
    },

    createActiveFilter: function (active, role) {
      var filter = function (item) {
        var contexts = item.data.Contexts;
        if (contexts) {
          var isDeveloper = contexts.filter(function (context) { return context.Role.RoleID === 906; }).length !== 0;
          var showDevelopers = role === 906;
          if (isDeveloper && !showDevelopers) { return false; }
          if (active === 0) { return true; }
          var activeContexts = contexts.filter(function (context) { return context.IsActive === true; });
          var isActive = activeContexts.length !== 0;
          return (active === 1 && isActive) || (active === 2 && !isActive);
        }
        return true;
      };

      return filter;
    },

    updateGrid: function () {
      var store  = this.getView().getStore();
      var user   = this.getView().down('#userFilter').getValue();
      var unit   = this.getView().down('#unitFilter').getValue();
      var role   = this.getView().down('#roleFilter').getValue();
      var active = this.getView().down('#activeFilter').getValue();

      store.clearFilter();
      store.addFilter(this.createUserFilter(user, role));
      store.addFilter(this.createUnitFilter(unit, role));
      store.addFilter(this.createRoleFilter(role));
      store.addFilter(this.createActiveFilter(active, role));
    },

    searchOwn: function () {
      if(!this.ownLoaded) {
        this.getView().getStore().loadData(this.ownUsers);
        this.ownLoaded = true;
      }
      this.getView().down('#labelBar').show(); // collapse(Ext.Component.DIRECTION_TOP, 5000);
      this.getView().down('#filterBar').show();
      this.updateGrid();
    },

    searchAll: function () {
      this.ownLoaded = false;
      this.getView().down('#labelBar').hide();
      this.getView().down('#filterBar').hide();
      var me = this;
      var userQuery   = this.getView().down('#userFilter').getValue();
      this.loadUsers(userQuery).then(function (response) { me.followupAction(response); });
    },

    loadUsers: function (query) {
      var deferred = new Ext.Deferred();
      Ext.Ajax.request({
        url: '/stratum/api/metadata/users?query=' + query,
        success: function (response) {
          deferred.resolve(response);
        },
        failure: function (response) {
          deferred.reject(response);
        }
      });
      return deferred.promise;
    },

    followupAction: function (response) {
      this.getView().getStore().loadRawData(Ext.decode(response.responseText).data)
      console.log('followup');
    } 
  });

  Ext.define('RC.UserAdministration.view.UserGrid', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.usergrid',
    controller: 'user',
    multiSelect: true,
    selModel: 'rowmodel',
    width: 750,

    initComponent: function () {
      this.callParent();
    },

    plugins: {
      gridexporter: true,
    },
    
    listeners: {
      dataloaded: 'updateStores'
    },

    header: {
      style: {
        backgroundColor: Profile.Site.ThemeSettings.BaseColor
      },
      title: {
        text: 'Användare',
        style: {
          color: 'white'
        }
      },
    },

    store: {
      data: [],
      filters: []
    },

    columns: [
      {
        text: 'Förnamn',
        dataIndex: 'FirstName',
        flex: 1,
        sortable: true
      }, {
        text: 'Efternamn',
        dataIndex: 'LastName',
        flex: 1,
        sortable: true
      }, {
        text: 'Användarnamn',
        dataIndex: 'Username',
        flex: 1,
        sortable: true
      }, {
        text: 'Titel',
        dataIndex: 'WorkTitle',
        flex: 1,
        sortable: true
      }, {
        text: 'Organisation',
        dataIndex: 'Organization',
        flex: 1,
        sortable: true
      }
    ],

    dockedItems: [
      {
        xtype: 'toolbar',
        dock: 'top',
        items: [
          {
            xtype: 'textfield',
            itemId: 'userFilter',
            flex: 3,
            keyMap: {
              'ctrl+enter': {
                handler: 'searchAll'
              },
              'enter': {
                handler: 'searchOwn'
              },
            },
          },
          {
            xtype: 'button',
            text: 'Sök (egna)',
            flex: 1,
            handler: 'searchOwn'
          },
          {
            xtype: 'button',
            text: 'Sök (alla)',
            flex: 1,
            handler: 'searchAll'
          },
        ]
      },
      {
        xtype: 'toolbar',
        dock: 'top',
        itemId: 'labelBar',
        items: [
          { xtype: 'label', text: 'Enhet', height: 15, flex: 1, padding: '0 0 0 3' },
          { xtype: 'label', text: 'Roll',  height: 15, flex: 1, padding: '0 0 0 3' },
          { xtype: 'label', text: 'Aktiv', height: 15, flex: 1, padding: '0 0 0 3' }
        ]
      },
      {
        xtype: 'toolbar',
        dock: 'top',
        itemId: 'filterBar',
        items: [
          {
            xtype: 'rcfilter',
            itemId: 'unitFilter',
            cls: 'scw-select',
            flex: 1,
            valueField: 'UnitID',
            displayField: 'UnitName',
            value: 0,
            selectCallback: 'updateGrid',
            store: {
              fields: ['UnitID', 'UnitName']
            }
          }, {
            xtype: 'rcfilter',
            itemId: 'roleFilter',
            cls: 'scw-select',
            flex: 1,
            valueField: 'ValueCode',
            displayField: 'ValueName',
            value: 0,
            sortfield: 'ValueName',
            sortdirection: 'DESC',
            selectCallback: 'updateGrid',
            store: {
              fields: ['ValueCode', 'ValueName'],
              data: [
                { ValueCode: 0, ValueName: 'Alla' },
                { ValueCode: 101, ValueName: 'Dataleverantör' },
                { ValueCode: 201, ValueName: 'API-klient' },
                { ValueCode: 301, ValueName: 'Integratör' },
                { ValueCode: 701, ValueName: 'Patient' },
                { ValueCode: 901, ValueName: 'Registrerare' },
                { ValueCode: 903, ValueName: 'Koordinatorer' },
                { ValueCode: 906, ValueName: 'Systemutvecklare' },
                { ValueCode: 907, ValueName: 'Patientobsertvatör' },
                { ValueCode: 908, ValueName: 'Rapportobsertvatör' },

              ]
            }
          },
          {
            xtype: 'rcfilter',
            itemId: 'activeFilter',
            cls: 'scw-select',
            flex: 1,
            valueField: 'ValueCode',
            displayField: 'ValueName',
            value: 0,
            sortfield: 'ValueName',
            sortdirection: 'DESC',
            selectCallback: 'updateGrid',
            store: {
              fields: ['ValueCode', 'ValueName'],
              data: [
                { ValueCode: 0, ValueName: 'Alla' },
                { ValueCode: 1, ValueName: 'Ja' },
                { ValueCode: 2, ValueName: 'Nej' }
              ]
            }
          }
        ]
      },
    ],

    fbar: [
      // {
      //   minWidth: 80,
      //   text: 'Redigera',
      //   handler: 'edit'
      // }, {
      //   minWidth: 80,
      //   text: 'Mejla',
      //   handler: 'mail'
      // }, 
      {
        minWidth: 80,
        text: 'Exportera',
        // iconCls: 'fa fa-file-excel-o',
        handler: 'export'
      }
    ]
  });

  /*Ext.define('Role', {
    extend: 'Ext.data.Model',
    idProperty: 'RoleID',
    fields: ['RoleName']
});

  Ext.define('Context', {
    extend: 'Ext.data.Model',
    idProperty: 'ContextID',
    fields: ['ContextID', 'isActive',
    {
      name: 'RoleID',
      reference: {
        type: 'Role',
        association: 'ContextsByRole',
        getterName: 'getRole',
        setterName: 'setRole',
        inverse: "context"
    }}]
});*/

  Ext.define('RC.UserAdministration.controller.ContextController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.context',
    config: {
      loader: null,
      contexts: []
    },
    ownLoaded: false,

    export: function () {
      Ext.util.CSV.delimiter = ';';
      this.getView().saveDocumentAs({ type: 'csv', fileName: 'users.csv' });
    },
    mail: function () { 
      console.log('mailed'); 
    },

    edit: function () { 
      console.log('edited'); 
    },
    
    updateStores: function (dataLoader) {
      var contexts = dataLoader.getContexts();
      var units = dataLoader.getUnits();
      this.loadOwnContexts(contexts);
      this.loadOwnUnits(units);
      this.setLoader(dataLoader);
    },

    loadOwnUnits: function (units) {
      var unitFilter = this.getView().down('#unitFilter');
      var unitStore = unitFilter.getStore();
      unitStore.loadData(units);
      unitStore.add({ UnitName: 'Alla', UnitID: 0 });
      unitStore.sort({ property: 'UnitName', direction: 'ASC' });
      unitFilter.setValue(0);
    },

    loadOwnContexts: function (contexts) {
      var contextsStore = this.getView().getStore();
      contextsStore.loadData(contexts);
      this.updateGrid();
      this.setContexts(contexts);
      this.ownLoaded = true;
    },

    updateGrid: function () {
      var store  = this.getView().getStore();
      var user   = this.getView().down('#userFilter').getValue();
      var unit   = this.getView().down('#unitFilter').getValue();
      var role   = this.getView().down('#roleFilter').getValue();
      var active = this.getView().down('#activeFilter').getValue();

      store.clearFilter();
      store.addFilter(this.createUserFilter(user, role));
      store.addFilter(this.createUnitFilter(unit, role));
      store.addFilter(this.createRoleFilter(role));
      store.addFilter(this.createActiveFilter(active, role));
    },

    searchOwn: function () {
      if(!this.ownLoaded) {
        this.getView().getStore().loadData(this.getContexts());
        this.ownLoaded = true;
      }
      this.getView().down('#labelBar').show();
      this.getView().down('#filterBar').show();
      this.updateGrid();
    },

    searchAll: function () {
      this.ownLoaded = false;
      // this.getView().down('#labelBar').hide();
      // this.getView().down('#filterBar').hide();
      var me = this;
      var userQuery   = this.getView().down('#userFilter').getValue();
      this.loadContexts(userQuery).then(function (response) { me.followupAction(response); });
    },

    loadContexts: function (query) {
      var deferred = new Ext.Deferred();
      Ext.Ajax.request({
        url: '/stratum/api/metadata/contexts?query=' + query,
        success: function (response) {
          deferred.resolve(response);
        },
        failure: function (response) {
          deferred.reject(response);
        }
      });
      return deferred.promise;
    },

    followupAction: function (response) {
      this.getView().getStore().loadRawData(Ext.decode(response.responseText).data)
      console.log('followup');
    },

    createUnitFilter: function (unit, role) {
      var contexts = this.getContexts();
      var filter = function (item) {
        var contexts = item.data.Contexts;
        var isDeveloper = item.data.Role.RoleID === 906;
        var showDevelopers = role === 906;
        if (isDeveloper && !showDevelopers) { return false; }
        if (unit === 0) { return true; }
        return item.data.Unit.UnitID===unit;
      }
      return filter;
    },

    createUserFilter: function (user, role) {
      var contexts = this.getContexts();
      var filter = function (item) {
        var isDeveloper = item.data.Role.RoleID === 906;
        var showDevelopers = role === 906;
        if (isDeveloper && !showDevelopers) { return false; }
        if (user === '') { return true; }
        return Ext.String.startsWith(item.data.User.Username, user, true) || Ext.String.startsWith(item.data.User.FirstName, user, true) || Ext.String.startsWith(item.data.User.LastName, user, true); 
      };
      return filter;
    },

    createRoleFilter: function (role) {
      var contexts = this.getContexts();
      var filter = function (item) {
        var isDeveloper = item.data.Role.RoleID === 906;
        var showDevelopers = role === 906;
        if (isDeveloper && !showDevelopers) { return false; }
        if (role === 0) { return true; }
        return item.data.Role.RoleID === role;
      }
      return filter;
    },

    createActiveFilter: function (active, role) {
      var contexts = this.getContexts();
      var filter = function (item) {
        var isDeveloper = item.data.Role.RoleID === 906;
        var showDevelopers = role === 906;
        if (isDeveloper && !showDevelopers) { return false; }
        if (active === 0) { return true; }
        return item.data.IsActive == (active === 1 ? true : false);
      }
      return filter;
    },
  });
  
  Ext.define('RC.UserAdministration.view.ContextGrid', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.contextgrid',
    controller: 'context',
    multiSelect: true,
    selModel: 'rowmodel',
    width: 750,

    initComponent: function () {
      this.callParent();
    },

    plugins: {
      gridexporter: true,
    },
    
    listeners: {
      dataloaded: 'updateStores'
    },

    header: {
      style: {
        backgroundColor: Profile.Site.ThemeSettings.BaseColor
      },
      title: {
        text: 'Kontexter',
        style: {
          color: 'white'
        }
      },
    },

    store: {
      // model: 'Context',
      data: [],
      filters: []
    },

    columns: [
      {
        text: 'Aktiv',
        xtype: 'checkcolumn',
        dataIndex: 'IsActive',
        
        width: 60,
        sortable: true
      }, 
      {
        text: 'Förnamn',
        renderer: function(value, metaData, record) {
                    return record.get('User').FirstName;
                },
        flex: 1,
        sortable: true
      }, 
      {
        text: 'Efternamn',
        renderer: function(value, metaData, record) {
                    return record.get('User').LastName;
                },
        flex: 1,
        sortable: true
      }, 
      {
        text: 'Roll',
        renderer: function(value, metaData, record) {
                    return record.get('Role').RoleName;
                },
        flex: 1,
        sortable: true
      }, 
      {
        text: 'Enhet',
        renderer: function(value, metaData, record) {
                    return record.get('Unit').UnitName;
                },
        flex: 1,
        sortable: true
      }
    ],

    dockedItems: [
      {
        xtype: 'toolbar',
        dock: 'top',
        items: [
          {
            xtype: 'textfield',
            itemId: 'userFilter',
            flex: 3,
            keyMap: {
              'ctrl+enter': {
                handler: 'searchAll'
              },
              'enter': {
                handler: 'searchOwn'
              },
            },
          },
          {
            xtype: 'button',
            text: 'Sök (egna)',
            flex: 1,
            handler: 'searchOwn'
          },
          {
            xtype: 'button',
            text: 'Sök (alla)',
            flex: 1,
            handler: 'searchAll'
          },
        ]
      },
      {
        xtype: 'toolbar',
        dock: 'top',
        itemId: 'labelBar',
        items: [
          { xtype: 'label', text: 'Enhet', height: 15, flex: 1, padding: '0 0 0 3' },
          { xtype: 'label', text: 'Roll',  height: 15, flex: 1, padding: '0 0 0 3' },
          { xtype: 'label', text: 'Aktiv', height: 15, flex: 1, padding: '0 0 0 3' }
        ]
      },
      {
        xtype: 'toolbar',
        dock: 'top',
        itemId: 'filterBar',
        items: [
          {
            xtype: 'rcfilter',
            itemId: 'unitFilter',
            cls: 'scw-select',
            flex: 1,
            valueField: 'UnitID',
            displayField: 'UnitName',
            value: 0,
            selectCallback: 'updateGrid',
            store: {
              fields: ['UnitID', 'UnitName']
            }
          }, {
            xtype: 'rcfilter',
            itemId: 'roleFilter',
            cls: 'scw-select',
            flex: 1,
            valueField: 'ValueCode',
            displayField: 'ValueName',
            value: 0,
            sortfield: 'ValueName',
            sortdirection: 'DESC',
            selectCallback: 'updateGrid',
            store: {
              fields: ['ValueCode', 'ValueName'],
              data: [
                { ValueCode: 0, ValueName: 'Alla' },
                { ValueCode: 101, ValueName: 'Dataleverantör' },
                { ValueCode: 201, ValueName: 'API-klient' },
                { ValueCode: 301, ValueName: 'Integratör' },
                { ValueCode: 701, ValueName: 'Patient' },
                { ValueCode: 901, ValueName: 'Registrerare' },
                { ValueCode: 903, ValueName: 'Koordinatorer' },
                { ValueCode: 906, ValueName: 'Systemutvecklare' },
                { ValueCode: 907, ValueName: 'Patientobsertvatör' },
                { ValueCode: 908, ValueName: 'Rapportobsertvatör' },

              ]
            }
          },
          {
            xtype: 'rcfilter',
            itemId: 'activeFilter',
            cls: 'scw-select',
            flex: 1,
            valueField: 'ValueCode',
            displayField: 'ValueName',
            value: 0,
            sortfield: 'ValueName',
            sortdirection: 'DESC',
            selectCallback: 'updateGrid',
            store: {
              fields: ['ValueCode', 'ValueName'],
              data: [
                { ValueCode: 0, ValueName: 'Alla' },
                { ValueCode: 1, ValueName: 'Ja' },
                { ValueCode: 2, ValueName: 'Nej' }
              ]
            }
          }
        ]
      },
    ],

    fbar: [
      // {
      //   minWidth: 80,
      //   text: 'Redigera',
      //   handler: 'edit'
      // }, {
      //   minWidth: 80,
      //   text: 'Mejla',
      //   handler: 'mail'
      // }, 
      {
        minWidth: 80,
        text: 'Exportera',
        // iconCls: 'fa fa-file-excel-o',
        handler: 'export'
      }
    ]
  });
  
  // Ext.create('RC.UserAdministration.view.FileDrop').show();
  RC.UserAdministration.app = Ext.create('Ext.tab.Panel', { renderTo: 'contentPanel', items: [{ title: 'Användare', xtype: 'usergrid', itemId: 'usersView' }, { title: 'Kontexter', xtype: 'contextgrid', itemId: 'contextsView' }] });
  Ext.create('RC.UserAdministration.storage.Data', {observers: [RC.UserAdministration.app.down('#usersView'), RC.UserAdministration.app.down('#contextsView')]});
}

Ext.util.CSS.removeStyleSheet('useradministration');
Ext.util.CSS.createStyleSheet(
  ' '
  + '.active {'
  + '  background-color: aquamarine;'
  + '.x-selmodel-checkbox .x-grid-cell-inner {'
  + '  padding: 5px 0px 6px 2px;'
  + '}', 'septum'
);
