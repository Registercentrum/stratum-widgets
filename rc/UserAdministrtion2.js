var widgetConfig  = widgetConfig || {}
widgetConfig.Roles = [0, 901, 903, 907, 908]
widgetConfig.devMode = Profile.Context && Profile.Context.User.UserID <= 200
widgetConfig.devMode = false // qqq

function startWidget() {
  Ext.Loader.loadScript({
    url: '/stratum/extjs/scripts/exporter.js',
    onLoad: function () { onReady() }
  })
}

function onReady() {
  Ext.tip.QuickTipManager.init()
  // Ext.create('RC.UserAdministration.view.FileDrop').show();
  Ext.create('RC.UserAdministration.store.User')
  Ext.create('RC.UserAdministration.store.Unit')
  Ext.create('RC.UserAdministration.store.Role')
  Ext.create('RC.UserAdministration.store.Bindings', { storeId: 'bindings' })
  RC.UserAdministration.app = Ext.create('Ext.tab.Panel', { renderTo: 'contentPanel', items: [{ title: 'Användare', xtype: 'usergrid' }, { title: 'Enheter', xtype: 'unitgrid' }] })
  RC.UserAdministration.data = Ext.create('RC.UserAdministration.storage.Data', { observers: [RC.UserAdministration.app.down('usergrid'), RC.UserAdministration.app.down('unitgrid')] })
}

Stratum.Role || Ext.define('Stratum.Role', {
  extend: 'Stratum.Model',
  fields: [
    { name: 'RoleID', type: 'int', allowNull: false },
    { name: 'RoleName', type: 'string' },
  ],
  idProperty: 'RoleID',
  proxy: {
    type: 'memory'
  }
})

Stratum.Region || Ext.define('Stratum.Region', {
  extend: 'Stratum.Model',
  fields: [
    { name: 'DomainValueID', type: 'int', allowNull: true },
    { name: 'ValueCode', type: 'string' },
    { name: 'ValueName', type: 'string' }
  ],
  idProperty: 'DomainValueID'
})

Ext.define('RC.UserAdministration.store.User', {
  extend: 'Ext.data.Store',
  model: 'Stratum.User',
  storeId: 'users'
})

Ext.define('RC.UserAdministration.store.Active', {
  extend: 'Ext.data.Store',
  alias: 'store.active',
  fields: [
    { name: 'ActiveCode', type: 'boolean', allowNull: false },
    { name: 'ActiveName', type: 'string' },
  ],
  data: [
    { ActiveCode: true, ActiveName: 'Ja' },
    { ActiveCode: false, ActiveName: 'Nej' },
  ],
  idProperty: 'ActiveCode',
  proxy: {
    type: 'memory'
  }
})

Ext.define('RC.UserAdministration.store.Unit', {
  extend: 'Ext.data.Store',
  model: 'Stratum.Unit',
  alias: 'store.unit',
  autoLoad: true,
  proxy: {
    url: '/stratum/api/metadata/units/register/' + Profile.Site.Register.RegisterID,
    type: 'rest',
    reader: {
      type: 'json',
      rootProperty: 'data'
      
    },
    api: {
      create: '/stratum/api/metadata/units',
      update: '/stratum/api/metadata/units'
    } 
  }
})

Ext.define('RC.UserAdministration.store.Role', {
  extend: 'Ext.data.Store',
  model: 'Stratum.Role',
  alias: 'store.role',
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
  ],
  filters: [{
    filterFn: function (item) {
      return widgetConfig.Roles.indexOf(item.data.RoleID) >= 0 || widgetConfig.devMode
    }
  }],
  sorters: 'RoleID'
})

Ext.define('RC.UserAdministration.store.Region', {
  extend: 'Ext.data.Store',
  model: 'Stratum.Region',
  alias: 'store.region',
  autoLoad: true,
  proxy: {
    type: 'ajax',
    url: '/stratum/api/metadata/domainvalues/domain/3003',
    reader: {
      type: 'json',
      rootProperty: 'data'
    },
  },
  listeners: {
    load: function (store) {
      store.sort('ValueName', 'ASC')
    }
  }
})

