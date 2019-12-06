
function start() {
  Ext.Loader.loadScript({
    url: '/stratum/extjs/scripts/exporter.js',
    onLoad: function () { onReady(); }
  });
}

function onReady() {
  Ext.tip.QuickTipManager.init()
  // Ext.create('RC.UserAdministration.view.FileDrop').show();
  Ext.create('RC.UserAdministration.store.User')
  Ext.create('RC.UserAdministration.store.Unit')
  Ext.create('RC.UserAdministration.store.Role')
  RC.UserAdministration.app = Ext.create('Ext.tab.Panel', { renderTo: 'contentPanel', items: [{ title: 'Användare', xtype: 'usergrid' }] });
  RC.UserAdministration.data = Ext.create('RC.UserAdministration.storage.Data', { observers: [RC.UserAdministration.app.down('usergrid')] });
}

Ext.define('RC.UserAdministration.store.User', {
  extend: 'Ext.data.Store',
  model: 'Stratum.User',
  storeId: 'users',
  /*
  autoLoad: true,
  proxy: {
    type: 'ajax',
    url: '/stratum/api/metadata/users/register/' + Profile.Site.Register.RegisterID,
    reader: {
      type: 'json',
      rootProperty: 'data'
    }
  }*/
})

Ext.define('RC.UserAdministration.store.Unit', {
  extend: 'Ext.data.Store',
  model: 'Stratum.Unit',
  storeId: 'units',
  autoLoad: true,
  proxy: {
    type: 'ajax',
    url: '/stratum/api/metadata/units/register/' + Profile.Site.Register.RegisterID,
    reader: {
      type: 'json',
      rootProperty: 'data'
    }
  }
})

Stratum.Role || Ext.define('Stratum.Role', {
	extend: 'Stratum.Model',
	fields: [
		{name: 'RoleID', type: 'int', allowNull: false},
		{name: 'RoleName', type: 'string'},
	],
	idProperty: 'RoleID',
	proxy: {
		type: 'memory'
	}
});

Ext.define('RC.UserAdministration.store.Role', {
  extend: 'Ext.data.Store',
  model: 'Stratum.Role',
  storeId: 'roles',
  data: [
    { RoleID: 101, RoleName: 'Dataleverantör' },
    { RoleID: 201, RoleName: 'API-klient' },
    { RoleID: 301, RoleName: 'Integratör' },
    { RoleID: 701, RoleName: 'Patient' },
    { RoleID: 901, RoleName: 'Registrerare' },
    { RoleID: 902, RoleName: 'Plusregistrerare' },
    { RoleID: 903, RoleName: 'Koordinatorer' },
    { RoleID: 906, RoleName: 'Systemutvecklare' },
    { RoleID: 907, RoleName: 'Patientobsertvatör' },
    { RoleID: 908, RoleName: 'Rapportobsertvatör' }
  ]
})

