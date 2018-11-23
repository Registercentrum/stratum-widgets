
function request(aRequestor) {
	var sm = !aRequestor.origins, // Simple mode (no collection to iterate)
		ep = aRequestor.url.match(/\{\s*([\.-\w]+)\s*\}/),
		ll = sm ? 1 : aRequestor.origins.length,
		cr = 0,  // Request counter
		ra = [], // Final response object array
		af,	ic;

	if (ep && ep.length > 1) {
		af = Ext.JSON.decode('{ accessor: function(xl,xi) { return xl[xi].' + ep[1] + ' } }').accessor; // Accessor function for current list item.
	}
	for (ic = 0; ic < ll; ic++) {
		cr++;
		Ext.Ajax.request({
			url: sm || !af ? aRequestor.url : aRequestor.url.replace(ep[0], af(aRequestor.origins, ic)), 
			method: 'get',
			success: function (anIndex, aResponse) {
				var rp = aResponse && aResponse.responseText && Ext.decode(aResponse.responseText).data,
					ro;

				if (sm) {
					aRequestor.finally && aRequestor.finally(rp);
				} else {
					ro = { 
						origin: aRequestor.origins[anIndex], 
						result: rp 
					}
					aRequestor.partial && aRequestor.partial(ro);
					ra.push(ro);
					if (--cr === 0) {
						aRequestor.finally && aRequestor.finally(ra);
					}
				}
			}.bind(undefined, ic)
		});
	}
}

function normalize(anOverviewList) { // Normalize list of overview objects into a 12-month vector.
	var dt = new Date(),
		mc = dt.getMonth() === 11 ? 1 : dt.getMonth()+2, 
		yc = mc === 1 ? dt.getFullYear() : dt.getFullYear()-1, 
		ra = [],
		io = 0,
		ix, rc, cc, tc;

	for (ix = 0; ix < 12; ix++) {
		if (!rc) {
			 rc = anOverviewList[io++];
		}
		cc = 0;
		tc = 0;
		if (rc && rc.Year === yc && rc.Month === mc) {
			cc = rc.Count;
			tc = rc.Transfers || 0; 
			rc = null;
		}
		ra.push({
			Year:  yc,
			Month: mc,
			Count: cc-tc,
			Transfers: tc 
		});
		if (mc === 12) {
			mc = 1;
			yc = yc+1;
		} else {
			mc = mc+1;
		}
	}
	return ra;
}

function stampOfLatest(aOverviewList) {
	var ml = aOverviewList.length > 0 && aOverviewList[aOverviewList.length-1];

	if (!ml) {
		return '<i style="color: #ccc">(ingen data)</i>';
	}
	return ml.Year + '-' + ('00' + ml.Month).slice(-2);
}

function descriptives(aOverviewList) {
	var cc = 0, 
		ct = 0, 
		ix, oc;

	for (ix = 0; ix < aOverviewList.length; ix++) {
		oc = aOverviewList[ix];
		cc = cc + oc.Count;
		ct = ct + oc.Transfers;
	}
//	return Ext.String.format('{0} ({1}%)', cc, cc ? Math.round(100*ct/cc) : 0);
	return {
		total: cc, 
		transfers: cc ? Math.round(100*ct/cc) : 0
	}
}