Ext.define('RC.UserAdministration.store.Bindings', {
  extend: 'Ext.data.Store',
  alias: 'store.bindings',
  autoLoad: true,
  proxy: {
    type: 'ajax',
    url: '/stratum/api/metadata/units/bindings/' + Profile.Site.Register.RegisterID,
    reader: {
      type: 'json',
      rootProperty: 'data'
    },
  }
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
    dataloaded: 'updateStores',
    itemdblclick: 'userClicked',
    columnhide: 'onColumnHidden',
    columnShow: 'onColumnShown',
    selectionchange: 'onSelectionChange',
    groupclick: function () { return false },
    refresh: function () { this.update() },
  },
  store: 'users',
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
          store: {
            type: 'role', 
          },
          listeners: {
            change: 'updateGrid',
            beforeRender: 'addDefault'
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

  export: function () {
    Ext.util.CSV.delimiter = ';'
    var grid = this.getView()
    grid.saveDocumentAs({ type: 'xlsx', fileName: 'användare.xlsx' })
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
    Ext.create('RC.UserAdministration.view.CreateUser').show()
  },

  updateStores: function (dataLoader) {
    var users = dataLoader.getUsers()
    var contexts = dataLoader.getContexts()

    this.loadOwnUsers(users, contexts)
    this.setLoader(dataLoader)
    this.lookup('searchButton').enable()
    this.searchOwn()
  },

  updateDropdowns: function (dataLoader) {
    var units = dataLoader.getUnits()
    this.loadOwnUnits(units)
  },

  loadOwnUnits: function (units) {
    var unitFilter = this.lookup('unitFilter')
    var unitStore = unitFilter.getStore()
    unitStore.loadData(units)
    unitStore.add({ UnitName: ' Alla', UnitID: 0 })
    unitStore.sort({ property: 'UnitName', direction: 'ASC' })
    unitFilter.setValue(0)
  },

  loadOwnUsers: function (users, contexts) {
    this.addContexts(users)
    this.join(users, contexts)
    this.updateGrid()
    this.ownUsers = users
  },

  join: function (a, b) {
    b.forEach(function (context) {
      var user = a.filter(function (item) { return context.User.Username === item.Username })
      user[0].Contexts.push(context)
    })
  },

  addContexts: function (users) {
    users.forEach(function (item) {
      item.Contexts = []
    })
  },

  addDefault: function () {
    var dropdown = this.lookup('roleFilter')
    dropdown.getStore().add({ RoleID: 0, RoleName: 'Alla' })
    dropdown.setValue(0)
  },

  createUserFilter: function (user, role) {
    var filter = function (item) {
      if (item.data.UserID < 200 && !widgetConfig.devMode) return false
      var contexts = item.data.Contexts
      if (contexts) {
        if (user === '') { return true }
        var unitContexts = contexts.filter(function (context) {
          return Ext.String.startsWith(context.User.Username, user, true)
            || Ext.String.startsWith(context.User.FirstName, user, true)
            || Ext.String.startsWith(context.User.LastName, user, true)
            || (context.User.Extra && (typeof context.User.Extra === 'string') && Ext.String.startsWith(JSON.parse(context.User.Extra)[Profile.Site.Register.RegisterID], user, true))
            || (context.User.Extra && (typeof context.User.Extra === 'object') && Ext.String.startsWith(context.User.Extra[Profile.Site.Register.RegisterID], user, true))
        })
        var isPartOfUnit = unitContexts.length !== 0
        return isPartOfUnit
      }
      return true
    }
    return filter
  },

  createUnitFilter: function (unit, role) {
    var filter = function (item) {
      var contexts = item.data.Contexts
      if (contexts) {
        if (unit === 0) { return true }
        var unitContexts = contexts.filter(function (context) { return context.Unit.UnitID === unit })
        var isPartOfUnit = unitContexts.length !== 0
        return isPartOfUnit
      }
      return true
    }
    return filter
  },

  createRoleFilter: function (role) {
    var filter = function (item) {
      var roles
      var isInRole
      var contexts = item.data.Contexts
      if (contexts && role) {
        roles = contexts.filter(function (context) { return context.Role.RoleID === role })
        isInRole = roles.length !== 0
        return isInRole
      }
      if (contexts) {
        roles = contexts.filter(function (context) { return widgetConfig.Roles.indexOf(context.Role.RoleID) >= 0 || widgetConfig.devMode })
        isInRole = roles.length !== 0
        return isInRole
      }
      return true
    }

    return filter
  },

  createActiveFilter: function (active, role) {
    var filter = function (item) {
      var contexts = item.data.Contexts
      if (contexts) {
        if (active === 0) { return true }
        var activeContexts = contexts.filter(function (context) { return context.IsActive === true })
        var isActive = activeContexts.length !== 0
        return (active === 1 && isActive) || (active === 2 && !isActive)
      }
      return true
    }

    return filter
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
      this.getView().getStore().loadData(this.ownUsers)
      this.ownLoaded = true
    }
    this.updateGrid()
  },

  userClicked: function (component, record, item, index) {
    record.data.LastActive = this.getLatestContextLogin(record.data)
    record.data.Info = JSON.parse(record.data.Extra || '{}')[Profile.Site.Register.RegisterID]
    record.data.PersonalId = this.checkIfPersonalId(record.data.HSAID) ? record.data.HSAID : null

    Ext.create('RC.UserAdministration.view.EditUser', { userData: record, contextData: record.data.Contexts }).show()
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
      })
    }
  },

  getLatestContextLogin: function (user) {
    var time = user.Contexts.reduce(function (total, current) { 
      total.ActivatedAt = total.ActivatedAt || '' 
      if (total.ActivatedAt < current.ActivatedAt) { 
        return current 
      } 
      return total 
    })
    time = time.ActivatedAt ? time.ActivatedAt.substring(0, 16).replace('T', ' ') : null
    return time || 'Okänt'
  }
})

