
function start() {
  Ext.Loader.loadScript({
    url: '/stratum/extjs/scripts/exporter.js',
    onLoad: function () { onReady(); }
  });
}

function onReady() {
  Ext.tip.QuickTipManager.init()
  // Ext.create('RC.UserAdministration.view.FileDrop').show();
  RC.UserAdministration.app = Ext.create('Ext.tab.Panel', { renderTo: 'contentPanel', items: [{ title: 'Användare', xtype: 'usergrid', itemId: 'usersView' }] });
  RC.UserAdministration.data = Ext.create('RC.UserAdministration.storage.Data', { observers: [RC.UserAdministration.app.down('#usersView')] });
}

Ext.define('RC.UserAdministration.controller.UserController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.user',
  config: {
    loader: null,
    ownUsers: null,
    ownLoaded: false
  },

  initComponent: function () {
    this.callParent()
    con
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
    this.getView().down('#searchOwnButton').setDisabled(false)
  },

  updateDropdowns: function (dataLoader) {
    var units = dataLoader.getUnits();
    this.loadOwnUnits(units);
  },

  updateLogins: function (dataLoader) {
    this.setLoader(dataLoader)
  },

  loadOwnUnits: function (units) {
    var unitFilter = this.getView().down('#unitFilter');
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
    var store = this.getView().getStore();
    var user = this.getView().down('#userFilter').getValue();
    var unit = this.getView().down('#unitFilter').getValue();
    var role = this.getView().down('#roleFilter').getValue();
    var active = this.getView().down('#activeFilter').getValue();

    store.suspendEvents()
    store.clearFilter();
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
    record.data.LatestLogin = this.getLatestLogin(record.data.UserID)
    record.data.LatestContextLogin = this.getLatestContextLogin(record.data).substring(0, 16).replace('T', ' ')

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
    var userWindow = Ext.create('RC.UserAdministration.view.EditUser', { userData: record.data, contextData: record.data.Contexts })
    /*
    Ext.create('Ext.window.Window', {
      modal: true,
      title: 'Användare',
      items: [
        {
          xtype: 'rcuserform',
          viewModel: {
            stores: {
              user: record.data
            }
          }
        },
        {
          xtype: 'contextgrid',
          width: 800,
          height: 300,
          plugin: true,
          listeners: {
            beforerender: function () {
              this.down('toolbar').hide()
              this.down('#gridHeader').show()
              this.down('#labelBar').hide()
              this.down('#filterBar').hide()
            }
          },
          store: {
            data: record.data.Contexts
          },
        }
      ],
      dockedItems: [
        {
          xtype: 'toolbar',
          dock: 'bottom',
          itemId: 'buttonBar',
          items: [
            {
              xtype: 'tbspacer', flex: 1
            },
            {
              minWidth: 80,
              text: 'Stäng',
              handler: function () {
                this.up('window').destroy()
              }
            }]
        }
      ]
    }).show(); */
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

  getLatestLogin: function (user) {
    if (!this.getLoader() || !this.getLoader().getLoginsSith()) return ''
    var bankIdLog = this.getLoader().getLoginsBankId().filter(function (logitem) { return logitem.Context.User.UserID === user })[0];
    var latestBankIdLogin = bankIdLog ? bankIdLog.PerformedAt.slice(0, 10) : ''
    var sithsLog = this.getLoader().getLoginsSith().filter(function (logitem) { return logitem.Context.User.UserID === user })[0]
    var latestSithsLogin = sithsLog ? sithsLog.PerformedAt.slice(0, 10) : ''
    var latestOfAll = latestBankIdLogin > latestSithsLogin ? latestBankIdLogin : latestSithsLogin
    return latestOfAll
  },

  getLatestContextLogin: function (user) {
    return user.Contexts.reduce(function (total, current) { if (total.ActivatedAt < current.ActivatedAt) { return current; } return total }).ActivatedAt || 'Okänt'
  }
})

