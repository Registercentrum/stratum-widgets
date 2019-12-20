var UNIT_FILTER = '#unitFilter';
var gCurrentAreaCode;
var gIS_INIT = true;
var controller;
Ext.define('CustomAxis', {
	extend: 'Ext.chart.axis.Category',
	alias: 'axis.custom',
	config: {
		fixedAxisWidth: undefined
	},
	getThickness: function () {
		var customWidth = this.getFixedAxisWidth();
		if (customWidth) {
			return customWidth;
		}
		return this.callParent();
	}
});

Ext.define('Siber.store.Start', {
	extend: 'Ext.data.Store',
	alias: 'store.start',
	storeId: 'start',
	fields: []
});

Ext.define('Siber.view.Filter', {
	extend: 'Ext.form.field.ComboBox',
	xtype: 'siberfilter',
	alias: 'view.siberfilter',
	cls: 'siber-select',
	margin: '0 0 15 0',
	forceSelection: false,
	typeAhead: true,
	queryMode: 'local',
	minChars: 1,
	anyMatch: true,
	autoSelect: false,
	caseSensitive: false,
	checkChangeEvents: ['change', 'keyup']
});

Ext.define('Siber.controller.Start', {
	extend: 'Ext.app.ViewController',
	alias: 'controller.start',
	updateCharts: function () {
		if (!Profile.Context && widgetConfig.isDashboard)
			return;
		var chartConfigs = getChartConfigs(widgetConfig);
		for (var i = 0; i < chartConfigs.length; i++) {
			controller.api = chartConfigs[i].api;
			controller.updateChart(i);
		}
	},
	updateChart: function (chartID) {
		var view = this.getView();
		var spinner = view.down('#spinner');
		var chart = Ext.getCmp('chart' + chartID);
		chart.hide();
		spinner.show();
		controller.currentCounty = view.down('#countyFilter').getDisplayValue() || 'Alla';
		view.down(UNIT_FILTER).getStore().clearFilter();
		view.down(UNIT_FILTER).getFilters().add(controller.filterUnits.bind(controller));
		if (Profile.Context && widgetConfig.isDashboard && gIS_INIT) {
			var c = view.down(UNIT_FILTER);
			c.setValue(Profile.Context.Unit.UnitCode);
			gCurrentAreaCode = c.getSelectedRecord().data.AreaCode;
			gIS_INIT = false;
		}
		var url = controller.createUrl();
		Ext.Ajax.request({
			type: 'ajax',
			method: 'get',
			cors: true,
			url: url,
			success: function (response) {
				var result = Ext.decode(response.responseText).data;
				for(var i=0; i<result.length; i++){
					if(!result[i]['is.unit'])
						if(widgetConfig.xField!==undefined){
							result[i][widgetConfig.xField]=result[i][widgetConfig.xField].toUpperCase();
						}
						
				}
				chart.getStore().loadData(result);
				if (widgetConfig.flipXY) {
					var h = (chart.getStore().getData().items.length * 60) + 40;
					chart.height = h > 650 ? h : 650;
				} else {
					 chart.height = widgetConfig.isDashboard ? 300 : widgetConfig.height || 500;
				}
				chart.show();
				spinner.hide();
			}
		});
	},
	createUrl: function () {
		var view = this.getView();
		var county = view.down('#countyFilter').getValue();
		var unit = view.down(UNIT_FILTER).getValue();
		var indicator = view.down('#indicatorFilter').getValue();
		var isQuarterly = this.api.indexOf('ybars') >= 0; //TODO:Bugg sedan innan?
		county = county[0] === '0' ? county[1] : county;
		var level = unit !== '00' || (isQuarterly && county !== '0') ? 'unit' : 'county';
		var id = level === 'county' || isQuarterly ? county : unit;
		var group = level === 'unit' || county !== '0' ? '&group=' + id : '';
		if (level == 'unit' && id < 0) {
			level = 'area';
		}
		var indication = widgetConfig.showIndicatorFilter ? '&indication=' + indicator : '';
		var url = '/stratum/api/statistics/siber/' + this.api + '?agglevel=' + level + group + indication + '&apikey=MpuYxfbtp5I=';
		return url;
	},
	initialize: function () {	
		Ext.Ajax.request({
			type: 'ajax',
			method: 'get',
			cors: true,
			url: '/stratum/api/metadata/units/bindings/155?apikey=MpuYxfbtp5I=',
			success: function (response) {
				var countiesResult = Ext.decode(response.responseText).data;
				controller.unitCounties = countiesResult;
				controller.getView().down('#countyFilter').getFilters().add(controller.filterCounties.bind(controller));
				Ext.Ajax.request({
					type: 'ajax',
					method: 'get',
					cors: true,
					url: '/stratum/api/statistics/siber/siberw-get-clinic-areas-v3?returntype=json&apikey=MpuYxfbtp5I=',
					success: function (response) {
						var result = Ext.decode(response.responseText).data;
						var unitsAreas = mergeUnitsAndAreas(result)
						var i = 0;
						for (i = 0; i < unitsAreas.areaList.length; i++) {
							var areaName = unitsAreas.areaList[i].AreaName;
							var countyName = unitsAreas.areaList[i].CountyName;
							controller.unitCounties[areaName] = { County: countyName };
						}
						Ext.get(UNIT_FILTER.replace('#', '')).component.getStore().loadData(unitsAreas.completeList);
						controller.updateCharts(true);
					}
				});
			}
		});
	},
	filterUnits: function (item) {
		if (widgetConfig.isDashboard) {
			return Profile.Context && item.data.UnitCode == Profile.Context.Unit.UnitCode || item.data.UnitCode == gCurrentAreaCode || (item.data.AreaCode && item.data.AreaCode == gCurrentAreaCode);
		}
		return item.data.UnitName !== 'Registercentrum' && (item.data.UnitName === 'Alla' || (this.unitCounties[item.data.UnitName] && this.unitCounties[item.data.UnitName].County === this.currentCounty) || this.currentCounty === 'Alla');
	},
	filterCounties: function (item) {
		var include = false;
		for (var i in this.unitCounties) { if (this.unitCounties[i].County === item.data.ValueName) { include = true; } }
		return include || item.data.ValueName === 'Alla';
	},
	countySelected: function () {
		this.getView().down(UNIT_FILTER).setValue('00');
		this.updateCharts(false);
	},
	unitCounties: {},
	currentCounty: 'Alla'
});