Ext.define('RC.UserAdministration.controller.Form', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.form',

  init: function () {
    this.callParent() 
    var usedFields = this.getFields()
    var fields = this.getForm().getFields().items
    fields.forEach(function (field) { 
      if (usedFields.indexOf(field.reference) < 0) {
        field.hide()
        field.disable()
      }
    })
  },

  onSithIdChoosen: function () {
    this.lookup('hsaid').show()
    this.lookup('hsaid').enable()
    this.lookup('personalid').hide()
    this.lookup('personalid').disable()
    this.lookup('sithIdButton').hide()
    this.lookup('bankIdButton').show()
  },

  onBankIdChoosen: function () {
    this.lookup('hsaid').hide()
    this.lookup('hsaid').disable()
    this.lookup('personalid').show()
    this.lookup('personalid').enable()
    this.lookup('bankIdButton').hide()
    this.lookup('sithIdButton').show()
  },

  onCreateContext: function () {
    Ext.create('RC.UserAdministration.view.CreateContext', { user: this.getView().getUserData().data.UserID }).show()
  },

  getUser: function () {
    var form = this.getForm().getValues()
    form.Email = form.Username
    var completeInfo = this.lookup('userform').up().Info || {}
    completeInfo[Profile.Site.Register.RegisterID] = form.Info
    form.Extra = JSON.stringify(completeInfo)
    return form
  },

  getForm: function () {
    return this.lookup('userform').getForm()
  },

  getContext: function () {
    var form = this.getForm().getValues()
    var context = {
      IsActive: true,
      User: { },
      Unit: { UnitID: form.UnitID },
      Role: { RoleID: form.RoleID }
    }
    
    return context
  },

  transformUser: function () {
    var form = this.getForm().getValues()
    this.transformExtra(form)
    this.getForm().setValues(form)
    return form.UserID
  },

  transformExtra: function (form) {
    var completeInfo = this.lookup('userform').up().Info || {}
    completeInfo[Profile.Site.Register.RegisterID] = form.Info
    form.Extra = JSON.stringify(completeInfo)
    return form
  },

  transformHsaid: function (component, value) {
    value = value.toUpperCase()
    component.setValue(value)
  },
  
  saveUser: function (data) {
    var deferred = new Ext.Deferred()
    delete data.user.UserID
    
    Ext.Ajax.request({
      url: '/stratum/api/metadata/users/',
      method: 'POST',
      jsonData: data.user,
      withCredentials: true,
      success: function (response) {
        data.user = Ext.decode(response.responseText).data
        deferred.resolve(data)
      },
      failure: function (response) {
        deferred.reject(response)
      }
    })
    return deferred.promise
  },

  saveContext: function (data) {
    var deferred = new Ext.Deferred()
    data.context.User.UserID = data.user.UserID
    Ext.Ajax.request({
      url: '/stratum/api/metadata/contexts/',
      method: 'POST',
      jsonData: data.context,
      withCredentials: true,
      success: function (response) {
        deferred.resolve(data)
      },
      failure: function (response) {
        deferred.reject(response)
      }
    })
    return deferred
  },

  updateUser: function (data) {
    var user = data.user
    var controller = data.controller
    Ext.Ajax.request({
      url: '/stratum/api/metadata/contexts/user/' + user.UserID,
      method: 'GET',
      withCredentials: true,
      success: function (result, request) {
        user.Contexts = Ext.decode(result.responseText).data
        var units = controller.getAllRegistryUnits()
        user.Contexts = user.Contexts.filter(function (context) { return units.indexOf(context.Unit.UnitID) >= 0 })
        Ext.ComponentQuery.query('usergrid')[0].getStore().add(user)
      },
      failure: function (result, request) {
      }
    })
  },
  
  getAllRegistryUnits: function () {
    return Ext.ComponentQuery.query('usergrid').pop().lookup('unitFilter').getStore()
      .getData().items.map(function (item) { return item.data.UnitID })
  }
})

