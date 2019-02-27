
(function() {

	var container = Stratum.containers && Stratum.containers['SHPR/ErrorReports'] || 'sw-rccontainer1';

// 	Ext.get(container).createChild({ 
// 		cls: 'Closeable Warning alert alert-danger',
// 		html: '<div role="alert">Denna sida är under utveckling och kan visa felaktiga data.</div>' 
// 	});

	if (!Profile.Context || !Profile.Context.Role.IsPermittedToAdminister) {
		Ext.get(container).createChild({ 
			cls: 'Closeable Warning alert alert-danger',
			html: '<div role="alert">Du behöver vara inloggad som koordinator för att kunna se kontrollrapporter.</div>' 
		});
		return;
	}

	Ext.util.CSS.removeStyleSheet('ErrorReports');
	Ext.util.CSS.createStyleSheet(
//		'.report-grid .x-grid-row { height: 32px }' +
		'.report-grid .x-grid-td { vertical-align: middle }' +
		'.report-grid .x-grid-row a { color: #333; font-weight: 500 }' +
		'.report-grid .x-grid-td { vertical-align: middle }' +
		'.report-grid .x-grid-header-ct { border-color: #e0e0e0 }' +
		'.report-grid .x-grid-body { border-color: #e0e0e0 }' +
		'.report-grid .link-button { border: none; background: none; }' +
		'.report-grid .x-btn.x-btn-disabled { background: none; }' +
		'.report-grid .x-action-col-icon { margin-right: 10px }' +
		'.report-grid-append { color: #4caf50 }' +
		'.report-grid-delete { color: #f44336 }' +
		'.report-grid-icon-overlay { position: absolute; pointer-events: none; font: 20px fontawesome }' +
		'.report-panel { margin-bottom: 20px }' +
		'.report-panel .x-panel-body { border-color: #e0e0e0 }' +
		'.report-panel .x-toolbar-default { border: 1px solid #e0e0e0 !important; background-color: #f9f9f9 }' +
		'',
		'ErrorReports'
	);

	if (!Ext.ClassManager.isCreated('ER.controller')) {
		Ext.define('ER.controller', { 
			extend: 'Ext.app.Controller',
			singleton: true,
			
			control: {
				'[itemId^="ER-item"]': {
					change: 'onChange',
					afterrender: 'onRender'
				},
				'[itemId^="ER-view"]': {
					afterrender: 'onRender'
				}
			},
			
			constructor: function (aConfig) {
				if(!Ext.ClassManager.isCreated('Stratum.UnitItem')) {
				Ext.define('Stratum.UnitItem', {
					extend: 'Stratum.Unit',
					idProperty: 'UnitCode',
					fields: [
						{ name: 'UnitCode', type: 'int' },
						{ name: 'UnitName', type: 'string' },
						{ name: 'IsActive', type: 'bool' }
					]
				});
				}
 				this.controlee = {}; // Map of ids to views.
 				this.parameter = {}; // Map of parameter names to values for api call or filtering.
 				this.contexts  = {}; // Map of units to contexts for current users loginable contexts (for impersonation).
 				this.units     = {}; // Map of unit codes to names.
				this.callParent(arguments);
			},

			start: function() {
				var me = this;
				
				me.loaded = false;
 				me.parameter = {};
 				me.contexts  = {};
				me.controlee['ER-item-year'].setValue(new Date().getFullYear());
				me.units = new Ext.data.Store({
					autoLoad: true,
					model: 'Stratum.UnitItem',
					proxy: {
						type: 'ajax',
						url : '/stratum/api/metadata/units/register/102',
						reader: 'compactjson',
					},
					listeners: {
						load: function() {
							me.ready();
						}
					}
				});				
				Ext.Ajax.request({ url: '/stratum/api/authentication/contexts', method: 'GET',
					withCredentials: true,
					success: function(rr) {
						Ext.Array.each(Ext.decode(rr.responseText).data, function(cx) {
							if (cx.Unit.Register.RegisterID === Profile.Context.Unit.Register.RegisterID) {
								me.contexts[cx.Unit.UnitCode] = cx.ContextID;
							}
						});
					}
				});
			},
			ready: function() {
				this.loaded = true;
				this.controlee['ER-item-year'].focus();
			},
			update: function() {
				var me = this,
					rs = this.controlee['ER-view-grid'].getStore();
				
				rs.load({
					url: '/stratum/api/statistics/shpr/adm-error-reports?' + Ext.Object.toQueryString(me.parameter),
					callback: function() {
						me.controlee['ER-item-summary'].setText(rs.count() + ' träffar.');
					}
				})
			},
			nameOfUnit: function(aUnitCode) {
				return this.units.getById(aUnitCode).get('UnitName');
			},
			addIssue: function(aRecordIndex, aBtn) {				
				var me = this,
					rs = this.controlee['ER-view-grid'].getStore().getAt(aRecordIndex),
					ct = this.contexts[rs.get('P_Unit')], // Context to impersonate.
					co = Profile.Context.ContextID; // Original context.
									
				if (!ct) {
					alertMessage(Ext.String.format('Du saknar kontext för den här kliniken ({0})', rs.get('P_Unit')));
					return;
				}
				//TODO: maybe check first if there is any open issue on this patient?
				me.controlee['ER-view-grid'].disable();
				aBtn.disabled=true;
				Ext.Ajax.request({ url: '/stratum/api/authentication/context', method: 'PUT', // Switch to "issued" clinic's context ...
					withCredentials: true,
					jsonData: { Context: { ContextID: ct } },
					success: function(rr) {
						Ext.Ajax.request({ // ... add issue about potential error to the clinic ...
							url: '/stratum/api/registrations/form/2216',
							jsonData: {
								Subject: {
									SubjectKey: rs.get('SubjectKey')	
								},
								IssueDate: Ext.Date.format(new Date(), 'Y-m-d'),
								IssuingUser: Ext.String.format('{0} {1}', Profile.Context.User.FirstName, Profile.Context.User.LastName),
								IssueType: 9,
								IsClosedByReporter: false, 
								IsStarted: false,
								Description: '' 
									+ 'Vi har hittat ett eventuellt problem med en av era registreringar.\n'
									+ rs.get('ErrorType') + ' på ' + ['höger','vänster'][rs.get('P_Side')-1] + ' sida.'
									+ 'Vänligen kontrollera och åtgärda registreringen.\n'
									+ 'Mvh SHPR'								
							},
							callback: function () {
								Ext.Ajax.request({ url: '/stratum/api/authentication/context', method: 'PUT', // ... and finally go back to the original context.
									withCredentials: true,
									jsonData: { Context: { ContextID: co } },
									success: function() {
										me.controlee['ER-view-grid'].enable();									
										aBtn.value='Upplagd';
									}
								});
							}
						});
					}					
				});
			},

			onRender: function(aView) {
				this.controlee[aView.itemId] = aView;
			},
			onChange: function(aComponent, aValue) {
				var id = aComponent.itemId.split('-').pop();
					
				this.parameter[id] = aValue;
				this.controlee['ER-item-submit'].setDisabled(!this.parameter['year']);
				this.controlee['ER-view-grid'].getStore().removeAll();
				this.controlee['ER-item-summary'].setText('');
			}
		});
	}

	new Ext.panel.Panel({
		itemId: 'ER-view-input',
		cls: 'report-panel',
		renderTo: container,
		bodyPadding: 10,
		height: 120,
		border: true,
		layout: 'hbox',
		defaults: {
			labelAlign: 'top',
			style: 'margin-right: 10px'	
		},
		items: [{
			xtype: 'numberfield',
			itemId: 'ER-item-year',
			labelAlign: 'top',
			fieldLabel: 'År',
			width: 80,
			maxValue: new Date().getFullYear(),
			minValue: 1999
		}],
		dockedItems: [{
			xtype: 'toolbar',
			dock: 'bottom',
			items: [{
				itemId: 'ER-item-submit',
				text: 'Visa rapport',
				handler: function() {
					ER.controller.update();
				}
			}, 
			'-',
			{
				xtype: 'label',
				itemId: 'ER-item-summary',
				text: ''
			}]
		}]
	});

	new Ext.grid.Panel ({
		itemId: 'ER-view-grid',
		cls: 'report-grid',
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
				{ name: 'SubjectKey',		type: 'string' },
				{ name: 'P_Side',			type: 'int' },
				{ name: 'P_Unit',			type: 'int' },
				{ name: 'P_UnitName',		type: 'string',	calculate: function(aRecord) { return ER.controller.nameOfUnit(aRecord.P_Unit); } }, // Renderer can't be used since sorting will fail.
				{ name: 'P_SurgDate',		type: 'date' },
				{ name: 'EventID_Primary',	type: 'int' },
				{ name: 'ErrorType',		type: 'string' },
				{ name: 'ErrorNote',		type: 'string' }
			],
			sorters: [{
				property: 'P_SurgDate',
				direction: 'DESC'
			}],
		},
		viewConfig: {
			deferEmptyText: false,
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
			},/*{
				text: 'Sida',
				dataIndex: 'P_Side',
				width: 80,
				renderer: function(aValue) {
					switch(aValue) {
						case 1: return 'Höger'
						case 2: return 'Vänster'
					}
				}
  			},*/{
				text: 'Primär',
				xtype: 'datecolumn',
				dataIndex: 'P_SurgDate',
				format:'Y-m-d',
				width: 90
  			},{
				text: 'Klinik',
				dataIndex: 'P_UnitName',
				cellWrap: true,
				width: 160
  			},{
				text: 'Beskrivning',
				dataIndex: 'ErrorType',
				cellWrap: true,
				flex: 1,
				renderer: function(aValue, aConfig, aRecord) {
					return Ext.String.format(
						'<a href="#!event?id={1}"><strong style="color: #f44336">{0}</strong><br><small>{2}</small></a>', 
						aValue, 
						aRecord.get('EventID_Primary'), 
						aRecord.get('ErrorNote')
					);
				}
			},{
				text: 'Ärende?',
				dataIndex: null,
				width: 100,
				renderer: function(aValue, aConfig) {
					return Ext.String.format('<input type="button" onclick="setPointOfOrigin(this);ER.controller.addIssue({0},this)" value="Lägg upp">', aConfig.recordIndex)
				}
			}]
		}
	});

	ER.controller.start();

})();
//! Koordinatorns rapporter för att övervaka, kontrollera och rapportera misstänkta fel.
