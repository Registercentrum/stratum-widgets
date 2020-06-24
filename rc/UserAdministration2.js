var widgetConfig = widgetConfig || {};
widgetConfig.devMode = Profile.Context && Profile.Context.User.UserID <= 200;
widgetConfig.openEditOnSave = true
// widgetConfig.devMode = false

function onReady() {
  widgetConfig.Roles = widgetConfig.Roles || [901, 902, 903, 907, 908];
  widgetConfig.Roles.push(0);

  widgetConfig.passhash = "zdn+TQhqObQUdp9hZv/qm9CQLak=";
  Ext.tip.QuickTipManager.init();
  RC &&
    RC.UserAdministration &&
    RC.UserAdministration.app &&
    RC.UserAdministration.app.destroy();
  // Ext.create('RC.UserAdministration.view.FileDrop').show();
  Ext.create("RC.UserAdministration.store.User");
  Ext.create("RC.UserAdministration.store.Unit");
  Ext.create("RC.UserAdministration.store.Role");
  Ext.create("RC.UserAdministration.store.Bindings", { storeId: "bindings" });
  RC.UserAdministration.app = Ext.create("Ext.tab.Panel", {
    cls: "navbar-default",
    renderTo:
      Stratum && Stratum.containers
        ? Stratum.containers["RC/UserAdministration11"]
        : "contentPanel",
    items: [
      { title: "Användare", xtype: "usergrid" },
      { title: "Enheter", xtype: "unitgrid" },
    ],
  });
  RC.UserAdministration.data = Ext.create(
    "RC.UserAdministration.storage.Data",
    {
      observers: [
        RC.UserAdministration.app.down("usergrid"),
        RC.UserAdministration.app.down("unitgrid"),
      ],
    }
  );
}

Stratum.Role ||
  Ext.define("Stratum.Role", {
    extend: "Stratum.Model",
    fields: [
      { name: "RoleID", type: "int", allowNull: false },
      { name: "RoleName", type: "string" },
    ],
    idProperty: "RoleID",
    proxy: {
      type: "memory",
    },
  });

Stratum.Region ||
  Ext.define("Stratum.Region", {
    extend: "Stratum.Model",
    fields: [
      { name: "DomainValueID", type: "int", allowNull: true },
      { name: "ValueCode", type: "string" },
      { name: "ValueName", type: "string" },
    ],
    idProperty: "DomainValueID",
  });

Ext.define("RC.UserAdministration.store.User", {
  extend: "Ext.data.Store",
  model: "Stratum.User",
  alias: "store.user",
});

Ext.define("RC.UserAdministration.store.Active", {
  extend: "Ext.data.Store",
  alias: "store.active",
  fields: [
    { name: "ActiveCode", type: "boolean", allowNull: false },
    { name: "ActiveName", type: "string" },
  ],
  data: [
    { ActiveCode: true, ActiveName: "Ja" },
    { ActiveCode: false, ActiveName: "Nej" },
  ],
  idProperty: "ActiveCode",
  proxy: {
    type: "memory",
  },
});

Ext.define("RC.UserAdministration.store.Unit", {
  extend: "Ext.data.Store",
  model: "Stratum.Unit",
  alias: "store.unit",
  autoLoad: true,
  proxy: {
    url:
      "/stratum/api/metadata/units/register/" +
      Profile.Site.Register.RegisterID,
    type: "rest",
    reader: {
      type: "json",
      rootProperty: "data",
    },
    api: {
      create: "/stratum/api/metadata/units",
      update: "/stratum/api/metadata/units",
    },
  },
});

Ext.define("RC.UserAdministration.store.Role", {
  extend: "Ext.data.Store",
  model: "Stratum.Role",
  alias: "store.role",
  data: [
    { RoleID: 101, RoleName: "Dataleverantör" },
    { RoleID: 201, RoleName: "API-klient" },
    { RoleID: 301, RoleName: "Integratör" },
    { RoleID: 701, RoleName: "Patient" },
    { RoleID: 901, RoleName: "Registrerare" },
    { RoleID: 902, RoleName: "Plusregistrerare" },
    { RoleID: 903, RoleName: "Koordinator" },
    { RoleID: 906, RoleName: "Systemutvecklare" },
    { RoleID: 907, RoleName: "Patientobservatör" },
    { RoleID: 908, RoleName: "Rapportobservatör" },
  ],
  filters: [
    {
      filterFn: function (item) {
        return (
          widgetConfig.Roles.indexOf(item.data.RoleID) >= 0 ||
          widgetConfig.devMode
        );
      },
    },
  ],
  sorters: "RoleID",
});

Ext.define("RC.UserAdministration.store.Region", {
  extend: "Ext.data.Store",
  model: "Stratum.Region",
  alias: "store.region",
  autoLoad: true,
  proxy: {
    type: "ajax",
    url: "/stratum/api/metadata/domainvalues/domain/3003",
    reader: {
      type: "json",
      rootProperty: "data",
    },
  },
  listeners: {
    load: function (store) {
      store.sort("ValueName", "ASC");
    },
  },
});

Ext.define("RC.UserAdministration.store.Bindings", {
  extend: "Ext.data.Store",
  alias: "store.bindings",
  autoLoad: true,
  proxy: {
    type: "ajax",
    url:
      "/stratum/api/metadata/units/bindings/" +
      Profile.Site.Register.RegisterID,
    reader: {
      type: "json",
      rootProperty: "data",
    },
  },
});

Ext.define("RC.UserAdministration.view.UserGrid", {
  extend: "Ext.grid.Panel",
  alias: "widget.usergrid",
  controller: "user",
  multiSelect: true,
  selModel: "rowmodel",
  width: "100%",
  height: 500,
  cls: "rc-useradministration",

  plugins: {
    gridexporter: true,
  },

  listeners: {
    unitsloaded: "updateDropdowns",
    dataloaded: "updateStores",
    contextsupdated: "updateContexts",
    itemdblclick: "userClicked",
    columnhide: "onColumnHidden",
    columnShow: "onColumnShown",
    adduser: "addUser",
    edituser: "editUser",
    selectionchange: "onSelectionChange",
    groupclick: function () {
      return false;
    },
    refresh: function () {
      this.update();
    },
  },

  store: {
    type: "user",
    storeId: "users",
  },

  columns: [
    {
      text: "ID",
      dataIndex: "UserID",
      width: 65,
      sortable: true,
      hidden: localStorage.getItem("UserID") === "hidden" || false,
    },
    {
      text: "Förnamn",
      dataIndex: "FirstName",
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem("FirstName") === "hidden" || false,
    },
    {
      text: "Efternamn",
      dataIndex: "LastName",
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem("LastName") === "hidden" || false,
    },
    {
      text: "Användarnamn",
      dataIndex: "Username",
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem("Username") === "hidden" || false,
    },
    {
      text: "Titel",
      dataIndex: "WorkTitle",
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem("WorkTitle") === "hidden" || false,
    },
    {
      text: "Organisation",
      dataIndex: "Organization",
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem("Organization") === "hidden" || false,
    },
    {
      text: "E-post",
      dataIndex: "Email",
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem("Email") === "hidden" || false,
    },
  ],

  dockedItems: [
    {
      xtype: "toolbar",
      reference: "search",
      dock: "top",
      border: false,
      items: [
        {
          xtype: "textfield",
          reference: "userFilter",
          flex: 1,
          keyMap: {
            enter: {
              handler: "searchOwn",
            },
          },
        },
        {
          xtype: "button",
          reference: "searchButton",
          text: "Sök",
          iconCls: "x-fa fa-search",
          width: 120,
          handler: "searchOwn",
          disabled: false,
        },
      ],
    },
    {
      xtype: "toolbar",
      dock: "top",
      border: false,
      items: [
        {
          xtype: "label",
          text: "Enhet",
          height: 15,
          flex: 1,
          padding: "0 0 0 3",
        },
        {
          xtype: "label",
          text: "Roll",
          height: 15,
          flex: 1,
          padding: "0 0 0 3",
        },
        {
          xtype: "label",
          text: "Aktiv",
          height: 15,
          flex: 1,
          padding: "0 0 0 3",
        },
      ],
    },
    {
      xtype: "toolbar",
      dock: "top",
      border: false,
      items: [
        {
          xtype: "rcfilter",
          reference: "unitFilter",
          cls: "scw-select",
          flex: 1,
          valueField: "UnitID",
          displayField: "UnitName",
          value: localStorage.getItem("selectedunit") || 0,
          store: {
            storeId: "unitStore",
            fields: ["UnitID", "UnitName"],
          },
          listeners: {
            change: "updateGrid",
          },
        },
        {
          xtype: "rcfilter",
          reference: "roleFilter",
          cls: "scw-select",
          flex: 1,
          valueField: "RoleID",
          displayField: "RoleName",
          sortfield: "RoleName",
          sortdirection: "DESC",
          selectCallback: "updateGrid",
          store: {
            type: "role",
          },
          listeners: {
            change: "updateGrid",
            beforeRender: "addDefault",
          },
        },
        {
          xtype: "rcfilter",
          reference: "activeFilter",
          cls: "scw-select",
          flex: 1,
          valueField: "ValueCode",
          displayField: "ValueName",
          value: 0,
          sortfield: "ValueName",
          sortdirection: "DESC",
          listeners: {
            change: "updateGrid",
          },
          store: {
            fields: ["ValueCode", "ValueName"],
            data: [
              { ValueCode: 0, ValueName: "Alla" },
              { ValueCode: 1, ValueName: "Ja" },
              { ValueCode: 2, ValueName: "Nej" },
            ],
          },
        },
      ],
    },
    {
      xtype: "toolbar",
      dock: "top",
      border: false,
      items: [
        {
          reference: "exportButton",
          text: "Exportera",
          iconCls: "x-fa fa-download",
          handler: "export",
          width: 120,
          disabled: false,
        },
        {
          reference: "emailButton",
          text: "E-posta",
          iconCls: "x-fa fa-envelope",
          handler: "mail",
          width: 120,
          disabled: true,
        },
        {
          reference: "editButton",
          text: "Redigera",
          iconCls: "x-fa fa-pencil",
          handler: "edit",
          width: 120,
          disabled: true,
        },
        {
          reference: "createButton",
          text: "Lägg till",
          iconCls: "x-fa fa-user-plus",
          handler: "create",
          width: 120,
          disabled: false,
        },
      ],
    },
  ],
});