Ext.create('Ext.data.Store', {
	storeId: 'transfersPerMonthStore',
	autoLoad: true,
	fields: [
		{ name: 'id',			type: 'int' 					},
		{ name: 'UnitName',		type: 'string'					},
		{ name: 'Latest',		type: 'string'					},
		{ name: 'Total',		type: 'int',	allowNull: true },
		{ name: 'Transfers',	type: 'string' 					},
		{ name: 'Monthlies',	type: 'auto' 					}
	],
	sorters: 'UnitName',
	listeners: {
		load: function(aStore) {
			request({
				url: 'api/metadata/contexts/user/91943', // All contexts (and their units) for Olof at Medrave.
				finally: function(aContextList) {
					aStore.add(Ext.Array.map(aContextList, function (anItem) {
						return { 
							id: anItem.Unit.UnitID, 
							UnitName: anItem.Unit.UnitName,
							Latest: '<img src="Images/ImageLoaderBar.gif" style="height: 5px" />'
						}
					}));
					request({
						url: '/api/overview/monthly/lvr?unit={Unit.UnitCode}', 
						origins: aContextList, 
						partial: function(aResponse) {
							var es = aStore.getById(aResponse.origin.Unit.UnitID),
								ds = descriptives(aResponse.result);

							es.set('Latest', stampOfLatest(aResponse.result));
							es.set('Total', ds.total);
							es.set('Transfers', ds.transfers + '%');
							es.set('Monthlies', normalize(aResponse.result));
						},
						finally: function(anOverviewList) {
							//aStore.endUpdate();
						}
					});
				}
			});
		}
	}
});

Ext.create('Ext.grid.Panel', {
    renderTo: 'WidgetContainer',
	width: '100%',
	border: true,
	store: Ext.data.StoreManager.lookup('transfersPerMonthStore'),	
	viewConfig:{
		markDirty:false
	}, 	
	plugins: [{
		ptype: 'rowexpander',
		rowBodyTpl: new Ext.XTemplate(
			'<tpl><div>{GenericScript}</div></tpl>'
		)
	}],
	columns: [{ 
		text: 'Vårdenhet',
		dataIndex: 'UnitName',
		menuDisabled: true,
		flex: 1
	},{
		text: 'Senaste',
		dataIndex: 'Latest',
		tooltip: 'År och månad för när den senaste registreringen gjorts.',
		menuDisabled: true,
		width: 100
	},{
		text: 'Antal',
		dataIndex: 'Total',
		tooltip: 'Antal registreringar utförda senaste året.',
		menuDisabled: true,
		align: 'right',
		width: 80
	},{
		text: 'Överförda',
		dataIndex: 'Transfers',
		tooltip: 'Andel registreringar under senaste året som är direktöverförda.',
		menuDisabled: true,
		align: 'right',
		width: 90
	},{
		text: 'Översikt',
		dataIndex: 'Monthlies',
		xtype: 'widgetcolumn',
		menuDisabled: true,
		sortable: false,
		width: 70,
		widget: {
			xtype: 'sparklinebar',
			html: 'TEST'
		}
	}]
});

