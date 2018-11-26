(function() {

	var container = Stratum.containers && Stratum.containers['SHPR/Components'] || 'sw-rccontainer1';

	if (!Profile.Context) {
		Ext.get(container).createChild({ 
			cls: 'Closeable Warning alert alert-danger',
			html: '<div role="alert">Du behöver vara inloggad för att använda sidan.</div>' 
		});
		return;
	}

	Ext.util.CSS.removeStyleSheet('Components');
	Ext.util.CSS.createStyleSheet(
		'.component-grid .x-grid-row { height: 45px }' +
		'.component-grid .x-grid-td { vertical-align: middle }' +
		'.component-grid .x-grid-row a { color: #333; font-weight: 500 }' +
		'.component-grid .x-grid-header-ct { border-color: #e0e0e0 }' +
		'.component-grid .x-grid-body { border-color: #e0e0e0 }' +
		'.component-grid .x-toolbar-default { border: none !important; background-color: transparent }' +
		'.component-grid button { background-color: #7c7c7c; color: white; font-family: open_sans; font-size: 12px; border-radius: 4px; border: 1px solid #666; cursor: pointer }' +
		'.component-grid button:hover { background-color: #727272; }' +
		'.component-panel .x-panel-body { background: none; border: none }' +
		'.component-panel .type-group a { outline: none }' +
		'.component-panel .type-group .x-btn-inner-default-toolbar-small { color: #fff }' +
		'.component-panel .type-group .x-btn.x-btn-pressed { background-color: #aa3333 }' +
		'.component-panel .type-group .x-btn { background-color: #7c7c7c }' +
		'.component-panel .type-group .x-table-layout { border-spacing: 0 }' +
		'.component-panel .type-group .x-btn-default-toolbar-small { margin: 5px 0px 5px 10px; padding: 5px; width: 160px }' +
        '.component-panel .type-group { border: none; padding: 0 }' +
        '.component-panel .print-button, .component-panel .download-button {float: right; margin-left: 10px !important; }'+
		'.component-editor .link-button { border-color: transparent; background: none; }' +
		'.component-editor .link-button:hover { border-color: #f66; background-color: #fcc }' +
        '.component-editor .link-button .x-btn-inner { color: #666 }' +
		'',
		'Components'
	);
	
	function setDefaultValueForIsActiveCmp(aComponentList){
		for(var i=0; i<aComponentList[0].items.length; i++){				
				if(!aComponentList[0].items[i].items)
					continue;
				var c1=aComponentList[0].items[i];
				for(var j=0; j < c1.items.length; j++){					
					if(!c1.items[j].items)
						continue;
					var c2=c1.items[j];
					for(var k=0; k<c2.items.length; k++){						
						var c3=c2.items[k];
						if(c3.name=='S_IsActive' || c3.name=='C_IsActive'){							
							c3.checked=true;
						}
					}
				}
		}
	}

	function createComponentEditor(aComponentList, aRecordIndex) {		
		if(!Ext.isNumber(aRecordIndex))
			setDefaultValueForIsActiveCmp(aComponentList);
		return new Ext.window.Window({ 
			title: (Ext.isNumber(aRecordIndex) ? 'Redigera ' : 'Lägg till ') + CA.controller.currentType().name,
			renderTo: Ext.getBody(),
			animateTarget: document.activeElement,
			autoShow: true,
			modal: true,
			width: 710,
			bodyPadding: 30,
			frame: true,
			cls: 'component-editor',
			items: aComponentList,
			fbar: [{
				text: Ext.isNumber(aRecordIndex) ? 'Spara och stäng' : 'Spara ny komponent',
				handler: function() {
					var me = this,
						fw = this.up('window'),
						ok = true;
						dl = fw.query('[isField]{isDirty()}'),
						kv = fw.query('[isField]').reduce(function(o,f) { // Collect all fields as a key/value object.
							if (!f.isValid()) { // Also check for invalidity (ugly but useful side-effect ;-).
								ok = false;
								return o;
							}
							o[f.name] = f instanceof Ext.form.field.Date ? Ext.Date.format(f.value, f.format) : f.value;
							return o;
						},{});

					me.disable(); // Prevent double click.
					if (ok) {
						if (dl.length === 0) { // Nothing dirty, nothing to persist.
							fw.close();
						} else {
							CA.controller.persistComponent(aRecordIndex, kv, function() {
								if (Ext.isNumber(aRecordIndex)) {
									fw.close();
								} else {
									dl.forEach(function(f) {
										f.originalValue = f.value; // Undirty all fields.
									})
									Ext.Function.defer(function() {
										me.enable();
									}, 1000);
								}
							});
						}
					}
				}
			},
			' ',
			{
				xtype: 'button',
				text: 'Ta bort',
//				style: 'border-color: #999; background-color: #ccc',
				cls: 'link-button',
				hidden: !Ext.isNumber(aRecordIndex),
				handler: function() {
					var tc = CA.controller.currentType(),
						id = CA.controller.controlee['CA-view-grid'].getStore().getAt(aRecordIndex).get('EventID'),
						me = this,
						fw = this.up('window'),
						rl = [],
						nr = 0;

					// Search through all dependent variables to determine if component is used in any registrations.
					Ext.Array.each(tc.dependencies, function(dp) {
						nr += dp.names.length; // Number of calls/checks in total.
						Ext.Array.each(dp.names, function(vn) {
							Ext.Ajax.request({ 
								url: Ext.String.format('/stratum/api/registrations/form/{0}?query={1} eq {2}', dp.form, vn, id), 
								method: 'GET',
								withCredentials: true,
								success: function(rr) {
									rl = rl.concat(Ext.decode(rr.responseText).data); // Accumulate list of all registrations where component is used.
									if (!--nr) { // All calls finished?
										setPointOfOrigin(me);
										if (rl.length > 0) {
											alertMessage('Den aktuella komponenten förekommer i en eller flera registreringar och kan därför inte tas bort.');
											return;
										}
										replyMessage('Är du säker på att du vill ta bort komponenten? Åtgärden går inte att ångra.', function() {
											CA.controller.deleteComponent(aRecordIndex, function() {
												fw.close();
											});
										});
									}
								}
							});
						});
					});
				}
			},
			'->',
			{
				xtype: 'button',
				text: 'Stäng',
				hidden: Ext.isNumber(aRecordIndex),
				handler: function() {
					var fw = this.up('window'),
						dl = fw.query('[isField]{isDirty()}[name!=' + CA.controller.parameter.type + '_SubmitDate]');

					if (dl.length > 0) {
						setPointOfOrigin(this);
						replyMessage('Det finns ändringar gjorda i formuläret. Vill du stänga och kasta bort dessa?', function() {
							fw.close();
						})
					} else {
						fw.close();
					}
				}
			}],
			listeners: {
				show: function() {
					this.query('[isField]')[0].focus();
					this.query('[name*=SubmitDate][value=null]').forEach(function(f) { f.setValue(new Date()); }) // Initialize empty SubmitDate:s with current date.
				}
			}
		});
	}

	if (!Ext.ClassManager.isCreated('CA.controller')) {
		Ext.define('CA.controller', { 
			extend: 'Ext.app.Controller',
			singleton: true,
			
			control: {
				'[itemId^="CA-item"]': {
					change: 'onChange',
					afterrender: 'onRender'
				},
				'[itemId^="CA-view"]': {
					afterrender: 'onRender'
				}
			},
			
			constructor: function (aConfig) {
 				this.controlee = {}; // Map of ids to views.
 				this.parameter = {}; // Map of parameter names to values for api call or filtering.
 				this.contexts  = {}; // Map of units to contexts for current users loginable contexts (for impersonation).
				this.callParent(arguments);
			},

			start: function() {
				var me = this;
				
				me.loaded = false;
 				me.parameter = {};
 				me.contexts  = {};
 				me.types = {
 					'S': { form: 2233, name: 'Stam',				dependencies: [{ form: 1003, names: ['R_FemStem'] }, 				{ form: 1002, names: ['P_FemStem'] }] },
 					'C': { form: 2224, name: 'Cup',					dependencies: [{ form: 1003, names: ['R_AcetCup','R_AcetCup2'] },	{ form: 1002, names: ['P_AcetCup','P_AcetCup2'] }] },
 					'L': { form: 2230, name: 'Liner',				dependencies: [{ form: 1003, names: ['R_AcetLiner'] },				{ form: 1002, names: ['P_AcetLiner'] }] },
 					'H': { form: 2228, name: 'Caput',				dependencies: [{ form: 1003, names: ['R_FemCaput'] },				{ form: 1002, names: ['P_FemCaput'] }] },
 					'A': { form: 2223, name: 'Bi-/unipolär caput',	dependencies: [{ form: 1003, names: ['R_FemCaputBiUni'] },			{ form: 1002, names: ['P_FemCaputBiUni'] }] },
 					'D': { form: 2225, name: 'Distal stam',			dependencies: [{ form: 1003, names: ['R_FemStemDist'] },			{ form: 1002, names: ['P_FemStemDist'] }] },
 					'P': { form: 2232, name: 'Distal plugg',		dependencies: [{ form: 1003, names: ['R_FemCemPlugDist'] },			{ form: 1002, names: ['P_FemCemPlugDist'] }] },
 					'N': { form: 2231, name: 'Nacke',				dependencies: [{ form: 1003, names: ['R_FemStemNeck'] },			{ form: 1002, names: ['P_FemStemNeck'] }] },
 					'I': { form: 2229, name: 'Bipolär caputliner',	dependencies: [{ form: 1003, names: ['R_FemLinerBi'] },				{ form: 1002, names: ['P_FemLinerBi'] }] },
 					'F': { form: 2226, name: 'Förstärkningsring',	dependencies: [{ form: 1003, names: ['R_AcetAugRing'] }] },
 					'G': { form: 2227, name: 'Augment',				dependencies: [{ form: 1003, names: ['R_AcetAug1','R_AcetAug2'] }] }
 				}
				me.suppliers = new Ext.data.Store({
					autoLoad: true,
					model: 'Stratum.Unit',
					proxy: {
						type: 'ajax',
						url : '/stratum/api/metadata/units/register/149',
						reader: 'compactjson',
					},
					listeners: {
						load: function() {
							me.ready();
						}
					}
				});				
				Ext.Ajax.request({
					url: '/stratum/api/authentication/contexts', 
					method: 'GET',
					withCredentials: true,
					success: function(rr) {
						Ext.Array.each(Ext.decode(rr.responseText).data, function(cx) {
							if (cx.Unit.Register.RegisterID === 149) {
								me.contexts[cx.Unit.UnitID] = cx.ContextID;
							}
						});
					}
				});
			},
			ready: function() {
				this.loaded = true;
				this.controlee['CA-item-type'].focus();
			},
			update: function() {
				var me = this, 
					rs = this.controlee['CA-view-grid'].getStore();

				me.controlee['CA-item-filter'].setValue('');
				rs.clearFilter();
				rs.removeAll();
				var filters = rs.getFilters();
 			    function filterInactive (item) {
					 return  (Profile.Context && Profile.Context.Role.RoleName === 'Koordinator') || (item.data.S_IsActive===undefined && item.data.C_IsActive===undefined) || item.data.S_IsActive || item.data.C_IsActive;
				 }
				filters.add(filterInactive);
				Ext.suspendLayouts();
				rs.load({
					url: '/stratum/api/registrations/form/' + this.currentType().form,
					callback: function() {
						me.controlee['CA-view-grid'].reconfigure([{ 
							text: 'Artikelnummer',
							dataIndex: me.parameter.type + '_ArticleNumber',
							width: 150
						},{
							text: 'Beskrivning',
							dataIndex: me.parameter.type + '_Description',
							variableRowHeight: true,
							flex: 1,
							renderer: function(aValue, aConfig, aRecord) {
								return '<small style="color: #999">' + CA.controller.nameOfSupplier(aRecord.get('UnitID')) + '</small><br>' + aValue;
							}
						},{
							text: '',
							dataIndex: null,
                            width: (Profile.Context && Profile.Context.Role.RoleName == 'Koordinator')?100:0,
							renderer: function(aValue, aConfig) {
								return Ext.String.format('<button onclick="CA.controller.componentEditor({0})">Redigera</button>', aConfig.recordIndex)
							}
						}]);
						me.controlee['CA-item-summary'].setText(Ext.String.format('{0} komponenter totalt.', rs.count()));
						Ext.resumeLayouts(true);
					}
				})
			},
			currentType: function() {
				return this.types[this.parameter.type];
			},
			nameOfSupplier: function(aSupplierID) {
				return this.suppliers.getById(aSupplierID).get('UnitName');
			},
			componentEditor: function(aRecordIndex) {
				var me = this;

				Ext.Ajax.request({
					url: '/stratum/api/configurations/form/' + me.currentType().form,
					method: 'GET',
					withCredentials: true,
					success: function(rr) {
						var cr = me.controlee['CA-view-grid'].getStore().getAt(aRecordIndex),
							pd = Ext.decode(rr.responseText).data;						
						// Strip out unused configuration.
						Ext.Array.forEach(selectObjects(pd, 'isField'), function (xc) {
							var cv = cr && cr.get(xc.name);
							
							delete xc.listeners;
							delete xc.validator;
							delete xc.calculation;
							delete xc.control;
							switch (xc.xtype) { // Fill in values from current record.
								case 'datefield':
									xc.value = cv ? Repository.Global.Methods.ParseDate(cv): null;
									break;
								case 'filtercombo':
									xc.value = cv || cv === 0 ? cv.toString() : null;
									//xc.allowBlank = false;
									//xc.editable = false;
									break;
								case 'checkboxfield':
									xc.checked = cv;
									break;
								default:
									xc.value = cv; 
									break;
							}
						});
						pd[0].items.unshift({
							xtype: 'filtercombo',
							isField: true,
							fieldLabel: 'Leverantör:',
							labelAlign: 'top',
							name: 'UnitID',
							grow: true,
							disabled: Ext.isNumber(aRecordIndex), // Only enabled for new components.
							allowBlank: false,
							editable: false,
							store: me.suppliers,
							displayField: 'UnitName',
							valueField: 'UnitID',
							value: cr && cr.get('UnitID')
						});
						createComponentEditor(pd, aRecordIndex);
					}
				});
			},
			switchContext: function(aContext, aCallback) {
				Ext.Ajax.request({
					url: '/stratum/api/authentication/context', 
					method: 'PUT',
					withCredentials: true,
					jsonData: {
						Context: {
							ContextID: aContext
						}
					},
					failure: function() {
						alertMessage('Det gick inte att byta kontext. Försök igen senare.');
					},
					success: function() {
						aCallback();
					}
				});
			},
			persistComponent: function(aRecordIndex, aRecord, aCallback) {
				var me = this,
					ro = this.controlee['CA-view-grid'].getStore().getAt(aRecordIndex),
					cx = this.contexts[aRecord.UnitID || ro.get('UnitID')]; // Supplier context to impersonate.

				if (!cx) {
					alertMessage(Ext.String.format('Du saknar kontext för att spara komponenter från {0}.', me.nameOfSupplier(ro.get('UnitID'))));
					aCallback();
					return;
				}
				// Switch context to supplier ...
				me.switchContext(cx, function() {
					delete aRecord.UnitID; // UnitID is taken from current context and cannot be explicitly submitted on PUT or POST.
					Ext.Ajax.request({ 
						url: '/stratum/api/registrations/form/' + me.currentType().form + (ro ? '/' + ro.get('EventID') : ''),
						method: ro ? 'PUT' : 'POST',
						withCredentials: true,
						jsonData: aRecord, // Only altered data is submitted.
						callback: function () { // ... and finally switch back to users real context.
							me.switchContext(Profile.Context.ContextID, function() {
								aCallback();
								me.update();
							})
						}
					});
				})
			},
			deleteComponent: function(aRecordIndex, aCallback) {
				var me = this,
					ro = this.controlee['CA-view-grid'].getStore().getAt(aRecordIndex),
					id = ro.get('EventID'); 
					cx = this.contexts[ro.get('UnitID')]; // Supplier context to impersonate.
					
				me.switchContext(cx, function() {
					Ext.Ajax.request({ 
						url: Ext.String.format('/stratum/api/registrations/{0}', id), 
						method: 'DELETE',
						withCredentials: true,
						callback: function () {
							me.switchContext(Profile.Context.ContextID, function() {
								aCallback();
								me.update();
							})
						}
					})
				})
			},

			onRender: function(aView) {
				this.controlee[aView.itemId] = aView;
			},
			onChange: function(aComponent, aValue) {
				var id = aComponent.itemId.split('-').pop(),
					me = this,
					rs, v1, v2, qs;
					
					
				this.parameter[id] = aValue;
				if (id === 'type') {
					if (this.controlee['CA-item-type-' + aValue].pressed) {
						this.controlee['CA-item-append'].setText(Ext.String.format('Lägg till {0}', this.types[aValue].name.toLowerCase()));
						this.controlee['CA-item-filter'].setDisabled(false);
						this.controlee['CA-item-append'].setDisabled(false);
                        this.controlee['CA-view-grid'  ].setDisabled(false);
                        this.controlee['CA-items-print'].setDisabled(false);
                        this.controlee['CA-items-download'].setDisabled(false);
						this.update();
					} else {
						// All type buttons are depressed.
						this.controlee['CA-item-append'].setText('Lägg till');
						this.controlee['CA-item-filter'].setDisabled(true);
						this.controlee['CA-item-append'].setDisabled(true);
						this.controlee['CA-view-grid'  ].setDisabled(true);
						this.controlee['CA-view-grid'  ].getStore().removeAll();
					}
					return;
				}
				if (id === 'filter') {
					rs =  this.controlee['CA-view-grid'].getStore();
					rs.clearFilter();
					if (aValue.length > 0) {
						v1 = me.parameter.type + '_ArticleNumber';
						v2 = me.parameter.type + '_Description';
						qs = aValue.toLowerCase();
						rs.filterBy(function(aRecord) {
							return aRecord.get(v1).toLowerCase().indexOf(qs) >= 0 
								|| aRecord.get(v2).toLowerCase().indexOf(qs) >= 0 
								|| me.nameOfSupplier(aRecord.get('UnitID')).toLowerCase().indexOf(qs) >= 0;
						});
					}
					this.controlee['CA-item-summary'].setText(Ext.String.format('{0} komponenter i urvalet ({1} totalt).', 
						 rs.count(), 
						 rs.data.getSource().length
					));
					return;
				}
            },
            print:  function() {
				var components = this.controlee['CA-view-grid'].getStore().data.items;
				var prefix = this.parameter.type;
				html = '<!DOCTYPE html><html><head><style>body { -webkit-print-color-adjust: exact; } table { width: 100%; border-collapse: collapse; } th {text-align: left; border-bottom: 1px solid #ccc} tr:nth-child(even) {background-color: #EEE;} tr:nth-child(odd) {background-color: #FFF} td {border-bottom: 1px solid #ccc; padding: 5px;}</style></head><body><h1>Komponenttyp: ' + this.types[this.parameter.type].name + '</h1><table><tr><th>Artikelnummer</th><th>Beskrivning</th><th>Tillverkare</th></tr>';
				for(var item in components){
					var supplier = CA.controller.nameOfSupplier(components[item].get('UnitID'));
					html += '<tr><td>' + components[item].data[prefix + '_ArticleNumber'] + '</td><td>' + components[item].data[prefix + '_Description'] + '</td><td>' + supplier + '</td></tr>';
				}
				html += '</table></body></html>';
				var win = window.open('', 'Komponenter');
				win.document.write(html);
				win.document.close();
				win.focus();
				win.print();
				win.close();
            },
            download:  function() {
				var tag = Ext.ComponentQuery.query("#CA-items-download")[Ext.ComponentQuery.query("#CA-items-download").length-1].el.dom;
				if (!tag) return;
				
				var blob = new Blob([this.prepareContentForDownload()], { type: "text/html;charset=utf-8" });
				var url = URL.createObjectURL(blob);

				/* if IE print by way of msSaveBlob */
				if(window.navigator.msSaveBlob){
					window.navigator.msSaveBlob(blob, 'registreringar.csv');
				}
				/* If not we have to set an additional href attribute, that cant be set along 'download' because it confuses IE then. The tag is queried.*/
				else {
					tag.setAttribute('href', url);
				}
			},
			prepareContentForDownload: function() {
				var content = '';
				var components = this.controlee['CA-view-grid'].getStore().data.items;
				var prefix = this.parameter.type;
				content += 'Artikelnummer; Beskrivning; Tillverkare\n';
				for(var item in components){
					var supplier = CA.controller.nameOfSupplier(components[item].get('UnitID'));
					content += components[item].data[prefix + '_ArticleNumber'] + ';'; 
					content += components[item].data[prefix + '_Description']   + ';';
					content += supplier + '\n';
				}

				content = '\ufeff' + content;
				return content;
			}
		});
	}

	new Ext.panel.Panel({
		itemId: 'CA-view-input',
		cls: 'component-panel',
		renderTo: container,
		border: false,
		frame: false,
		layout: 'auto',
		defaults: {
			labelAlign: 'top',
			style: 'margin: 0 0 10px 0'
		},
		items: [{
			xtype: 'buttongroup',
			itemId: 'CA-item-type',
			cls: 'type-group',
			columns: 4,
			defaults: {
				enableToggle: true,
				toggleGroup: 'all',
				handler: function() {
					this.fireEvent('change', this.ownerCt, this.itemId.split('-').pop());
				}
			},
			items: [{
				itemId: 'CA-item-type-S',
				text: 'Stam'
			},{
				itemId: 'CA-item-type-C',
				text: 'Cup'
			},{
				itemId: 'CA-item-type-D',
				text: 'Distal stam'
			},{
				itemId: 'CA-item-type-A',
				text: 'Bi-/unipolär caput'
			},{
				itemId: 'CA-item-type-L',
				text: 'Liner'
			},{
				itemId: 'CA-item-type-H',
				text: 'Caput'
			},{
				itemId: 'CA-item-type-P',
				text: 'Distal plugg'
			},{
				itemId: 'CA-item-type-I',
				text: 'Bipolär caputliner'
			},{
				itemId: 'CA-item-type-N',
				text: 'Nacke'
			},{
				itemId: 'CA-item-type-F',
				text: 'Förstärkningsring'
			},{
				itemId: 'CA-item-type-G',
				text: 'Augment'
			}]
		},{
			xtype: 'textfield',
			itemId: 'CA-item-filter',
			emptyText: '(skriv minst två tecken om du vill filtrera listan nedan)',
			disabled: true,
			inputType: 'search',
			width: '100%',
			style: 'margin-bottom: 40px',
			checkChangeEvents: [],
			enableKeyEvents: true,
			listeners: {
				keyup: Ext.Function.createBuffered(function() {
					CA.controller.onChange(
						CA.controller.controlee['CA-item-filter'], 
						CA.controller.controlee['CA-item-filter'].getValue()
					)
				}, 500)
			}
		},{
			xtype: 'button',
			itemId: 'CA-item-append',
            text: 'Lägg till',
            hidden: !Profile.Context || Profile.Context.Role.RoleName != 'Koordinator',
			disabled: true,
			handler: function(aButton) {
				CA.controller.componentEditor();
			}
        },
        {
			xtype: 'button',
			itemId: 'CA-items-print',
            text: 'Skriv ut',
            cls: 'print-button',
			disabled: true,
			handler: function(aButton) {
				CA.controller.print();
			}
        },
        {
			xtype: 'button',
			itemId: 'CA-items-download',
			href: window.navigator.msSaveBlob?'':'komponent',
			autoEl: {
				tag: 'a',
				download: 'komponenter.csv'
			},
            text: 'Ladda ner',
            cls: 'download-button',
			disabled: true,
			handler: function(aButton) {
				CA.controller.download();
			}
		}]
	});

	new Ext.grid.Panel ({
		itemId: 'CA-view-grid',
		cls: 'component-grid',
		renderTo: container,
		width: '100%',
		height: 30+7*(45+1)+30-2,
		disabled: true,
		border: true,
		enableColumnHide: false,
		enableColumnMove: false,
		enableColumnResize: false,
		enableLocking: false,
		emptyText: '<div style="height: 100px; text-align: center"></div>',
		store: {
			proxy: {
				type: 'ajax',
				reader: 'compactjson'
			},
			fields: [
				{ name: 'EventID', type: 'string' }
			]
		},
		viewConfig: {
			deferEmptyText: false
		},
		columns: { // Just placeholders, real columns are set dynamically by CA.controller.update.
			defaults: {
				menuDisabled: false
			},
			items: [{ 
				text: 'Artikelnummer',
				width: 150
  			},{
				text: 'Beskrivning',
				flex: 1
			},{
				width: 100
			}]
		},
		dockedItems: [{
			xtype: 'toolbar',
			dock: 'bottom',
			items: [{
				xtype: 'label',
				itemId: 'CA-item-summary',
				height: 19
			}]
		}]
	});

	CA.controller.start();

})();
//! Administration av implantatkomponenter.