Ext.define('RC.UserAdministration.view.UserGrid', {
  extend: 'Ext.grid.Panel',
  alias: 'widget.usergrid',
  controller: 'user',
  multiSelect: true,
  selModel: 'rowmodel',
  width: 750,
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
    columnShow: 'onColumnShown'
  },

  store: {
    // groupField: 'FirstName',
    data: [],
    filters: [],
    sorters: {
      property: 'LastName'
    },
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
      dock: 'top',
      border: false,
      items: [
        {
          xtype: 'textfield',
          itemId: 'userFilter',
          flex: 1,
          keyMap: {
            'enter': {
              handler: 'searchOwn'
            }
          }
        },
        {
          xtype: 'button',
          itemId: 'searchOwnButton',
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
      itemId: 'labelBar',
      hidden: false,
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
      itemId: 'filterBar',
      hidden: false,
      border: false,
      items: [
        {
          xtype: 'rcfilter',
          itemId: 'unitFilter',
          cls: 'scw-select',
          flex: 1,
          valueField: 'UnitID',
          displayField: 'UnitName',
          value: localStorage.getItem('selectedunit') || 0,
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
              { ValueCode: 902, ValueName: 'Plusregistrerare' },
              { ValueCode: 903, ValueName: 'Koordinatorer' },
              { ValueCode: 906, ValueName: 'Systemutvecklare' },
              { ValueCode: 907, ValueName: 'Patientobsertvatör' },
              { ValueCode: 908, ValueName: 'Rapportobsertvatör' }
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
    {
      xtype: 'toolbar',
      dock: 'top',
      itemId: 'actionBar',
      border: false,
      items: [
        {
          minWidth: 80,
          text: 'Exportera',
          // iconCls: 'fa fa-file-excel-o',
          handler: 'export'
        },
        {
          minWidth: 80,
          text: 'E-posta',
          handler: 'mail'
        },
        {
          minWidth: 80,
          text: 'Redigera',
          handler: 'edit'
        },
        {
          minWidth: 80,
          text: 'Skapa',
          handler: 'create'
        }
      ]
    }
  ],
})

Ext.define('RC.UserAdministration.view.CreateUser', {
  extend: 'Ext.window.Window',
  controller: 'createuser',
  modal: true,
  title: 'Användare',
  items: [
    {
      xtype: 'rcuserform',
      isCreation: true,
      viewModel: {
        stores: {
          user: {}
        }
      }
    },
    {
      xtype: 'matchuser',
      width: 800,
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
      itemId: 'buttonBar',
      items: [
        {
          xtype: 'tbspacer', flex: 1
        },
        {
          minWidth: 80,
          text: 'Stäng',
          handler: function () {
            this.up('window').destroy()
          }
        }
      ]
    },
  ]
})

Ext.define('RC.UserAdministration.controller.CreateUserController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.createuser',

  onFormChanged: function () {
    var me = this
    var query = this.getQueryFromInputs()
    query !== '' && this.loadUser(query).then(function (response) { me.showMatchingUsers(response) })
  },

  getQueryFromInputs: function () {
    var view = this.getView()
    var inputs = ''
    inputs += view.down('#firstName').getValue().length > 2 ? view.down('#firstName').getValue() + ' ' : ''
    inputs += view.down('#lastName').getValue().length > 2 ? view.down('#lastName').getValue() + ' ' : ''
    inputs += view.down('#email').getValue().length > 2 ? view.down('#email').getValue() + ' ' : ''
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
    this.getView().down('#matchUser').getStore().loadData(matches)
  },

  filterMactches: function (matches) {
    var view = this.getView()
    var firstName = view.down('#firstName').getValue()
    var lastName = view.down('#lastName').getValue()
    var email = view.down('#email').getValue()
    matches = matches.filter(function (match) {
      return (firstName.length < 3 || Ext.String.startsWith(match.FirstName, firstName, true))
        && (lastName.length < 3 || Ext.String.startsWith(match.LastName, lastName, true))
        && (email.length < 3 || Ext.String.startsWith(match.Email, email, true))
    })
    return matches
  }
})

Ext.define('RC.UserAdministration.view.EditUser', {
  extend: 'Ext.window.Window',
  config: {
    userData: [],
    contextData: []
  },
  initComponent: function (arguments) {
    this.callParent(arguments)
    this.down('rcuserform').getViewModel().setData({ user: this.getUserData() })
    this.down('grid').getStore().loadData(this.getContextData())
  },
  modal: true,
  title: 'Användare',
  items: [
    {
      xtype: 'rcuserform',
      viewModel: {
        stores: {
          user: [] // record.data
        }
      }
    },
    {
      xtype: 'contextgrid',
      width: 800,
      height: 300,
      plugin: true,
      listeners: {
        beforerender: function () {
          this.down('toolbar').hide()
          this.down('#gridHeader').show()
          this.down('#labelBar').hide()
          this.down('#filterBar').hide()
        }
      },
      store: {
        data: [] //record.data.Contexts
      },
    }
  ],
  dockedItems: [
    {
      xtype: 'toolbar',
      dock: 'bottom',
      itemId: 'buttonBar',
      items: [
        {
          xtype: 'tbspacer', flex: 1
        },
        {
          minWidth: 80,
          text: 'Stäng',
          handler: function () {
            this.up('window').destroy()
          }
        }
      ]
    }
  ]
})

Ext.define('RC.UserAdministration.view.MatchUser', {
  extend: 'Ext.grid.Panel',
  alias: 'widget.matchuser',
  itemId: 'matchUser',
  width: 750,
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
  config: {
    isCreation: false
  },
  defaults: {
    layout: 'form',
    xtype: 'container',
    defaultType: 'textfield',
    columnWidth: 0.49
  },
  layout: 'column',
  width: 800,
  items: [
    {
      defaults: {
        listeners: {
          change: 'onFormChanged'
        },
      },
      items: [
        { fieldLabel: 'Förnamn', name: 'firstName', bind: '{user.FirstName}', itemId: 'firstName' },
        { fieldLabel: 'Efternamn', name: 'lastName', bind: '{user.LastName}', itemId: 'lastName' },
        { fieldLabel: 'Epostadress', name: 'email', bind: '{user.Email}', itemId: 'email' },
        { fieldLabel: 'Registerinfo', name: 'info', bind: '{user.Info}', itemId: 'registryInformation' },
      ]
    },
    {
      items: [
        { fieldLabel: 'HSAID', name: 'hsaid', bind: '{user.HSAID}', itemId: 'hsaid' },
        { fieldLabel: 'Personnummer', name: 'personalid', bind: '{user.PersonalId}', itemId: 'personalid', msgTarget: 'qtip', validator: function (val) { return this.up('form').validatePersonalId(val) } },
        { fieldLabel: 'Organisation', name: 'organisation', bind: '{user.Organization}' },
        { fieldLabel: 'Titel', name: 'title', bind: '{user.WorkTitle}' },
        { fieldLabel: 'Senast inloggad', bind: '{user.LatestContextLogin}', cls: 'rc-info', itemId: 'latestLogin' }

      ]
    }
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
          minWidth: 80,
          handler: function () {
            this.up('form').down('#hsaid').show()
            this.up('form').down('#personalid').hide()
          }
        },
        {
          xtype: 'button',
          text: 'Byt till BankID',
          minWidth: 80,
          handler: function () {
            this.up('form').down('#hsaid').hide()
            this.up('form').down('#personalid').show()
          }
        },
        {
          xtype: 'button',
          text: 'Spara',
          minWidth: 80,
          handler: function () {
            var user = this.up('rcuserform').getViewModel().data.user
            var extra = this.up('rcuserform').up().Info || {}
            extra[Profile.Site.Register.RegisterID] = user.Info
            var updatedUser = {
              UserID: user.UserID,
              WorkTitle: user.WorkTitle,
              Username: user.Username,
              Email: user.Email,
              FirstName: user.FirstName,
              LastName: user.LastName,
              HSAID: user.HSAID,
              Organization: user.Organization,
              Title: user.Title,
              Extra: JSON.stringify(extra)
            }
            this.up('form').saveUser(updatedUser)
            this.up('window').destroy()
          }
        }
      ]
    }
  ],

  initComponent: function () {
    this.callParent()
    var personalid = this.getViewModel().get('user').PersonalId
    if (personalid) {
      this.down('#personalid').show()
      this.down('#hsaid').hide()
    } else {
      this.down('#personalid').hide()
      this.down('#hsaid').show()
    }

    if (this.getIsCreation()) {
      this.down('#latestLogin').setHidden(true)
    }
  },

  saveUser: function (user) {
    var controller = this
    Ext.Ajax.request({
      url: '/stratum/api/metadata/users/' + user.UserID,
      method: 'PUT',
      jsonData: user,
      withCredentials: true,
      success: function (result, request) {
        controller.updateUser(user, controller)
      },
      failure: function (result, request) {
        console.log(result.responseText);
      }
    });
  },

  updateUser: function (user, controller) {
    Ext.Ajax.request({
      url: '/stratum/api/metadata/contexts/user/' + user.UserID,
      method: 'GET',
      jsonData: user,
      withCredentials: true,
      success: function (result, request) {
        var index = Ext.ComponentQuery.query('usergrid')[0].getStore().find('UserID', user.UserID)
        var userToUpdate = Ext.ComponentQuery.query('usergrid')[0].getStore().getAt(index)
        user.Contexts = Ext.decode(result.responseText).data
        var units = Ext.ComponentQuery.query('usergrid').pop().down('#unitFilter').getStore().getData().items.map(function (item) { return item.data.UnitID })
        user.Contexts = user.Contexts.filter(function (context) { return units.indexOf(context.Unit.UnitID) >= 0 })
        Ext.ComponentQuery.query('usergrid')[0].getStore().removeAt(index)
        Ext.ComponentQuery.query('usergrid')[0].getStore().add(user)
      },
      failure: function (result, request) {
        console.log(result.responseText);
      }
    });
  },

  validatePersonalId: function (value) {
    var validator = new RegExp(/^\d{8}-\w{4}$/)
    return validator.test(value) ? true : false
  },

  displayLatestLogin: function () {
    var user = this.getViewModel().getData().user.UserID
    var field = this.down('#latestLogin')
    field.setValue(time.data[0].PerformedAt.slice(0, 10))
  }

})