Ext.define('Start.viewmodel.Start', {
	extend: 'Ext.app.ViewModel',
	alias: 'viewmodel.start',
	stores: {
		start: {
			type: 'start'
		}
	}
});

Ext.define('Siber.view.Start', {
	extend: 'Ext.container.Container',
	alias: 'view.start',
	controller: 'start',
	viewModel: 'start',
	itemId: 'start',
	width: '100%',
	mixin: ['Ext.mixin.Responsive'],
	items: [
		{
			xtype: 'container',
			border: false,
			plugins: {
              responsive: true
            },
            responsiveConfig: {
              'width < 1200': {
                layout: {
                  type: 'box',
                  vertical: true,
                  align: 'stretch'
                }
              },
              'width >= 1200': {
                layout: {
                  type : 'box',
                  vertical: false
                }
              }
            },
			items: [
				{
					itemId: 'indicatorFilter',
					xtype: 'siberfilter',
					hidden: !widgetConfig.showIndicatorFilter || (widgetConfig.isDashboard && !Profile.Context),
					displayField: 'ValueName',
					valueField: 'ValueCode',
					flex: 3,
					fieldLabel: 'Diagnosgrupp:',
					labelStyle: 'text-align: right;',
					value: 'all',
					height: 40,
					style: {
                      marginBottom: 10
                    },
					listeners: {
						select: 'updateCharts'
					},
					store: {
						fields: ['ValueCode', 'ValueName'],
						data: [
							{ ValueName: 'Alla diagnoser', ValueCode: 'all' },
							{ ValueName: 'Depression', ValueCode: 'depression' },
							{ ValueName: 'Stressyndrom', ValueCode: 'stress' },
							{ ValueName: 'Social fobi', ValueCode: 'social_anxiety' },
							{ ValueName: 'Paniksyndrom', ValueCode: 'panic' },
							{ ValueName: 'Ångestsyndrom inkl GAD', ValueCode: 'anxiety_including_gad' },
							{ ValueName: 'Hälsoångest', ValueCode: 'hypochondriasis' },
							{ ValueName: 'Tvångssyndrom', ValueCode: 'ocd' },
							{ ValueName: 'Insomni', ValueCode: 'insomnia' },
							{ ValueName: 'Dysmorfofobi', ValueCode: 'dysmorphic' },
							{ ValueName: 'Ångestsyndrom unga RCADS-47', ValueCode: 'anxiety_young_rcads47' },
							{ ValueName: 'Ångestsyndrom unga RCADS-25', ValueCode: 'anxiety_young_rcads25' },
							{ ValueName: 'Ångestsyndrom unga', ValueCode: 'anxiety_young' }
						],
						sorters: {
							property: 'ValueName',
							direction: 'ASC'
						},
						filters: [
							function (item) {
								if (widgetConfig.isDashboard)
									return true;
								if (item.data.ValueCode == 'anxiety_young_rcads47' || item.data.ValueCode == 'anxiety_young_rcads25')
									return widgetConfig.showSpecialIndicators;
								if (item.data.ValueCode == 'anxiety_young')
									return widgetConfig.showSpecialIndicators === undefined || widgetConfig.showSpecialIndicators === false;
								if (!widgetConfig.excludedIndicators) return true;
								return !Ext.Array.contains(widgetConfig.excludedIndicators, item.data.ValueCode);
							}
						]
					},
				},
				{
					itemId: 'countyFilter',
					xtype: 'siberfilter',
					hidden: !widgetConfig.showCountyFilter || (widgetConfig.isDashboard && !Profile.Context),
					displayField: 'ValueName',
					valueField: 'ValueCode',
					fieldLabel: ' Region:',
					flex: 2,
					padding: '0 1px 0 0',					
					labelStyle: 'text-align: right;',
					value: '00',
					listeners: {
						select: 'countySelected'
					},
					store: {
						fields: ['ValueCode', 'ValueName'],
						autoLoad: true,
						proxy: {
							type: 'ajax',
							url: '/stratum/api/metadata/domains/3003?apikey=MpuYxfbtp5I=',
							withCredentials: true,
							reader: {
								type: 'json',
								rootProperty: 'data.DomainValues'
							},
						},
						listeners: {
							load: function (store) {
								store.add({ ValueName: 'Alla', ValueCode: '00' });
								store.sort({ property: 'ValueName', direction: 'ASC' });
							},
						}
					},
				},
			]
		},
		{
			xtype: 'container',
			hidden: !widgetConfig.showUnitFilter,
			layout: {
				type: 'hbox',
				align: 'left'
			},
			items: [				
				{
					itemId: UNIT_FILTER.replace('#', ''),
					id: UNIT_FILTER.replace('#', ''),
					xtype: 'siberfilter',
					hidden: !widgetConfig.showUnitFilter || (widgetConfig.isDashboard && !Profile.Context) ,
					displayField: 'UnitName',
					valueField: 'UnitCode',
					fieldLabel: 'Område/enhet:',
					labelStyle: 'text-align: right;',
					flex: 1,
					labelWidth: 100,
					value: '00',
					listeners: {
						select: 'updateCharts'
					},
					store: Ext.create('Ext.data.Store', {}),
					tpl: Ext.create(
						'Ext.XTemplate',
						'<tpl for=".">',
						'<div class="{[this.getClass(values)]}">{UnitName}</div>',
						'</tpl>',
						{
							getClass: function (rec) {
								return rec.UnitCode < 0 ? 'x-boundlist-item bsw-county-item' : 'x-boundlist-item';
							}
						}
					)
				}
			]
		},
		{
		  xtype: 'container',
		  height: 20
		},
		{
			xtype: 'component',
			height: '200',
			html: !Profile.Context && widgetConfig.isDashboard ? '' : widgetConfig.helpNote ?  '<p>' + widgetConfig.helpNote + '</p>' : '',
			hidden: !widgetConfig.helpNote || Ext.os.deviceType === 'Phone'
		},
		getChartItems(),
		{
			xtype: 'container',
			itemId: 'spinner',
			width: '100%',
			height: 162,
			hidden: true,
			html: '<div class="spinner"><div class="rect1"></div><div class="rect2"></div><div class="rect3"></div><div class="rect4"></div><div class="rect5"></div></div>'
		}
	]
});