Ext.define('RC.UserAdministration.view.CreateUser', {
  extend: 'Ext.window.Window',
  controller: 'createuser',
  modal: true,
  width: 1000,
  title: 'Användare',
  
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
  ]
})

Ext.define('RC.UserAdministration.controller.CreateUser', {
  extend: 'RC.UserAdministration.controller.Form',
  alias: 'controller.createuser',

  config: {
    fields: ['username', 'firstname', 'lastname', 'hsaid', 'role', 'unit']
  },

  init: function () {
    this.callParent()
    this.lookup('username').setFieldLabel('Epost')
    this.lookup('username').enable()
    this.lookup('username').removeCls('rc-info')
    this.onSithIdChoosen()
    if (Profile.Context.User.UserID < 200) {
      this.lookup('username').setFieldLabel('Användarnamn')
    }
  },

  onSave: function () {
    if (!this.getForm().isValid()) return
    var data = {}
    data.controller = this
    data.user = this.getUser()
    data.context = this.getContext()
    this.saveUser(data).then(this.saveContext).then(this.updateUser)
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
    var deferred = new Ext.Deferred()
    Ext.Ajax.request({
      url: '/stratum/api/metadata/users?query=' + query,
      success: function (response) {
        deferred.resolve(response)
      },
      failure: function (response) {
        deferred.reject(response)
      }
    })
    return deferred.promise
  },

  showMatchingUsers: function (response) {
    var matches = Ext.decode(response.responseText).data
    matches = this.filterMactches(matches)
    this.lookup('matchUser').getStore().loadData(matches)
  },

  filterMactches: function (matches) {
    var firstName = this.lookup('firstname').getValue()
    var lastName = this.lookup('lastname').getValue()
    var email = this.lookup('username').getValue()
    matches = matches.filter(function (match) {
      return (firstName.length < 3 || Ext.String.startsWith(match.FirstName, firstName, true))
          && (lastName.length < 3  || Ext.String.startsWith(match.LastName, lastName, true))
          && (email.length < 3     || Ext.String.startsWith(match.Email, email, true))
    })
    return matches
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
          xtype: 'tbfill'
        },
        {
          xtype: 'label',
          reference: 'statusbar',
          style: {
            fontWeight: 'normal'
          }
        }
      ]
    }
  ]
})