Ext.define('RC.UserAdministration.controller.ContextController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.context',
  config: {
    loader: null,
    contexts: [],
    users: []
  },
  ownLoaded: false,

  updateStores: function (dataLoader) {
    var contexts = dataLoader.getContexts();
    this.transformContexts(contexts);
    this.loadOwnContexts(contexts);
    this.setLoader(dataLoader);
  },

  updateDropdowns: function (dataLoader) {
    var units = dataLoader.getUnits();
    this.loadOwnUnits(units);
  },

  updateLogins: function (dataLoader) {
    this.setLoader(dataLoader)
  },

  transformContexts: function (contexts) {
    contexts.forEach(function (context) { context.FullName = context.User.LastName + ', ' + context.User.FirstName; })
  },

  loadUnits: function (dataLoader) {
    var units = dataLoader.getUnits()
    this.loadOwnUnits(units)
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
    var store = this.getView().getStore();
    var user = this.getView().down('#userFilter').getValue();
    var unit = this.getView().down('#unitFilter').getValue();
    var role = this.getView().down('#roleFilter').getValue();
    var active = this.getView().down('#activeFilter').getValue();

    store.clearFilter();
    store.addFilter(this.createUserFilter(user, role));
    store.addFilter(this.createUnitFilter(unit, role));
    store.addFilter(this.createRoleFilter(role));
    store.addFilter(this.createActiveFilter(active, role));
  },

  searchOwn: function () {
    if (!this.ownLoaded) {
      this.getView().getStore().loadData(this.getContexts());
      this.ownLoaded = true;
    }
    this.getView().down('#labelBar').show();
    this.getView().down('#filterBar').show();
    this.updateGrid();
  },

  searchAll: function () {
    this.ownLoaded = false;
    var me = this;
    var userQuery = this.getView().down('#userFilter').getValue();
    this.loadContexts(userQuery).then(function (response) { me.followupAction(response); });
  },

  loadContexts: function (query) {
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
  },

  createUnitFilter: function (unit, role) {
    var contexts = this.getContexts();
    var filter = function (item) {
      var contexts = item.data.Contexts;
      var isDeveloper = item.data.Role.RoleID === 906;
      var showDevelopers = role === 906;
      if (isDeveloper && !showDevelopers) { return false; }
      if (unit === 0) { return true; }
      return item.data.Unit.UnitID === unit;
    }
    return filter;
  },

  createUserFilter: function (user, role) {
    var contexts = this.getContexts();
    var controller = this;
    var filter = function (item) {
      var isDeveloper = controller.isDeveloper(item.data.User);
      var hideDevelopers = role !== 906;
      if (isDeveloper && hideDevelopers) { return false; }
      if (user === '') { return true; }
      return Ext.String.startsWith(item.data.User.Username, user, true) || Ext.String.startsWith(item.data.User.FirstName, user, true) || Ext.String.startsWith(item.data.User.LastName, user, true);
    };
    return filter;
  },

  createRoleFilter: function (role) {
    var contexts = this.getContexts();
    var controller = this;
    var filter = function (item) {
      var isDeveloper = controller.isDeveloper(item.data.User);
      var showDevelopers = role === 906;
      if (isDeveloper && !showDevelopers) { return false; }
      if (role === 0) { return true; }
      return item.data.Role.RoleID === role;
    }
    return filter;
  },

  createActiveFilter: function (active, role) {
    var contexts = this.getContexts();
    var controller = this;
    var filter = function (item) {
      var isDeveloper = controller.isDeveloper(item.data.User);
      var showDevelopers = role === 906;
      if (isDeveloper && !showDevelopers) { return false; }
      if (active === 0) { return true; }
      return item.data.IsActive == (active === 1 ? true : false);
    }
    return filter;
  },

  isDeveloper: function (user) {
    return user.UserID < 200;
  },

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

Ext.define('RC.UserAdministration.view.ContextGrid', {
  extend: 'Ext.grid.Panel',
  alias: 'widget.contextgrid',
  itemId: 'contextGrid',
  controller: 'context',
  multiSelect: true,
  selModel: 'rowmodel',
  width: 750,

  listeners: {
    unitsloaded: 'updateDropdowns',
    loginsloaded: 'updateLogins',
    dataloaded: 'updateStores'
  },

  store: {
    groupField: 'FullName',
    data: [],
    filters: []
  },

  features: [{ ftype: 'grouping', enableGroupingMenu: true, startCollapsed: true, groupHeaderTpl: '{name}' }],

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
      itemId: 'gridHeader',
      padding: 10,
      border: false,
      style: {
        color: 'white',
        backgroundColor: '#888',
      },
      hidden: true
    },
    {
      xtype: 'toolbar',
      dock: 'top',
      items: [
        {
          xtype: 'textfield',
          itemId: 'userFilter',
          flex: 4,
          keyMap: {
            'enter': {
              handler: 'searchOwn'
            },
          },
        },
        {
          xtype: 'button',
          itemId: 'searchAllButton',
          text: 'Sök',
          flex: 1,
          handler: 'searchOwn'
        }
      ]
    },
    {
      xtype: 'toolbar',
      dock: 'top',
      itemId: 'labelBar',
      items: [
        { xtype: 'label', text: 'Enhet', height: 15, flex: 1, padding: '0 0 0 3' },
        { xtype: 'label', text: 'Roll', height: 15, flex: 1, padding: '0 0 0 3' },
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
    }
  ],
})

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
  initComponent: function () {
    debugger;
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
    });
    Ext.Promise.all([
      Ext.Ajax.request({ url: '/stratum/api/metadata/logentries/latest/logtype/1102/', method: 'GET' }),
      Ext.Ajax.request({ url: '/stratum/api/metadata/logentries/latest/logtype/1104/', method: 'GET' }),
      Ext.Ajax.request({ url: '/stratum/api/metadata/units/register/' + Profile.Site.Register.RegisterID }),
    ]).then(function (results) {
      var loginsSith = Ext.decode(results[0].responseText).data;
      var loginsBankid = Ext.decode(results[1].responseText).data;
      var units = Ext.decode(results[2].responseText).data;

      controller.setLoginsSith(loginsSith)
      controller.setLoginsBankId(loginsBankid)
      controller.setUnits(units);

      controller.getObservers().forEach(function (observer) {
        observer.fireEvent('loginsloaded', controller);
      })
    });
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
  + '  border: none;'
  + '}'
  , 'useradministration'
)