function createChart(id) {
	var widgetConfig = getChartConfigs(window.widgetConfig)[id];	
	var axes= [
			{
				type: 'numeric',
				minimum: 0,
				maximum: widgetConfig.asPercentages ? 1 : NaN,
				position: widgetConfig.flipXY ? 'bottom' : 'left',
				grid: true,
				border: false,
				renderer: function (axis, label, layoutContext, lastLabel) {
					if (widgetConfig.asPercentages) {
						label *= 100;
						label = parseInt(label, 10);
					} else {
						label = Math.floor(label) === label ? label : '';
					}
					if (widgetConfig.asPercentages) { label += '%'; }
					return label;
				}
			},
			{
				type: 'custom',
				position: widgetConfig.flipXY ? 'left' : 'bottom',
				fields: widgetConfig.xField,
				fixedAxisWidth: widgetConfig.flipXY ? 160: 50,
				labelWidth: 80,			
				renderer: function (axis, label, layoutcontext, lastLabel) {					
					label = Ext.os.deviceType === 'Phone' ? label.replace('20', '-') : label
					var words = label.split(' ');
					var newLabel = [];
					var newWord = words.shift();
					words.forEach(function (word) {
						var testWord = newWord + ' ' + word;
						if (testWord.length > 19) {
							newLabel.push(newWord);
							newWord = word;
						} else {
							newWord = testWord;
						}
					});
					newLabel.push(newWord);
					label = newLabel.join('\n');					
					return label;
				}
			}
		]
	if(widgetConfig.isDashboard){
		axes[1].label={fontSize:12};
	}
	var chart = Ext.create('Ext.chart.CartesianChart', {
		extend: 'Ext.chart.CartesianChart',
		id: 'chart' + id,		
		width: widgetConfig.isDashboard ? 370 : '100%',
		flipXY: widgetConfig.flipXY,
		border: false,
		colors: widgetConfig.colors || null,
		insetPadding: { right: 20 },
		hidden: true,
		touchAction: {
            panY: true,
        },
		legend: {
			type: 'dom',
			docked: 'top',
			cls: 'siber-legend',
			hidden: !widgetConfig.yField.push || widgetConfig.yField.length==1
		},
		useDarkerStrokeColor: false,
		store: {
			fields: [],
			autoLoad: true,
			proxy: {
				type: 'ajax',
				withCredentials: true,
				reader: {
					type: 'json',
					rootProperty: 'data'
				}
			},
		},
		axes: axes,
		series: {
			type: 'bar',
			stacked: widgetConfig.isStacked,
			xField: widgetConfig.xField,
			yField: widgetConfig.yField,
			title: widgetConfig.title,
			style: {
				maxBarWidth: 70
			},
			useDarkerStrokeColor: false,
			tooltip: {
				trackMouse: true,
				renderer: function (tooltip, record, ctx) {
					var value = record.get(ctx.field);
					var text = value;
					if (widgetConfig.asPercentages) {
						var period = ctx.field.split('_').slice(-1)[0];
						period = period === 'latest' || period === 'previous' ? '_' + period : '';
						var classification = widgetConfig.isStacked ? ctx.field.split('_').slice(0)[0] + '_' : '';
						var frequency = classification + 'freq' + period;
						var total = classification + 'total' + period;
						text = Math.round(value * 100) + '%';
						if (record.get(frequency)) {
							text = text + ' (' + record.get(frequency) + ' av ' + (record.get(total) || '???') + ')';
						}
					} else {
						text = 'Antal: ' + value;
					}
					tooltip.setHtml(text);
				}
			}
		}
	});

	if (widgetConfig.id !== undefined) {
		var headerCmp = getHeaderTextCmp(widgetConfig.id)
		if (headerCmp !== null) {
			var container = Ext.create('Ext.Panel', {
				layout: 'vbox',
				width: '100%',
				margin: 5
			});
			container.items.add(headerCmp);
			container.items.add(chart);
			return container;
		}
	}
	return chart;
}