Ext.define('RC.UserAdministration.view.UserGrid', {
  extend: 'Ext.grid.Panel',
  alias: 'widget.usergrid',
  reference: 'usergrid',
  controller: 'user',
  multiSelect: true,
  selModel: 'rowmodel',
  width: '100%',
  height: 500,

  plugins: {
    gridexporter: true,
  },

  listeners: {
    unitsloaded: 'updateDropdowns',
    loginsloaded: 'updateLogins',
    dataloaded: 'updateStores',
    groupclick: function () { return false; },
    itemdblclick: 'userClicked',
    refresh: function () { this.update() },
    columnhide: 'onColumnHidden',
    columnShow: 'onColumnShown',
    selectionchange: 'onSelectionChange'
  },
  store: 'users',
/*  store: {
    // groupField: 'FirstName',
    data: [],
    filters: [],
    sorters: {
      property: 'LastName'
    },
  },*/

  columns: [
    {
      text: 'Förnamn',
      dataIndex: 'FirstName',
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem('FirstName') === 'hidden' || false
    }, {
      text: 'Efternamn',
      dataIndex: 'LastName',
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem('LastName') === 'hidden' || false
    }, {
      text: 'Användarnamn',
      dataIndex: 'Username',
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem('Username') === 'hidden' || false
    }, {
      text: 'Titel',
      dataIndex: 'WorkTitle',
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem('WorkTitle') === 'hidden' || false
    }, {
      text: 'Organisation',
      dataIndex: 'Organization',
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem('Organization') === 'hidden' || false
    }, {
      text: 'Epost',
      dataIndex: 'Email',
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem('Email') === 'hidden' || false
    }
  ],

  features: [{ ftype: 'grouping', enableGroupingMenu: true }],
  /*
  features: [{
    id: 'group',
    ftype: 'groupingsummary',
    groupHeaderTpl: '{name}',
    hideGroupedHeader: true,
    enableGroupingMenu: false
  }],
  */

  dockedItems: [
    {
      xtype: 'toolbar',
      reference: 'search',
      dock: 'top',
      border: false,
      items: [
        {
          xtype: 'textfield',
          reference: 'userFilter',
          flex: 1,
          keyMap: {
            'enter': {
              handler: 'searchOwn'
            }
          }
        },
        {
          xtype: 'button',
          reference: 'searchButton',
          text: 'Sök',
          width: 100,
          handler: 'searchOwn',
          disabled: false
        },
      ]
    },
    {
      xtype: 'toolbar',
      dock: 'top',
      border: false,
      items: [
        { xtype: 'label', text: 'Enhet', height: 15, flex: 1, padding: '0 0 0 3' },
        { xtype: 'label', text: 'Roll', height: 15, flex: 1, padding: '0 0 0 3' },
        { xtype: 'label', text: 'Aktiv', height: 15, flex: 1, padding: '0 0 0 3' }
      ]
    },
    {
      xtype: 'toolbar',
      dock: 'top',
      border: false,
      items: [
        {
          xtype: 'rcfilter',
          reference: 'unitFilter',
          cls: 'scw-select',
          flex: 1,
          valueField: 'UnitID',
          displayField: 'UnitName',
          value: localStorage.getItem('selectedunit') || 0,
          store: {
            storeId: 'unitStore',
            fields: ['UnitID', 'UnitName']
          },
          listeners: {
            change: 'updateGrid'
          }
        }, {
          xtype: 'rcfilter',
          reference: 'roleFilter',
          cls: 'scw-select',
          flex: 1,
          valueField: 'RoleID',
          displayField: 'RoleName',
          sortfield: 'RoleName',
          sortdirection: 'DESC',
          selectCallback: 'updateGrid',
          store: 'roles',
          listeners: {
            change: 'updateGrid',
            beforerender: function () {this.getStore().insert(0, {RoleID: 0, RoleName: 'Alla'}); this.setValue(0)}
          }
        },
        {
          xtype: 'rcfilter',
          reference: 'activeFilter',
          cls: 'scw-select',
          flex: 1,
          valueField: 'ValueCode',
          displayField: 'ValueName',
          value: 0,
          sortfield: 'ValueName',
          sortdirection: 'DESC',
          listeners: {
            change: 'updateGrid'
          },
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
    {
      xtype: 'toolbar',
      dock: 'top',
      border: false,
      items: [
        {
          reference: 'exportButton',
          text: 'Exportera',
          handler: 'export',
          minWidth: 80,
          disabled: false
        },
        { 
          reference: 'emailButton',
          text: 'E-posta',
          handler: 'mail',
          minWidth: 80,
          disabled: true
        },
        {
          reference: 'editButton',
          text: 'Redigera',
          handler: 'edit',
          minWidth: 80,
          disabled: true
        },
        {
          reference: 'createButton',
          text: 'Skapa',
          handler: 'create',
          minWidth: 80,
          disabled: false
        }
      ]
    }
  ]
})

Ext.define('RC.UserAdministration.controller.User', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.user',
  config: {
    loader: null,
    ownUsers: null,
    ownLoaded: false
  },

  initComponent: function () {
    this.callParent()
  },

  export: function () {
    Ext.util.CSV.delimiter = ';';
    var grid = this.getView()
    grid.saveDocumentAs({ type: 'xlsx', fileName: 'users.xlsx' });
  },

  mail: function () {
    var selections = this.getView().getSelection()
    var mailList = ''
    selections.forEach(function (user) {
      if (Ext.data.validator.Email(user.getData().Email)) {
        mailList += user.getData().Email + ';'
      }
    })
    window.location = 'mailto:' + mailList
  },

  edit: function () {
    var selections = this.getView().getSelection()
    if (selections.length === 1) {
      this.userClicked(null, selections[0])
    }
  },

  create: function () {
    var userWindow = Ext.create('RC.UserAdministration.view.CreateUser')
    userWindow.show()
  },

  updateStores: function (dataLoader) {
    var users = dataLoader.getUsers();
    var contexts = dataLoader.getContexts();

    this.loadOwnUsers(users, contexts);
    this.setLoader(dataLoader);
    this.lookup('searchButton').setDisabled(false)
    this.searchOwn()
  },

  updateDropdowns: function (dataLoader) {
    var units = dataLoader.getUnits();
    this.loadOwnUnits(units);
  },

  updateLogins: function (dataLoader) {
    this.setLoader(dataLoader)
  },

  loadOwnUnits: function (units) {
    var unitFilter = this.lookup('unitFilter')
    var unitStore = unitFilter.getStore();
    unitStore.loadData(units);
    unitStore.add({ UnitName: ' Alla', UnitID: 0 });
    unitStore.sort({ property: 'UnitName', direction: 'ASC' });
    unitFilter.setValue(0);
  },

  loadOwnUsers: function (users, contexts) {
    var userStore = this.getView().getStore();
    this.addContexts(users);
    this.join(users, contexts);
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
        // var isDeveloper = contexts.filter(function (context) { return context.Role.RoleID === 906; }).length !== 0;
        var isDeveloper = item.data.UserID < 200
        var showDevelopers = role === 906;
        if (isDeveloper && !showDevelopers) { return false; }
        if (user === '') { return true; }
        var unitContexts = contexts.filter(function (context) {
          return Ext.String.startsWith(context.User.Username, user, true)
            || Ext.String.startsWith(context.User.FirstName, user, true)
            || Ext.String.startsWith(context.User.LastName, user, true)
            || context.User.Extra && (typeof context.User.Extra === 'string') && Ext.String.startsWith(JSON.parse(context.User.Extra)[Profile.Site.Register.RegisterID], user, true)
            || context.User.Extra && (typeof context.User.Extra === 'object') && Ext.String.startsWith(context.User.Extra[Profile.Site.Register.RegisterID], user, true)
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
        // var isDeveloper = contexts.filter(function (context) { return context.Role.RoleID === 906; }).length !== 0;
        var isDeveloper = item.data.UserID < 200
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
        // var isDeveloper = contexts.filter(function (context) { return context.Role.RoleID === 906; }).length !== 0;
        var isDeveloper = item.data.UserID < 200
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
    var store   = this.getView().getStore()
    var user    = this.lookup('userFilter').getValue()
    var unit    = this.lookup('unitFilter').getValue()
    var role    = this.lookup('roleFilter').getValue()
    var active  = this.lookup('activeFilter').getValue()

    store.suspendEvents()
    store.clearFilter()
    store.addFilter(this.createUserFilter(user, role))
    store.addFilter(this.createUnitFilter(unit, role))
    store.addFilter(this.createRoleFilter(role))
    store.resumeEvents()
    store.addFilter(this.createActiveFilter(active, role))
  },

  searchOwn: function () {
    if (!this.ownLoaded) {
      this.getView().getStore().loadData(this.ownUsers);
      this.ownLoaded = true;
    }
    this.updateGrid();
  },

  userClicked: function (component, record, item, index) {
    var etxra, info
    record.data.LastActive = this.getLatestContextLogin(record.data)

    if (record.data.Contexts && record.data.Extra) {
      record.data.Contexts.forEach(function (item) {
        if (typeof item.User.Extra !== 'string') return;
        item.User.Extra = JSON.parse(item.User.Extra)
        record.data.Info = item.User.Extra[Profile.Site.Register.RegisterID]
        info = item.User.Extra
        record.data.Extra = null
      })
    }

    record.data.Extra = null
    record.data.PersonalId = this.checkIfPersonalId(record.data.HSAID) ? record.data.HSAID : null
    var userWindow = Ext.create('RC.UserAdministration.view.EditUser', { userData: record, contextData: record.data.Contexts })
    userWindow.show()
    userWindow.Info = info
    if (!record.data.Contexts) {
      this.loadContexts(userWindow, record.data.UserID)
    }
  },

  onColumnHidden: function (component, column, eOpts) {
    localStorage.setItem(column.dataIndex, 'hidden')
  },

  onColumnShown: function (component, column, eOpts) {
    localStorage.setItem(column.dataIndex, 'shown')
  },

  onSelectionChange: function (component, record, index, eOpts) {
    this.lookup('emailButton').enable()
    this.lookup('editButton').enable()
  },

  checkIfPersonalId: function (value) {
    return value && (value.indexOf('19') === 0 || value.indexOf('20') === 0)
  },

  loadContexts: function (component, userId) {
    var contexts = this.getLoader() && this.getLoader().getContexts().filter(function (c) { return c.User.UserID === userId })
    if (contexts.length !== 0) {
      component.down('grid').getStore().loadData(contexts)
    } else {
      Ext.Ajax.request({
        url: '/stratum/api/metadata/contexts/user/' + userId,
        withCredentials: true,
        success: function (result, request) {
          var data = Ext.decode(result.responseText).data
          component.down('grid').getStore().loadData(data)
        }
      });
    }
  },

  getLatestContextLogin: function (user) {
    var time = user.Contexts.reduce(function (total, current) { 
      total.ActivatedAt = total.ActivatedAt || ''; 
      if (total.ActivatedAt < current.ActivatedAt) { 
        return current; 
      } 
      return total }
    )
    time = time.ActivatedAt.substring(0, 16).replace('T', ' ')
    return time || 'Okänt'
  }
})

Ext.define('RC.UserAdministration.controller.Form', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.form',

  init: function () {
    var personalidIsUsed = this.lookup('userform').getForm().getValues().PersonalId
    
    this.lookup('personalid').setHidden(!personalidIsUsed)
    this.lookup('personalid').setDisabled(!personalidIsUsed)
    this.lookup('hsaid').setHidden(personalidIsUsed)
    this.lookup('hsaid').setDisabled(personalidIsUsed)
  },

  getUser: function () {
    var form = this.lookup('userform').getForm().getValues()
    var completeInfo = this.lookup('userform').up().Info || {}
    completeInfo[Profile.Site.Register.RegisterID] = form.Info
    form.Extra = JSON.stringify(completeInfo)
    return form
  },

  getContext: function (form) {
    var context = {
        IsActive: true,
        User: {UserID: form.UserID},
        Unit: {UnitID: form.unit},
        Role: {RoleId: form.role}
    }
    return context
  },
  
  saveUser: function (user) {
    var deferred = new Ext.Deferred()
    var method = user.UserID ? 'PUT' : 'POST'
    Ext.Ajax.request({
      url: '/stratum/api/metadata/users/' + user.UserID,
      method: method,
      jsonData: user,
      withCredentials: true,
      success: function (response) {
        deferred.resolve(response);
      },
      failure: function (response) {
        deferred.reject(response);
      }
    })
    return deferred.promise
  },

  saveContext: function () {
    var deferred = new Ext.Deferred()
    Ext.Ajax.request({
      url: '/stratum/api/metadata/contexts/',
      method: 'POST',
      jsonData: context,
      withCredentials: true,
      success: function (response) {
        deferred.resolve(response);
      },
      failure: function (response) {
        deferred.reject(response);
      }
    })
    return deferred
  },

  updateUser: function (user) {
    Ext.Ajax.request({
      url: '/stratum/api/metadata/contexts/user/' + user.UserID,
      method: 'GET',
      jsonData: user,
      withCredentials: true,
      success: function (result, request) {
        var index = Ext.ComponentQuery.query('usergrid')[0].getStore().find('UserID', user.UserID)
        var userToUpdate = Ext.ComponentQuery.query('usergrid')[0].getStore().getAt(index)
        user.Contexts = Ext.decode(result.responseText).data
        var units = Ext.ComponentQuery.query('usergrid').pop().lookup('unitFilter').getStore().getData().items.map(function (item) { return item.data.UnitID })
        user.Contexts = user.Contexts.filter(function (context) { return units.indexOf(context.Unit.UnitID) >= 0 })
        Ext.ComponentQuery.query('usergrid')[0].getStore().removeAt(index)
        Ext.ComponentQuery.query('usergrid')[0].getStore().add(user)
      },
      failure: function (result, request) {
        console.log(result.responseText);
      }
    })
  }
})

Ext.define('RC.UserAdministration.view.CreateUser', {
  extend: 'Ext.window.Window',
  controller: 'createuser',
  modal: true,
  width: 1000,
  title: 'Användare',
  initComponent: function (arguments) {
    this.callParent(arguments)
    this.down('rcuserform').getViewModel().setData({ passhash: '?'})
  },
  items: [
    {
      xtype: 'rcuserform',
      reference: 'userform',
      viewModel: {
        stores: {
          user: {
          }
        }
      }
    },
    {
      xtype: 'matchuser',
      width: '100%',
      height: 300,
      plugin: true,
      store: {
        data: []
      },
    }
  ],
  dockedItems: [
    {
      xtype: 'toolbar',
      dock: 'bottom',
      items: [
        {
          xtype: 'tbspacer', flex: 1
        },
        {
          text: 'Stäng',
          minWidth: 80,
          handler: function () {
            this.up('window').destroy()
          }
        }
      ]
    },
  ]
})

Ext.define('RC.UserAdministration.controller.CreateUser', {
  extend: 'RC.UserAdministration.controller.Form',
  alias: 'controller.createuser',

  init: function () {
    this.callParent()
    this.lookup('registryinfo').hide()
    this.lookup('organisation').hide()
    this.lookup('lastactive').hide()
    this.lookup('email').hide()
    this.lookup('username').setFieldLabel('Epost')
    this.lookup('username').setEditable(true)
    this.lookup('username').removeCls('rc-info')
    if(Profile.Context.User.UserID < 200) {
      this.lookup('username').setFieldLabel('Användarnamn')
    }
  },

  onSaveUser: function () {
    var controller = this
    var user = this.getUser()
    var context = this.getContext()
    this.saveUser(user).then(function () {controller.saveContext(context)}).then(function (){controller.updateUser(user)})
    this.getView().destroy()
  },

  onFormChanged: function () {
    var me = this
    var query = this.getQueryFromInputs()
    query !== '' && this.loadUser(query).then(function (response) { me.showMatchingUsers(response) })
  },

  getQueryFromInputs: function () {
    var view = this.getView()
    var inputs = ''
    inputs += this.lookup('firstname').getValue().length > 2 ? this.lookup('firstname').getValue() + ' ' : ''
    inputs += this.lookup('lastname').getValue().length  > 2 ? this.lookup('lastname').getValue()  + ' ' : ''
    inputs += this.lookup('username').getValue().length  > 2 ? this.lookup('username').getValue()  + ' ' : ''
    inputs = inputs.length > 0 ? inputs.substring(0, inputs.length - 1) : ''
    return inputs
  },

  loadUser: function (query) {
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

  showMatchingUsers: function (response) {
    var matches = Ext.decode(response.responseText).data
    matches = this.filterMactches(matches)
    this.lookup('matchUser').getStore().loadData(matches)
  },

  filterMactches: function (matches) {
    var view = this.getView()
    var firstName = this.lookup('firstname').getValue()
    var lastName = this.lookup('lastname').getValue()
    var email = this.lookup('username').getValue()
    matches = matches.filter(function (match) {
      return (firstName.length < 3 || Ext.String.startsWith(match.FirstName, firstName, true))
          && (lastName.length < 3  || Ext.String.startsWith(match.LastName, lastName, true))
          && (email.length < 3     || Ext.String.startsWith(match.Email, email, true))
    })
    return matches
  },

  onSithIdChoosen: function () {
    this.lookup('hsaid').show()
    this.lookup('hsaid').enable()
    this.lookup('personalid').hide()
    this.lookup('personalid').disable()
  },

  onBankIdChoosen: function () {
    this.lookup('hsaid').hide()
    this.lookup('hsaid').disable()
    this.lookup('personalid').show()
    this.lookup('personalid').enable()
  }
})

Ext.define('RC.UserAdministration.view.EditUser', {
  extend: 'Ext.window.Window',
  controller: 'edituser',
  modal: true,
  width: 1000,
  title: 'Användare',
  
  config: {
    userData: [],
    contextData: []
  },
  
  items: [
    {
      xtype: 'rcuserform',
      reference: 'userform',
      viewModel: {
        stores: {
          user: []
        }
      }
    },
    {
      xtype: 'contextgrid',
      width: '100%',
      height: 300,
      plugin: true,
      store: {
        data: []
      },
    }
  ],
  dockedItems: [
    {
      xtype: 'toolbar',
      dock: 'bottom',
      items: [
        {
          xtype: 'tbspacer', flex: 1
        },
        {
          text: 'Stäng',
          minWidth: 80,
          handler: function () {
            this.up('window').destroy()
          }
        }
      ]
    }
  ]
})

Ext.define('RC.UserAdministration.controller.EditUser', {
  extend: 'RC.UserAdministration.controller.Form',
  alias: 'controller.edituser',

  init: function () {
    this.callParent()
    this.getView().down('grid').getStore().loadData(this.getView().getContextData())
    this.lookup('userform').loadRecord(this.getView().getUserData())
    delete this.lookup('username').vtype
    this.lookup('unit').hide()
    this.lookup('role').hide()
    this.lookup('username').setFieldLabel('Användarnamn')
    this.lookup('username').setEditable(false)
    this.lookup('username').addCls('rc-info')
  },

  onSaveUser: function () {
    var controller = this
    var user = this.getUser()
    this.lookup('userform').getForm().updateRecord()
    Ext.StoreManager.lookup('users').sync({callback: function (){console.log('synced')}})
    this.getView().destroy()
  },


  onSithIdChoosen: function () {
    this.lookup('hsaid').show()
    this.lookup('hsaid').enable()
    this.lookup('personalid').hide()
    this.lookup('personalid').disable()
  },

  onBankIdChoosen: function () {
    this.lookup('hsaid').hide()
    this.lookup('hsaid').disable()
    this.lookup('personalid').show()
    this.lookup('personalid').enable()
  }
})

Ext.define('RC.UserAdministration.view.MatchUser', {
  extend: 'Ext.grid.Panel',
  alias: 'widget.matchuser',
  reference: 'matchUser',
  width: '100%',
  columns: [
    {
      text: 'Förnamn',
      dataIndex: 'FirstName',
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem('FirstName') === 'hidden' || false
    }, {
      text: 'Efternamn',
      dataIndex: 'LastName',
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem('LastName') === 'hidden' || false
    }, {
      text: 'Användarnamn',
      dataIndex: 'Username',
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem('Username') === 'hidden' || false
    }, {
      text: 'Titel',
      dataIndex: 'WorkTitle',
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem('WorkTitle') === 'hidden' || false
    }, {
      text: 'Organisation',
      dataIndex: 'Organization',
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem('Organization') === 'hidden' || false
    }, {
      text: 'Epost',
      dataIndex: 'Email',
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem('Email') === 'hidden' || false
    }
  ],
})



Ext.define('RC.UserAdministration.form.User', {
  extend: 'Ext.form.Panel',
  xtype: 'rcuserform',

  fieldDefaults: {
    validateOnChange: true		
  },
  bodyPadding: 7,
  defaults: {
    layout: 'form',
    xtype: 'textfield',
    columnWidth: 0.49,
    labelWidth: 115,
    padding: 7,
    listeners: {
      change: 'onFormChanged'
    },
  },
  layout: 'column',
  width: '100%',
  items: [
        { fieldLabel: 'Förnamn',         name: 'FirstName',    reference: 'firstname' },
        { fieldLabel: 'Efternamn',       name: 'LastName',     reference: 'lastname' },
        { fieldLabel: 'HSAID',           name: 'HSAID',        reference: 'hsaid',      fieldStyle: { textTransform: 'uppercase' }, labelClsExtra: 'PrefixMandatory', maxLength: 64 },
        { fieldLabel: 'Personnummer',    name: 'PersonalId',   reference: 'personalid', vtype: 'personalId' },
        { fieldLabel: 'Epost',           name: 'Email',        reference: 'email',      vtype: 'email' },
        { fieldLabel: 'Registerinfo',    name: 'Info',         reference: 'registryinfo' },
        { fieldLabel: 'Organisation',    name: 'Organization', reference: 'organisation' },
        { fieldLabel: 'Användarnamn',    name: 'Username',     reference: 'username',   vtype: 'username' },
        { fieldLabel: 'Senast inloggad', name: 'LastActive',   reference: 'lastactive', cls: 'rc-info' },
        { fieldLabel: 'Enhet',           name: 'Unit',         reference: 'unit',       xtype: 'combobox', store: 'units', valueField: 'UnitID', displayField: 'UnitName' },
        { fieldLabel: 'Roll',            name: 'Role',         reference: 'role',       xtype: 'combobox', store: 'roles', valueField: 'RoleID', displayField: 'RoleName'},
        { fieldLabel: 'Användarid',      name: 'UserID',       reference: 'userid',     hidden: true},
        { fieldLabel: 'Title',           name: 'WorkTitle',    reference: 'worktitle',  hidden: true},
  ],
  dockedItems: [
    {
      xtype: 'toolbar',
      dock: 'bottom',
      border: false,
      items: [
        {
          xtype: 'tbspacer', flex: 1
        },
        {
          xtype: 'button',
          text: 'Byt till Sithskort',
          handler: 'onSithIdChoosen',
          minWidth: 80
        },
        {
          xtype: 'button',
          text: 'Byt till BankID',
          handler: 'onBankIdChoosen',
          minWidth: 80
        },
        {
          xtype: 'button',
          text: 'Spara',
          handler: 'onSaveUser',
          formBind: true,
          minWidth: 80
        }
      ]
    }
  ]
})

Ext.define('RC.UserAdministration.view.ContextGrid', {
  extend: 'Ext.grid.Panel',
  alias: 'widget.contextgrid',
  reference: 'contextgrid',
  controller: 'context',
  multiSelect: true,
  selModel: 'rowmodel',
  width: '100%',

  columns: [
    {
      text: 'Aktiv',
      xtype: 'checkcolumn',
      dataIndex: 'IsActive',
      width: 60,
      sortable: true,
      renderer: function (value, cellValues) {
        cellValues.innerCls = cellValues.innerCls.replace(' synced', '');
        if (cellValues.record.data.isSynced) {
          cellValues.innerCls += ' synced';
        }

        var content = this.defaultRenderer(value, cellValues);
        return content;
      },
      listeners: {
        beforecheckchange: function (aColumn, anRowIndex, isChecked) {
        },
        checkchange: 'syncStore'
      }
    },
    {
      text: 'Enhet',
      renderer: function (value, metaData, record) { return record.get('Unit').UnitName; },
      flex: 1,
      sortable: true
    },
    {
      text: 'Roll',
      renderer: function (value, metaData, record) { return record.get('Role').RoleName; },
      flex: 1,
      sortable: true
    },
    {
      text: 'Aktiv senast',
      width: 100,
      renderer: function (value, metaData, record) { return record.get('ActivatedAt') ? record.get('ActivatedAt').substring(0, 10) : '' },
      sortable: true
    },
    {
      text: 'Slutdatum',
      renderer: function (value, metaData, record) { return record.get('User').ExpireDate; },
      flex: 1,
      sortable: true,
      hidden: true
    }
  ],

  dockedItems: [
    {
      xtype: 'header',
      title: 'Kontexter',
      padding: 10,
      border: false,
      style: {
        color: 'white',
        backgroundColor: '#888',
      }
    }
  ],
})

Ext.define('RC.UserAdministration.controller.Context', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.context',
  
  syncStore: function (column, index, checked, record, e, eOpts) {
    var view = column.getView()
    var params = Ext.clone(record.data)
    params.IsActive = checked
    delete params.User
    Ext.Ajax.request({
      url: '/stratum/api/metadata/contexts/' + params.ContextID,
      method: 'PUT',
      jsonData: params,
      withCredentials: true,
      success: function (result, request) {
        record.data.isSynced = true;
        view.addRowCls(index, 'synced')
      },
      failure: function (result, request) {
        console.log(result.responseText);
      }
    });
  }
})

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
    // config.listeners = { select: config.selectCallback };
    this.callParent(arguments);
  }
})