Ext.define('RC.UserAdministration.controller.EditUser', {
  extend: 'RC.UserAdministration.controller.Form',
  alias: 'controller.edituser',
  config: {
    fields: ['username', 'firstname', 'lastname', 'hsaid', 'email', 'organisation', 'registryinfo', 'lastactive']
  },

  init: function () {
    this.callParent()
    this.getView().down('grid').getStore().loadData(this.getView().getContextData())
    this.lookup('userform').loadRecord(this.getView().getUserData())
    delete this.lookup('username').vtype
    delete this.lookup('hsaid').vtype // qqq
    this.lookup('username').setFieldLabel('Användarnamn')
    this.lookup('username').setEditable(false)
    this.lookup('username').addCls('rc-info')
    this.lookup('extra').enable()
    var personalidIsUsed = this.getForm().getValues().PersonalId
    this.updateStatusBar()
    if (personalidIsUsed) {
      this.onBankIdChoosen()
    } else {
      this.onSithIdChoosen()
    }
  },

  updateStatusBar: function () {
    var numberOfContexts = this.getView().getContextData().length
    this.lookup('statusbar').setText('Antal ' + numberOfContexts)
  },

  onSave: function () {
    this.transformUser()
    this.getForm().updateRecord()
    Ext.StoreManager.lookup('users').sync({ callback: function () { } })
    this.getView().destroy()
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

Ext.define('RC.UserAdministration.view.CreateContext', {
  extend: 'Ext.window.Window',
  controller: 'createcontext',
  modal: true,
  width: 1000,
  title: 'Ny kontext',
  config: {
    user: null
  },
  
  items: [
    {
      xtype: 'rcuserform',
      reference: 'userform'
    }
  ]
})

Ext.define('RC.UserAdministration.controller.CreateContext', {
  extend: 'RC.UserAdministration.controller.Form',
  alias: 'controller.createcontext',
  config: {
    fields: ['unit', 'role']
  },

  onSave: function () {
    if (!this.getForm().isValid()) return
    var data = {}
    data.context = this.getContext()
    data.user = {}
    data.user.UserID = this.getUser()
    this.saveContext(data)
    this.getView().destroy()
  },

  getForm: function () {
    return this.lookup('userform').getForm()
  },

  getUser: function () {
    return this.getView().getUser()
  }
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
    { fieldLabel: 'Förnamn',         name: 'FirstName',    reference: 'firstname',  allowBlank: false },
    { fieldLabel: 'Efternamn',       name: 'LastName',     reference: 'lastname',   allowBlank: false },
    { fieldLabel: 'HSAID',           name: 'HSAID',        reference: 'hsaid',      allowBlank: false, vtype: 'hsaid', listeners: { change: 'transformHsaid' }, fieldStyle: { textTransform: 'uppercase' }, labelClsExtra: 'PrefixMandatory', maxLength: 64 },
    { fieldLabel: 'Personnummer',    name: 'PersonalId',   reference: 'personalid', allowBlank: false, vtype: 'personalid' },
    { fieldLabel: 'Epost',           name: 'Email',        reference: 'email',      vtype: 'email' },
    { fieldLabel: 'Registerinfo',    name: 'Info',         reference: 'registryinfo' },
    { fieldLabel: 'Organisation',    name: 'Organization', reference: 'organisation' },
    { fieldLabel: 'Användarnamn',    name: 'Username',     reference: 'username',   vtype: 'username', allowBlank: false },
    { fieldLabel: 'Senast inloggad', name: 'LastActive',   reference: 'lastactive', cls: 'rc-info' },
    { fieldLabel: 'Enhet',           name: 'UnitID',       reference: 'unit',       allowBlank: false, xtype: 'combobox', store: { type: 'unit' }, valueField: 'UnitID', displayField: 'UnitName' },
    { fieldLabel: 'Roll',            name: 'RoleID',       reference: 'role',       allowBlank: false, xtype: 'combobox', store: { type: 'role' }, valueField: 'RoleID', displayField: 'RoleName' },
    { fieldLabel: 'Användarid',      name: 'UserID',       reference: 'userid',     },
    { fieldLabel: 'Title',           name: 'WorkTitle',    reference: 'worktitle',  },
    { fieldLabel: 'Extra',           name: 'Extra',        reference: 'extra',      },
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
          reference: 'createContextButton',
          text: 'Skapa ny kontext',
          handler: 'onCreateContext',
          minWidth: 80
        },
        {
          xtype: 'button',
          reference: 'sithIdButton',
          text: 'Byt till Sithskort',
          handler: 'onSithIdChoosen',
          minWidth: 80
        },
        {
          xtype: 'button',
          reference: 'bankIdButton',
          text: 'Byt till BankID',
          handler: 'onBankIdChoosen',
          minWidth: 80
        },
        {
          text: 'Stäng',
          minWidth: 80,
          handler: function () {
            this.up('window').destroy()
          }
        },
        {
          xtype: 'button',
          text: 'Spara',
          handler: 'onSave',
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
        cellValues.innerCls = cellValues.innerCls.replace(' synced', '')
        if (cellValues.record.data.isSynced) {
          cellValues.innerCls += ' synced'
        }

        var content = this.defaultRenderer(value, cellValues)
        return content
      },
      listeners: {
        beforecheckchange: function (aColumn, anRowIndex, isChecked) {
        },
        checkchange: 'syncStore'
      }
    },
    {
      text: 'Enhet',
      renderer: function (value, metaData, record) { return record.get('Unit').UnitName },
      flex: 1,
      sortable: true
    },
    {
      text: 'Roll',
      renderer: function (value, metaData, record) { return record.get('Role').RoleName },
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
      renderer: function (value, metaData, record) { return record.get('User').ExpireDate },
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
        record.data.isSynced = true
        view.addRowCls(index, 'synced')
      },
      failure: function (result, request) {
      }
    })
  }
})