function getChartConfigs(widgetConfig) {
	if (!widgetConfig.isDashboard)
		return [widgetConfig];
	var cfgs = [];
	cfgs.push({
		api: 'siberw-qbars-count-starts',
		xField: 'YQ',
		yField: 'Freq',
		id: 'BeStartKv',
		title: 'Antal behandlingsstarter',
		colors: ['#43afaf', '#E47C7B'],
		flipXY: false,
		numericPosition: 'bottom'
	});
	cfgs.push({
		api: 'siberw-qbars-count-endings',
		xField: 'YQ',
		yField: 'Freq',
		id: 'BeSlutKv',
		title: 'Antal behandlingsavslut',
		colors: ['#E47C7B'],
		flipXY: false,
		numericPosition: 'bottom'
	});		
	cfgs.push({
		api: 'siberw-qbars-structured-diagnostics',
		id: 'StruktDiagKv',
		xField: 'YQ',
		yField: 'proportion',
		title: 'Strukturerad diagnostik',
		colors: ['#E47C7B'],
		flipXY: false,
		asPercentages: true,
		numericPosition: 'bottom'
	});	
	cfgs.push({
		api: 'siberw-stacked-qbars-completion',
		id: 'FullfoljKv',
		flipXY: false,
		xField: 'YQ',
		yField: ['good_proportion', 'bad_proportion', 'missing_proportion'],
		title: ['>50%', '<=50%', 'Uppgift saknas'],
		isStacked: true,
		asPercentages: true,
		colors: ['#43afaf', '#E47C7B', '#E8DAB2']
	});
	cfgs.push({
		api: 'siberw-qbars-proportion-treated-in-time',
		xField: 'YQ',
		yField: ['proportion'],
		id: 'BeInom30Kv',
		title: ['Andel inom 30 dagar'],
		colors: ['#43afaf'],
		flipXY: false,
		asPercentages: true
	});
	cfgs.push({
		api: 'siberw-stacked-qbars-effect',
		flipXY: false,
		xField: 'YQ',
		yField: ['good_proportion', 'bad_proportion', 'missing_proportion'],
		id: 'ForbattradKv',
		title: ['Förbättrade', 'Inte förbättrade', 'Uppgift saknas'],
		isStacked: true,
		asPercentages: true,
		colors: ['#43afaf', '#E47C7B', '#E8DAB2']
	});
	for (var p in widgetConfig) {
		for (var i = 0; i < cfgs.length; i++) {
			var cfg = cfgs[i];
			if (cfg[p] === undefined) {
				cfg[p] = widgetConfig[p];
			}
		}
	}
	return cfgs;
}

