
Ext.Loader.loadScript({
  url: '/stratum/extjs/scripts/exporter.js',
  onLoad: function() {}
  
});

Ext.Loader.loadScript({
  url: '/stratum/extjs/scripts/pivot.js',
  onLoad: function() {onReady();}
  
});


function onReady() {

Ext.define('shpr.view.Filter', {
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
  
Ext.define('RC.UserAdministration.drag.FileController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.drag-file',
  
  afterRender: function(view) {
      var body = view.body;

      if (window.File && window.FileList && window.FileReader) {
          this.target = new Ext.drag.Target({
              element: body,
              listeners: {
                  scope: this,
                  dragenter: this.onDragEnter,
                  dragleave: this.onDragLeave,
                  drop: this.onDrop,
                  dragover:  this.beforeDrop
              }
          });
      } else {
          body.down('.drag-file-label').setHtml(
              'File dragging is not supported by your browser'
          );
          body.el.addCls('nosupport');
      }
  },

  onDragEnter: function() {
      this.getView().body.addCls('active');
  },

  onDragLeave: function() {
      this.getView().body.removeCls('active');
  },
  
  beforeDrop: function (a,b ,c) {
    return true;  
  },

  onDrop: function(target, info) {
      var view = this.getView();
      var body = view.body;
      var icon = body.down('.drag-file-icon');
      var reader =  new FileReader();

      body.removeCls('active');
      reader.onload = this.read;
      reader.readAsText(info.files[0]);
  },

  destroy: function() {
      Ext.undefer(this.timer);
      this.target = Ext.destroy(this.target);
      this.callParent();
  },

  read: function (e) {
      var content = e.target.result;
      console.log(content);
  }
});

Ext.define('RC.UserAdministration.view.DragFile', {
  extend: 'Ext.panel.Panel',
  xtype: 'drag-file',
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

Ext.define('RC.UserAdministration.UserController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.user',
  export:  function () {
             Ext.util.CSV.delimiter = ";";
             this.getView().saveDocumentAs({ type: 'csv', fileName: 'users.csv'});
           },
  mail:    function () {console.log('mailed');},
  edit:    function () {console.log('edited');},
  loadAll: function() {
    var controller = this;
    Ext.Promise.all([
      Ext.Ajax.request({
        url: 'http://w10-076.rcvg.local/stratum/api/metadata/users/register/' + Profile.Site.Register.RegisterID
      }),
      Ext.Ajax.request({
        url: 'http://w10-076.rcvg.local/stratum/api/metadata/contexts/register/' + Profile.Site.Register.RegisterID
      })
   ])
   .then(function(results) {
     var users    = Ext.decode(results[0].responseText).data;
     var contexts = Ext.decode(results[1].responseText).data;
     controller.addContexts(users);
     controller.join(users, contexts);
     controller.getView().getStore().loadData(users);
     controller.updateGrid();
   });
  },

  join:  function(a, b) {
           b.forEach(function(context) {
             var user = a.filter(function(item){return context.User.Username === item.Username;});
             user[0].Contexts.push(context);
          });
  },
  
  addContexts: function (users) {
      users.forEach(function(item) {
          item.Contexts = [];
      });
  },

  updateGrid: function () {
    this.getView().getStore().clearFilter();
    var role = this.getView().down('#roleFilter').getValue();
    this.getView().getStore().addFilter(function (item) { 
        if(item.data.Contexts && role) {
          var isDeveloper = item.data.Contexts.filter(function(item){return item.Role.RoleID === 906; }).length !== 0;
          var roles = item.data.Contexts.filter(function(item){return item.Role.RoleID === role && (role === 906 || !isDeveloper);});
          var inrole = roles.length !== 0;
          return inrole;
        } 
        return true;
    });
    var active = this.getView().down('#activeFilter').getValue();
    this.getView().getStore().addFilter(function (item) { 
        if(item.data.Contexts) {
          var isDeveloper = item.data.Contexts.filter(function(item){return item.Role.RoleID === 906; }).length !== 0;
          if(isDeveloper && role !== 906) { return false }
          else if (active===0) { return true };
          var activeContexts = item.data.Contexts.filter(function(item){return item.IsActive === true;});
          var isActive = activeContexts.length !== 0;
          return (active === 1 && isActive) || (active === 2 && !isActive);
        } 
        return true;
    });

    var unit = this.getView().down('#unitFilter').getValue();
    this.getView().getStore().addFilter(function (item) { 
        if(item.data.Contexts) {
          var isDeveloper = item.data.Contexts.filter(function(item){return item.Role.RoleID === 906; }).length !== 0;
          if(isDeveloper && role !== 906) { return false }
          else if (unit===0) { return true };
          var unitContexts = item.data.Contexts.filter(function(current){return current.Unit.UnitID === unit;});
          var isPartOfUnit = unitContexts.length !== 0;
          return isPartOfUnit;
        } 
        return true;
    });
  }
});

Ext.define('RC.UserAdministration.view.Grid', {
  extend: 'Ext.grid.Panel',
  controller: 'user',
  multiSelect: true,
  selModel: 'rowmodel',
  width: 750,

  plugins: {
   gridexporter: true,
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

  initComponent: function() {
      this.getController().loadAll();
      this.callParent();
  },
  
  columns: [{
      text: "Förnamn",
      dataIndex: 'FirstName',
      flex: 1,
      sortable: true
  }, {
      text: "Efternamn",
      dataIndex: 'LastName',
      flex: 1,
      sortable: true
  }, {
      text: 'Användarnamn',
      dataIndex: 'Username',
      flex: 1,
      sortable: true
  }
  ],
  dockedItems: [{
  xtype: 'toolbar',
  dock: 'top',
  items: [
      { xtype: 'label', text: 'Enhet', height: 15, flex: 1, padding: '0 0 0 3' },
      { xtype: 'label', text: 'Roll', height: 15, flex: 1, padding: '0 0 0 3' },
      { xtype: 'label', text: 'Aktiv', height: 15, flex: 1, padding: '0 0 0 3' }
  ]
}],
  tbar: [
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
        fields: ['UnitID', 'UnitName'],
        autoLoad: true,
        proxy: {
          type: 'ajax',
          url: '/stratum/api/metadata/units/register/100',
          reader: {
            type: 'json',
            rootProperty: 'data'
          }
        },
        listeners: {
          load: function (store) {
             store.add({ UnitName: 'Alla', UnitID: 0 });
             store.sort({ property: 'UnitName', direction: 'ASC' });
          },
        }
      }
    },{
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
    }],

  fbar: [{
      minWidth: 80,
      text: 'Redigera',
      handler: 'edit'
  }, {
      minWidth: 80,
      text: 'Mejla',
      handler: 'mail'
  }, {
      minWidth: 80,
      text: 'Exportera',
      handler: 'export'
  }]
});

// Ext.create('RC.UserAdministration.view.DragFile').show();
Ext.create('RC.UserAdministration.view.Grid', {renderTo: 'contentPanel'});

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

/*
foo.saveDocumentAs({
   type: 'xlsx',
   title: 'Användare',
   fileName: 'users.xlsx'
});*/