Ext.define('RC.UserAdministration.view.UnitGrid', {
  extend: 'Ext.grid.Panel',
  alias: 'widget.unitgrid',
  reference: 'unitgrid',
  controller: 'unit',
  multiSelect: true,
  selModel: 'rowmodel',
  width: '100%',
  height: 500,

  plugins: {
    gridexporter: true,
  },

  listeners: {
    itemdblclick: 'unitClicked',
    unitsloaded: 'onDataLoaded',
    selectionchange: 'onSelectionChange',
    columnhide: 'onColumnHidden',
    columnShow: 'onColumnShown',
    refresh: function () { this.update() }
  },

  store: {
    model: 'Stratum.Unit',
    storeId: 'units'
  },

  columns: [
    {
      text: 'Id',
      dataIndex: 'UnitCode',
      width: 60,
      sortable: true,
      hidden: localStorage.getItem('UnitCode') === 'hidden' || false
    },
    {
      text: 'Namn',
      dataIndex: 'UnitName',
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem('UnitName') === 'hidden' || false
    },
    {
      text: 'HSAID',
      dataIndex: 'HSAID',
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem('HSAID') === 'hidden' || false
    },
    {
      text: 'Region',
      dataIndex: 'County',
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem('County') === 'hidden' || false
    },
    {
      text: 'PARID',
      dataIndex: 'PARID',
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem('PARID') === 'hidden' || localStorage.getItem('PARID') === null
    },
    {
      text: 'Aktiv',
      dataIndex: 'IsActive',
      width: 60,
      sortable: true,
      hidden: localStorage.getItem('IsActive') === 'hidden' || localStorage.getItem('PARID') === null,
      renderer: function (value, cellValues) {
        value = value ? 'Ja' : 'Nej'
        return value
      },
    }
  ],

  dockedItems: [
    {
      xtype: 'toolbar',
      reference: 'search',
      dock: 'top',
      border: false,
      items: [
        {
          xtype: 'textfield',
          reference: 'unitFilter',
          flex: 1,
          keyMap: {
            'enter': {
              handler: 'searchUnits'
            }
          }
        },
        {
          xtype: 'button',
          reference: 'searchButton',
          text: 'Sök',
          width: 100,
          handler: 'searchUnits',
          disabled: false
        },
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

Ext.define('RC.UserAdministration.controller.Unit', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.unit',

  searchUnits: function () {
    var store   = this.getView().getStore()
    var unit    = this.lookup('unitFilter').getValue()
    store.clearFilter()
    store.addFilter(this.createUnitFilter(unit))
  },

  onDataLoaded: function (dataLoader) {
    var units = dataLoader.getUnits()
    var bindings = dataLoader.getBindings()
    units.forEach(function (unit) {
      unit.County = bindings[unit.UnitName].County
    })
    this.getView().getStore().loadData(units)
  },

  export: function () {
    Ext.util.CSV.delimiter = ';'
    var grid = this.getView()
    grid.saveDocumentAs({ type: 'xlsx', fileName: 'enheter.xlsx' })
  },

  edit: function () {
    var selections = this.getView().getSelection()
    if (selections.length === 1) {
      this.unitClicked(null, selections[0])
    }
  },

  create: function () {
    Ext.create('RC.UserAdministration.view.CreateUnit').show()
  },

  unitClicked: function (component, record, item, index) {
    Ext.create('RC.UserAdministration.view.EditUnit', { unit: record }).show()
  },

  onColumnHidden: function (component, column, eOpts) {
    localStorage.setItem(column.dataIndex, 'hidden')
  },

  onColumnShown: function (component, column, eOpts) {
    localStorage.setItem(column.dataIndex, 'shown')
  },

  onSelectionChange: function (component, record, index, eOpts) {
    this.lookup('editButton').enable()
  },

  createUnitFilter: function (unit) {
    var filter = function (item) {
      return Ext.String.startsWith(item.data.UnitName, unit, true)
    }
    return filter
  },
})

Ext.define('RC.UserAdministration.form.Unit', {
  extend: 'Ext.form.Panel',
  xtype: 'rcunitform',
  layout: 'column',
  width: '100%',
  bodyPadding: 7,

  fieldDefaults: {
    validateOnChange: true
  },
  
  defaults: {
    layout: 'form',
    xtype: 'textfield',
    columnWidth: 1,
    labelWidth: 115,
    padding: 7,
    listeners: {
      change: 'onFormChanged'
    },
  },
  
  items: [
    { fieldLabel: 'Namn', name: 'UnitName', reference: 'unitname',  allowBlank: false },
    { fieldLabel: 'Enhetskod', name: 'UnitCode', reference: 'unitcode',  allowBlank: false },
    { fieldLabel: 'Aktiv', name: 'IsActive', reference: 'active', hidden: true, allowBlank: false, xtype: 'combobox', store: { type: 'active' }, valueField: 'ActiveCode', displayField: 'ActiveName' },
    { fieldLabel: 'HSA-id', name: 'HSAID', reference: 'hsaid',  allowBlank: true },
    { fieldLabel: 'PAR-id', name: 'PARID', reference: 'parid',  allowBlank: true },
    { fieldLabel: 'Region', name: 'County', reference: 'region', allowBlank: false, xtype: 'combobox', store: { type: 'region' }, valueField: 'DomainValueID', displayField: 'ValueName' },
    // { fieldLabel: 'Register', name: 'Register', reference: 'registry', hidden: true }
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
          text: 'Stäng',
          minWidth: 80,
          handler: function () {
            this.up('window').destroy()
          }
        },
        {
          xtype: 'button',
          text: 'Spara',
          handler: 'onSave',
          formBind: true,
          minWidth: 80
        }
      ]
    }
  ]
})

Ext.define('RC.UserAdministration.controller.UnitForm', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.unitform',

  getForm: function () {
    return this.lookup('unitform').getForm()
  },
})

