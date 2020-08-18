
"use strict";
Ext.util.CSS.createStyleSheet(
	'.HeatGrid table { border-collapse: collapse; overflow: hidden; } '+
	'.HeatGrid .x-grid-row .x-grid-cell { border-color: #aaa; } '+
	//'.HeatGrid .x-grid-cell-first { background-color: #eee; }'+
	'.HeatGrid .x-grid-cell-inner { white-space: normal; }'
);

var mappedDomains = null;
Ext.util.CSS.createStyleSheet('@media print { #sidebarPanel { display: none; } }')

Ext.Ajax.request({
		url: 'stratum/api/metadata/domains/map/4148,4000,4205',
		method: 'get',
		success: function (md) {
			mappedDomains = Ext.decode(md.responseText).data;
			start();
		},
		failure: function() {
			Ext.create('Ext.container.Container', {
				renderTo: 'ProfileContainer',
				cls: 'Closeable Warning',
				html: 'Fel vid inläsning av domäner.'
			});
		}
});

function start () {
	var	db = Profile.Models, store;
	var eventExists = false;
	if (db.History.Visit.Registrations.length !== 0) {
		for (var i=0; i<db.History.Visit.Registrations.length; i++) {
			if (db.History.Visit.Registrations[i].AsthmaDiagnosis == 1) {
				eventExists = true;
				break;
			}
		};
	}
	if (!eventExists) {
		Ext.create('Ext.container.Container', {
			renderTo: 'ProfileContainer',
			cls: 'Closeable Message',
			html: 'Patienten saknar registreringar.'
		});
		return;
	}

	function getPatientProfileValues(store) {
		var local = Repository.Local.Methods;
		var	h = Profile.Models.History;
		var a = [];
		a[0] = new Array('Smoking');
		a[0].push('Röker');
		a[1] = new Array('FEV1PercentAfter');
		a[1].push('Lungfunktion, % (FEV1)');
		a[2] = new Array('Weight');
		a[2].push('Vikt, kg');
		a[3] = new Array('Height');
		a[3].push('Längd, cm');
		a[4] = new Array('BodyMassIndex');
		a[4].push('BMI');
		a[5] = new Array('AllergyDiagnosis');
		a[5].push('Allergi, överkänslighet');
		a[6] = new Array('AKT');
		a[6].push('ACT-skala <sup>1</sup>');
		a[7] = new Array('NumberExacerbation10');
		a[7].push('Antal försämringstillfällen <sup>2</sup>');
		
		var fields = [];
		fields.push({name: 'indicator', type: 'string'});
		fields.push({name: 'title', type: 'string'});

		Ext.Array.forEach(h.Visit.Registrations, function(rc) {
			var value;
			var tval;
			var d = rc.VisitDate.substr(0, 10);
			fields.push({name: d, type: 'string'});
			value = Ext.isEmpty(rc.Smoking) ? '' : mappedDomains['CurrentSmokingHabits'][rc.Smoking];
			a[0].push(value);
			value = Ext.isEmpty(rc.FEV1PercentAfter) ? '' : rc.FEV1PercentAfter.toString().replace('.',',');
			a[1].push(value);
			value = Ext.isEmpty(rc.Weight) ? '' : rc.Weight.toString().replace('.',',');
			a[2].push(value);
			value = Ext.isEmpty(rc.Height) ? '' : rc.Height;
			a[3].push(value);
			value = Ext.isEmpty(rc.BodyMassIndex) ? '' : rc.BodyMassIndex.toString().replace('.',',');
			a[4].push(value);
			value = Ext.isEmpty(rc.AllergyDiagnosis) ? '' : mappedDomains['YesNo'][rc.AllergyDiagnosis];
			a[5].push(value);
			tval = rc.AKT > 19 ? 'Kontrollerad' : 'Okontrollerad';
			value = Ext.isEmpty(rc.AKT) ? '' : tval;
			a[6].push(value);
			value = Ext.isEmpty(rc.NumberExacerbation10) ? '' : rc.NumberExacerbation10;
			a[7].push(value);
		});
		// Update the user model with all fields.
		//PatientProfileModel.setFields(fields);
		store.setFields(fields);
		return a;
	}

	typeof PatientProfileModel === 'undefined' && Ext.define('PatientProfileModel', {
		extend: 'Ext.data.Model'
	});

	store = Ext.create('Ext.data.Store', {
		storeId:'PatientProfileStore',
		model: 'PatientProfileModel'
	});

	store.loadData(getPatientProfileValues(store));

	function createGrid() { 
		return Ext.create('Ext.grid.Panel', {
			renderTo: 'ProfileContainer',
			store: Ext.data.StoreManager.lookup('PatientProfileStore'),
			columns: [
				{ header: '', dataIndex: 'title', locked: true, width: 196, sortable: false, hideable: false }
				//,{ header: '', dataIndex: 'indicator', width: 0, hidden: true, hideable: false }
			],
			viewConfig: {
				stripeRows: false,
				disableSelection: true
			},
			cls: 'HeatGrid',
			width: 640,
			columnLines: true,
			rowLines: true,
			enableColumnHide: true,
			enableColumnMove: false,
			enableColumnResize: false,
			border: true,
			ui: 'plain',
			listeners: {
				/*
				viewready: function() {
					var r = Repository.Local.database.History.Visit.Registrations;
					var c = this.columns[r.length];
					var p = c.getPosition();
					this.scrollByDeltaX(p[0], true);
				},
				*/
				afterrender: function() {
					var rc = Profile.Models.History.Visit.Registrations;
					var len = 0;
					for (var i=0; i<rc.length; i++) {
						if (rc[i].AsthmaDiagnosis == 1) {
							len++;
						}
					}
					var flexLength = len>3 ? 0 : 1;
					
					for (var i=0; i<rc.length; i++) {
						if (rc[i].AsthmaDiagnosis != 1) {
							continue;
						}
						var d = rc[i].VisitDate.substr(0, 10);
						var column = Ext.create('Ext.grid.column.Column', { header: d, dataIndex: d, flex: flexLength, width: 148, sortable: false, renderer: indicatorTip, menuDisabled: true });
						var me = this.normalGrid;							// Horizontal scroll with legacy column is not working, That's why "normalGrid" is using.
						me.headerCt.insert(me.columns.length, column);
						//this.headerCt.insert(this.columns.length, column);
					};
				}
			}
		});
	};

	function createFooter() {
		return Ext.create('Ext.panel.Panel', {
			renderTo: 'ProfileContainer',
			bodyPadding: '20 0 0 0',
			border: false,
			width: 640,
			items: [{
				xtype: 'button',
				text: 'Skriv ut',
				width: 70,
				//iconCls: 'icon-print',
				handler : function() {
					window.print();
					//printProfile();
				}
			},{
				xtype: 'container',
				html:  '<br><sup>1)</sup> Enligt Astmakontrolltest (ACT). Kontrollerad om >19, annars Okontrollerad.<br><sup>2)</sup> Antal akuta försämringstillfällen senaste året.'
			}]
		});
	};
	createHeader();
	var grid = createGrid();
	Ext.Function.defer(function() {
		var c = grid.columns[grid.columns.length-1];
		var p = c.getPosition();
		grid.scrollByDeltaX(p[0], true);
		grid.show();
	}, 100);
	createFooter();

	// -----------
	// Print
	// -----------
	Ext.util.CSS.createStyleSheet(
		'.print-profile { background-color: #fff; }' +
		'.print-header-profile { background-color: #e5f1f2; background-image: url(Handlers/ResourceManager.ashx?ID=30350); background-repeat:no-repeat; background-position: 200px; }'
	);
	function createHeaderPanel() {
		return Ext.create ('Ext.container.Container', {
			layout: 'auto',
			height: 120,
			baseCls: 'print-header-profile',
			renderTo: 'ProfileContainer'
		});
	}
	function printProfile () {
		var headerlogo = createHeaderPanel();
		var header = createHeader();
		var grid = createGrid();
		var footer = createFooter();
		var rc = Profile.Models.History.Visit.Registrations;
		var len = 0;
		for (var i=0; i<rc.length; i++) {
			if (rc[i].AsthmaDiagnosis == 1) {
				len++;
			}
		}
		var w = 190 + len*150 + 2;					// Calculate constant for appropriate width...
		w = Ext.min([190 + 8*150 + 2, w]);			// ...but not to large. Display max 8 columns. It works in landscape.

		headerlogo.setWidth(Ext.max([640, w]));
		footer.items.items[0].destroy();			// Remove print button.

		grid.setWidth(w);
		Ext.Function.defer(function() {
			var c = grid.columns[grid.columns.length-1];
			var p = c.getPosition();
			grid.scrollByDeltaX(p[0], true);
			grid.show();
		}, 100);
		
		if (!Ext.isEmpty(Profile.Person)) {
			header.items.add(
				new Ext.Container({ html: Profile.Person.FirstName + ' ' + Profile.Person.LastName + ', ' + Profile.Person.SocialNumber + '<br><br>' })
			);
		};
		var w = Ext.create('Ext.window.Window', {
			height: '100%',
			width: '101%',	// Should be 100%(?)
			y: 0,			// Top position
			bodyPadding: '20px 100px',
			baseCls: 'print-profile',
			modal: true,
			items: [
				headerlogo,
				header,
				grid,
				footer,
				{
					xtype: 'container',
					style: 'padding: 10px'
				},{
					xtype: 'button',
					text: 'Skriv ut',
					style: 'padding: 4px',
					width: 70,
					//tooltip: 'Tips! Välj att skriva ut med bakgrundsfärger och -bilder för bättre utskrift.',
					//iconCls: 'icon-print',
					handler : function() {
						if (w.items.items[7]) w.items.items[7].hide();
						if (w.items.items[6]) w.items.items[6].hide();
						if (w.items.items[5]) w.items.items[5].hide();
						window.print();
						w.items.items[5].show();
						w.items.items[6].show();
						w.items.items[7].show();
					}
				},{
					xtype: 'button',
					text: 'Avbryt',
					style: 'padding: 4px',
					width: 70,
					handler : function() {
						w.close();
					}
				},{
					xtype: 'label',
					html: '<br><br><p style="font-size:10px;">Tips! Välj att skriva ut med bakgrundsfärger och -bilder för bättre utskrift.</p>'
				}
			]
		});
		w.show();
	}

	function indicatorTip(aValue, aMeta, aRecord, aCellY, aCellX, aStore, aView) {
		aMeta.tdAttr = 'data-qtip="' + aValue + '"';
		return aValue; 
	}

	function createHeader() { 
		return Ext.create('Ext.panel.Panel', {
			renderTo: 'ProfileContainer',
			border: false,
			width: 640,
			items: {
				xtype: 'container',
				html:  '<h1>Astma - Patientens värden över tid</h1>'
			}
		});
	}
};