Ext.define("RC.UserAdministration.controller.User", {
  extend: "Ext.app.ViewController",
  alias: "controller.user",
  config: {
    loader: null,
    ownUsers: null,
    ownLoaded: false,
  },

  init: function () {
    var columns = this.getView().getColumns();
    var defaultHiddenColumns = ["UserID", "WorkTitle", "Organization"];
    columns.forEach(function (column) {
      column.hidden =
        localStorage.getItem(column.dataIndex) === "hidden" ||
        (localStorage.getItem(column.dataIndex) === null &&
          defaultHiddenColumns.indexOf(column.dataIndex) > -1);
    });
  },

  export: function () {
    Ext.util.CSV.delimiter = ";";
    var grid = this.getView();
    grid.saveDocumentAs({ type: "xlsx", fileName: "användare.xlsx" });
  },

  mail: function () {
    var selections = this.getView().getSelection();
    var mailList = "";
    var validator = new Ext.data.validator.Email();
    selections.forEach(function (user) {
      if (validator.validate(user.getData().Email) === true) {
        mailList += user.getData().Email + ";";
      }
    });
    window.location = "mailto:" + mailList;
  },

  edit: function () {
    var selections = this.getView().getSelection();
    if (selections.length === 1) {
      this.userClicked(null, selections[0]);
    }
  },

  create: function () {
    Ext.create("RC.UserAdministration.view.CreateUser").show();
  },

  updateStores: function (dataLoader) {
    var users = dataLoader.getUsers();
    var contexts = dataLoader.getContexts();

    this.loadOwnUsers(users, contexts);
    this.setLoader(dataLoader);
    this.lookup("searchButton").enable();
    this.searchOwn();
  },

  updateDropdowns: function (dataLoader) {
    var units = dataLoader.getUnits();
    this.initializeDropdown(units);
  },

  updateContexts: function (user) {
    var data = { controller: this, user: {} };
    data.user.UserID = user;
    this.loadUserContexts(data);
  },

  loadUserContexts: function (data) {
    var controller = data.controller;
    Ext.Ajax.request({
      url: "/stratum/api/metadata/contexts/user/" + data.user.UserID,
      method: "GET",
      withCredentials: true,
      success: function (result, request) {
        var contexts = Ext.decode(result.responseText).data;
        var units = controller.getAllRegistryUnits();
        contexts = contexts.filter(function (context) {
          return units.indexOf(context.Unit.UnitID) >= 0;
        });
        controller
          .getView()
          .getStore()
          .getById(data.user.UserID)
          .set("Contexts", contexts);
      },
    });
  },

  initializeDropdown: function (units) {
    var unitFilter = this.lookup("unitFilter");
    var unitStore = unitFilter.getStore();
    unitStore.loadData(units);
    unitStore.add({ UnitName: " Alla", UnitID: 0 });
    unitStore.sort({ property: "UnitName", direction: "ASC" });
    unitFilter.setValue(0);
  },

  loadOwnUsers: function (users, contexts) {
    this.addContexts(users);
    var newUsers = this.createUserArray(users);
    this.join(newUsers, contexts);
    this.updateGrid();
    this.ownUsers = users;
  },

  join: function (a, b) {
    b.forEach(function (context) {
      a[context.User.UserID].Contexts.push(context);
    });
  },

  addContexts: function (users) {
    users.forEach(function (item) {
      item.Contexts = [];
    });
  },

  createUserArray: function (users) {
    var newUsers = [];
    users.forEach(function (user) {
      newUsers[user.UserID] = user;
    });
    return newUsers;
  },

  addDefault: function () {
    var dropdown = this.lookup("roleFilter");
    dropdown.getStore().add({ RoleID: 0, RoleName: "Alla" });
    dropdown.setValue(0);
  },

  createFilter: function (user, unit, role, active) {
    var filter = function (item) {
      var contexts = item.data.Contexts;
      if (contexts) {
        contexts = contexts.filter(function (context) {
          return unit === 0 || context.Unit.UnitID === unit;
        });
        contexts = contexts.filter(function (context) {
          return role === 0 || context.Role.RoleID === role;
        });
        contexts = contexts.filter(function (context) {
          return active === 0 || context.IsActive === (active === 1);
        });
        return contexts.length !== 0;
      }
      return true;
    };
    return filter;
  },

  createUserFilter: function (user, role) {
    var filter = function (item) {
      if (item.data.UserID < 200 && !widgetConfig.devMode) return false;
      if (!item.data.Contexts) return false;
      if (user === "") return true;
      user = user.replace("<", "").replace(">", "");
      var contexts = item.data.Contexts;
      var terms = user.split(" ");
      terms.forEach(function (term) {
        term = term.toLowerCase();
        contexts = contexts.filter(function (context) {
          return (
            context.User.Username.toLowerCase().indexOf(term) > -1 ||
            (context.User.FirstName &&
              context.User.FirstName.toLowerCase().indexOf(term) > -1) ||
            (context.User.LastName &&
              context.User.LastName.toLowerCase().indexOf(term) > -1) ||
            (context.User.Email &&
              context.User.Email.toLowerCase().indexOf(term) > -1)
          );
        });
      });
      var isPartOfUnit = contexts.length !== 0;
      var matchesExtraField =
        JSON.parse(item.data.Extra) &&
        Ext.String.startsWith(
          JSON.parse(item.data.Extra)[Profile.Site.Register.RegisterID],
          user,
          true
        )
          ? true
          : false;
      return isPartOfUnit || matchesExtraField;
    };
    return filter;
  },

  /* eslint-disable no-undef */
  createContextFilter: function () {
    return function (context) {
      return (
        context.User.Username.toLowerCase().indexOf(term) > -1 ||
        (context.User.FirstName &&
          context.User.FirstName.toLowerCase().indexOf(term) > -1) ||
        (context.User.LastName &&
          context.User.LastName.toLowerCase().indexOf(term) > -1) ||
        (context.User.Email &&
          context.User.Email.toLowerCase().indexOf(term) > -1)
      );
    };
  },
  /* eslint-enable no-undef */

  updateGrid: function () {
    var store = this.getView().getStore();
    var user = this.lookup("userFilter").getValue();
    var unit = this.lookup("unitFilter").getValue();
    var role = this.lookup("roleFilter").getValue();
    var active = this.lookup("activeFilter").getValue();

    store.suspendEvents();
    store.clearFilter();
    store.addFilter(this.createFilter(user, unit, role, active));
    store.resumeEvents();
    store.addFilter(this.createUserFilter(user, role));
  },

  searchOwn: function () {
    if (!this.ownLoaded) {
      this.getView().getStore().loadData(this.ownUsers);
      this.ownLoaded = true;
    }
    this.updateGrid();
  },

  userClicked: function (component, record, item, index, recentlySaved) {
    record.data.LastActive = this.getLatestContextLogin(record.data);
    record.data.Info = JSON.parse(record.data.Extra || "{}")[
      Profile.Site.Register.RegisterID
    ];
    record.data.PersonalId = this.checkIfPersonalId(record.data.HSAID)
      ? record.data.HSAID
      : null;

    Ext.create("RC.UserAdministration.view.EditUser", {
      userData: record,
      recentlySaved: recentlySaved,
      contextData: Ext.clone(record.data.Contexts),
      contextsForValidation: Ext.clone(record.data.Contexts),
    }).show();
  },

  onColumnHidden: function (component, column, eOpts) {
    localStorage.setItem(column.dataIndex, "hidden");
  },

  onColumnShown: function (component, column, eOpts) {
    localStorage.setItem(column.dataIndex, "shown");
  },

  onSelectionChange: function (component, record, index, eOpts) {
    this.lookup("emailButton").enable();
    this.lookup("editButton").enable();
  },

  checkIfPersonalId: function (value) {
    return value && (value.indexOf("19") === 0 || value.indexOf("20") === 0);
  },

  addUser: function (user) {
    var controller = this;
    var data = {};
    data.userId = user;
    data.controller = this;
    this.loadUser(data).then(controller.loadUserContexts);
  },

  editUser: function (user, recentlySaved) {
    var record = this.getView().getStore().getById(user);
    this.userClicked(null, record, null, null, recentlySaved);
  },

  loadUser: function (data) {
    var deferred = new Ext.Deferred();
    Ext.Ajax.request({
      url: "/stratum/api/metadata/users/" + data.userId,
      method: "GET",
      withCredentials: true,
      success: function (response) {
        data.user = Ext.decode(response.responseText).data;
        Ext.StoreManager.get("users").add(data.user);
        deferred.resolve(data);
      },
      failure: function (response) {
        deferred.reject(response);
      },
    });
    return deferred.promise;
  },

  loadContexts: function (component, userId) {
    var contexts =
      this.getLoader() &&
      this.getLoader()
        .getContexts()
        .filter(function (c) {
          return c.User.UserID === userId;
        });
    if (contexts.length !== 0) {
      component.down("grid").getStore().loadData(contexts);
    } else {
      Ext.Ajax.request({
        url: "/stratum/api/metadata/contexts/user/" + userId,
        withCredentials: true,
        success: function (result, request) {
          var data = Ext.decode(result.responseText).data;
          component.down("grid").getStore().loadData(data);
        },
      });
    }
  },

  getLatestContextLogin: function (user) {
    var time = user.Contexts.reduce(function (total, current) {
      total.ActivatedAt = total.ActivatedAt || "";
      if (total.ActivatedAt < current.ActivatedAt) {
        return current;
      }
      return total;
    });
    time = time.ActivatedAt
      ? time.ActivatedAt.substring(0, 16).replace("T", " ")
      : null;
    return time || "Okänt";
  },

  getAllRegistryUnits: function () {
    return Ext.ComponentQuery.query("usergrid")
      .pop()
      .lookup("unitFilter")
      .getStore()
      .getData()
      .items.map(function (item) {
        return item.data.UnitID;
      });
  },
});