Ext.application({
	name: 'Siber',
	units: [],
	launch: function () {
		var target = (typeof Stratum !== 'undefined' && Stratum.containers) ? Stratum.containers['SIBER/Chart'] : 'contentPanel';
		Ext.create('Siber.view.Start', {
			renderTo: target,
			hidden: widgetConfig.isDashboard && !Profile.Context
		});
		controller = Ext.ComponentQuery.query('#start')[0].getController();
		controller.initialize();        
	}
});

Ext.util.CSS.removeStyleSheet('siber');
Ext.util.CSS.createStyleSheet(
	' '
	+ '.numRatingsAxis {'
	+ '  white-space: normal;'
	+ '  width: 200px;'
	+ '}'

	+ '.siber-select .x-form-trigger-wrap {'
	+ '  border-color: #999;'
	+ '}'

	+ '.siber-select .x-form-trigger-wrap-focus.x-form-trigger-wrap {'
	+ '  border-color: #338FEB;'
	+ '}'

	+ '.siber-select .x-form-item-body {'
	+ '  height: 40px;'
	+ '  border-radius: 3px;'
	+ '}'

	+ ' .bsw-county-item {'
	+ '     padding-top: 10px;'
	+ '     padding-bottom: 6px;'
	+ '     border-top: 1px dashed #000;'
	+ '     font-weight: bold;'
	+ '     margin-top: 5px;'
	+ ' }'

	+ '.siber-select input {'
	+ '  color: #3F73A6;'
	+ '  color: #2f5880;'
	+ '  padding: 9px 14px;'
	+ '}'

	+ '.siber-select div {'
	+ '  border-radius: 3px;'
	+ '}'

	+ '.siber-select label {'
	+ '  white-space: nowrap;'
	+ '  padding-top: 11px;'
	+ '  color: #3F73A6;'
	+ '  color: #2f5880;'
	+ '}'

	+ '.siber-select .x-form-trigger {'
	+ '  vertical-align: middle;'
	+ '  color: #3F73A6;'
	+ '}', 'siber'
);

function getChartItems() {
	var height = 400;
	if (widgetConfig.isDashboard) {
		return {
			height: 1220,
			layout: {
				type: 'vbox'
			},
			items: [
				{
					xtype: 'container',
					border: true,
					style: 'border: 1px; blue',
					height: height,
					layout: { type: 'hbox' },
					items: [createChart(0), createChart(1)]
				},
				{
					xtype: 'container',
					border: true,
					height: height,
					layout: { type: 'hbox' },
					items: [createChart(2), createChart(3)]
				},
				{
					xtype: 'container',
					border: true,
					height: height,
					layout: { type: 'hbox' },
					items: [createChart(4), createChart(5)]
				}
			]
		}
	} else {
		return {
			xtype: 'container',
			id: 'chartcontainer',			
			items: [{
				xtype: 'container',				
				layout: { type: 'hbox' },
				items: [createChart(0)]
			}
			]
		}
	}
}