Ext.define('RC.UserAdministration.Validators', {
  override: 'Ext.form.field.VTypes',
  personalId: function(value) {
    var validator = new RegExp(/^\d{12}$/)
    return validator.test(value) ? true : false
  },

  personalIdText: 'Inget giltigt personnummer ÅÅÅÅMMDDXXXX',

  username: function (value, field) {
    var isValid = false
    if(value===field.lastTry)return field.lastTryResult
    field.lastTry = value
    
    Ext.Ajax.request({
      async: false,
      url: '/stratum/api/metadata/users/exists/' + value,
      method: 'GET',
      success: function(response, opts) {
        isValid = false
      },
      failure: function(response, opts) {
        isValid = true
      }
    })
    field.lastTryResult = isValid
    return isValid
  },

  usernameText: 'Denna epostadress <br>används redan'
})

Ext.define('RC.UserAdministration.storage.Data', {
  mixins: ['Ext.mixin.Observable'],
  config: {
    users: [],
    contexts: [],
    units: [],
    observers: [],
    loginsSith: [],
    loginsBankId: []
  },
  constructor: function (config) {
    this.initConfig(config);
    this.callParent(config);
    this.loadData();
  },
  
  loadData: function () {
    var controller = this;
    Ext.Promise.all([
      Ext.Ajax.request({ url: '/stratum/api/metadata/units/register/' + Profile.Site.Register.RegisterID }),
    ]).then(function (results) {
      var units = Ext.decode(results[0].responseText).data;
      controller.setUnits(units);
      controller.getObservers().forEach(function (observer) {
        observer.fireEvent('unitsloaded', controller);
      })
    })
    
    Ext.Promise.all([
      Ext.Ajax.request({ url: '/stratum/api/metadata/users/register/' + Profile.Site.Register.RegisterID }),
      Ext.Ajax.request({ url: '/stratum/api/metadata/contexts/register/' + Profile.Site.Register.RegisterID }),
    ]).then(function (results) {
      var users = Ext.decode(results[0].responseText).data;
      var contexts = Ext.decode(results[1].responseText).data;

      controller.setUsers(users);
      controller.setContexts(contexts);
      controller.getObservers().forEach(function (observer) {
        observer.fireEvent('dataloaded', controller);
      })
    });
  }
})

Ext.define('RC.UserAdministration.view.FileDrop', {
  extend: 'Ext.panel.Panel',
  xtype: 'filedrop',
  controller: 'filedrop',
  title: 'File Drag',
  width: 500,
  height: 300,
  bodyPadding: 5,
  layout: 'fit',
  renderTo: 'contentPanel',
  bodyCls: 'drag-file-ct',
  // html: '<div class="drag-file-icon" style="height: 100%; width: 100%";></div>'
})

Ext.define('RC.UserAdministration.controller.FileDrop', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.filedrop',

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
    this.getView().body.addCls('rc-active');
  },

  onDragLeave: function () {
    this.getView().body.removeCls('rc-active');
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
})

Ext.util.CSS.removeStyleSheet('useradministration')
Ext.util.CSS.createStyleSheet(
  ' '
  + '.rc-active {'
  + '  background-color: aquamarine;'
  + '}'

  + '.synced .x-grid-dirty-cell .x-grid-cell-inner:after, .x-grid-dirty-cell .synced.x-grid-cell-inner:after {'
  + '  color: #0db52b;'
  + '}'

  + '.rc-info div {'
  + '  border-color: #eee;'
  + '}'
  , 'useradministration'
)