Ext.define("RC.UserAdministration.controller.Form", {
  extend: "Ext.app.ViewController",
  alias: "controller.form",

  init: function () {
    this.callParent();
    var usedFields = this.getFields();
    var fields = this.getForm().getFields().items;
    fields.forEach(function (field) {
      if (usedFields.indexOf(field.reference) < 0) {
        field.hide();
        field.disable();
      }
    });
  },

  onSithIdChoosen: function () {
    this.lookup("firstname").allowBlank = true;
    this.lookup("firstname").removeCls("rc-required");
    this.lookup("lastname").allowBlank = true;
    this.lookup("lastname").removeCls("rc-required");
    this.lookup("hsaid").show();
    this.lookup("hsaid").enable();
    this.lookup("personalid").hide();
    this.lookup("personalid").disable();
    this.lookup("sithIdButton").hide();
    this.lookup("bankIdButton").show();
  },

  onBankIdChoosen: function () {
    this.lookup("firstname").allowBlank = false;
    this.lookup("firstname").addCls("rc-required");
    this.lookup("lastname").allowBlank = false;
    this.lookup("lastname").addCls("rc-required");
    this.lookup("hsaid").hide();
    this.lookup("hsaid").disable();
    this.lookup("personalid").show();
    this.lookup("personalid").enable();
    this.lookup("bankIdButton").hide();
    this.lookup("sithIdButton").show();
  },

  getUser: function () {
    var form = this.getForm().getValues();
    form.Email = form.Username;
    var completeInfo = this.lookup("userform").up().Info || {};
    completeInfo[Profile.Site.Register.RegisterID] = form.Info;
    form.Extra = JSON.stringify(completeInfo);
    form.HSAID = form.HSAID ? form.HSAID : form.PersonalId;
    return form;
  },

  getForm: function () {
    return this.lookup("userform").getForm();
  },

  getContext: function () {
    var form = this.getForm().getValues();
    var context = {
      IsActive: true,
      User: {},
      Unit: { UnitID: form.UnitID },
      Role: { RoleID: form.RoleID },
    };

    return context;
  },

  transformUser: function () {
    var form = this.getForm().getValues();
    this.transformPersonalId(form);
    this.transformExtra(form);
    this.getForm().setValues(form);
    return form.UserID;
  },

  transformExtra: function (form) {
    var completeInfo = this.lookup("userform").up().Info || {};
    completeInfo[Profile.Site.Register.RegisterID] = form.Info;
    form.Extra = JSON.stringify(completeInfo);
    return form;
  },

  transformPersonalId: function (form) {
    if (!form.PersonalId) return;
    this.lookup("hsaid").setValue(form.PersonalId);
    this.lookup("hsaid").enable();
    this.lookup("personalid").disable();
  },

  saveUser: function (data) {
    var deferred = new Ext.Deferred();
    delete data.user.UserID;

    Ext.Ajax.request({
      url: "/stratum/api/metadata/users/",
      method: "POST",
      jsonData: data.user,
      withCredentials: true,
      success: function (response) {
        data.user = Ext.decode(response.responseText).data;
        deferred.resolve(data);
      },
      failure: function (response) {
        deferred.reject(response);
      },
    });
    return deferred.promise;
  },

  saveContext: function (data) {
    var deferred = new Ext.Deferred();
    data.context.User.UserID = data.user.UserID;
    Ext.Ajax.request({
      url: "/stratum/api/metadata/contexts/",
      method: "POST",
      jsonData: data.context,
      withCredentials: true,
      success: function (response) {
        data.context = Ext.decode(response.responseText).data;
        deferred.resolve(data);
      },
      failure: function (response) {
        deferred.reject(response);
      },
    });
    return deferred;
  },

  updateUser: function (data) {
    var deferred = new Ext.Deferred();
    var user = data.user;
    var controller = data.controller;
    Ext.Ajax.request({
      url: "/stratum/api/metadata/contexts/user/" + user.UserID,
      method: "GET",
      withCredentials: true,
      success: function (result, request) {
        user.Contexts = Ext.decode(result.responseText).data;
        var units = controller.getAllRegistryUnits();
        user.Contexts = user.Contexts.filter(function (context) {
          return units.indexOf(context.Unit.UnitID) >= 0;
        });
        Ext.ComponentQuery.query("usergrid")[0].getStore().add(user);
        data.user = user;
        deferred.resolve(data);
      },
      failure: function (result, request) {
        deferred.reject(data);
      },
    });
    return deferred;
  },

  getAllRegistryUnits: function () {
    return Ext.ComponentQuery.query("usergrid")
      .pop()
      .lookup("unitFilter")
      .getStore()
      .getData()
      .items.map(function (item) {
        return item.data.UnitID;
      });
  },

  onSendWelcomeMail: function () {
    var newline = "" + escape("\n");
    var site = Profile.Site.SiteName;
    var registry = Profile.Site.Register.ShortName.toLowerCase();
    var recipient = this.lookup("username").getValue() || "";
    var name =
      this.lookup("firstname").getValue() +
      " " +
      this.lookup("lastname").getValue();
    name = name !== " " ? " " + name : "";
    var sender =
      Profile.Context.User.FirstName + " " + Profile.Context.User.LastName;
    var subject = widgetConfig.mailTitle || "Välkommen till " + site;
    var content = this.lookup("personalid").isDisabled()
      ? this.getSithsMail()
      : this.getBankIdMail();
    content = content
      .replace(/\{recipient}/g, recipient)
      .replace(/\{sender}/g, sender)
      .replace(/\{site}/g, site)
      .replace(/\{registry}/g, registry)
      .replace(/\{nl}/g, newline)
      .replace(/\{name}/g, name);
    var mail =
      "mailto:" + recipient + "?subject=" + subject + "&body=" + content;
    window.location = mail;
  },

  showSaveDefault: function () {
    this.lookup("saveButton").setIconCls("x-fa fa-cloud-upload");
  },

  showSaveSpinner: function () {
    this.lookup("saveButton").setIconCls("x-fa fa-cog fa-spin");
  },

  showSaveCheckmark: function (data) {
    var me = data && data.controller ? data.controller : this;
    me.lookup("saveButton").setIconCls("x-fa fa-check");
  },

  showSaveFailed: function (data) {
    var me = data && data.controller ? data.controller : this;
    me.lookup("saveButton").setIconCls("x-fa fa-exclamation");
  },

  showRenewSpinner: function () {
    this.lookup("renewSithsButton").setIconCls("x-fa fa-refresh fa-spin");
  },

  showRenewCheckmark: function () {
    this.lookup("renewSithsButton").setIconCls("x-fa fa-check");
  },

  getSithsMail: function () {
    var content =
      "Hej{name}!{nl}{nl}Välkommen till {site}.{nl}" +
      "Du har nu fått ett inloggningskonto till {site}, men behöver först koppla ditt {nl}" +
      "SITHS-kort. Gå till https://{registry}.registercentrum.se och logga in: {nl}{nl}" +
      "Användarnamn: {recipient}{nl}" +
      "Lösenord: sa52re{nl}{nl}" +
      "Med vänlig hälsning,{nl}" +
      "{sender}";
    return widgetConfig.sithsMail || content;
  },

  getBankIdMail: function () {
    var content =
      "Hej{name}!{nl}{nl}Välkommen till {site}.{nl}" +
      "Du kan nu logga in på {site} via mobilt Bank ID.{nl}" +
      "Gå till https://{registry}.registercentrum.se och logga in med ditt BankID: {nl}{nl}" +
      "Med vänlig hälsning,{nl}" +
      "{sender}";
    return widgetConfig.bankidMail || content;
  },

  fetchIDs: function (hsaid) {
    var ids = []
      Ext.Ajax.request({
        async: false,
        url: "/stratum/api/metadata/users?query=" + hsaid,
        success: function (response) {
          ids = Ext.decode(response.responseText).data
        },
        failure: function (response) {
          
        },
      });
      return ids
    }
});

