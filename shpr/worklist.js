(function() {

	var container = Stratum.containers && Stratum.containers['SHPR/WorkList'] || 'sw-rccontainer1';

	if (!Profile.Context || !Profile.Context.Role.IsPermittedToAdminister) {
		Ext.get(container).createChild({ 
			cls: 'Closeable Warning alert alert-danger',
			html: '<div role="alert">Du behöver vara inloggad som koordinator för att kunna se arbetslistan.</div>' 
		});
		return;
	}

	Ext.util.CSS.removeStyleSheet('WorkList');
	Ext.util.CSS.createStyleSheet(
		'.worklist-grid .x-grid-row { height: 32px }' +
		'.worklist-grid .x-grid-td { vertical-align: middle }' +
		'.worklist-grid .x-grid-row a { color: #333; font-weight: 500 }' +
		'.worklist-grid .x-grid-td { vertical-align: middle }' +
		'.worklist-grid .x-grid-header-ct { border-color: #e0e0e0 }' +
		'.worklist-grid .x-grid-body { border-color: #e0e0e0 }' +
		'.worklist-grid .x-action-col-icon { margin-right: 10px }' +
		'.worklist-grid .link-button { border: none; background: none; }' +
		'.worklist-grid .x-btn.x-btn-disabled { background: none; }' +
		'.worklist-grid input[type=button] { font-size: 12px; }' +
//		'.worklist-grid .x-grid-item-focused .x-grid-cell-inner:before { border: none }' +
		'.worklist-grid-append { color: #4caf50 }' +
		'.worklist-grid-delete { color: #f44336 }' +
		'.worklist-grid-icon-overlay { position: absolute; pointer-events: none; font: 20px fontawesome }' +
		'.worklist-panel { margin-bottom: 20px }' +
		'.worklist-panel .x-panel-body { border-color: #e0e0e0 }' +
		'.worklist-panel .summary-table { border-collapse: separate; border-spacing: 3px; padding: 5px; background-color: #ffebee; border-radius: 4px; width: 190px }' +
		'.worklist-panel .summary-table td:first-child { text-align: right; font-weight: bold }' +
		'',
		'WorkList'
	);

	if (!Ext.ClassManager.isCreated('WL.controller')) {
		Ext.define('WL.controller', { 
			extend: 'Ext.app.Controller',
			singleton: true,
			
			control: {
				'[itemId^="WL-item"]': {
					change: 'onChange',
					afterrender: 'onRender'
				},
				'[itemId^="WL-view"]': {
					afterrender: 'onRender'
				}
			},
			
			constructor: function (aConfig) {
				// Subclass to set idProperty to UnitCode and eliminate unused properties.
				Ext.define('Stratum.UnitItem', {
					extend: 'Stratum.Unit',
					idProperty: 'UnitCode',
					fields: [
						{ name: 'UnitCode', type: 'int' },
						{ name: 'UnitName', type: 'string' },
						{ name: 'IsActive', type: 'bool' }
					]
				});
 				this.contexts = Ext.create('Ext.data.Store', {
					model: 'Stratum.Context'
				});
 				this.controlee = {}; // Map of controlled views.
 				this.parameter = {}; // Map of parameters for api call or filtering.
				this.callParent(arguments);
			},

			start: function() {
				var me = this;
				
				me.loaded = false;
				me.contexts.load({
					url: '/stratum/api/metadata/contexts/unit/2329', // Contexts on unit Registercentrum for SHPR.
					callback: function() {
						me.controlee['WL-item-unit'].getStore().load({
							callback: function() { 
								me.controlee['WL-view-grid'].getStore().load({ // Promises, please.
									url: '/stratum/api/statistics/shpr/adm-work-list',
									callback: function() {
										if (me.controlee['WL-view-grid'].getStore().count()) {
											me.controlee['WL-view-grid'].getSelectionModel().select(0);
											me.controlee['WL-view-grid'].getView().getRow(0).children[1].focus(); // Hack to prevent scrolling of grid.
										}
										me.ready();
									}
								});
							}
						});
					}
				})
			},
			ready: function() {
				this.loaded = true;
				this.controlee['WL-item-unit'].focus();
				this.controlee['WL-item-unit'].selectText();
				this.update();
			},
			update: function() {
				var ds = this.controlee['WL-view-grid'].getStore();

				if (this.loaded) {
					this.controlee['WL-item-summary'].update({ 
						total: ds.count(),
						arrived: ds.query('IND_Journal', 1).filterBy(ds.getFilters().filterFn).count(),
						ordered: ds.query('IND_Journal', 2).filterBy(ds.getFilters().filterFn).count(),
						missing: ds.query('IND_Journal', null).filterBy(ds.getFilters().filterFn).count(),
					});
				}
			},
			getUser: function(aUserID) {
				var cm = this.contexts.getById(+aUserID);

				return cm 
					? Ext.String.format('{0} {1}', cm.get('User').Firstname, cm.get('User').Lastname[0])
					: '';
			},
			getUnit: function(aUnitCode) {
				var cm = this.controlee['WL-item-unit'].getStore().getById(aUnitCode);

				return cm 
					?  cm.get('UnitName') 
					: '(okänd)';
			},

			onRender: function(aView) {
				this.controlee[aView.itemId] = aView;
			},
			onChange: function(aComponent, aValue) {
				var id = aComponent.itemId.split('-').pop(),
					ds = this.controlee['WL-view-grid'].getStore(),
					sa = [1,2,null], // All possible values in column Journal.
					fa = [];
					
				this.parameter[id] = aValue;
				Ext.Object.each(this.parameter, function(pk,pv) {
					if (pv !== 0 && pv !== true || pv === false) { // Filter only if clinic selected or checkboxes *not* checked.
						switch(pk) {
							case 'unit':
								fa.push({ property: 'R_Unit', value: pv, exactMatch: true });
								break;
							case 'arrived':
								delete sa[sa.indexOf(1)];
								break;
							case 'ordered':
								delete sa[sa.indexOf(2)];
								break;
							case 'missing':
								delete sa[sa.indexOf(null)];
								break;
						}
					}
				})
				fa.push({ property: 'IND_Journal', operator: 'in', value: sa });
				ds.clearFilter();
				ds.filter(fa);
			}
		});
	}

	new Ext.panel.Panel({
		itemId: 'WL-view-input',
		cls: 'worklist-panel',
		renderTo: container,
		bodyPadding: 10,
		border: true,
		items: [{
			xtype: 'filtercombo',
			itemId: 'WL-item-unit',
			labelAlign: 'top',
			fieldLabel: 'Visa arbetslista för',
			displayField: 'UnitName',
			valueField: 'UnitCode',
			grow: true,
			store: {
				model: 'Stratum.UnitItem',
				sorters: [{
					property: 'UnitName'
				}],
				filters: [
					function(aUnit) {
						return aUnit.get('IsActive');
					}
				],
				listeners: {
					beforeload: function(aStore) {
						aStore.getProxy().setUrl(aStore.getProxy().getUrl() + '/register/102');
					},
					load: function(aStore) {
						aStore.insert(0, { UnitCode: 0, UnitName: '(alla kliniker)', IsActive: true });
					}
				}
			},
			listeners: {
				afterrender: function() {
					this.select(0);
				}
			}
		},{
			xtype: 'checkboxfield',
			itemId: 'WL-item-arrived',
			name: 'journal',
			boxLabel: 'Inkludera journal ankommen',
			checked: true
		},{
			xtype: 'checkboxfield',
			itemId: 'WL-item-ordered',
			name: 'journal',
			boxLabel: 'Inkludera journal beställd',
			checked: true
		},{
			xtype: 'checkboxfield',
			itemId: 'WL-item-missing',
			name: 'journal',
			boxLabel: 'Inkludera obehandlade',
			checked: true
		},{
			xtype: 'component',
			itemId: 'WL-item-summary',
			style: 'position: absolute; right: 10px; top: 15px',
			layout: 'fit',
			tpl: new Ext.XTemplate(
				'<table class="summary-table">',
				'<tr><td>{total}</td><td>i arbetslistan, varav</td></tr>',
				'<tr><td>{ordered}</td><td><tpl if="ordered == 1">beställd journal<tpl else>beställda journaler</tpl></td></tr>',
				'<tr><td>{arrived}</td><td><tpl if="arrived == 1">ankommen journal<tpl else>ankomna journaler</tpl></td></tr>',
				'<tr><td>{missing}</td><td><tpl if="missing == 1">obehandlad<tpl else>obehandlade</tpl></td></tr>',
				'</table>'
			)
		}]
	});

	new Ext.grid.Panel ({
		itemId: 'WL-view-grid',
		cls: 'worklist-grid',
		renderTo: container,
		width: '100%',
		border: true,
		enableColumnHide: false,
		enableColumnMove: false,
		enableColumnResize: false,
		enableLocking: false,
		emptyText: '<div style="height: 60px; text-align: center; margin-top: 20px"></div>',
		store: {
			proxy: {
				type: 'ajax',
				reader: 'compactjson'
			},
			fields: [
				{ name: 'SubjectKey',			type: 'string'	},
				{ name: 'R_SaveDate',			type: 'date'	},
				{ name: 'R_Unit',				type: 'int'		},
				{ name: 'R_UnitName',			type: 'string',	calculate: function(aRecord) { return WL.controller.getUnit(aRecord.R_Unit); } }, // Renderer can't be used since sorting will fail.
				{ name: 'P_ProstType',			type: 'int'		},
				{ name: 'R_ReSurgType',			type: 'int',	allowNull: true },
				{ name: 'EventID_Reoperation',	type: 'int',	allowNull: true },
				{ name: 'IND_Journal',			type: 'int',	allowNull: true },
				{ name: 'IND_Registrator',		type: 'string'	},
				{ name: 'EventID_InDepth',		type: 'int',	allowNull: true }
			],
			sorters: [{
				property: 'R_SaveDate',
				direction: 'DESC'
			}],
			listeners: {
				filterchange: function() {
					WL.controller.update();
				}
			}
		},
		viewConfig: {
			deferEmptyText: false,
			markDirty: false
		},
        listeners: {
        },
		columns: {
			defaults: {
				menuDisabled: true
			},
			items: [{ 
				text: 'Person',
				dataIndex: 'SubjectKey',
				width: 130,
				renderer: function(aValue) {
					return '<a href="#!subject?key=' + (Repository.Global.Methods.EncryptNIN || function(x) { return x; })(aValue) + '">' + aValue + '</a>';
				}
  			},{
				text: 'Ankommen',
				dataIndex: 'InsertedAtReoperation',
				xtype: 'datecolumn',
				format: 'Y-m-d',
				width: 120
  			},{
				text: 'Reop.datum',
				dataIndex: 'R_SurgDate',
				xtype: 'datecolumn',
				format: 'Y-m-d',
				width: 120
  			},{
				text: 'Klinik',
				dataIndex: 'R_UnitName',
				flex: 1
  			},{
				text: 'Typ',
				dataIndex: 'P_ProstType',
				width: 70,
				renderer: function(aValue) {
					switch(aValue) {
						case 1: return '<span class="Badge Orangeish" style="float: none">T</span>'
						case 2: return '<span class="Badge Blueish" style="float: none">H</span>'
					}
				}
  			},{
				text: 'Åtgärd',
				dataIndex: 'R_ReSurgType',
				width: 110,
				renderer: function(aValue) {
					switch(aValue) {
						case 901: return 'Byte'
						case 902: return 'Extraktion'
						case 903: return 'Öppet ingrepp'
					}
				}
			},{
				text: 'Journal',
				dataIndex: 'IND_Journal',
				width: 100,
				renderer: function(aValue, aConfig, aRecord) {
					switch(aValue) {
						case 1:  
							return Ext.String.format('<a class="Badge Greenish" style="margin: 0 10px" href="#!event?id={0}">Ankommen</a>', aRecord.get('EventID_xSHPRInDepth'))
						case 2:  
							return Ext.String.format('<a class="Badge" style="margin: 0 10px" href="#!event?id={0}">Beställd</a>', aRecord.get('EventID_xSHPRInDepth'))
						default: 
							return '';
					}
				}
			}],
		},
	});

	WL.controller.start();

})();
//! Koordinatorns arbetslista för reoperationer.
