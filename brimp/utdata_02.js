
(function() {
	var unit = Profile.Context.Unit;
	var unitCode = unit.UnitCode;
	var unitName = unit.UnitName;
	// API account: Ronny
	Profile.APIKey = 'SJ9-63odWfc=';
	
	// Create the URL's to get data from the R-server, for last year and the year before that
	var baseUrl = '/api/statistics/brimp/utdata_02?rinvoke=1&start_year={0}&end_year={1}&unitId={2}';
	var date1 = new Date();
	var date2 = new Date();
	date1.setFullYear(date1.getFullYear()-1);
	date2.setFullYear(date2.getFullYear()-2);
	var d1 = Ext.Date.format(date1, 'Y');
	var d2 = Ext.Date.format(date2, 'Y');
	var url1 = Ext.String.format(baseUrl, d1, d1, unitCode);
	var url2 = Ext.String.format(baseUrl, d2, d2, unitCode);
	
	Ext.fly('utdata').update('<p>Antal insatta implantat/expander per år och per tillverkare (en stapel per år och aktuella tillverkare för kliniken) för ' + unitName + '.</p>');
	Ext.Ajax.request({
		url: url2,
		method: 'GET',
		success: function(response, opts) {
			var header = 'Antal insatta implantat per tillverkare vid primäroperation';
			var oldData = Ext.decode(response.responseText).data;
			createChart(header, oldData);
		},
		failure: function(response, opts) {
			// TODO: Visa felmeddelande?
			console.log('server-side failure with code ' + response.status);
		}
	});

	var createChart = function(header, someData) {
		var chart1 = Ext.create('Ext.chart.Chart', {
			renderTo: 'utdata', 
			width: '100%',
			height: 400,
			insetPadding: 30,
			animation: false,
			border: false,
			colors: ['#AFA0C4', '#614D7D'],
			background: '#fff',
			title: header,
			style: {
				borderWidth: '1px',
				borderColor: '#ddd',
				borderStyle: 'solid',
				opacity: 0
			},
			/* Användes i R-tester-scriptet, behövs?
			plugins: {
				ptype: 'chartitemevents'
			},
			*/
			store: {
				autoLoad: true,
				proxy: {
					type: 'ajax',
					url: url1,
					reader: 'objecttoarray'
				},
				fields: [
					{ name: 'key',			type: 'string',	mapping: 'key' },
					{ name: 'year',			type: 'int', 	mapping: 'value[0]' },
					{ name: 'manufactorer',	type: 'string', mapping: 'value[1]' },
					{ name: 'manuOld', type: 'string', 
						calculate: function(data) {
							// TEMPORARY trial of decoding, change in axis and series too!
							return Ext.util.Format.htmlEncode(data.manufactorer);
						}
					},
					{ name: 'unitCode',		type: 'int', 	mapping: 'value[2]' },
					{ name: 'manuQty',		type: 'int',	mapping: 'value[3]' },
					{ name: 'totalQty',		type: 'int',	mapping: 'value[4]' },
					{ name: 'totalShare',	type: 'float',	mapping: 'value[5]' },
					{ name: 'keyOld',		type: 'string',
						calculate: function(data) {
							return (data.year-1) + '-' + data.manufactorer;
						}
					},
					{ name: 'yearOld',		type: 'int',
						calculate: function(data) {
							return someData[data.keyOld][0];
						}
					},
					{ name: 'manuQtyOld',	type: 'int',
						calculate: function(data) {
							return someData[data.keyOld][3];
						}
					},
					{ name: 'totalQtyOld',	type: 'int',	
						calculate: function(data) {
							return someData[data.keyOld][4];
						}
					},
					{ name: 'totalShareOld',type: 'float',	
						calculate: function(data) {
							return someData[data.keyOld][5];
						}
					}
				],
				listeners: {
					beforeload: function() {
						spin('utdata', 'Hämtar underlag', 310, 170);
					},
					load: function(aStore, aList) {
						unspin();
						chart1.setAnimation(true);
						chart1.animate({
							duration: 500,
							from:	{ opacity: 0 },
							to:		{ opacity: 1 }
						});
					}
				}
			},
			legend: {
				position: 'bottom',
				toggleable: false
			},
			axes: [{
				type: 'numeric',
				position: 'left',
				fields: ['manuQty','manuQtyOld'],
				title: 'Antal',
				grid: {
					stroke: '#ddd'
				},
				minimum: 0,
				renderer: function(axis, label, layout, lastLabel) {
					// Don't display decimal numbers
					return label % 1 === 0 ? label : '';
				}
			},{
				type: 'category',
				position: 'bottom',
				fields: ['manufactorer'],
				label: {
					rotate: {
						degrees: 315
					}
				}
			}],
			series: [{
				type: 'bar',
				title: d2,
				xField: 'manufactorer',
				yField: 'manuQtyOld',
				style: {
					scalingX: 0.5,
					translationX: -10,
					fillOpacity: 0.7
				},
				tooltip: {
					trackMouse: true,
					renderer: function(tooltip, rec, item) {
						var text = Ext.String.format('{0}: {1} implantat ({2} av BRIMP)<br/>{3}: {4} implantat',
							rec.data.year, rec.data.manuQty, Ext.util.Format.number(rec.data.totalShare, '0.0%'),
							rec.data.yearOld, rec.data.manuQtyOld);
						tooltip.setHtml(text);
					}
				}
			},{
				type: 'bar',
				title: d1,
				xField: 'manufactorer',
				yField: 'manuQty',
				style: {
					scalingX: 0.5,
					translationX: 0,
					fillOpacity: 1
				},
				tooltip: {
					trackMouse: true,
					renderer: function(tooltip, rec, item) {
						var text = Ext.String.format('{0}: {1} implantat ({2} av BRIMP)<br/>{3}: {4} implantat',
							rec.data.year, rec.data.manuQty, Ext.util.Format.number(rec.data.totalShare, '0.0%'), 
							rec.data.yearOld, rec.data.manuQtyOld);
						tooltip.setHtml(text);
					}
				}
			}]
		});
	};
})();
