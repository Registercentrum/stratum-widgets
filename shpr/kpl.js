(function() {

	var container = Stratum.containers && Stratum.containers['SHPR/KPL'] || 'sw-rccontainer1',
		apikey = 'MpuYxfbtp5I='
		colors = {
			total: '#c9c9c9',
			expected: '#42a5f5',
			observed: '#f44336',
		};

	function asColoredSymbol(aValue) {
		return Ext.String.format(
			'<span style="font: 30px fontawesome; color: {1}">{0}<strong style="color: #fff; position: absolute; left: 11px; top: 2px; font: 26px open_sans">{2}</strong></span>',
			['&#xf111;','&#xf111;','&#xf111;'][aValue-1],
			['#ff5722','#ffc107','#4caf50'][aValue-1],
			['&minus;','=','+'][aValue-1]
		);
	}

	function getPerformances(aValue, aRecord) {
		var no = aRecord.get('limit') || { lower: 0, upper: 100 },
			nr = no.upper-no.lower,
			ra;

		ra = [
			(aRecord.get('total')-no.lower)/nr,
			(aRecord.get('clinic')-no.lower)/nr,
			1,
			(aRecord.get('upper')-no.lower)/nr,
			(aRecord.get('lower')-no.lower)/nr
		];
//		console.log(aRecord.get('indicator'), ra);
		return ra;
	}

	function createSeparator() {
		return new Ext.Component({
			tag: 'hr',
			style: 'margin: 10px 0; border-top: 1px solid #eee'
		});
	}

	function createUnitSelector() {
		return Ext.Container({
			itemId: 'KPL-selector-source',
			width: '100%',
			border: false,
			layout: 'auto',
			items: [{
				xtype: 'filtercombo',
				itemId: 'KPL-selector-unit',
				fieldLabel: 'Klinik',
				grow: true,
				labelWidth: 120,
				pack: 'start',
				style: 'float: left; margin-right: 20px',
				displayField: 'UnitName',
				valueField: 'UnitCode',
				bubbleEvents: ['change'],
				store: Ext.create('Ext.data.Store', {
					autoLoad: true,
					proxy: {
						type: 'ajax',
						url: '/stratum/api/metadata/units/register/102?apikey=' + apikey,
						reader: {
							type: 'json',
							rootProperty: 'data'
						}
					},
					fields: [
						'UnitCode', 
						'UnitName'
					],
					sorters: [{
						property: 'UnitName'
					}],
					filters: [
						function(aUnit) {
							return aUnit.get('IsActive');
						}
					],
					listeners: {
						load: function(aStore) {
							aStore.removeAt(aStore.findExact('UnitCode', 999)); // Remove "Registercentrum".
							KPL.controller.done();
						}
					}
				})
			},{
				xtype: 'component',
				html: 'jämför med:',
				style: 'float: left; margin-right: 20px; margin-bottom: 0; margin-top: 2px'
			},{
				xtype: 'container',
				itemId: 'KPL-selector-comparison',
				layout: 'hbox',
				defaults: {
					xtype: 'radio',
					name: 'comparison',
					style: 'margin-right: 20px',
					bubbleEvents: ['change']
				},
				items: [{
					boxLabel: 'Riket',
					itemId: 'KPL-item-comparison-nation',
				},{
					boxLabel: 'Landstinget',
					itemId: 'KPL-item-comparison-county'
				}],
				listeners: {
					change: function(anItem, aValue) {
						if (aValue) { 
							this.fireEvent('modify', this, anItem.itemId.split('-').pop()); // Pass on to controller (if item is true).
						}
					},
				}
			}],
			listeners: {
				reset: function() {
					this.items.get('KPL-selector-comparison').items.get('KPL-item-comparison-nation').setValue(true);
					// Auto select unit in list if logged in to SHPR and not on "Registercentrum" unit.
					if (Profile.Context && Profile.Context.Unit.Register.RegisterID === 102 && Profile.Context.Unit.UnitCode < 900) {
						this.items.get('KPL-selector-unit').select(Profile.Context.Unit.UnitCode);
					}
				}
			}
		});
	}

	function createAgeSelector() {
		return new Ext.Container({ // Should be FieldContainer (with fieldLabel) but flex does not work there.
			width: '100%',
			layout: {
				type: 'hbox',
				align: 'middle'
			},
			items: [{
				xtype: 'slider',
				fieldLabel: 'Ålder',
				labelWidth: 120,
				flex: 1,
				minValue: 20,
				maxValue: 110,
				values: [null,null],
				increment: 5,
				listeners: {
					changecomplete: function() {
						var tf = this.up('container').down('textfield'),
							va = this.getValues();

						tf.setValue(Ext.String.format('{0}-{1}', va[0], va[1]));
					}
				}		
			},{
				xtype: 'textfield',
				itemId: 'KPL-selector-age',
				readOnly: true,
				width: 60,
				margin: '0 10 0 10',
				listeners: {
					reset: function() {
						var sc = this.up().down('slider');
						sc.setValue(0, sc.config.minValue, true);
						sc.setValue(1, sc.config.maxValue, true);
						sc.fireEvent('changecomplete');
					},
					common: function() { // Standard patient: age between 55 and 84,9 years.
						var sc = this.up().down('slider');
						sc.setValue(0, 55, true);
						sc.setValue(1, 85, true);
						sc.fireEvent('changecomplete');
					}
				}
			}]
		});
	}

	function createGenderSelector() {
		return new Ext.form.FieldContainer({
			itemId: 'KPL-selector-gender',
			fieldLabel: 'Kön',
			width: '100%',
			layout: 'hbox',
			defaults: {
				xtype: 'radio',
				width: 140,
				name: 'gender',
				bubbleEvents: ['change']
			},
			items: [{
				boxLabel: 'Samtliga',
				itemId: 'KPL-item-gender-all'
			},{
				boxLabel: 'Män',
				itemId: 'KPL-item-gender-1'
			},{
				boxLabel: 'Kvinnor',
				itemId: 'KPL-item-gender-2'
			}],
			listeners: {
				change: function(anItem, aValue) {
					if (aValue) {
						this.fireEvent('modify', this, anItem.itemId.split('-').pop());
					}
				},
				reset: function() {
					this.items.get('KPL-item-gender-all').setValue(true);
				}
			}
		});
	}

	function createDiagnosisSelector() {
		return new Stratum.FilterCombobox({
			itemId: 'KPL-selector-diagnosis',
			fieldLabel: 'Diagnos',
			grow: true,
			displayField: 'ValueName',
			valueField: 'ValueCode',
			value: 0,
			store: Ext.create('Ext.data.Store', {
				autoLoad: true,
				proxy: {
					type: 'ajax',
					url: '/stratum/api/metadata/domains/5914?apikey=' + apikey,
					reader: {
						type: 'json',
						rootProperty: 'data.DomainValues'
					}
				},
				fields: [
					'ValueCode', 
					'ValueName'
				],
				listeners: {
					load: function(aStore) {
						aStore.insert(0, { ValueCode: 'all', ValueName: 'Samtliga' });
						KPL.controller.done();
					}
				}
			}),
			listeners: {
				reset: function() {
					this.setValue('all');
				},
				common: function() { // Standard patient: diagnosis is primary arthrosis.
					this.setValue(1);
				}
			}
		});
	}

	function createFixationSelector() {
		return new Ext.form.FieldContainer({
			itemId: 'KPL-selector-fixation',
			fieldLabel: 'Fixationtyp',
			width: '100%',
			layout: 'hbox',
			defaults: {
				xtype: 'radio',
				width: 140,
				name: 'fixation',
				bubbleEvents: ['change']
			},
			items: [{
				boxLabel: 'Samtliga',
				itemId: 'KPL-item-fixation-all'
			},{
				boxLabel: 'Cementerad',
				itemId: 'KPL-item-fixation-1'
			},{
				boxLabel: 'Ocementerad',
				itemId: 'KPL-item-fixation-2'
			},{
				boxLabel: 'Hybrid (+omvänd)',
				itemId: 'KPL-item-fixation-3'
			}],
			listeners: {
				change: function(anItem, aValue) {
					if (aValue) {
						this.fireEvent('modify', this, anItem.itemId.split('-').pop());
					}
				},
				reset: function() {
					this.items.get('KPL-item-fixation-all').setValue(true);
				}
			}
		});
	}

	function createBMISelector() {
		return new Ext.Container({ // Should be FieldContainer (with fieldLabel) but flex does not work there.
			width: '100%',
			layout: {
				type: 'hbox',
				align: 'middle'
			},
			items: [{
				xtype: 'slider',
				fieldLabel: 'BMI',
				labelWidth: 120,
				flex: 1,
				minValue: 10, // To be set from data?
				maxValue: 50,
				values: [null,null],
				increment: 5,
				listeners: {
					changecomplete: function() {
						var tf = this.up('container').down('textfield'),
							va = this.getValues();

						tf.setValue(Ext.String.format('{0}-{1}', va[0], va[1]));
					}
				}		
			},{
				xtype: 'textfield',
				itemId: 'KPL-selector-bmi',
				readOnly: true,
				width: 60,
				margin: '0 10 0 10',
				listeners: {
					reset: function() {
						var sc = this.up().down('slider');
						sc.setValue(0, sc.config.minValue, true);
						sc.setValue(1, sc.config.maxValue, true);
						sc.fireEvent('changecomplete');
					},
					common: function() {  // Standard patient: BMI between 18.5 and 29.9.
						var sc = this.up().down('slider');
						sc.setValue(0, 20, true);
						sc.setValue(1, 30, true);
						sc.fireEvent('changecomplete');
					}
				}
			}]
		});
	}

	function createASASelector() {
		return new Ext.Container({ // Should be FieldContainer (with fieldLabel) but flex does not work there.
			width: '100%',
			layout: {
				type: 'hbox',
				align: 'middle'
			},
			items: [{
				xtype: 'slider',
				fieldLabel: 'ASA-grad',
				labelWidth: 120,
				flex: 1,
				minValue: 1,
				maxValue: 4,
				increment: 1,
				values: [null,null],
				listeners: {
					changecomplete: function() {
						var tf = this.up('container').down('textfield'),
							va = this.getValues();

						tf.setValue(Ext.String.format('{0}-{1}', va[0], va[1]));
					}
				}		
			},{
				xtype: 'textfield',
				itemId: 'KPL-selector-asa',
				readOnly: true,
				width: 60,
				margin: '0 10 0 10',
				listeners: {
					reset: function() {
						var sc = this.up().down('slider');
						sc.setValue(0, 1, true);
						sc.setValue(1, 4, true);
						sc.fireEvent('changecomplete');
					},
					common: function() { // Standard patient: ASA grade 1-2.
						var sc = this.up().down('slider');
						sc.setValue(0, 1, true); 
						sc.setValue(1, 2, true);
						sc.fireEvent('changecomplete');
					}
				}
			}]
		});
	}

	function createCharnleySelector() {
		return new Ext.Container({ // Should be FieldContainer (with fieldLabel) but flex does not work there.
			width: '100%',
			layout: {
				type: 'hbox',
				align: 'middle'
			},
			items: [{
				xtype: 'slider',
				fieldLabel: 'Charnley-klass',
				labelWidth: 120,
				flex: 1,
				minValue: 1,
				maxValue: 3,
				increment: 1,
				values: [null,null],
				useTips: true,
				tipText: function(aThumb) {
					return String.fromCharCode(65 + aThumb.value-1);
				},
				listeners: {
					changecomplete: function() {
						var tf = this.up('container').down('textfield'),
							va = this.getValues();

						tf.setValue(Ext.String.format('{0}-{1}', String.fromCharCode(65 + va[0]-1), String.fromCharCode(65 + va[1]-1)));
					}
				}		
			},{
				xtype: 'textfield',
				itemId: 'KPL-selector-charnley',
				readOnly: true,
				width: 60,
				margin: '0 10 0 10',
				listeners: {
					reset: function() {
						var sc = this.up().down('slider');
						sc.setValue(0, 1, true);
						sc.setValue(1, 3, true);
						sc.fireEvent('changecomplete');
					}
				}
			}]
		});
	}

	function createTrendChart(aContainer, aValueList) {
		var ro = {};

		// Calculate min, max to set range on axes.
		aValueList.forEach(function(o) { 
			ro.upper = Math.max(o.total, ro.upper || o.total, o.observed, ro.upper || o.observed); 
			ro.lower = Math.min(o.total, ro.lower || o.total, o.observed, ro.lower || o.observed); 
		});
		ro.delta = (ro.upper-ro.lower)/4;
		return new Ext.chart.CartesianChart({
			id: Ext.id(), // Makes purging of orphans work in Stratum/ExtJS (strange getBoundingClientRect errors otherwise).
			renderTo: aContainer,
			width: '100%',
			height: 200,
			insetPadding: 20,
			interactions: 'itemhighlight',
			border: false,
			background: 'none',
			bodyStyle: {
				background: 'none'
			},
			store: new Ext.data.Store({
				data: aValueList,
				fields: [
					{ name: 'year',		type: 'int'   },
					{ name: 'clinic',	type: 'float' },
					{ name: 'total',	type: 'float' }
				]
			}),
			axes: [{
				type: 'numeric',
				position: 'left',
				fields: ['observed','expected','total'],
				minimum: ro.lower-ro.delta, // Looks best (will never know why).
				maximum: ro.upper+ro.delta,
				increment: ro.delta
			}, {
				type: 'category',
				position: 'bottom',
				fields: 'year'
			}],
			series: [{
				type: 'line',
				xField: 'year',
				yField: 'total',
				colors: [colors.total],
				marker: true,
				style: {
                    lineWidth: 2
                }
			},{
				type: 'line',
				xField: 'year',
				yField: 'expected',
				colors: [colors.expected],
				marker: true,
				style: {
                    lineWidth: 2
                }
			},{
				type: 'line',
				xField: 'year',
				yField: 'observed',
				colors: [colors.observed],
				marker: true,
				style: {
					opacity: 0.7,
                    lineWidth: 2
                }
			}]
		});
	}

	// Split ranges into separate attributes, ie asa=1-2 becomes asa_lower=1 and asa_upper=2.
	function splitRange(anObject, aLimit) {
		var sa;

		if (anObject[aLimit]) {
			sa = anObject[aLimit].split('-');
			anObject[aLimit + '_lower'] = sa[0];
			anObject[aLimit + '_upper'] = sa[1];
			delete anObject[aLimit];
		}
	};

	Ext.util.CSS.removeStyleSheet('kpl-indicators');
	Ext.util.CSS.createStyleSheet(
		'.indicator-panel { width: 100%; margin-bottom: 20px; border-width: 0 }' +
		'.indicator-panel .x-panel-body { border-width: 0 }' +
		'.indicator-panel .x-toolbar { border-width: 0 }' +
		'.indicator-panel .brand-button { background-color: #aa3333; }' +
		'.indicator-panel .brand-button:hover { background-color: #992e2e; }' +
		'.indicator-panel .brand-button .x-btn-inner-default-toolbar-small { color: #fff }' +
		'.indicator-grid { width: 100% }' +
		'.indicator-grid .x-grid-row { height: 60px }' +
		'.indicator-grid .x-grid-td { vertical-align: middle }' +
		'.indicator-grid .x-grid-cell-first { vertical-align: baseline; padding-top: 18px }' +
		'.indicator-grid .x-grid-header-ct { border-color: #e0e0e0 }' +
		'.indicator-grid .x-grid-body { border-color: #e0e0e0 }' +
		'.indicator-grid .x-grid-rowbody { padding: 20px }' +
		'.indicator-grid .x-grid-row-expander-spacer { border-top: none; border-left: none; border-bottom: none;  }' +
		'.indicator-grid .detail-table { border-collapse: collapse; margin-right: 10px; }' +
		'.indicator-grid .detail-table th { border: 1px dotted #ccc; padding: 10px; text-align: left; background-color: #e0e0e0; font-weight: 500; }' +
		'.indicator-grid .detail-table td { border: 1px dotted #ccc; padding: 10px; text-align: left; background-color: #ffffff }' +
		'',
		'kpl-indicators'
	);

	if (Ext.ClassManager.isCreated('KPL.controller')) {
		KPL.controller.reset();
	} else {
		Ext.define('KPL.controller', {
			extend: 'Ext.app.Controller',
			singleton: true,
			
			control: {
				'[itemId^="KPL-selector"]': {
					change: 'onSelectorChange',
					modify: 'onSelectorChange' // New event for FieldContainer (since it lacks change event).
				},
				'[itemId^="KPL-toolbar"]': { 
					click: 'onButtonClick'
				},
				'[itemId^="KPL-view"]': {
					boxready: 'onViewReady'
				}
			},
			
			constructor: function(aConfig) {
//				this.throttle = Ext.Function.createBuffered(function() { // To prevent unnecessary api calls due to  rapid changes in selectors.
//					this.load(); 
//				}, 300, this),
				this.controlee = {};	// List of controlled views.
				this.parameters	= {};	// Accumulated parameters for statistics api call.
				this.captions = {};		// Display texts from selectors.
				this.count = 0;			// Count of asynchronous calls done (used during initialization). 

				this.callParent(arguments);
			},

			preset: function(aPreset) { // Set selectors to a preset ("all data" or "common patient").
				this.selection = aPreset;
				this.controlee['KPL-view-panel'].query('[itemId^="KPL-selector"]').forEach(function(aSelector) { 
					aSelector.fireEvent(aPreset);
				});
			},
			start: function() { // Reset selectors and refresh grid (ie. start application).
				var sp = this.controlee['KPL-view-panel'],
					rb = sp.down('#KPL-toolbar-reset-selection'),
					sb = sp.down('#KPL-toolbar-submit');
				
				if (!Profile.Context || Profile.Context.Unit.Register.RegisterID !== 102 || Profile.Context.Unit.UnitCode > 900) {
					rb.fireEvent('click', rb);
					sp.setTitle('<i>Börja med att välja klinik ...</i>');
					sp.expand(0);
					sp.down('#KPL-selector-unit').focus();
					this.ready = true;
					return;
				}
				this.ready = false;
				rb.fireEvent('click', rb); // Reset selectors.
				sb.fireEvent('click', sb); // Perform selection and call api.
			},
			reset: function() {
				this.parameters	= {};
				this.captions = {};
				this.count = 0;
			},
			load: function() { // Load new indicator data and refresh grid.
				this.controlee['KPL-view-panel'].collapse();
				this.controlee['KPL-view-grid'].getView().getNodes().forEach(function(aRow) {
					KPL.controller.controlee['KPL-view-grid'].getView().fireEvent('collapsebody', aRow);
				});
				splitRange(this.parameters, 'age');
				splitRange(this.parameters, 'bmi');
				splitRange(this.parameters, 'asa');
				splitRange(this.parameters, 'charnley');
				Ext.data.StoreManager.lookup('KPL-store').removeAll();
				this.controlee['KPL-view-grid'].el.select('.x-grid-empty').setVisible(false); // Hide grid empty text when loading indicator is visible.
				Ext.data.StoreManager.lookup('KPL-store').load({
					params: KPL.controller.parameters,
					callback: function() {
						KPL.controller.controlee['KPL-view-grid'].el.select('.x-grid-empty').setVisible(true);
						KPL.controller.ready = true;
					}
				});
			},
			done: function() { // Called by selector stores when finished loading.
				this.count++;
				if (this.count === 2) { 
					this.start(); // Start rest of application when all essential data are loaded.
				}
			},
			
			onViewReady: function(aComponent) {
				this.controlee[aComponent.itemId] = aComponent;
			},
			onButtonClick: function(aComponent) {
				switch (aComponent.itemId) {
					case 'KPL-toolbar-reset-selection':
						this.ready = false;
						this.preset('reset');
						break;
					case 'KPL-toolbar-ordinary-patient':
						/*
							Ålder		55-84.9
							BMI			18.5-29.9
							ASA			1-2
							Diagnos		Primär artros
						*/
						this.ready = false;
						this.preset('reset');
						this.preset('common');
						break;
					case 'KPL-toolbar-submit':
						if (!this.parameters.unit) {
							setPointOfOrigin(this.controlee['KPL-view-panel'].down('#KPL-selector-unit').inputEl);
							alertMessage('Välj först den klinik du vill se statistik för.');
							return;
						}
						switch (this.selection) { // Current selection in selector panel (all, common, other)
							case 'reset':
								this.controlee['KPL-view-panel'].setTitle('Visar all data för ' + this.captions['unit']);
								break;
							case 'common':
								this.controlee['KPL-view-panel'].setTitle('Visar ”den vanlige patienten” för ' + this.captions['unit']);
								break;
							case 'other':
								this.controlee['KPL-view-panel'].setTitle('Visar eget urval för ' + this.captions['unit']);
								break;
						}
						this.load();
						break;
				}
			},
			onSelectorChange: function(aComponent, aValue) {
				var id = aComponent.itemId.split('-').pop();

				//console.log(id, aValue);
				if (id === 'unit' && !this.parameters.unit) {
					this.controlee['KPL-view-panel'].setTitle('<i>Klicka nu på knappen ”Visa statistik” ...</i>');
					this.controlee['KPL-view-panel'].down('#KPL-toolbar-submit').el.highlight('#ff9', { iterations: 1, duration: 700 }); //.frame('#fc3');
					/*
					this.controlee['KPL-view-panel'].down('#KPL-toolbar-submit').el.move('l', 50, {
						duration: 300,
						easing: 'bounceIn',
						callback: function(ao) {
							ao.target.target.move('r', 50, {
								duration: 300, 
								easing: 'bounceOut'
							});
						}
					});
					*/
				}
				switch (id) {
					case 'charnley': // Need to convert A-C to 1-3 etc.
						this.parameters[id] = aValue.replace(/[A-C]/g, function(aCharacter) { return aCharacter.charCodeAt(0)-64; });
						break;
					default:
						this.parameters[id] = aValue;
						break;
				}
				if (aComponent.getDisplayValue) {
					this.captions[id] = aComponent.getDisplayValue();
				}
				if (this.ready) { // Only listen to change events when user is changing selectors directly.
					if (id !== 'unit') { // Changing unit is not considered a tailored selection.
						this.selection = 'other';
					}
//					this.throttle();
				}
			}
		});
	}
			
	new Ext.data.Store({
		storeId: 'KPL-store',
		proxy: {
			type: 'ajax',
			url: '/stratum/api/statistics/shpr/kpl-indicators?apikey=' + apikey,
			reader: {
				type: 'json',
				rootProperty: 'data'
			}
		},
		fields: [
			{ name: 'indicator',	type: 'string'	},
			{ name: 'tagline',		type: 'string'	},
			{ name: 'description',	type: 'string'	},
			{ name: 'achievement',	type: 'string',	convert: asColoredSymbol },
			{ name: 'performances',	type: 'auto',   convert: getPerformances },
			{ name: 'clinic',		type: 'number' },
			{ name: 'total',		type: 'number' },
			{ name: 'upper',		type: 'number' },
			{ name: 'lower',		type: 'number' },
			{ name: 'trend',		type: 'auto' }
		]
	});

	new Ext.panel.Panel({
		itemId: 'KPL-view-panel',
		layout: 'auto',
		cls: 'indicator-panel',
		renderTo: container,
		title: '<img style="height: 16px" src="/stratum/Images/ImageLoaderRectangle.gif">',
		collapsible: true,
		collapsed: true,
		titleCollapse: true,
		border: false,
		frame: false,
		bodyPadding: 15,
		defaults: {
			labelAlign: 'left',
			labelWidth: 120
		},
		items: [
			createUnitSelector(),
			createSeparator(),
			createAgeSelector(),
			createSeparator(),
			createGenderSelector(),
			createSeparator(),
			createDiagnosisSelector(),
			createSeparator(),
			createFixationSelector(),
			createSeparator(),
			createBMISelector(),
			createSeparator(),
			createASASelector(),
			createSeparator(),
			createCharnleySelector()
		],
		dockedItems: [{
			xtype: 'toolbar',
			dock: 'bottom',
//			defaultButtonUI: 'default',
			items: [{
				itemId: 'KPL-toolbar-reset-selection',
				text: 'Välj allt'
			},{
				itemId: 'KPL-toolbar-ordinary-patient',
				text: 'Välj ”den vanlige patienten”'
			},
			'->',
			{
				itemId: 'KPL-toolbar-submit',
				text: 'Visa statistik',
				cls: 'brand-button'
			}]
		}]
    });

	new Ext.grid.Panel ({
		itemId: 'KPL-view-grid',
		renderTo: container,
		cls: 'indicator-grid',
		border: true,
		enableColumnHide: false,
		enableColumnMove: false,
		enableColumnResize: false,
		enableLocking: false,
		emptyText: '<div style="height: 60px; text-align: center; margin-top: 20px"><i>inga data finns för aktuellt urval</i></div>',
		store: Ext.data.StoreManager.lookup('KPL-store'),	
		viewConfig: {
			markDirty: false,
			stripeRows: false,
			deferEmptyText: false,
			listeners: {
				expandbody: function(aRowNode, aRecord) {
					// Create chart upon expanding detail view.
					createTrendChart(aRowNode.querySelector('section'), aRecord.get('trend'));
				},
				collapsebody: function(aRowNode) {
					// Charts has to be destroyed manually since ExtJS lose track when mixing html and components (charts are in <section>s).
					purgeOrphans(aRowNode.querySelector('section'));
				}
			}
		}, 	
		plugins: [{
			ptype: 'rowexpander',
			rowBodyTpl: new Ext.XTemplate(
				'<p><i>{description}</i></p>',
				'<br>',
				'<strong>Aktuella indikator- och målvärden</strong>',
				'<p><small><i>I tabellen visas aktuella indikatorvärden, målvärde och andel patienter på kliniken som når målet.<br>',
				'För indikatorvärdena betyder {[this.interval(0, values)]} under målet, mellan {[this.interval(1, values)]} &quot;på väg mot målet&quot; och över {[this.interval(2, values)]} når målet.</i></small></p>',
				'<table class="detail-table" style="width: 100%">',
					'<tr>',
						'<th>Klinikens värde</th>',
						'<th>{[this.comparison()]}s värde</th>',
						'<th>Målvärde</th>',
						'<th>Når målet</th>',
					'</tr>',
					'<tr>',
						'<td>{clinic:this.number}</td>',
						'<td>{total:this.number}</td>',
						'<td>{upper:this.number}</td>',
						'<td>?</td>',
					'</tr>',
				'</table>',
				'<br>',
				'<br>',
				'<strong>Trend över tid de senaste fem åren</strong>',
				'<p><small>',
					'{[this.bullet("total")]} = {[this.comparison().toLowerCase()]}s värde, ',
					'{[this.bullet("observed")]} = klinikens observerade värde',
					'<tpl if="this.expectancy(trend)">',
						', {[this.bullet("expected")]} = klinikens förväntade värde.',
					'</tpl>',
				'</small></p>',
				'<section></section>',
				'<br>',
				{
					number: function(v) {
						 return Ext.util.Format.number(v, v < 1 ? "0.000" : "0.0");
					},
					comparison: function() {
						return { 'nation': 'Riket', 'county': 'Landstinget' }[KPL.controller.parameters.comparison];
					},
					interval: function(aLevel, anObject) {
						switch (aLevel) {
							case 0: return Ext.String.format('<b>{0}</b>', this.number(anObject.lower));
							case 1: return Ext.String.format('<b>{0}&nbsp;&ndash;&nbsp;{1}</b>', this.number(anObject.lower), this.number(anObject.upper));
							case 2:	return Ext.String.format('<b>{0}</b>', this.number(anObject.upper));
						}
					},
					bullet: function(aValueType) {
						return Ext.String.format('<span style="font: 10px fontawesome; color: {0}">&#xf111;</span>', colors[aValueType]);
					},
					expectancy: function(aTrend) {
						return Ext.Array.some(aTrend, function(o) { return o.expected; });
					}
				}
			)
		}],
		columns: {
			defaults: {
				menuDisabled: true,
				sortable: false
			},
			items: [{ 
				text: ' ',
				dataIndex: 'achievement',
				width: 40
			},{
				text: 'Indikator',
				dataIndex: 'indicator',
				cellWrap: true,
				flex: 3,
				renderer: function(aValue, aMetaData, aRecord) {
					return '<strong>' + aValue + '</strong><br><small>' + aRecord.get('tagline') + '</small>';
				}
			},{
				text: 'Utfall',
				tooltip: Ext.String.htmlEncode('Den här kolumnen visar klinikens resultat i förhållande till riket eller landstinget och uppsatta målvärden (se nedan för beskrvning av ”Bullet graph”).'),
				dataIndex: 'performances',
				xtype: 'widgetcolumn',
				flex: 1,
				widget: {
					xtype: 'sparklinebullet',
					disableHighlight: true,
					highlightLighten: '1.0',
					rangeColors: ['#c8e6c9','#ffe0b2','#ffcdd2'], /*['hsla(120, 100%, 50%, 0.3)', 'hsla(60, 100%, 50%, 0.3)', 'hsla(0, 100%, 50%, 0.3)'],*/
					targetWidth: 5,
					targetColor: '#bdbdbd',
					performanceColor: '#f44336', //'#42a5f5',
					height: 30,
					width:  '100%',
					tipTpl: new Ext.XTemplate(
						'{region:this.labelize} {[this.reformat(values)]}', 
						{
							labelize: function(v) {
								if (!this.comparison) {
									 this.comparison = { 'nation': 'Rikets', 'county': 'Landstingets' }[KPL.controller.parameters.comparison];
								}
								switch (v) {
									case 't0': return this.comparison + ' värde';
									case 'p1': return 'Klinikens värde';
									case 'r2': return 'Övre målområde';
									case 'r3': return 'Mellanliggande målområde';
									case 'r4': return 'Undre målområde';
								}
							},
							reformat: function(v) {
								switch (v.fieldkey) {
									case 'r': return '';
									default : return Ext.String.format('({0})', Ext.util.Format.number(v.value, "0.0"));
								}
							}
						}
					)
				}
			}]
		},
		listeners: {
			beforedestroy: function() {
				// Make sure to purge grid to avoid errors due to dangling components (in GetBoundingClientRect).
				KPL.controller.controlee['KPL-view-grid'].getView().getNodes().forEach(function(aRow) {
					KPL.controller.controlee['KPL-view-grid'].getView().fireEvent('collapsebody', aRow);
				});
			}
		}
	});

}());
//! Statistikverktyg för att få "koll på läget".