Ext.define("RC.UserAdministration.view.CreateUser", {
  extend: "Ext.window.Window",
  controller: "createuser",
  modal: true,
  width: 1000,
  title: "Lägg till ny användare",
  cls: "rc-useradministration",

  items: [
    {
      xtype: "rcuserform",
      reference: "userform",
      viewModel: {
        stores: {
          user: {},
        },
      },
    },
    {
      xtype: "matchuser",
      width: "100%",
      height: 300,
      plugin: true,
      store: {
        data: [],
        type: "user",
        storeId: "matchingusers",
      },
    },
  ],
  dockedItems: [
    {
      xtype: "toolbar",
      dock: "bottom",
      items: [
        {
          xtype: "label",
          text: "...",
          reference: "statusbar",
          style: {
            fontWeight: "normal",
            color: "#606060",
          },
        },
      ],
    },
  ],
});

Ext.define("RC.UserAdministration.controller.CreateUser", {
  extend: "RC.UserAdministration.controller.Form",
  alias: "controller.createuser",

  config: {
    fields: [
      "username",
      "firstname",
      "lastname",
      "hsaid",
      "role",
      "unit",
      "registryinfo",
    ],
  },

  init: function () {
    this.callParent();
    this.lookup("username").setFieldLabel("E-post");
    this.lookup("username").enable();
    this.lookup("username").removeCls("rc-info");
    this.lookup("createContextButton").hide();
    this.lookup("renewSithsButton").hide();
    this.onSithIdChoosen();
    widgetConfig.preferredRole &&
      this.lookup("role").setValue(widgetConfig.preferredRole);
    if (widgetConfig.devMode) {
      this.lookup("username").setFieldLabel("Användarnamn");
    }
  },

  onSave: function () {
    if (!this.getForm().isValid()) return;
    var data = {};
    var controller = this;
    data.controller = this;
    data.user = this.getUser();
    data.context = this.getContext();
    this.showSaveSpinner();
    this.saveUser(data)
      .then(controller.saveContext)
      .then(controller.updateUser)
      .then(controller.updateForm, controller.showSaveFailed);
  },

  updateForm: function (data) {
    var me = data && data.controller ? data.controller : this;
    me.showSaveCheckmark();
    if (widgetConfig.openEditOnSave) {
      var usergrid = RC.UserAdministration.app.down("usergrid")
      usergrid.fireEvent("edituser", data.user.UserID)
      me.getView().destroy()
    }
  },

  onFormChanged: function () {
    var me = this;
    var query = this.getQueryFromInputs();
    query !== "" &&
      this.loadUser(query).then(function (response) {
        me.showMatchingUsers(response);
      });
  },

  getQueryFromInputs: function () {
    var inputs = "";
    inputs +=
      this.lookup("firstname").getValue().length > 2
        ? this.lookup("firstname").getValue() + " "
        : "";
    inputs +=
      this.lookup("lastname").getValue().length > 2
        ? this.lookup("lastname").getValue() + " "
        : "";
    inputs +=
      this.lookup("hsaid").getValue().length > 2
        ? this.lookup("hsaid").getValue() + " "
        : "";
    inputs +=
      this.lookup("personalid").getValue().length > 2
        ? this.lookup("personalid").getValue() + " "
        : "";
    inputs +=
      this.lookup("username").getValue().length > 2
        ? this.lookup("username").getValue() + " "
        : "";
    inputs = inputs.length > 0 ? inputs.substring(0, inputs.length - 1) : "";
    return inputs;
  },

  loadUser: function (query) {
    var deferred = new Ext.Deferred();
    Ext.Ajax.request({
      url: "/stratum/api/metadata/users?query=" + query,
      success: function (response) {
        deferred.resolve(response);
      },
      failure: function (response) {
        deferred.reject(response);
      },
    });
    return deferred.promise;
  },

  showMatchingUsers: function (response) {
    var matches = Ext.decode(response.responseText).data;
    this.matches = matches;
    matches = this.filterMatches(matches);
    this.lookup("matchUser").getStore().loadData(matches);
    this.lookup("statusbar").setText("Antal: " + matches.length);
    this.lookup("hsaid").isValid();
    this.lookup("personalid").isValid();
  },

  filterMatches: function (matches) {
    var firstName = this.lookup("firstname").getValue();
    var lastName = this.lookup("lastname").getValue();
    var hsaid = this.lookup("hsaid").isDisabled()
      ? ""
      : this.lookup("hsaid").getValue();
    var bankid = this.lookup("personalid").isDisabled()
      ? ""
      : this.lookup("personalid").getValue();
    var email = this.lookup("username").getValue();
    matches = matches.filter(function (match) {
      if (hsaid === match.HSAID || bankid === match.HSAID) return true;
      return (
        (firstName.length < 3 ||
          Ext.String.startsWith(match.FirstName, firstName, true)) &&
        (lastName.length < 3 ||
          Ext.String.startsWith(match.LastName, lastName, true)) &&
        (hsaid.length < 3 || Ext.String.startsWith(match.HSAID, hsaid, true)) &&
        (bankid.length < 3 ||
          Ext.String.startsWith(match.HSAID, bankid, true)) &&
        (email.length < 3 || Ext.String.startsWith(match.Email, email, true))
      );
    });
    return matches;
  },
});

Ext.define("RC.UserAdministration.view.EditUser", {
  extend: "Ext.window.Window",
  controller: "edituser",
  modal: true,
  width: 1000,
  title: "Redigera användare",
  cls: "rc-useradministration",

  listeners: {
    contextadded: "onContextAdded",
    change: "onFormChanged",
  },

  config: {
    userData: [],
    contextData: [],
    contextsForValidation: [],
    recentlySaved: false
  },

  items: [
    {
      xtype: "rcuserform",
      reference: "userform",
      viewModel: {
        stores: {
          user: [],
        },
      },
    },
    {
      xtype: "contextgrid",
      reference: "contexts",
      width: "100%",
      height: 300,
      plugin: true,
      store: {
        fields: [
          "IsActive",
          {
            name: "ContextID",
            dataIndex: "ContextID",
          },
          {
            name: "Unit",
            convert: function (v, record) {
              return record.get("Unit").UnitName;
            },
          },
          {
            name: "Role",
            convert: function (v, record) {
              return record.get("Role").RoleName;
            },
          },
          {
            name: "Active",
            convert: function (v, record) {
              return record.get("ActivatedAt")
                ? record.get("ActivatedAt").substring(0, 10)
                : "";
            },
          },
        ],
        data: [],
      },
    },
  ],
  dockedItems: [
    {
      xtype: "toolbar",
      dock: "bottom",
      items: [
        {
          xtype: "tbfill",
        },
        {
          xtype: "label",
          reference: "statusbar",
          style: {
            fontWeight: "normal",
          },
        },
      ],
    },
  ],
});

Ext.define("RC.UserAdministration.controller.EditUser", {
  extend: "RC.UserAdministration.controller.Form",
  alias: "controller.edituser",
  config: {
    fields: [
      "username",
      "firstname",
      "lastname",
      "hsaid",
      "email",
      "organisation",
      "registryinfo",
      "lastactive",
    ],
  },

  init: function () {
    this.callParent()
    this.loadUserData()
    delete this.lookup("username").vtype
    delete this.lookup("hsaid").vtype
    this.lookup("username").setFieldLabel("Användarnamn")
    this.lookup("extra").enable()
    var personalidIsUsed = this.getView().getUserData().data.PersonalId
    this.updateStatusBar()
    this.loadContextActivity()
    if (personalidIsUsed) {
      this.lookup("hsaid").setValue(null)
      this.onBankIdChoosen()
    } else {
      this.onSithIdChoosen()
    }
    this.getForm().isValid()
    this.showSaveCheckmark()
  },

  loadContextActivity: function () {
    var store = this.getView().down("grid").getStore();
    var contexts = store.getData().items;
    var controller = this;
    contexts.forEach(function (context) {
      controller.updateContext(context.data.ContextID, store);
    });
  },

  updateContext: function (id, store) {
    Ext.Ajax.request({
      url: "/stratum/api/metadata/logentries/context/" + id,
      method: "GET",
      withCredentials: true,
      success: function (result, request) {
        var data = Ext.decode(result.responseText).data;
        if (data.length === 0) {
          var record = store.findRecord("ContextID", id);
          record.set("deletable", true);
          record.commit();
        }
      },
      failure: function (result, request) {},
    });
  },

  loadUserData: function () {
    var user = this.getView().getUserData();
    var contexts = this.getView().getContextData();
    var contextStore = this.getView().down("grid").getStore();
    contextStore.loadData(contexts);
    this.lookup("userform").loadRecord(user);
  },

  updateStatusBar: function () {
    var numberOfContexts = this.getView().getContextData().length;
    this.lookup("statusbar").setText("Antal " + numberOfContexts);
  },

  onSave: function () {
    var controller = this;
    this.transformUser();
    this.getForm().updateRecord();
    if (this.getForm().getRecord().data.HSAID === "") {
      this.getForm().getRecord().data.HSAID = null;
    }
    var recordChanged = this.getForm().getRecord().isDirty();
    recordChanged && this.showSaveSpinner();
    !recordChanged && this.showSaveCheckmark();
    Ext.StoreManager.lookup("users").sync({
      callback: function () {
        controller.showSaveCheckmark();
      },
    });
  },

  renewSiths: function () {
    var controller = this;
    this.transformUser();
    this.getForm().updateRecord();
    var record = this.getForm().getRecord();
    !record.data.HSAID === null && this.showRenewSpinner();
    record.set("HSAID", null);
    this.lookup("hsaid").setValue(null);
    record.set("Passhash", widgetConfig.passhash);
    Ext.StoreManager.lookup("users").sync({
      callback: function () {
        controller.showRenewCheckmark();
      },
    });
  },

  onFormChanged: function () {
    this.showSaveDefault();
  },

  onCreateContext: function () {
    Ext.create("RC.UserAdministration.view.CreateContext", {
      user: this.getView().getUserData().get("UserID"),
      contexts: this.getView().getContextsForValidation(),
      userForm: this.getView(),
    }).show();
  },

  onContextAdded: function (context) {
    var store = this.lookup("contexts").getStore();
    context.deletable = true;
    store.add(context);
    var usergrid = RC.UserAdministration.app.down("usergrid");
    var existingUser = Ext.StoreManager.get("users").getById(
      context.User.UserID
    );
    if (existingUser === null) {
      usergrid.fireEvent("adduser", context.User.UserID);
    } else {
      usergrid.fireEvent("contextsupdated", context.User.UserID);
    }
  },

  showLog: function () {
    console.log("logg");
    this.fetchLogg().then(function (data) {
      console.log(data);
    });
  },

  fetchLogg: function () {
    var deferred = new Ext.Deferred();

    Ext.Ajax.request({
      // url: '/stratum/api/metadata/logentries/latest/logtype/' + 1201,
      // url: '/stratum/api/metadata/logentries/context/ContextID?after=aFromDate',
      url: "/stratum/api/metadata/users/register/110?expose=deep",
      method: "GET",
      withCredentials: true,
      success: function (result, request) {
        var data = Ext.decode(result.responseText).data;
        deferred.resolve(data);
      },
      failure: function (result, request) {
        deferred.reject();
      },
    });
    return deferred.promise;
  },
});