Ext.define('RC.UserAdministration.view.EditUnit', {
  extend: 'Ext.window.Window',
  controller: 'editunit',
  modal: true,
  width: 600,
  title: 'Redigera enhet',
  
  config: {
    unit: [],
  },
  
  items: [
    {
      xtype: 'rcunitform',
      reference: 'unitform'
    }
  ]
})

Ext.define('RC.UserAdministration.controller.EditUnit', {
  extend: 'RC.UserAdministration.controller.UnitForm',
  alias: 'controller.editunit',
  config: {
    fields: ['unitname']
  },

  init: function () {
    this.lookup('unitform').loadRecord(this.getView().getUnit())
    this.lookup('region').hide()
    this.lookup('region').disable()
  },

  onSave: function () {
    this.getForm().updateRecord()
    Ext.StoreManager.lookup('units').sync({ callback: function () { } })
    this.getView().destroy()
  },

  transformRegion: function () {
    var form = this.getForm().getValues()
    form.Bindings = [{ DomainValueId: form.County }]
    this.getForm().setValues(form)
  }
})

Ext.define('RC.UserAdministration.view.CreateUnit', {
  extend: 'Ext.window.Window',
  controller: 'createunit',
  modal: true,
  width: 600,
  title: 'Skapa enhet',
  
  config: {
    unit: [],
  },
  
  items: [
    {
      xtype: 'rcunitform',
      reference: 'unitform'
    }
  ]
})