/*
function createXAxis() {
	return {
		type: 'Numeric',
		position: 'left',
		fields: ['Count', 'Transfers'],
		label: {
			font: '11px Georgia',
			renderer: Ext.util.Format.numberRenderer('0,0')
		}
	};
}
		
function createYAxis() {
	return {
		type: 'Category',
		position: 'bottom',
		fields: ['Month'],
		label: {
			font: '11px Georgia',
			renderer: function(v) {
				return ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec'][v-1];
			}
		}
	};
}
		
function createChart(aUnitCode) {
	return Ext.widget('chart', { 
		width: '100%',
		height: 50,
		animation: false,
		shadow: false,
		theme: 'StratumGeneric',
		insetPadding: 5,
		renderTo: 'uc' + aUnitCode,
		plugins: {
			ptype: 'chartitemevents'
		},
		store: {
			storeId: 'chartStore' + aUnitCode,
			autoLoad: true,
			fields: [
				{ name: 'Year',			type: 'int' },
				{ name: 'Month',		type: 'int' }, 
				{ name: 'Count',		type: 'int' },
				{ name: 'Transfers',	type: 'int' }
			],
			listeners: {
				load: function(aStore) {
					Ext.Ajax.request({
						url: '/api/overview/monthly/lvr?unit=' + aUnitCode,
						method: 'get',
						success: function(aResponse) { // Normalize response into a 12-month vector.
							var rl = Ext.decode(aResponse.responseText).data, 
								dt = new Date(),
								mc = dt.getMonth() === 11 ? 1 : dt.getMonth()+2, 
								yc = mc === 1 ? dt.getFullYear() : dt.getFullYear()-1, 
								ix, rc, cc, tc;
							for (ix = 0; ix < 12; ix++) {
								if (!rc) {
									 rc = rl.shift();
								}
								cc = 0;
								tc = 0;
								if (rc && rc.Year === yc && rc.Month === mc) {
									cc = rc.Count;
									tc = rc.Transfers || 0; 
									rc = null;
								}
								aStore.add({
									Year:  yc,
									Month: mc,
									Count: cc-tc,
									Transfers: tc 
								});
								if (mc === 12) {
									mc = 1;
									yc = yc+1;
								} else {
									mc = mc+1;
								}
							}
						}
					});
				}
			}
		},
		series: [{
			type: 'bar',
			xField: 'Year',
			yField: ['Count', 'Transfers'],
			stacked: true,
			tips: {
				trackMouse: true,
				renderer: function (storeItem, item) {
					this.setTitle(storeItem.get('Count') + ' registreringar totalt.');
				}
			}
			listeners: {
				itemmouseover: function(a,anEvent) {
		console.log(anEvent);
		return;
					this.axes.add(createXAxis());
					this.axes.add(createYAxis());
					this.el.parent().animate({ to: { height: 300 } });
					this.setHeight(300);
				},
				itemmouseout: function(a,anEvent) {
		console.log(anEvent);
		return;
					this.axes.clear();
					this.surface.removeAll();
					this.el.parent().animate({ to: { height: 50 } });
					this.setHeight(50);
				}
			}
		}],
	});
}

if (!Ext.isDefined(Ext.chart.theme.StratumGeneric)) {
	Ext.define('Ext.chart.theme.StratumGeneric', {
		extend: 'Ext.chart.theme.Base',
		alias: 'chart.theme.StratumGeneric',
		config: {
			colors: ['#F2B134', '#ED553B', '#4FB99F', '#112F41']
		},
		constructor: function(aConfig) {
			this.callParent([Ext.apply(this.config, aConfig)]);
		}
	});
}

Ext.create('Ext.data.Store', {
	storeId: 'unitStore',
	autoLoad: true,
	fields: [
		{ name: 'UnitID',	type: 'int', 	mapping: 'Unit.UnitID' },
		{ name: 'UnitCode',	type: 'int', 	mapping: 'Unit.UnitCode' },
		{ name: 'UnitName', type: 'string',	mapping: 'Unit.UnitName' }
	],
	proxy: {
		type: 'ajax',
		url: 'api/metadata/contexts/user/91943', // Hard coded to LVRs Medrave data supplier (could be generalized).
		reader: {
			rootProperty: 'data'
		}
	},
	sorters: [{
		property: 'UnitName'
	}],
	filters: [
		function(r) {
			return true; 
		}
	]
});

Ext.widget('dataview', {
	height: '100%',
	layout: 'fit',
	renderTo: 'WidgetContainer', 
    store: Ext.data.StoreManager.lookup('unitStore'),
    itemSelector: 'div.unit-card',
    tpl: new Ext.XTemplate(
		'<tpl for=".">',
			'<div style="padding: 20px 0; border-top: 5px solid #ddd" class="unit-card">',
				'<h3>{UnitName}</h3>',
				'<p><i>(enhetskod {UnitCode})</i></p>',
				'<div class="unit-chart" id="uc{UnitCode}"></div>',
			'</div>',
		'</tpl>',
		{
			compiled: true
		}
	),
	listeners: {
		refresh: function() {
			var dl = Ext.query('div[class^="unit-chart"]'),
				dc;
			for (dc=0; dc < dl.length; dc++) {
				createChart(+dl[dc].id.substr(2));
			} 
		}
	}
});
*/
//! Statistik över vårdenheter med direktöverförda registreringar i LVR.