Ext.define("RC.UserAdministration.view.MatchUser", {
  extend: "Ext.grid.Panel",
  alias: "widget.matchuser",
  reference: "matchUser",
  width: "100%",
  controller: "matchuser",

  listeners: {
    itemdblclick: "editUser",
  },

  columns: [
    {
      text: "Förnamn",
      dataIndex: "FirstName",
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem("FirstName") === "hidden" || false,
    },
    {
      text: "Efternamn",
      dataIndex: "LastName",
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem("LastName") === "hidden" || false,
    },
    {
      text: "Användarnamn",
      dataIndex: "Username",
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem("Username") === "hidden" || false,
    },
    {
      text: "Titel",
      dataIndex: "WorkTitle",
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem("WorkTitle") === "hidden" || false,
    },
    {
      text: "Organisation",
      dataIndex: "Organization",
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem("Organization") === "hidden" || false,
    },
    {
      text: "E-post",
      dataIndex: "Email",
      flex: 1,
      sortable: true,
      hidden: localStorage.getItem("Email") === "hidden" || false,
    },
  ],
  dockedItems: [
    {
      xtype: "header",
      title: "Existerande användare",
      padding: 10,
      border: false,
      style: {
        color: "white",
        backgroundColor: "#888",
      },
    },
  ],
});

Ext.define("RC.UserAdministration.controller.MatchUser", {
  extend: "Ext.app.ViewController",
  alias: "controller.matchuser",

  editUser: function (component, record, item, index) {
    var data = { controller: this, user: record.data };
    this.loadUserContexts(data).then(this.loadUser);
  },

  loadUser: function (data) {
    var me = data.controller;
    var user = data.user;
    var record = me.getView().getStore().getById(data.user.UserID);
    user.Contexts = user.Contexts || [];
    user.LastActive = me.getLatestContextLogin(data.user);
    user.Info = JSON.parse(record.data.Extra || "{}")[
      Profile.Site.Register.RegisterID
    ];
    user.PersonalId = me.checkIfPersonalId(record.data.HSAID)
      ? record.data.HSAID
      : null;
    Ext.create("RC.UserAdministration.view.EditUser", {
      userData: record,
      contextData: Ext.clone(record.data.Contexts),
      contextsForValidation: Ext.clone(record.data.Contexts),
    }).show();
  },

  /* Duplicated code from usergrid - Refactor if time allows*/
  getLatestContextLogin: function (user) {
    if (user.Contexts.length === 0) return "Okänt";
    var time = user.Contexts.reduce(function (total, current) {
      total.ActivatedAt = total.ActivatedAt || "";
      if (total.ActivatedAt < current.ActivatedAt) {
        return current;
      }
      return total;
    });
    time = time.ActivatedAt
      ? time.ActivatedAt.substring(0, 16).replace("T", " ")
      : null;
    return time || "Okänt";
  },

  checkIfPersonalId: function (value) {
    return value && (value.indexOf("19") === 0 || value.indexOf("20") === 0);
  },

  loadUserContexts: function (data) {
    var controller = this;
    var deferred = new Ext.Deferred();

    Ext.Ajax.request({
      url: "/stratum/api/metadata/contexts/user/" + data.user.UserID,
      method: "GET",
      withCredentials: true,
      success: function (result, request) {
        var contexts = Ext.decode(result.responseText).data;
        var units = controller.getAllRegistryUnits();
        contexts = contexts.filter(function (context) {
          return units.indexOf(context.Unit.UnitID) >= 0;
        });
        controller
          .getView()
          .getStore()
          .getById(data.user.UserID)
          .set("Contexts", contexts);
        deferred.resolve(data);
      },
      failure: function (result, request) {
        deferred.reject();
      },
    });
    return deferred.promise;
  },

  getAllRegistryUnits: function () {
    return Ext.ComponentQuery.query("usergrid")
      .pop()
      .lookup("unitFilter")
      .getStore()
      .getData()
      .items.map(function (item) {
        return item.data.UnitID;
      });
  },
});

Ext.define("RC.UserAdministration.view.CreateContext", {
  extend: "Ext.window.Window",
  controller: "createcontext",
  modal: true,
  width: 1000,
  title: "Ny kontext",
  cls: "rc-useradministration",
  config: {
    user: null,
    contexts: [],
    userForm: null,
  },

  items: [
    {
      xtype: "rcuserform",
      reference: "userform",
    },
  ],
});

Ext.define("RC.UserAdministration.controller.CreateContext", {
  extend: "RC.UserAdministration.controller.Form",
  alias: "controller.createcontext",
  config: {
    fields: ["unit", "role"],
  },

  init: function () {
    this.callParent();
    this.lookup("sithIdButton").hide();
    this.lookup("bankIdButton").hide();
    this.lookup("createContextButton").hide();
    this.lookup("WelcomeLetterButton").hide();
    this.lookup("renewSithsButton").hide();
    this.lookup("showLogButton").hide();
    this.lookup("role").vtype = "context";
    this.lookup("unit").vtype = "context";
    var existingUser = RC.UserAdministration.app
      .down("usergrid")
      .getStore()
      .getById(this.getUser());
    if (existingUser) {
      var contexts = existingUser.getData().Contexts;
      this.getView().setContexts(contexts);
    }
  },

  onSave: function () {
    if (!this.getForm().isValid()) return;
    var data = {};
    data.context = this.getContext();
    data.user = {};
    data.user.UserID = this.getUser();
    data.controller = this;
    this.saveContext(data).then(data.controller.updateContexts);
  },

  updateContexts: function (data) {
    var view = data.controller.getView();
    view.getUserForm().fireEvent("contextadded", data.context);
    view.destroy();
  },

  getForm: function () {
    return this.lookup("userform").getForm();
  },

  getUser: function () {
    return this.getView().getUser();
  },
});