function isYearBars() {
	return widgetConfig.api.indexOf('ybars') >= 0;
}

function getHeaderTextCmp(id) {
	if (id == undefined)
		return null;
	var headerText = null;
	var subheaderText = null;
	switch (id) {
		case 'BeStartKv':
			headerText = 'Antal påbörjade behandlingar per kvartal';
			subheaderText = '';
			break;
		case 'BeSlutKv':
			headerText = 'Antal avslutade behandlingar per kvartal';
			subheaderText = '';
			break;
		case 'BeInom30Kv':
			headerText = 'Tillgänglighet per kvartal';
			subheaderText = 'Andel behandlingar där patienten bedömdes och började<br/> behandling inom 30 dagar efter vårdbegäran.';
			break;
		case 'ForbattradKv':
			headerText = 'Behandlingsresultat per kvartal';
			subheaderText = 'Andel behandlingar där patienten var förbättrad<br/>efter avslut.';
			break;
		case 'StruktDiagKv':
			headerText = 'Strukturerad diagnostik per kvartal';
			subheaderText = 'Andel behandlingar där patienten diagnostiserats med stöd av en strukturerad intervjuguide.';
			break;
		case 'FullfoljKv':
			headerText = 'Fullföljandegrad per kvartal';
			subheaderText = 'Andel behandlingar där patienten fullföljt minst hälften<br/>av behandlingsprogrammet.';
			break;
	}

	if (headerText !== null) {
		var cmp = Ext.create('Ext.Container', {
			height: 75,
			width: '100%',//370,
			html: '<p><b>' + headerText + '</b></p><p style="font-size:13px">' + subheaderText + '</p>'
		});
		return cmp;
	}
	return null;
}

function mergeUnitsAndAreas(data) {
	var currentAreaCode = 0;
	var result = {};
	var completeList = [];
	var areaList = [];
	var i = 0;
	completeList.push({ UnitName: 'Alla', UnitCode: '00' });
	for (i = 0; i < data.length; i++) {
		var aCode = data[i].AreaCode;
		var name = '';
		var code = '';
		if (aCode !== currentAreaCode) {
			currentAreaCode = aCode;
			name = data[i].AreaName;
			code = data[i].AreaCode;

			completeList.push({ UnitCode: code, UnitName: name });
			areaList.push({ CountyName: data[i].CountyName, AreaName: data[i].AreaName });
		}
		name = data[i].UnitName;
		code = data[i].UnitCode;
		completeList.push({ UnitCode: code, UnitName: name, AreaCode: data[i].AreaCode });
	}
	result.completeList = completeList;
	result.areaList = areaList;
	return result;
}

function printObject(obj) {
	console.log('{');
	for (var p in obj) {
		console.log(p + ': ' + obj[p]);
	}
	console.log('}');
}
Ext.util.CSS.removeStyleSheet('siber-charts')
Ext.util.CSS.createStyleSheet(
	' '
	+ '.rc-active {'
	+ '  background-color: aquamarine;'
	+ '}'	
	+ '@media (min-width: 992px) {'
	+ '.base-page>.widget-large {'
	+ '  margin-right: -10%;'
	+ '}'
	+ '}'

    + '@media only screen and (max-width: 768px) {'
    + '  .siber-select label {'
    + '    font-size: 16px;'
    + '  }'
    + '  .siber-select input {'
    + '    font-size: 16px;'
    + '  }'
    + '}'

	+ '.siber-legend .x-legend-item {'
	+ '  font-size: 12px;'
	+ '  max-width: 22em;'
	+ '}'
    
    + '@media only screen and (max-width: 600px) {'
	+ '.siber-legend .x-legend-container {'
    + '      width: 100%;'
    + '      margin: auto;'
    + '      text-align: left;'
    + '}'

      + '.siber-select label {'
      + '  white-space: nowrap;'
      + '  padding-top: 11px;'
      + '  color: #3F73A6;'
      + '  color: #2f5880;'
      + '  font-size: 14px'
      + '}'

    + '.siber-legend .x-legend-item {'
    + '    width: 100%;'
    // + '    max-width: 260px;'
    + '    float: left;'
    + '    text-overflow: clip;'
    + '  }'
    + '}'
	, 'sibercharts'
)
//# sourceURL=SIBER/Chart








