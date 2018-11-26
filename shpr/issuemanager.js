(function() {

	var container = Stratum.containers && Stratum.containers['SHPR/IssueManager'] || 'sw-rccontainer1';

	Ext.util.CSS.removeStyleSheet('issue-manager');
	Ext.util.CSS.createStyleSheet(
		'.issue-grid { margin-bottom: 2em }' +
		'.issue-grid .x-grid-row a { color: #333; font-weight: 500 }' +
		'.issue-grid .x-grid-td { vertical-align: middle }' +
		'.issue-grid .x-grid-cell-first {  }' +
		'.issue-grid .x-grid-header-ct { border-color: #e0e0e0 }' +
		'.issue-grid .x-grid-body { border-color: #e0e0e0 }' +
		'',
		'issue-manager'
	);

	if (!Ext.ClassManager.isCreated('IM.controller')) {
		Ext.define('Stratum.Issue', {
			extend: 'Stratum.Registration',
			fields: [
				{ name: 'IssueDate',			type: 'date'	},
				{ name: 'IssueType',			type: 'int'		},
				{ name: 'Description',			type: 'string'	},
				{ name: 'IsStarted',			type: 'boolean' },
				{ name: 'IsClosedByReporter',	type: 'boolean' },
				{ name: 'IsClosedFinally',		type: 'boolean' },
				{ name: 'Replies', 				type: 'auto', 	persist: false	} // Fetched by separate call.
			],
			proxy: {
				type: 'rest',
				reader: 'compactjson',
				writer: 'compactjson',
				api: {
					create: '/stratum/api/registrations/form/2216',
					update: '/stratum/api/registrations'
				}
			}
		});

		Ext.define('IM.controller', { 
			extend: 'Ext.app.Controller',
			singleton: true,
			
			control: { // Not used as of now (see SHPR/KPL for a proper example).
				'[itemId^="IM-selector"]': {
					change: 'onSelectorChange',
					modify: 'onSelectorChange' 
				},
				'[itemId^="IM-view"]': {
					boxready: 'onViewReady'
				}
			},
			
			constructor: function (aConfig) {
				this.controlee  = {}; // List of controlled views.
				this.parameters = {}; // Accumulated parameters for api call.
				this.callParent(arguments);
			},

			start: function() {
				var st = Ext.data.StoreManager.lookup('IM-store');
				
				this.loaded = false;
				// Registrator sees issues that is not closed by reporter, coordinator sees issues that is not finally closed.
				st.load({ 
					url: '/stratum/api/registrations/form/2216?query=' + 
						(IM.controller.userIsCoordinator() 
							? 'IsClosedFinally eq false' 
							: 'IsClosedByReporter eq false'),
					callback: function() { 
						// Get corresponding replies for each issue with registration history since when cannot get child items in registration api (yet).
						st.each(function(aModel) {
							if(IM.controller.userIsCoordinator()) return;	//TODO:temporary performance related fix						
							var id = aModel.get('EventID');

							Ext.Ajax.request({ 
								url: '/stratum/api/overview/history/' + aModel.get('Subject').SubjectKey, 
								success: function(rt) {
									var ro = Ext.decode(rt.responseText).data,
										rl;
										
									rl = Ext.Array.filter(ro.History.IssueReply.Registrations, function(aReply) {
										return aReply.ParentEventID === id;
									});
									rl = rl.sort(function(a1st, a2nd) {
										if (a1st.ModifiedAt < a2nd.ModifiedAt) return -1;
										if (a1st.ModifiedAt > a2nd.ModifiedAt) return +1;
										return 0;
									});
									aModel.set('Replies', rl);
								}
							});
						})
					}
				});
			},
			ready: function() {
				this.loaded = true;
			},
			suspend: function(aCallback) {
				var st = Ext.data.StoreManager.lookup('IM-store');

				st.clearFilter(true);
			},
			persist: function(aCallback) {
				var st = Ext.data.StoreManager.lookup('IM-store');
				
				st.sync({
					success: function(aBatch) {
						st.filter(IM.controller.userIsCoordinator() ? 'IsClosedFinally' : 'IsClosedByReporter', false); // Hides the newly closed issue.
					},
					failure: function() {
						st.reload();
						setPointOfOrigin(IM.controller.controlee['IM-view-grid']);
						alertMessage('Det uppstod ett problem då ärendet skulle sparas. Kontrollera att du fortfarande är inloggad och försök igen.')
					}
				});
			},
			userIsCoordinator: function() {
				return !!(Profile.Context && Profile.Context.Role.RoleID === 903);
			},
			
			onViewReady: function(aView) {
				this.controlee[aView.itemId] = aView;
			},
			onSelectorChange: function(aComponent, aValue) {
				var id = aComponent.itemId.split('-').pop();

				if (this.loaded) { // Don´t listen to change events until initial api call has returned (ie. store is loaded).
					this.parameters[id] = aValue;
				}
			}
		});
	}

	new Ext.data.Store({
		storeId: 'IM-store',
		model: 'Stratum.Issue',
		autoLoad: false,
		listeners: {
			load: function() {
				IM.controller.ready();
			}
		}
	});

	new Ext.grid.Panel ({
		itemId: 'IM-view-grid',
		renderTo: container,
		store: Ext.data.StoreManager.lookup('IM-store'),	
		width: '100%',
		cls: 'issue-grid',
		border: true,
		enableColumnHide: false,
		enableColumnMove: false,
		enableColumnResize: false,
		enableLocking: false,
		emptyText: 'Du har inga pågående ärenden',
		viewConfig: {
			markDirty: false
		},
		columns: {
			defaults: {
				menuDisabled: true
			},
			items: [{ 
				text: ' ',
				dataIndex: 'Subject',
				width: 30,
				tooltip: 
					 '<div style=\'padding: 10px; line-height: 2em\'>'
						+'<span style=\'font: 16px fontawesome; color: #ff5722\'>&#xf111;</span> = Nytt ärende.<br>'
						+'<span style=\'font: 16px fontawesome; color: #ffc107\'>&#xf111;</span> = Ärendet påbörjat av koordinator.<br>'
						+'<span style=\'font: 16px fontawesome; color: #4caf50\'>&#xf111;</span> = Ärendet avslutat av koordinator.<br>'
					+'</div>',
				sortable: false,
				renderer: function(aValue, aMeta, aRecord) {
					var cs = +(aRecord.get('IsClosedFinally') || aRecord.get('IsClosedByReporter')) + +aRecord.get('IsStarted'); // Since true=1, false=0
					return Ext.String.format(
						'<span title="{2}" style="font: 20px fontawesome; color: {1}">{0}</span>',
						['&#xf111;','&#xf111;','&#xf111;'][cs],
						['#ff5722','#ffc107','#4caf50'][cs],
						['Nytt ärende','Ärende påbörjat av koordinator','Ärende avslutat av koordinator'][cs]
					);
				}			
  			},{
				text: 'Ärende',
				dataIndex: 'IssueDate',
//				tooltip: 'Ärenden och tillhörande svar. Senaste ärendet överst. Klicka för att sortera omvänt.',
				cellWrap: true,
				variableRowHeight: true,
				flex: 3,
				renderer: function(aValue, aMetaData, aRecord) {
					var rl = aRecord.get('Replies'),
						tt;
						
					tt = Ext.String.format(
						'<b><a href="#!subject?key={0}">{1}' + (IM.controller.userIsCoordinator() ? ' för {5}' : '') + '</a></b><br><small><a href="#!event?id={2}">{3}: {4}</a></small>', 
						Repository.Global.Methods.EncryptNIN ? Repository.Global.Methods.EncryptNIN(aRecord.get('Subject').SubjectKey) : aRecord.get('Subject').SubjectKey, 
						aRecord.get('Subject').SubjectKey, 
						aRecord.get('EventID'), 
						Ext.Date.format(Repository.Global.Methods.ParseDate(aRecord.get('InsertedAt')), 'Y-m-d H:i'), 
						aRecord.get('Description'),
						aRecord.get('Unit') ? aRecord.get('Unit').UnitName : Profile.Context.Unit.UnitName
					);
					if (rl) {
						Ext.Array.forEach(rl, function(cr) {
							tt += Ext.String.format('<div style="margin: 10px; padding: 10px; background-color: #fffde7; border: 1px solid #fff59d"><small>{0}: {1}</small></div>',
								Ext.Date.format(Repository.Global.Methods.ParseDate(cr.InsertedAt), 'Y-m-d H:i'), 
								cr.Reply
							);
						});
					}
					return tt;
				}
			},{
				text: 'Påbörjat',
				xtype: 'checkcolumn',
				hidden: !IM.controller.userIsCoordinator(),
				tooltip: Ext.String.htmlEncode('Ärendet påbörjat av koordinatorn.'),
				dataIndex: 'IsStarted',
				width: 90,
				listeners: {
					beforecheckchange: function(aColumn, anRowIndex, isChecked) {
						IM.controller.suspend(); // To prevent item from being filtered out of store before animation has ended.
					},
					checkchange: function(aColumn, anRowIndex, isChecked) {
						Ext.get(aColumn.getView().getRow(anRowIndex)).highlight('#fee', {
							duration: 300,
							listeners: {
								afteranimate: IM.controller.persist
							}
						});
					}
				}
			},{
				text: 'Stängt',
				xtype: 'checkcolumn',
				tooltip: Ext.String.htmlEncode('Kryssa i här om du som rapporterat ärendet vill markera det som avslutat (då försvinner det från din lista).'),
				dataIndex: 'IsClosedByReporter',
				width: 90,
				listeners: {
					beforecheckchange: function(aColumn, anRowIndex, isChecked) {
						IM.controller.suspend();
					},
					checkchange: function(aColumn, anRowIndex, isChecked) {
						Ext.get(aColumn.getView().getRow(anRowIndex)).highlight('#fee', {
							duration: 300,
							listeners: {
								afteranimate: IM.controller.persist
							}
						});
					}
				}
			},{
				text: 'Avslutat',
				xtype: 'checkcolumn',
				hidden: !IM.controller.userIsCoordinator(),
				tooltip: Ext.String.htmlEncode('Ärendet avslutat av koordinatorn.'),
				dataIndex: 'IsClosedFinally',
				width: 90,
				listeners: {
					beforecheckchange: function(aColumn, anRowIndex, isChecked) {
						IM.controller.suspend();
					},
					checkchange: function(aColumn, anRowIndex, isChecked) {
						var cr = Ext.data.StoreManager.lookup('IM-store').getAt(anRowIndex);
								
						if (!cr.get('IsStarted')) {
							 cr.set('IsStarted', true); // Autostart issue to be closed.
						}
						Ext.get(aColumn.getView().getRow(anRowIndex)).highlight('#fee', {
							duration: 300,
							listeners: {
								afteranimate: IM.controller.persist
							}
						});
					}
				}
			}]
		}
	});

	IM.controller.start();

}());
//! Hantering av pågående ärenden.