Ext.define("RC.UserAdministration.form.User", {
  extend: "Ext.form.Panel",
  xtype: "rcuserform",
  config: {
    userGrid: null,
  },

  fieldDefaults: {
    validateOnChange: true,
  },
  bodyPadding: "23 7",
  defaults: {
    layout: "form",
    xtype: "textfield",
    columnWidth: 0.49,
    labelWidth: 125,
    padding: 7,
    listeners: {
      change: "onFormChanged",
    },
  },
  layout: "column",
  width: "100%",
  items: [
    {
      fieldLabel: "Förnamn",
      name: "FirstName",
      reference: "firstname",
      allowBlank: true,
    },
    {
      fieldLabel: "Efternamn",
      name: "LastName",
      reference: "lastname",
      allowBlank: true,
    },
    {
      fieldLabel: "HSAID",
      name: "HSAID",
      reference: "hsaid",
      allowBlank: true,
      vtype: "hsaid",
      labelClsExtra: "PrefixMandatory",
      maxLength: 64,
    },
    {
      fieldLabel: "Personnummer",
      name: "PersonalId",
      reference: "personalid",
      allowBlank: false,
      vtype: "personalid",
      labelClsExtra: "rc-required",
    },
    {
      fieldLabel: "E-post",
      name: "Email",
      reference: "email",
      vtype: "email",
    },
    {
      fieldLabel: "Organisation",
      name: "Organization",
      reference: "organisation",
    },
    {
      fieldLabel: "Användarnamn",
      name: "Username",
      reference: "username",
      vtype: "username",
      allowBlank: false,
      labelClsExtra: "rc-required",
    },
    {
      fieldLabel: "Enhet",
      name: "UnitID",
      reference: "unit",
      allowBlank: false,
      xtype: "rcfilter",
      store: { type: "unit" },
      valueField: "UnitID",
      displayField: "UnitName",
      labelClsExtra: "rc-required",
    },
    {
      fieldLabel: "Roll",
      name: "RoleID",
      reference: "role",
      allowBlank: false,
      xtype: "rcfilter",
      store: { type: "role" },
      valueField: "RoleID",
      displayField: "RoleName",
      labelClsExtra: "rc-required",
    },
    {
      fieldLabel: "Användarid",
      name: "UserID",
      reference: "userid",
    },
    {
      fieldLabel: "Title",
      name: "WorkTitle",
      reference: "worktitle",
    },
    {
      fieldLabel: "Registerinfo",
      name: "Info",
      reference: "registryinfo",
    },
    {
      fieldLabel: "Senast inloggad",
      name: "LastActive",
      reference: "lastactive",
      cls: "rc-info",
    },
    {
      fieldLabel: "Extra",
      name: "Extra",
      reference: "extra",
    },
  ],
  dockedItems: [
    {
      xtype: "toolbar",
      dock: "bottom",
      border: false,
      items: [
        {
          xtype: "tbspacer",
          reference: "spacer",
          flex: 1,
        },
        {
          xtype: "button",
          reference: "showLogButton",
          text: "Logg",
          iconCls: "x-fa fa-trash",
          handler: "showLog",
          width: 155,
          hidden: true,
        },
        {
          xtype: "button",
          reference: "renewSithsButton",
          text: "Förnya SITHS-kort",
          handler: "renewSiths",
          iconCls: "x-fa fa-refresh",
          width: 155,
        },
        {
          xtype: "button",
          reference: "createContextButton",
          text: "Skapa ny kontext",
          iconCls: "x-fa fa-id-card-o",
          handler: "onCreateContext",
          width: 155,
        },
        {
          xtype: "button",
          reference: "WelcomeLetterButton",
          text: "Välkomstbrev",
          handler: "onSendWelcomeMail",
          iconCls: "x-fa fa-envelope",
          width: 155,
        },
        {
          xtype: "button",
          reference: "sithIdButton",
          text: "Byt till SITHS-kort",
          iconCls: "x-fa fa-exchange",
          handler: "onSithIdChoosen",
          width: 155,
        },
        {
          xtype: "button",
          reference: "bankIdButton",
          text: "Byt till BankID",
          iconCls: "x-fa fa-exchange",
          handler: "onBankIdChoosen",
          width: 155,
        },
        {
          text: "Stäng",
          width: 155,
          iconCls: "x-fa fa-close",
          handler: function (button, event) {
            if (event.ctrlKey) {
              var user = this.up("window").getController().savedUser || 1
              var usergrid = RC.UserAdministration.app.down("usergrid")
              usergrid.fireEvent("edituser", user, true)
            }
            this.up("window").destroy()
          },
        },
        {
          xtype: "button",
          text: "Spara",
          reference: "saveButton",
          iconCls: "x-fa fa-cloud-upload",
          handler: "onSave",
          formBind: true,
          width: 155,
        },
      ],
    },
  ],
});

Ext.define("RC.UserAdministration.view.ContextGrid", {
  extend: "Ext.grid.Panel",
  alias: "widget.contextgrid",
  reference: "contextgrid",
  controller: "context",
  multiSelect: true,
  selModel: "rowmodel",
  width: "100%",

  columns: [
    {
      text: "Aktiv",
      xtype: "checkcolumn",
      dataIndex: "IsActive",
      width: 60,
      sortable: true,
      renderer: function (value, cellValues) {
        cellValues.innerCls = cellValues.innerCls.replace(" synced", "");
        if (cellValues.record.data.isSynced) {
          cellValues.innerCls += " synced";
        }

        var content = this.defaultRenderer(value, cellValues);
        return content;
      },
      listeners: {
        beforecheckchange: function (aColumn, anRowIndex, isChecked) {},
        checkchange: "syncStore",
      },
    },
    {
      text: "ID",
      dataIndex: "ContextID",
      width: 65,
      sortable: true,
    },
    {
      text: "Enhet",
      dataIndex: "Unit",
      flex: 1,
      sortable: true,
    },
    {
      text: "Roll",
      dataIndex: "Role",
      flex: 1,
      sortable: true,
    },
    {
      text: "Aktiv senast",
      dataIndex: "Active",
      width: 100,
      sortable: true,
    },
    {
      // text: 'test',
      width: 40,
      xtype: "widgetcolumn",
      widget: {
        textAlign: "center",
        xtype: "button",
        cls: "rc-gridbutton",
        iconCls: "x-fa fa-trash",
        handler: "onRemoveContext",
        bind: {
          hidden: "{!record.deletable}",
        },
      },
      hidden: false, //!widgetConfig.devMode
    },
    {
      text: "Slutdatum",
      renderer: function (value, metaData, record) {
        return record.get("User").ExpireDate;
      },
      flex: 1,
      sortable: true,
      hidden: true,
    },
  ],

  dockedItems: [
    {
      xtype: "header",
      title: "Kontexter",
      padding: 10,
      border: false,
      style: {
        color: "white",
        backgroundColor: "#888",
      },
    },
  ],
});

Ext.define("RC.UserAdministration.controller.Context", {
  extend: "Ext.app.ViewController",
  alias: "controller.context",

  syncStore: function (column, index, checked, record, e, eOpts) {
    var view = column.getView();
    var observer = RC.UserAdministration.app.down("usergrid");
    var params = Ext.clone(record.data);
    params.IsActive = checked;
    delete params.User;
    delete params.ExpireDate;
    delete params.ActivatedAt;
    delete params.Active;
    delete params.Unit;
    delete params.Role;

    Ext.Ajax.request({
      url: "/stratum/api/metadata/contexts/" + params.ContextID,
      method: "PUT",
      jsonData: params,
      withCredentials: true,
      success: function (result, request) {
        record.data.isSynced = true;
        view.addRowCls(index, "synced");
        observer.fireEvent("contextsupdated", record.data.User.UserID);
      },
      failure: function (result, request) {},
    });
  },

  onRemoveContext: function (component) {
    this.fetchContextLog(component);
    this.removeContext(component);
  },

  removeContext: function (component) {
    var userGrid = RC.UserAdministration.app.down("usergrid");
    var contextStore = this.getView().getStore();
    var record = component.getWidgetRecord().getData();
    Ext.Ajax.request({
      url: "/stratum/api/metadata/contexts/" + record.ContextID,
      method: "DELETE",
      jsonData: record,
      withCredentials: true,
      success: function (result, request) {
        userGrid.fireEvent("contextsupdated", record.User.UserID);
        var contextRecord = contextStore.findRecord(
          "ContextID",
          record.ContextID
        );
        contextStore.remove(contextRecord);
      },
      failure: function (result, request) {},
    });
  },

  fetchContextLog: function (component) {
    var context = component.getWidgetRecord().get("ContextID");
    Ext.Ajax.request({
      url: "/stratum/api/metadata/logentries/context/" + context,
      method: "GET",
      withCredentials: true,
      success: function (result, request) {},
      failure: function (result, request) {},
    });
  },
});

Ext.define("RC.UserAdministration.view.UnitGrid", {
  extend: "Ext.grid.Panel",
  alias: "widget.unitgrid",
  reference: "unitgrid",
  controller: "unit",
  multiSelect: true,
  selModel: "rowmodel",
  width: "100%",
  height: 500,
  cls: "rc-useradministration",
  config: {
    domains: [],
  },

  plugins: {
    gridexporter: true,
  },

  listeners: {
    itemdblclick: "unitClicked",
    unitsloaded: "onDataLoaded",
    domainsLoaded: "onDomainsLoaded",
    selectionchange: "onSelectionChange",
    columnhide: "onColumnHidden",
    columnShow: "onColumnShown",
    refresh: function () {
      this.update();
    },
  },

  store: {
    model: "Stratum.Unit",
    storeId: "units",
  },

  columns: [
    {
      text: "ID",
      dataIndex: "UnitID",
      width: 60,
      sortable: true,
    },
    {
      text: "Kod",
      dataIndex: "UnitCode",
      width: 60,
      sortable: true,
    },
    {
      text: "Namn",
      dataIndex: "UnitName",
      flex: 1,
      sortable: true,
    },
    {
      text: "HSAID",
      dataIndex: "HSAID",
      flex: 1,
      sortable: true,
    },
    {
      text: "Region",
      dataIndex: "County",
      flex: 1,
      sortable: true,
    },
    {
      text: "PARID",
      dataIndex: "PARID",
      flex: 1,
      sortable: true,
    },
    {
      text: "Aktiv",
      dataIndex: "IsActive",
      width: 60,
      sortable: true,
      renderer: function (value, cellValues) {
        value = value ? "Ja" : "Nej";
        return value;
      },
    },
  ],

  dockedItems: [
    {
      xtype: "toolbar",
      reference: "search",
      dock: "top",
      border: false,
      items: [
        {
          xtype: "textfield",
          reference: "unitFilter",
          flex: 1,
          keyMap: {
            enter: {
              handler: "searchUnits",
            },
          },
        },
        {
          xtype: "button",
          reference: "searchButton",
          text: "Sök",
          iconCls: "x-fa fa-search",
          width: 120,
          handler: "searchUnits",
          disabled: false,
        },
      ],
    },
    {
      xtype: "toolbar",
      dock: "top",
      border: false,
      items: [
        {
          reference: "exportButton",
          text: "Exportera",
          iconCls: "x-fa fa-download",
          handler: "export",
          width: 120,
          disabled: false,
        },
        {
          reference: "editButton",
          text: "Redigera",
          iconCls: "x-fa fa-pencil",
          handler: "edit",
          width: 120,
          disabled: true,
        },
        {
          reference: "createButton",
          text: "Lägg till",
          iconCls: "x-fa fa-plus",
          handler: "create",
          width: 120,
          disabled: false,
        },
      ],
    },
  ],
});

