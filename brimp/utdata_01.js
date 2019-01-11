
(function() {
	var unit = Profile.Context.Unit;
	var unitCode = unit.UnitCode;
	var unitName = unit.UnitName;
	// API account: Ronny
	Profile.APIKey = 'SJ9-63odWfc=';
	
	// Create the URL's to get data from the R-server, for a one year period
	var baseUrl = '/api/statistics/brimp/utdata_01?rinvoke=1&start_month={0}&end_month={1}&unitId={2}';
	var date1 = new Date();
	var date2 = new Date();
	date1.setFullYear(date1.getFullYear()-1);
	date2.setMonth(date2.getMonth()-1);
	var d1 = Ext.Date.format(date1, 'Y-m');
	var d2 = Ext.Date.format(date2, 'Y-m');
	var url1 = Ext.String.format(baseUrl, d1, d2, unitCode);

	// And the same period for the year before this
	date1.setFullYear(date1.getFullYear()-1);
	date2.setFullYear(date2.getFullYear()-1);
	d1 = Ext.Date.format(date1, 'Y-m');
	d2 = Ext.Date.format(date2, 'Y-m');
	var url2 = Ext.String.format(baseUrl, d1, d2, unitCode);
	
	Ext.fly('utdata').update('<p>Antal primäropererade patienter månadsvis (bara avslutade månader presenteras) för ' + unitName + '.</p>');
	Ext.Ajax.request({
		// async: false, // Om async, sätt flagga t ex 'success' som läses av vid nästföljande anrop
		url: url2,
		method: 'GET',
		success: function(response, opts) {
			var header = 'Antal primäropererade patienter';
			var oldData = Ext.decode(response.responseText).data;
			createChart(header, oldData);
		},
		failure: function(response, opts) {
			// TODO: Visa felmeddelande?
			console.log('server-side failure with code ' + response.status);
		}
	});

	var createChart = function(header, someData) {
		var chart1 = Ext.create('Ext.chart.CartesianChart', {
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
			store: {
				autoLoad: true,
				proxy: {
					type: 'ajax',
					url: url1,
					reader: 'objecttoarray'
				},
				fields: [
					{ name: 'date',			type: 'string', mapping: 'key' },
					{ name: 'dateFormatted',type: 'string',
						calculate: function(data) {
							var d = new Date(data.date);
							return Ext.Date.format(d, 'M-Y');
						}
					},
					{ name: 'unitCode',		type: 'int', 	mapping: 'value[1]' },
					{ name: 'unitQty',		type: 'int',	mapping: 'value[2]' },
					{ name: 'totalQty',		type: 'int',	mapping: 'value[3]' },
					{ name: 'totalShare',	type: 'float',	mapping: 'value[4]' },
					{ name: 'dateOld',		type: 'string',
						calculate: function(data) {
							//debugger;
							var d = new Date(data.date);
							d.setFullYear(d.getFullYear()-1);
							var key = Ext.Date.format(d, 'Y-m');
							return someData[key][0];
						}
					},
					{ name: 'dateFormattedOld',type: 'string',
						calculate: function(data) {
							var d = new Date(data.dateOld);
							return Ext.Date.format(d, 'M-Y');
						}
					},
					{ name: 'unitQtyOld',	type: 'int',
						calculate: function(data) {
							//debugger;
							return someData[data.dateOld][2];
						}
					},
					{ name: 'totalQtyOld',	type: 'int',	
						calculate: function(data) {
							return someData[data.dateOld][3];
						}
					},
					{ name: 'totalShareOld',type: 'float',	
						calculate: function(data) {
							return someData[data.dateOld][4];
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
				fields: ['unitQty','unitQtyOld'],
				title: 'Antal',
				grid: {
					stroke: '#ddd'
				},
				majorTicks: {
					unit: {
						fixes: 0
					}
				},
				minimum: 0,
				renderer: function(label, layout, lastLabel) {
					// Don't display decimal numbers
					return label % 1 === 0 ? label : '';
				}
			},{
				type: 'category',
				position: 'bottom',
				fields: ['dateFormatted'],
				label: {
					rotate: {
						degrees: 315
					}
				}
			}],
			series: [{
				type: 'bar',
				title: 'föregående period',
				xField: 'dateFormatted',
				yField: 'unitQtyOld',
				style: {
					scalingX: 0.5,
					translationX: -10,
					fillOpacity: 1
				},
				tooltip: {
					trackMouse: true,
					renderer: function(rec, item) {
						var text = Ext.String.format('{0}: {1} patienter ({2} av BRIMP)<br/> {3}: {4} patienter',
							rec.data.dateFormatted, rec.data.unitQty, Ext.util.Format.number(rec.data.totalShare, '0.0%'), 
							rec.data.dateFormattedOld, rec.data.unitQtyOld);
						this.setHtml(text);
					}
				}
			},{
				type: 'bar',
				title: 'senaste 12 månader',
				xField: 'dateFormatted',
				yField: 'unitQty',
				style: {
					scalingX: 0.5,
					translationX: 0,
					fillOpacity: 1
				},
				tooltip: {
					trackMouse: true,
					renderer: function(rec, item) {
						var text = Ext.String.format('{0}: {1} patienter ({2} av BRIMP)<br/> {3}: {4} patienter',
							rec.data.dateFormatted, rec.data.unitQty, Ext.util.Format.number(rec.data.totalShare, '0.0%'), 
							rec.data.dateFormattedOld, rec.data.unitQtyOld);
						this.setHtml(text);
					}
				}
			}]
		});
	};
})();

