
var widgetConfig  = widgetConfig || {}
widgetConfig.Roles = [0, 901, 902, 903, 907, 908]
widgetConfig.devMode = Profile.Context && Profile.Context.User.UserID <= 200
// widgetConfig.devMode = false


function onReady() {
  Ext.tip.QuickTipManager.init()
  RC && RC.UserAdministration && RC.UserAdministration.app && RC.UserAdministration.app.destroy()
  // Ext.create('RC.UserAdministration.view.FileDrop').show();
  Ext.create('RC.UserAdministration.store.User')
  Ext.create('RC.UserAdministration.store.Unit')
  Ext.create('RC.UserAdministration.store.Role')
  Ext.create('RC.UserAdministration.store.Bindings', { storeId: 'bindings' })
  RC.UserAdministration.app = Ext.create('Ext.tab.Panel', { cls: 'navbar-default', renderTo: 'contentPanel', items: [{ title: 'Användare', xtype: 'usergrid' }, { title: 'Enheter', xtype: 'unitgrid' }] })
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
  alias: 'store.user'
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
  controller: 'user',
  multiSelect: true,
  selModel: 'rowmodel',
  width: '100%',
  height: 500,
  cls: 'rc-useradministration',

  plugins: {
    gridexporter: true,
  },

  listeners: {
    unitsloaded: 'updateDropdowns',
    dataloaded: 'updateStores',
    contextsupdated: 'onContextChanged',
    itemdblclick: 'userClicked',
    columnhide: 'onColumnHidden',
    columnShow: 'onColumnShown',
    selectionchange: 'onSelectionChange',
    groupclick: function () { return false },
    refresh: function () { this.update() },
  },
  store: {
    type: 'user',
    storeId: 'users'
  },
  columns: [
    {
      text: 'Id',
      dataIndex: 'UserID',
      width: 65,
      sortable: true,
      hidden: localStorage.getItem('UserID') === 'hidden' || false
    },
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

  init: function () {
    var columns = this.getView().getColumns()
    var defaultHiddenColumns = ['UserID', 'WorkTitle', 'Organization']
    columns.forEach(function (column) {
      column.hidden = localStorage.getItem(column.dataIndex) === 'hidden' || (localStorage.getItem(column.dataIndex) === null && defaultHiddenColumns.indexOf(column.dataIndex)>-1)
    })
  },

  export: function () {
    Ext.util.CSV.delimiter = ';'
    var grid = this.getView()
    grid.saveDocumentAs({ type: 'xlsx', fileName: 'användare.xlsx' })
  },

  mail: function () {
    var selections = this.getView().getSelection()
    var mailList = ''
    var validator = new Ext.data.validator.Email()
    selections.forEach(function (user) {
      if (validator.validate(user.getData().Email) === true) {
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

  onContextChanged: function (user) {
    this.loadUserContexts(user)
  },

  loadUserContexts: function (user) {
    var controller = this
    Ext.Ajax.request({
      url: '/stratum/api/metadata/contexts/user/' + user,
      method: 'GET',
      withCredentials: true,
      success: function (result, request) {
        var contexts = Ext.decode(result.responseText).data
        var units = controller.getAllRegistryUnits()
        contexts = contexts.filter(function (context) { return units.indexOf(context.Unit.UnitID) >= 0 })
        controller.getView().getStore().getById(user).set('Contexts', contexts)
      },
      failure: function (result, request) {
      }
    })
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
    var newUsers = this.createUserArray(users)
    this.joinNew(newUsers, contexts)
    // this.join(users, contexts)
    this.updateGrid()
    this.ownUsers = users
  },

  join: function (a, b) {
    b.forEach(function (context) {
      var user = a.filter(function (item) { return context.User.Username === item.Username })
      user[0].Contexts.push(context)
    })
  },

  joinNew: function (a, b) {
    b.forEach(function (context) {
      a[context.User.UserID].Contexts.push(context)
    })
  },

  addContexts: function (users) {
    users.forEach(function (item) {
      item.Contexts = []
    })
  },

  createUserArray: function (users) {
    var newUsers = []
    users.forEach(function (user) {
      newUsers[user.UserID] = user
    })
    return newUsers
  },

  addDefault: function () {
    var dropdown = this.lookup('roleFilter')
    dropdown.getStore().add({ RoleID: 0, RoleName: 'Alla' })
    dropdown.setValue(0)
  },

  createFilter: function (user, unit, role, active) {
    var filter = function (item) {
      var contexts = item.data.Contexts
      if (contexts) {
        contexts = contexts.filter(function (context) { return (unit === 0  || context.Unit.UnitID === unit) })
        contexts = contexts.filter(function (context) { return role === 0   || context.Role.RoleID === role })
        contexts = contexts.filter(function (context) { return active === 0 || context.IsActive    === (active === 1)})
        return contexts.length !== 0
      }
      return true
    }
    return filter
  },

  createUserFilter: function (user, role) {
    var filter = function (item) {
      if (item.data.UserID < 200 && !widgetConfig.devMode) return false
      if (user === '') { return true }
      user = user.replace('<', '').replace('>', '')
      var contexts = item.data.Contexts
      if (contexts) {
        var terms = user.split(' ')
        terms.forEach(function (term) {
          term = term.toLowerCase()
          contexts = contexts.filter(function (context) {
            return context.User.Username.toLowerCase().indexOf(term) > -1
               || (context.User.FirstName && context.User.FirstName.toLowerCase().indexOf(term) > -1)
               || (context.User.LastName && context.User.LastName.toLowerCase().indexOf(term) > -1)
               || (context.User.Email && context.User.Email.toLowerCase().indexOf(term) > -1)
          })
        })
        var isPartOfUnit = contexts.length !== 0
        var matchesExtraField = (JSON.parse(item.data.Extra) && Ext.String.startsWith(JSON.parse(item.data.Extra)[Profile.Site.Register.RegisterID], user, true)) ? true : false
        return isPartOfUnit || matchesExtraField
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
    store.addFilter(this.createFilter(user, unit, role, active))
    store.resumeEvents()
    store.addFilter(this.createUserFilter(user, role))
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

    Ext.create('RC.UserAdministration.view.EditUser', { userData: record, contextData: Ext.clone(record.data.Contexts), contextsForValidation: Ext.clone(record.data.Contexts) }).show()
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
  },

   getAllRegistryUnits: function () {
    return Ext.ComponentQuery.query('usergrid').pop().lookup('unitFilter').getStore()
      .getData().items.map(function (item) { return item.data.UnitID })
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
    this.lookup('firstname').allowBlank = true
    this.lookup('firstname').removeCls('rc-required')
    this.lookup('lastname').allowBlank = true
    this.lookup('lastname').removeCls('rc-required')
    this.lookup('hsaid').show()
    this.lookup('hsaid').enable()
    this.lookup('personalid').hide()
    this.lookup('personalid').disable()
    this.lookup('sithIdButton').hide()
    this.lookup('bankIdButton').show()
  },

  onBankIdChoosen: function () {
    this.lookup('firstname').allowBlank = false
    this.lookup('firstname').addCls('rc-required')
    this.lookup('lastname').allowBlank = false
    this.lookup('lastname').addCls('rc-required')
    this.lookup('hsaid').hide()
    this.lookup('hsaid').disable()
    this.lookup('personalid').show()
    this.lookup('personalid').enable()
    this.lookup('bankIdButton').hide()
    this.lookup('sithIdButton').show()
  },

  getUser: function () {
    var form = this.getForm().getValues()
    form.Email = form.Username
    var completeInfo = this.lookup('userform').up().Info || {}
    completeInfo[Profile.Site.Register.RegisterID] = form.Info
    form.Extra = JSON.stringify(completeInfo)
    form.HSAID = form.HSAID ? form.HSAID : form.PersonalId
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
    this.transformPersonalId(form)
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
    var value = form.HSAID
    if(value && value.indexOf('SE')>-1) {
      value = value.toUpperCase()
    }

    return value
  },

  transformPersonalId: function (form) {
    if(!form.PersonalId) return
    this.lookup('hsaid').setValue(form.PersonalId)
    this.lookup('hsaid').enable()
    this.lookup('personalid').disable()
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
        data.context = Ext.decode(response.responseText).data
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
  },

  onSendWelcomeMail: function () {
    var newline = '' + escape('\n')
    var site = Profile.Site.SiteName
    var registry = Profile.Site.Register.ShortName.toLowerCase()
    var recipient = this.lookup('username').getValue() || ''
    var name = (this.lookup('firstname').getValue() + ' ' + this.lookup('lastname').getValue())
    name = name !== ' ' ? ' ' + name : ''
    var sender = Profile.Context.User.FirstName + ' ' + Profile.Context.User.LastName
    var subject = widgetConfig.mailTitle || ('Välkommen till ' + site)
    var content = this.lookup('personalid').isDisabled() ? this.getSithsMail() : this.getBankIdMail()
    content = content.replace(/\{recipient}/g, recipient).replace(/\{sender}/g, sender).replace(/\{site}/g, site).replace(/\{registry}/g, registry).replace(/\{nl}/g, newline).replace(/\{name}/g, name)
    var mail = 'mailto:' + recipient + '?subject=' + subject + '&body=' + content
    window.location = mail
  },

  getSithsMail: function () {
    var content = 'Hej{name}!{nl}{nl}Välkommen till {site}.{nl}' 
                + 'Du har nu fått ett inloggningskonto till {site}, men behöver först koppla ditt {nl}'
                + 'SITHS-kort. Gå till https://{registry}.registercentrum.se och logga in: {nl}{nl}'
                + 'Användarnamn: {recipient}{nl}' 
                + 'Lösenord: sa52re{nl}{nl}'
                + 'Med vänlig hälsning,{nl}'
                + '{sender}'
    return widgetConfig.sithsMail || content
  },

  getBankIdMail: function () {
    var content = 'Hej{name}!{nl}{nl}Välkommen till {site}.{nl}' 
                + 'Du kan nu logga in på {site} via mobilt Bank ID.{nl}'
                + 'Gå till https://{registry}.registercentrum.se och logga in med ditt BankID: {nl}{nl}'
                + 'Med vänlig hälsning,{nl}'
                + '{sender}'
    return widgetConfig.bankidMail || content
  }
})

Ext.define('RC.UserAdministration.view.CreateUser', {
  extend: 'Ext.window.Window',
  controller: 'createuser',
  modal: true,
  width: 1000,
  title: 'Användare',
  cls: 'rc-useradministration',
  
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
        data: [],
        type: 'user',
        storeId: 'matchingusers'
      },
    }
  ]
})

Ext.define('RC.UserAdministration.controller.CreateUser', {
  extend: 'RC.UserAdministration.controller.Form',
  alias: 'controller.createuser',

  config: {
    fields: ['username', 'firstname', 'lastname', 'hsaid', 'role', 'unit', 'registryinfo']
  },

  init: function () {
    this.callParent()
    this.lookup('username').setFieldLabel('Epost')
    this.lookup('username').enable()
    this.lookup('username').removeCls('rc-info')
    this.lookup('createContextButton').hide()
    this.onSithIdChoosen()
    widgetConfig.preferredRole && this.lookup('role').setValue(widgetConfig.preferredRole)
    if (widgetConfig.devMode) {
      this.lookup('username').setFieldLabel('Användarnamn')
    }
  },

  onSave: function () {
    if (!this.getForm().isValid()) return
    var data = {}
    var controller = this
    data.controller = this
    data.user = this.getUser()
    data.context = this.getContext()
    this.saveUser(data).then(controller.saveContext).then(controller.updateUser)
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
  cls: 'rc-useradministration',

  listeners: {
    contextadded: 'onContextAdded'
  },
  
  config: {
    userData: [],
    contextData: [],
    contextsForValidation: []
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
      reference: 'contexts',
      width: '100%',
      height: 300,
      plugin: true,
      store: {
        fields: ['IsActive',
          {
            name: 'ContextID', dataIndex: 'ContextID'
          }, 
          {
            name: 'Unit', convert: function (v, record) {return record.get('Unit').UnitName}
          },
          {
            name: 'Role', convert: function (v, record) { return record.get('Role').RoleName}
          },
          {
            name: 'Active', convert: function(v, record) { return record.get('ActivatedAt') ? record.get('ActivatedAt').substring(0, 10) : '' }
          }
          ],
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
    delete this.lookup('hsaid').vtype
    // this.lookup('WelcomeLetterButton').hide()
    this.lookup('username').setFieldLabel('Användarnamn')
    //this.lookup('username').setEditable(false)
    //this.lookup('username').addCls('rc-info')
    //this.lookup('username').labelClsExtra = ''
    //this.lookup('hsaid').labelClsExtra = 'rc-required'
    //this.lookup('hsaid').allowBlank = false
    this.lookup('extra').enable()
    var personalidIsUsed = this.getView().getUserData().data.PersonalId
    this.updateStatusBar()
    if (personalidIsUsed) {
      this.lookup('hsaid').setValue(null)
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
    if(this.getForm().getRecord().data.HSAID===''){
      this.getForm().getRecord().data.HSAID=null
    }
    Ext.StoreManager.lookup('users').sync({ callback: function () { } })
    this.getView().destroy()
  },

  onCreateContext: function () {
    Ext.create('RC.UserAdministration.view.CreateContext', { user: this.getView().getUserData().get('UserID'), contexts: this.getView().getContextsForValidation(), userForm: this.getView() }).show()
  },

  onContextAdded: function (context) {
    var store = this.lookup('contexts').getStore()
    store.add(context)
    Ext.getStore('users').getById(context.User.UserID).data.Contexts.push(context)
  }
})

Ext.define('RC.UserAdministration.view.MatchUser', {
  extend: 'Ext.grid.Panel',
  alias: 'widget.matchuser',
  reference: 'matchUser',
  width: '100%',
  controller: 'matchuser',

  listeners: {
    itemdblclick: 'onEditUser'
  },

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

Ext.define('RC.UserAdministration.controller.MatchUser', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.matchuser',

  init: function () {
    
  },

  onEditUser: function (component, record, item, index) {
    var data = { controller: this, user: record.data}
    this.loadUserContexts(data).then(this.loadUser)
  },

  loadUser: function (data) {
    var me = data.controller
    var user = data.user
    var record = me.getView().getStore().getById(data.user.UserID)
    user.Contexts = user.Contexts || [] 
    user.LastActive = me.getLatestContextLogin(data.user)
    user.Info = JSON.parse(record.data.Extra || '{}')[Profile.Site.Register.RegisterID]
    user.PersonalId = me.checkIfPersonalId(record.data.HSAID) ? record.data.HSAID : null
    Ext.create('RC.UserAdministration.view.EditUser', { userData: record, contextData: Ext.clone(record.data.Contexts), contextsForValidation: Ext.clone(record.data.Contexts) }).show()
  },

  /* Duplicated code from usergrid - Refactor if time allows*/
  getLatestContextLogin: function (user) {
    if(user.Contexts.length===0) return 'Okänt'
    var time = user.Contexts.reduce(function (total, current) { 
      total.ActivatedAt = total.ActivatedAt || '' 
      if (total.ActivatedAt < current.ActivatedAt) { 
        return current 
      } 
      return total 
    })
    time = time.ActivatedAt ? time.ActivatedAt.substring(0, 16).replace('T', ' ') : null
    return time || 'Okänt'
  },

  checkIfPersonalId: function (value) {
    return value && (value.indexOf('19') === 0 || value.indexOf('20') === 0)
  },

  loadUserContexts: function (data) {
    var controller = this
    var deferred = new Ext.Deferred()
    
    Ext.Ajax.request({
      url: '/stratum/api/metadata/contexts/user/' + data.user.UserID,
      method: 'GET',
      withCredentials: true,
      success: function (result, request) {
        var contexts = Ext.decode(result.responseText).data
        var units = controller.getAllRegistryUnits()
        contexts = contexts.filter(function (context) { return units.indexOf(context.Unit.UnitID) >= 0 })
        controller.getView().getStore().getById(data.user.UserID).set('Contexts', contexts)
        deferred.resolve(data)
      },
      failure: function (result, request) {
        deferred.reject()
      }
    })
    return deferred.promise
  },

  getAllRegistryUnits: function () {
    return Ext.ComponentQuery.query('usergrid').pop().lookup('unitFilter').getStore()
      .getData().items.map(function (item) { return item.data.UnitID })
  }

})

Ext.define('RC.UserAdministration.view.CreateContext', {
  extend: 'Ext.window.Window',
  controller: 'createcontext',
  modal: true,
  width: 1000,
  title: 'Ny kontext',
  cls: 'rc-useradministration',
  config: {
    user: null,
    contexts: [],
    userForm: null
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

  init: function () {
    this.callParent() 
    this.lookup('sithIdButton').hide()
    this.lookup('bankIdButton').hide()
    this.lookup('createContextButton').hide()
    this.lookup('WelcomeLetterButton').hide()
    this.lookup('role').vtype = 'context'
    this.lookup('unit').vtype = 'context'
  },

  onSave: function () {
    if (!this.getForm().isValid()) return
    var data = {}
    data.context = this.getContext()
    data.user = {}
    data.user.UserID = this.getUser()
    data.controller = this
    this.saveContext(data).then(data.controller.updateContexts)
  },

  updateContexts: function (data) {
    data.controller.getView().getUserForm().fireEvent('contextadded', data.context)
    data.controller.getView().destroy()
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
  config: {
    userGrid: null
  },

  fieldDefaults: {
    validateOnChange: true
  },
  bodyPadding: 7,
  defaults: {
    layout: 'form',
    xtype: 'textfield',
    columnWidth: 0.49,
    labelWidth: 125,
    padding: 7,
    listeners: {
      change: 'onFormChanged'
    },
  },
  layout: 'column',
  width: '100%',
  items: [
    { fieldLabel: 'Förnamn',         name: 'FirstName',    reference: 'firstname',  allowBlank: true },
    { fieldLabel: 'Efternamn',       name: 'LastName',     reference: 'lastname',   allowBlank: true },
    { fieldLabel: 'HSAID',           name: 'HSAID',        reference: 'hsaid',      allowBlank: true, vtype: 'hsaid', /*fieldStyle: { textTransform: 'uppercase' },*/ labelClsExtra: 'PrefixMandatory', maxLength: 64 },
    { fieldLabel: 'Personnummer',    name: 'PersonalId',   reference: 'personalid', allowBlank: false, vtype: 'personalid', labelClsExtra: 'rc-required' },
    { fieldLabel: 'Epost',           name: 'Email',        reference: 'email',      vtype: 'email' },
    { fieldLabel: 'Organisation',    name: 'Organization', reference: 'organisation' },
    { fieldLabel: 'Användarnamn',    name: 'Username',     reference: 'username',   vtype: 'username', allowBlank: false, labelClsExtra: 'rc-required' },
    { fieldLabel: 'Enhet',           name: 'UnitID',       reference: 'unit',       allowBlank: false, xtype: 'rcfilter', store: { type: 'unit' }, valueField: 'UnitID', displayField: 'UnitName', labelClsExtra: 'rc-required' },
    { fieldLabel: 'Roll',            name: 'RoleID',       reference: 'role',       allowBlank: false, xtype: 'rcfilter', store: { type: 'role' }, valueField: 'RoleID', displayField: 'RoleName', labelClsExtra: 'rc-required' },
    { fieldLabel: 'Användarid',      name: 'UserID',       reference: 'userid',     },
    { fieldLabel: 'Title',           name: 'WorkTitle',    reference: 'worktitle',  },
    { fieldLabel: 'Registerinfo',    name: 'Info',         reference: 'registryinfo' },
    { fieldLabel: 'Senast inloggad', name: 'LastActive',   reference: 'lastactive', cls: 'rc-info' },
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
          reference: 'WelcomeLetterButton',
          text: 'Välkomstbrev',
          handler: 'onSendWelcomeMail',
          minWidth: 80
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
          text: 'Avbryt',
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
      text: 'ID',
      dataIndex: 'ContextID',
      width: 65,
      sortable: true
    },
    {
      text: 'Enhet',
      dataIndex: 'Unit',
      flex: 1,
      sortable: true
    },
    {
      text: 'Roll',
      dataIndex: 'Role',
      flex: 1,
      sortable: true
    },
    {
      text: 'Aktiv senast',
      dataIndex: 'Active',
      width: 100,
      // renderer: function (value, metaData, record) { return record.get('ActivatedAt') ? record.get('ActivatedAt').substring(0, 10) : '' },
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
    var observer = RC.UserAdministration.app.down('usergrid')
    var params = Ext.clone(record.data)
    params.IsActive = checked
    delete params.User
    delete params.ExpireDate
    delete params.ActivatedAt
    delete params.Active
    delete params.Unit
    delete params.Role
    
    Ext.Ajax.request({
      url: '/stratum/api/metadata/contexts/' + params.ContextID,
      method: 'PUT',
      jsonData: params,
      withCredentials: true,
      success: function (result, request) {
        record.data.isSynced = true
        view.addRowCls(index, 'synced')
        observer.fireEvent('contextsupdated', record.data.User.UserID)
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
  cls: 'rc-useradministration',
  config: {
    domains: []
  },

  plugins: {
    gridexporter: true,
  },

  listeners: {
    itemdblclick: 'unitClicked',
    unitsloaded: 'onDataLoaded',
    domainsLoaded: 'onDomainsLoaded',
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
      dataIndex: 'UnitID',
      width: 60,
      sortable: true
    },
    {
      text: 'Kod',
      dataIndex: 'UnitCode',
      width: 60,
      sortable: true
    },
    {
      text: 'Namn',
      dataIndex: 'UnitName',
      flex: 1,
      sortable: true
    },
    {
      text: 'HSAID',
      dataIndex: 'HSAID',
      flex: 1,
      sortable: true
    },
    {
      text: 'Region',
      dataIndex: 'County',
      flex: 1,
      sortable: true
    },
    {
      text: 'PARID',
      dataIndex: 'PARID',
      flex: 1,
      sortable: true
    },
    {
      text: 'Aktiv',
      dataIndex: 'IsActive',
      width: 60,
      sortable: true,
      renderer: function (value, cellValues) {
        value = value ? 'Ja' : 'Nej'
        return value
      }
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

  init: function () {
    var columns = this.getView().getColumns()
    var defaultHiddenColumns = ['UnitID', 'PARID']
    columns.forEach(function (column) {
      column.hidden = localStorage.getItem(column.dataIndex) === 'hidden' || (localStorage.getItem(column.dataIndex) === null && defaultHiddenColumns.indexOf(column.dataIndex)>-1)
    })
  },

  searchUnits: function () {
    var store   = this.getView().getStore()
    var unit    = this.lookup('unitFilter').getValue()
    store.clearFilter()
    store.addFilter(this.createUnitFilter(unit))
  },

  onDataLoaded: function (dataLoader) {
    var units = dataLoader.getUnits()
    var domains = this.getView().getDomains()
    var bindings = dataLoader.getBindings()
    units.forEach(function (unit) {
      unit.County = bindings[unit.UnitName].County
      domains.forEach(function (domain){
        unit[domain.DomainName] = bindings[unit.UnitName][domain.DomainName]
      })
    })
    this.getView().getStore().loadData(units)
  },

  onDomainsLoaded: function (dataLoader) {
    this.getView().setDomains(dataLoader.getDomains())
    var domains = this.getView().getDomains()
    var bindings = dataLoader.getBindings()
    var grid = this.getView().getHeaderContainer()
    domains.forEach(function (domain){
      grid.insert(Ext.create('Ext.grid.column.Column', { text: domain.DomainTitle, dataIndex: domain.DomainName, flex: 1 }))
    })
    this.onDataLoaded(dataLoader)
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
    var nextId = this.getNextUnitId()
    Ext.create('RC.UserAdministration.view.CreateUnit', {nextId: nextId, domains: this.getView().getDomains()}).show()
  },

  unitClicked: function (component, record, item, index) {
    Ext.create('RC.UserAdministration.view.EditUnit', { unit: record, domains: this.getView().getDomains() }).show()
  },

  getNextUnitId: function () {
    return this.getView().getStore().getData().items.map(function(item){return item.data.UnitCode}).reduce(function(max, item) {return Math.max(max, item)}) +1 
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
      return item.data.UnitName.toLowerCase().indexOf(unit)>-1 
          || item.data.UnitCode == unit
          || (item.data.County && item.data.County.toLowerCase().indexOf(unit)>-1 )
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
    { fieldLabel: 'HSA-id', name: 'HSAID', reference: 'hsaid',  allowBlank: true },
    { fieldLabel: 'PAR-id', name: 'PARID', reference: 'parid',  allowBlank: true },
    { fieldLabel: 'Region', name: 'County', reference: 'region', allowBlank: false, xtype: 'rcfilter', store: { type: 'region' }, valueField: 'DomainValueID', displayField: 'ValueName' },
    { fieldLabel: 'Aktiv', name: 'IsActive', reference: 'active', hidden: false, allowBlank: false, xtype: 'combobox', store: { type: 'active' }, valueField: 'ActiveCode', displayField: 'ActiveName' },
    // { fieldLabel: 'Bindings', name: 'Bindings', reference: 'bindings', allowBlank: true, xtype: 'hiddenfield' }
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
          text: 'Avbryt',
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
    domains: []
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
    this.addDomains()
    //this.lookup('region').hide()
    //this.lookup('region').disable()
  },

  onSave: function () {
    this.addBindings()
    Ext.StoreManager.lookup('units').sync({ callback: function () { } })
    this.getView().destroy()
  },

  addBindings: function () {
    var form = this.getForm().getValues()
    var domains = this.getView().getDomains()
    if(typeof form.County !== "number") form.County = this.lookup('region').findRecordByDisplay('Västra Götaland').id
    var bindings = [{ DomainValueID: form.County }]
    domains.forEach(function(domain){
      if(typeof form[domain.DomainName] !== "number") form[domain.DomainName] = this.lookup(domain.DomainName).findRecordByDisplay(form[domain.DomainName]).id
      bindings.push({DomainValueID: form[domain.DomainName]})
    })
    this.getForm().getRecord().set('Bindings', bindings)
  },

  addDomains: function () {
    var domains = this.getView().getDomains()
    var form = this.getView().down()
    var unit = this.getView().getUnit().getData()
    domains.forEach(function (domain) {
      form.add({
        xtype: 'rcfilter',
        name: domain.DomainName,
        fieldLabel: domain.DomainTitle,
        allowNull: false,
        allowBlank: false,
        valueField: 'DomainValueID', 
        displayField: 'ValueName',
        value: unit[domain.DomainName],
        store: {
          data: domain.DomainValues
        }
      })  
    })
  },
})

Ext.define('RC.UserAdministration.view.CreateUnit', {
  extend: 'Ext.window.Window',
  controller: 'createunit',
  modal: true,
  width: 600,
  title: 'Skapa enhet',
  
  config: {
    unit: [],
    nextId: 0,
    domains: []
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
    fields: ['unitname'],
    nextId: 0,
    domains: []
  },

  init: function () {
    var nextId = this.getView().getNextId()
    this.lookup('unitcode').setValue(nextId)
    this.lookup('active').setValue(true)
    this.addDomains()
  },

  addDomains: function () {
    var domains = this.getView().getDomains()
    var form = this.getView().down()
    var controller = this
    domains.forEach(function (domain) {
      form.add({
        xtype: 'rcfilter',
        name: domain.DomainName,
        fieldLabel: domain.DomainTitle,
        allowNull: false,
        valueField: 'DomainValueID', 
        displayField: 'ValueName',
        store: {
          data: domain.DomainValues
        }
      })  
    })
  },

  onSave: function () {
    var controller = this
    var domains = this.getView().getDomains()
    this.transformRegion()
    this.getForm().updateRecord()
    var unit = this.getForm().getValues()
    unit.Bindings = [{ DomainValueID: unit.County }]
    domains.forEach(function(domain){
      unit.Bindings.push({DomainValueID: unit[domain.DomainName]})
    })
    var extra = this.getView().getDomains().forEach(function(item){unit.Bindings.push({DomainValueID: controller.getForm().getValues()[item.DomainName]})})
    unit.Register = { RegisterID: Profile.Site.Register.RegisterID }
    unit.HSAID = unit.HSAID || null
    unit.PARID = unit.PARID || null
    this.saveUnit(unit).then(this.updateGrid)
    this.getView().destroy()
  },

  transformRegion: function () {
    var form = this.getForm().getValues()
    form.Bindings = { DomainValueId: form.County }
    this.getForm().setValues(form)
  },

  saveUnit: function (unit) {
    var controller = this
    var deferred = new Ext.Deferred()
    delete unit.UnitID
    delete unit.County
    
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

  usernameText: 'Denna epostadress <br>används redan',

  context: function (value, field) {
    var contexts = field.up('window').getContexts()
    var controller = field.up('window').getController()
    var unit = controller.lookup('unit').getValue()
    var role = controller.lookup('role').getValue()
    if(!(unit && role)) return true
    return !contexts.some(function (context) { return context.Role.RoleID === role && context.Unit.UnitID === unit })
  },

  contextText: 'En kontext med denna kombination <br> av enhet och roll finns redan'

})

Ext.define('RC.UserAdministration.storage.Data', {
  mixins: ['Ext.mixin.Observable'],
  config: {
    users: [],
    contexts: [],
    units: [],
    domains: [],
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
      Ext.Ajax.request({ url: '/stratum/api/metadata/units/bindings/' + Profile.Site.Register.RegisterID })
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

    Ext.Promise.all([
      Ext.Ajax.request({ url: 'stratum/api/metadata/domains/register/' + Profile.Site.Register.RegisterID })
    ]).then(function(results) {
      var domains = Ext.decode(results[0].responseText).data
      var requests = []
      domains = domains.filter(function (domain) {
        return domain.DomainID >= 3000 &&  domain.DomainID < 3100
      })
      if(domains.length === 0) return
      domains.forEach(function(domain){
        requests.push(Ext.Ajax.request({ url: 'stratum/api/metadata/domains/' + domain.DomainID}))
      })
      Ext.Promise.all(requests).then(function (results) {
        var domainvalues = Ext.decode(results[0].responseText).data
        controller.setDomains([domainvalues])
        controller.getObservers().forEach(function (observer) {
        observer.fireEvent('domainsloaded', controller)
      })
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

  + '.rc-required {'
  + '  background: url(https://stratum.registercentrum.se/Images/IconMandatory.png) 0px 5px no-repeat;'
  + '}'

  + '.rc-useradministration .x-form-item-label-default {'
  + '  padding-left: 11px;'
  + '}'

  + '.rc-useradministration .x-grid-item-selected {'
  + '  color: #f0f0f0;'
  + '  background-color: #666;'
  + '}'

  + '.rc-useradministration .x-grid-item-selected .x-grid-item-focused {'
  + '  color: #f0f0f0;'
  + '}'

  + '.rc-info div {'
  + '  border-color: #eee;'
  + '}',
  'useradministration'
)

function start() {
  Ext.Loader.loadScript({
    url: '/stratum/extjs/scripts/exporter.js',
    onLoad: function () { onReady() }
  }) // 
}