Ext.define("RC.UserAdministration.controller.Unit", {
  extend: "Ext.app.ViewController",
  alias: "controller.unit",

  init: function () {
    var columns = this.getView().getColumns();
    var defaultHiddenColumns = ["UnitID", "PARID"];
    columns.forEach(function (column) {
      column.hidden =
        localStorage.getItem(column.dataIndex) === "hidden" ||
        (localStorage.getItem(column.dataIndex) === null &&
          defaultHiddenColumns.indexOf(column.dataIndex) > -1);
    });
  },

  searchUnits: function () {
    var store = this.getView().getStore();
    var unit = this.lookup("unitFilter").getValue();
    store.clearFilter();
    store.addFilter(this.createUnitFilter(unit));
  },

  onDataLoaded: function (dataLoader) {
    var units = dataLoader.getUnits();
    var domains = this.getView().getDomains();
    var bindings = dataLoader.getBindings();
    units.forEach(function (unit) {
      unit.County = bindings[unit.UnitName].County;
      domains.forEach(function (domain) {
        unit[domain.DomainName] = bindings[unit.UnitName][domain.DomainName];
      });
    });
    this.getView().getStore().loadData(units);
  },

  onDomainsLoaded: function (dataLoader) {
    this.getView().setDomains(dataLoader.getDomains());
    var domains = this.getView().getDomains();
    var grid = this.getView().getHeaderContainer();
    domains.forEach(function (domain) {
      grid.insert(
        Ext.create("Ext.grid.column.Column", {
          text: domain.DomainTitle,
          dataIndex: domain.DomainName,
          flex: 1,
        })
      );
    });
    this.onDataLoaded(dataLoader);
  },

  export: function () {
    Ext.util.CSV.delimiter = ";";
    var grid = this.getView();
    grid.saveDocumentAs({ type: "xlsx", fileName: "enheter.xlsx" });
  },

  edit: function () {
    var selections = this.getView().getSelection();
    if (selections.length === 1) {
      this.unitClicked(null, selections[0]);
    }
  },

  create: function () {
    var nextId = this.getNextUnitId();
    Ext.create("RC.UserAdministration.view.CreateUnit", {
      nextId: nextId,
      domains: this.getView().getDomains(),
    }).show();
  },

  unitClicked: function (component, record, item, index) {
    Ext.create("RC.UserAdministration.view.EditUnit", {
      unit: record,
      domains: this.getView().getDomains(),
    }).show();
  },

  getNextUnitId: function () {
    return (
      this.getView()
        .getStore()
        .getData()
        .items.map(function (item) {
          return item.data.UnitCode;
        })
        .reduce(function (max, item) {
          return Math.max(max, item);
        }) + 1
    );
  },

  onColumnHidden: function (component, column, eOpts) {
    localStorage.setItem(column.dataIndex, "hidden");
  },

  onColumnShown: function (component, column, eOpts) {
    localStorage.setItem(column.dataIndex, "shown");
  },

  onSelectionChange: function (component, record, index, eOpts) {
    this.lookup("editButton").enable();
  },

  createUnitFilter: function (unit) {
    var filter = function (item) {
      return (
        item.data.UnitName.toLowerCase().indexOf(unit) > -1 ||
        item.data.UnitCode == unit ||
        (item.data.County && item.data.County.toLowerCase().indexOf(unit) > -1)
      );
    };
    return filter;
  },
});

Ext.define("RC.UserAdministration.form.Unit", {
  extend: "Ext.form.Panel",
  xtype: "rcunitform",
  layout: "column",
  width: "100%",
  bodyPadding: 7,
  cls: "rc-useradministration",

  fieldDefaults: {
    validateOnChange: true,
  },

  defaults: {
    layout: "form",
    xtype: "textfield",
    columnWidth: 1,
    labelWidth: 115,
    padding: 7,
    listeners: {
      change: "onFormChanged",
    },
  },

  items: [
    {
      fieldLabel: "Namn",
      name: "UnitName",
      reference: "unitname",
      allowBlank: false,
      labelClsExtra: "rc-required",
    },
    {
      fieldLabel: "Enhetskod",
      name: "UnitCode",
      reference: "unitcode",
      allowBlank: false,
      labelClsExtra: "rc-required",
    },
    {
      fieldLabel: "HSAID",
      name: "HSAID",
      reference: "hsaid",
      allowBlank: true,
    },
    {
      fieldLabel: "PARID",
      name: "PARID",
      reference: "parid",
      allowBlank: true,
      hidden: true,
    },
    {
      fieldLabel: "Region",
      name: "County",
      reference: "region",
      allowBlank: false,
      xtype: "rcfilter",
      store: { type: "region" },
      valueField: "DomainValueID",
      displayField: "ValueName",
      labelClsExtra: "rc-required",
    },
    {
      fieldLabel: "Aktiv",
      name: "IsActive",
      reference: "active",
      hidden: false,
      allowBlank: false,
      xtype: "combobox",
      store: { type: "active" },
      valueField: "ActiveCode",
      displayField: "ActiveName",
    },
  ],

  dockedItems: [
    {
      xtype: "toolbar",
      dock: "bottom",
      border: false,
      items: [
        {
          xtype: "tbspacer",
          flex: 1,
        },
        {
          text: "Stäng",
          iconCls: "x-fa fa-close",
          width: 155,
          handler: function () {
            this.up("window").destroy();
          },
        },
        {
          xtype: "button",
          text: "Spara",
          iconCls: "x-fa fa-cloud-upload",
          handler: "onSave",
          formBind: true,
          width: 155,
        },
      ],
    },
  ],
});

Ext.define("RC.UserAdministration.controller.UnitForm", {
  extend: "Ext.app.ViewController",
  alias: "controller.unitform",

  getForm: function () {
    return this.lookup("unitform").getForm();
  },
});

Ext.define("RC.UserAdministration.view.EditUnit", {
  extend: "Ext.window.Window",
  controller: "editunit",
  modal: true,
  width: 600,
  title: "Redigera enhet",

  config: {
    unit: [],
    domains: [],
  },

  items: [
    {
      xtype: "rcunitform",
      reference: "unitform",
    },
  ],
});

Ext.define("RC.UserAdministration.controller.EditUnit", {
  extend: "RC.UserAdministration.controller.UnitForm",
  alias: "controller.editunit",
  config: {
    fields: ["unitname"],
  },

  init: function () {
    this.lookup("unitform").loadRecord(this.getView().getUnit());
    this.addDomains();
  },

  onSave: function () {
    this.updateRecords();
    Ext.StoreManager.lookup("units").sync();
    this.getView().destroy();
  },

  updateRecords: function () {
    var controller = this;
    var record = this.getForm().getRecord();
    var form = this.getForm().getValues();
    var domains = this.getView().getDomains();

    this.getForm().updateRecord();

    if (typeof form.County !== "number") {
      form.County = this.lookup("region").findRecordByDisplay(
        "Västra Götaland"
      ).id;
    }
    record.set("County", controller.lookup("region").getDisplayValue());

    var bindings = [{ DomainValueID: form.County }];
    domains.forEach(function (domain) {
      var domainValue = form[domain.DomainName];
      var field = controller.lookup(domain.DomainName);
      if (typeof domainValue !== "number") {
        domainValue = field.findRecordByDisplay(domainValue).data.DomainValueID;
      }
      record.set(domain.DomainName, field.getDisplayValue());
      bindings.push({ DomainValueID: domainValue });
    });
    record.set("Bindings", bindings);
  },

  addDomains: function () {
    var domains = this.getView().getDomains();
    var form = this.getView().down();
    var unit = this.getView().getUnit().getData();
    domains.forEach(function (domain) {
      form.add({
        xtype: "rcfilter",
        reference: domain.DomainName,
        name: domain.DomainName,
        fieldLabel: domain.DomainTitle,
        allowNull: false,
        allowBlank: false,
        valueField: "DomainValueID",
        displayField: "ValueName",
        value: unit[domain.DomainName],
        store: {
          data: domain.DomainValues,
        },
      });
    });
  },
});

Ext.define("RC.UserAdministration.view.CreateUnit", {
  extend: "Ext.window.Window",
  controller: "createunit",
  modal: true,
  width: 600,
  title: "Lägg till enhet",

  config: {
    unit: [],
    nextId: 0,
    domains: [],
  },

  items: [
    {
      xtype: "rcunitform",
      reference: "unitform",
    },
  ],
});

Ext.define("RC.UserAdministration.controller.CreateUnit", {
  extend: "RC.UserAdministration.controller.UnitForm",
  alias: "controller.createunit",
  config: {
    fields: ["unitname"],
    nextId: 0,
    domains: [],
  },

  init: function () {
    var nextId = this.getView().getNextId();
    this.lookup("unitcode").setValue(nextId);
    this.lookup("active").setValue(true);
    this.addDomains();
  },

  addDomains: function () {
    var domains = this.getView().getDomains();
    var form = this.getView().down();
    domains.forEach(function (domain) {
      form.add({
        xtype: "rcfilter",
        name: domain.DomainName,
        reference: domain.DomainName,
        fieldLabel: domain.DomainTitle,
        allowNull: false,
        valueField: "DomainValueID",
        displayField: "ValueName",
        store: {
          data: domain.DomainValues,
        },
      });
    });
  },

  onSave: function () {
    var controller = this;
    var domains = this.getView().getDomains();
    var form = this.getForm().getValues();
    form.Bindings = [{ DomainValueID: form.County }];
    form.County = this.lookup("region").getDisplayValue();
    domains.forEach(function (domain) {
      form.Bindings.push({ DomainValueID: form[domain.DomainName] });
      form[domain.DomainName] = controller
        .lookup(domain.DomainName)
        .getDisplayValue();
    });
    form.Register = { RegisterID: Profile.Site.Register.RegisterID };
    form.HSAID = form.HSAID || null;
    form.PARID = form.PARID || null;
    var unitStore = Ext.StoreManager.get("units");
    unitStore.add(form);
    unitStore.sync();
    this.getView().destroy();
  },
});