Ext.define('RC.UserAdministration.controller.CreateUnit', {
  extend: 'RC.UserAdministration.controller.UnitForm',
  alias: 'controller.createunit',
  config: {
    fields: ['unitname']
  },

  init: function () {
    this.lookup('active').setValue(true)
  },

  onSave: function () {
    var unit = this.getForm().getValues()
    unit.Bindings = [{ DomainValueID: unit.County }]
    unit.Register = { RegisterID: Profile.Site.Register.RegisterID }
    unit.HSAID = unit.HSAID || null
    unit.PARID = unit.PARID || null
    delete unit.UnitID
    delete unit.County
    this.saveUnit(unit).then(this.updateGrid)
    this.getView().destroy()
  },

  saveUnit: function (unit) {
    var deferred = new Ext.Deferred()
    Ext.Ajax.request({
      url: '/stratum/api/metadata/units/',
      method: 'POST',
      jsonData: unit,
      withCredentials: true,
      success: function (response) {
        unit = Ext.decode(response.responseText).data
        deferred.resolve(unit)
      },
      failure: function (response) {
        deferred.reject(response)
      }
    })
    return deferred.promise
  },

  updateGrid: function (unit) {
    Ext.ComponentQuery.query('unitgrid').pop().getStore().add(unit)
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
    config.queryMode = 'local'
    // config.listeners = { select: config.selectCallback };
    this.callParent(arguments)
  }
})

Ext.define('RC.UserAdministration.Validators', {
  override: 'Ext.form.field.VTypes',
  hsaid: function (value) {
    var validator = new RegExp(/^SE[a-zA-Z0-9-]{1,29}$/)
    return validator.test(value)
  },
  hsaidText: 'Inget giltigt <br/>HSAID',

  personalid: function (value) {
    var validator = new RegExp(/^(19|20)[0-9]{10}$/)
    return validator.test(value)
  },

  personalidText: 'Inget giltigt personnummer <br/>ÅÅÅÅMMDDXXXX',

  username: function (value, field) {
    var isValid = false
    if (value === field.lastTry) return field.lastTryResult
    field.lastTry = value
    
    Ext.Ajax.request({
      async: false,
      url: '/stratum/api/metadata/users/exists/' + value,
      method: 'GET',
      success: function (response, opts) {
        isValid = false
      },
      failure: function (response, opts) {
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
    bindings: [],
    observers: [],
    loginsSith: [],
    loginsBankId: []
  },
  constructor: function (config) {
    this.initConfig(config)
    this.callParent(config)
    this.loadData()
  },
  
  loadData: function () {
    var controller = this
    Ext.Promise.all([
      Ext.Ajax.request({ url: '/stratum/api/metadata/units/register/' + Profile.Site.Register.RegisterID }),
      Ext.Ajax.request({ url: '/stratum/api/metadata/units/bindings/' + Profile.Site.Register.RegisterID }),
    ]).then(function (results) {
      var units = Ext.decode(results[0].responseText).data
      var bindings = Ext.decode(results[1].responseText).data
      controller.setUnits(units)
      controller.setBindings(bindings)
      controller.getObservers().forEach(function (observer) {
        observer.fireEvent('unitsloaded', controller)
      })
    })
    
    Ext.Promise.all([
      Ext.Ajax.request({ url: '/stratum/api/metadata/users/register/' + Profile.Site.Register.RegisterID }),
      Ext.Ajax.request({ url: '/stratum/api/metadata/contexts/register/' + Profile.Site.Register.RegisterID }),
    ]).then(function (results) {
      var users = Ext.decode(results[0].responseText).data
      var contexts = Ext.decode(results[1].responseText).data

      controller.setUsers(users)
      controller.setContexts(contexts)
      controller.getObservers().forEach(function (observer) {
        observer.fireEvent('dataloaded', controller)
      })
    })
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
    var body = view.body

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
      })
    } else {
      body.down('.drag-file-label').setHtml(
        'File dragging is not supported by your browser'
      )
      body.el.addCls('nosupport')
    }
  },

  onDragEnter: function () {
    this.getView().body.addCls('rc-active')
  },

  onDragLeave: function () {
    this.getView().body.removeCls('rc-active')
  },

  beforeDrop: function () {
    return true
  },

  onDrop: function (target, info) {
    var view = this.getView()
    var body = view.body
    // var icon = body.down('.drag-file-icon');
    var reader = new FileReader()

    body.removeCls('active')
    reader.onload = this.read
    reader.readAsText(info.files[0])
  },

  destroy: function () {
    Ext.undefer(this.timer)
    this.target = Ext.destroy(this.target)
    this.callParent()
  },

  read: function (e) {
    var content = e.target.result
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
  + '}',
  'useradministration'
)