Ext.define("RC.UserAdministration.view.Filter", {
  extend: "Ext.form.field.ComboBox",
  xtype: "rcfilter",
  alias: "view.rcfilter",
  forceSelection: false,
  typeAhead: true,
  queryMode: "local",
  minChars: 1,
  anyMatch: true,
  autoSelect: false,
  caseSensitive: false,
  checkChangeEvents: ["change", "keyup"],

  constructor: function (config) {
    config.queryMode = "local";
    this.callParent(arguments);
  },
});

Ext.define("RC.UserAdministration.Validators", {
  override: "Ext.form.field.VTypes",

  hsaid: function (value, field) {
    var controller = field.up("window").getController()
    var validator = new RegExp(/^SE[a-zA-Z0-9-]{1,29}$/);
    var hsaids = controller.fetchIDs && controller.fetchIDs(value)

    var existingId = hsaids.some(function(match){
      return match.HSAID === value
    })


    var validId = validator.test(value);
    if (!validId) {
      this.hsaidText = "Inget giltigt <br/>HSAID";
      return false;
    }
    if (existingId) {
      this.hsaidText = "Detta HSAID finns<br>redan registrerat";
      return false;
    }
    return true;
  },
  hsaidText: "Inget giltigt <br/>HSAID",

  personalid: function (value, field) {
    var validator = new RegExp(/^(19|20)[0-9]{10}$/);
    var matches = field.up("window").getController().matches;
    var existingId =
      field.up("window").getController().filterMatches &&
      field.up("window").getController().filterMatches(matches).length === 1;
    var validId = validator.test(value);
    if (!validId) {
      this.personalidText = "Inget giltigt personnummer <br/>ÅÅÅÅMMDDXXXX";
      return false;
    }
    if (existingId) {
      this.personalidText = "Personnumret finns<br>redan registrerat";
      return false;
    }
    return true;
  },
  personalidText: "Inget giltigt personnummer <br/>ÅÅÅÅMMDDXXXX",

  username: function (value, field) {
    var isValid = false;
    if (value === field.lastTry) return field.lastTryResult;
    field.lastTry = value;

    Ext.Ajax.request({
      async: false,
      url: "/stratum/api/metadata/users/exists/" + value,
      method: "GET",
      success: function (response, opts) {
        isValid = false;
      },
      failure: function (response, opts) {
        isValid = true;
      },
    });
    field.lastTryResult = isValid;
    return isValid;
  },
  usernameText: "Denna e-postadress <br>används redan",

  context: function (value, field) {
    var contexts = field.up("window").getContexts();
    var controller = field.up("window").getController();
    var unit = controller.lookup("unit").getValue();
    var role = controller.lookup("role").getValue();
    if (!(unit && role)) return true;
    return !contexts.some(function (context) {
      return context.Role.RoleID === role && context.Unit.UnitID === unit;
    });
  },
  contextText:
    "En kontext med denna kombination <br> av enhet och roll finns redan",
});

Ext.define("RC.UserAdministration.storage.Data", {
  mixins: ["Ext.mixin.Observable"],
  config: {
    users: [],
    contexts: [],
    units: [],
    domains: [],
    bindings: [],
    observers: [],
  },
  constructor: function (config) {
    this.initConfig(config);
    this.callParent(config);
    this.loadData();
  },

  loadData: function () {
    var controller = this;
    Ext.Promise.all([
      Ext.Ajax.request({
        url:
          "/stratum/api/metadata/units/register/" +
          Profile.Site.Register.RegisterID,
      }),
      Ext.Ajax.request({
        url:
          "/stratum/api/metadata/units/bindings/" +
          Profile.Site.Register.RegisterID,
      }),
    ]).then(function (results) {
      var units = Ext.decode(results[0].responseText).data;
      var bindings = Ext.decode(results[1].responseText).data;
      controller.setUnits(units);
      controller.setBindings(bindings);
      controller.getObservers().forEach(function (observer) {
        observer.fireEvent("unitsloaded", controller);
      });
    });

    Ext.Promise.all([
      Ext.Ajax.request({
        url:
          "/stratum/api/metadata/users/register/" +
          Profile.Site.Register.RegisterID,
      }),
      Ext.Ajax.request({
        url:
          "/stratum/api/metadata/contexts/register/" +
          Profile.Site.Register.RegisterID,
      }),
    ]).then(function (results) {
      var users = Ext.decode(results[0].responseText).data;
      var contexts = Ext.decode(results[1].responseText).data;
      controller.setUsers(users);
      controller.setContexts(contexts);
      controller.getObservers().forEach(function (observer) {
        observer.fireEvent("dataloaded", controller);
      });
    });

    Ext.Promise.all([
      Ext.Ajax.request({
        url:
          "/stratum/api/metadata/domains/register/" +
          Profile.Site.Register.RegisterID,
      }),
    ]).then(function (results) {
      var domains = Ext.decode(results[0].responseText).data;
      var requests = [];
      domains = domains.filter(function (domain) {
        return domain.DomainID >= 3000 && domain.DomainID < 3100;
      });
      if (domains.length === 0) return;
      domains.forEach(function (domain) {
        requests.push(
          Ext.Ajax.request({
            url: "/stratum/api/metadata/domains/" + domain.DomainID,
          })
        );
      });
      Ext.Promise.all(requests).then(function (results) {
        var domainvalues = Ext.decode(results[0].responseText).data;
        controller.setDomains([domainvalues]);
        controller.getObservers().forEach(function (observer) {
          observer.fireEvent("domainsloaded", controller);
        });
      });
    });
  },
});

Ext.define("RC.UserAdministration.view.FileDrop", {
  extend: "Ext.panel.Panel",
  xtype: "filedrop",
  controller: "filedrop",
  title: "File Drag",
  width: 500,
  height: 300,
  bodyPadding: 5,
  layout: "fit",
  renderTo: "contentPanel",
  bodyCls: "drag-file-ct",
  // html: '<div class="drag-file-icon" style="height: 100%; width: 100%";></div>'
});

Ext.define("RC.UserAdministration.controller.FileDrop", {
  extend: "Ext.app.ViewController",
  alias: "controller.filedrop",

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
          dragover: this.beforeDrop,
        },
      });
    } else {
      body
        .down(".drag-file-label")
        .setHtml("File dragging is not supported by your browser");
      body.el.addCls("nosupport");
    }
  },

  onDragEnter: function () {
    this.getView().body.addCls("rc-active");
  },

  onDragLeave: function () {
    this.getView().body.removeCls("rc-active");
  },

  beforeDrop: function () {
    return true;
  },

  onDrop: function (target, info) {
    var view = this.getView();
    var body = view.body;
    // var icon = body.down('.drag-file-icon');
    var reader = new FileReader();

    body.removeCls("active");
    reader.onload = this.read;
    reader.readAsText(info.files[0]);
  },

  destroy: function () {
    Ext.undefer(this.timer);
    this.target = Ext.destroy(this.target);
    this.callParent();
  },

  read: function (e) {
    // var content = e.target.result
  },
});

Ext.util.CSS.removeStyleSheet('useradministration')
Ext.util.CSS.createStyleSheet(
  ' '
  + '.rc-active {'
  + '  background-color: aquamarine;'
  + '}'

  + '.rc-gridbutton {'
  + '  background-color: initial;'
  + '  border-color: rgba(0,0,0,0);'
  + '}'

  + '.rc-gridbutton .x-btn-icon-el-default-small {'
  + '  color: #a3a3a3;'
  + '}'

  + '.rc-gridbutton.x-btn-over.x-btn-default-small {'
  + '  background-color: initial;'
  + '  border-color: rgba(0,0,0,0);'
  + '}'

  + '.rc-gridbutton.x-btn-over .x-btn-icon-el-default-small, .rc-gridbutton.x-btn-focus .x-btn-icon-el-default-small {'
  + '  color: #af1212;'
  + '}'

  + '.rc-gridbutton.x-btn-focus.x-btn-default-small {'
  + '  border-color: #a3a3a3;'   
  + '  background-color: initial;'
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

  + '.rc-useradministration .x-btn-icon-el-default-toolbar-small {'
  + '  color: #888;'
  + '}'
/*
  + '.rc-useradministration .x-btn-default-toolbar-small {'
  + '  border-color: #f0f0f0;'
  + '}'

  + '.rc-useradministration .x-btn-default-toolbar-small:hover {'
  + '  border-color: #b0b0b0;'
  + '}'
  */
  + '.rc-info div {'
  + '  border-color: #eee;'
  + '}',
  'useradministration'
)

// eslint-disable-next-line no-unused-vars
Ext.Loader.loadScript({
  url: '/stratum/extjs/scripts/exporter.js',
  onLoad: function () { onReady() }
})
