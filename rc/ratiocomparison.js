
/*
 * OBS!	This is required to make the widget work within Keystone Stratum CMS:
 *		Set this widget and specify a global _ratioBarChartConf object in Advanced Settings 
 *		- The url in calls must begin with '/stratum/'
 * 		- The container specified by renderTo will be replaced here with any
 *		  container specified in Stratum.containers by Keystone.
 * 		- Set the name of the unit in calls to 'Denna enhet' to get it replaced
 * 		  here by Context.Unit.UnitName
 *
 * Creates a bar or column chart (depending on configuration) from the
 * selected api-calls.
 *
 * The widget gets the configuration from a user created global variable
 * called '_ratioBarChartConf' which contains following settings:
 *
 *	{
 *		//The calls are all chained and should result in return values like:
 *		//	{ data: {val1: 32, val2: 42, etc..}}
 *		calls: [
 *			{
 *				unit: 'Display name',
 *				url: '/url/to/api/call'
 *			},
 *			{
 *				unit: 'Display name 2',
 *				url: '/url/to/second/api/call'
 *			}
 *		],
 *
 *		//The id of the domain describing the call result
 *		domain: 1234,
 *
 *		//Colors for graph, otherwise generated from BaseColor
 *		color: ['#ff00ff', '#eee'], //OPTIONAL
 *
 *		//Where the chart should be rendered
 *		renderTo: 'id-of-container',
 *
 *		//Describes whether the domain contains null or not
 *		nullable: true, //OPTIONAL
 *
 *		//Removes results where the sum is less than 'lowerLimit'
 *		lowerLimit: 10, //OPTIONAL
 *
 *		//Decides if the chart should contain a column or a bar series
 *		bar: true //OPTIONAL
 *   }
 */
(function(conf) {
	if (conf) {
		conf.renderTo = (Stratum.containers && Stratum.containers['RC/RatioComparisonWidget']) 
			? Stratum.containers['RC/RatioComparisonWidget'] : conf.renderTo;
		
		for (key in conf.calls) {
			if (conf.calls[key] && conf.calls[key].unit && conf.calls[key].unit === 'Denna VC')
				conf.calls[key].unit = Profile.Context && Profile.Context.Unit.UnitName;
		}
	}
 
 	var RatioBarChart = {
 		domainFields: [],
 		init: function() {
 			var me = this;
 			if (!conf || !conf.calls || !conf.domainId || !conf.renderTo) {
 				return;
 			}
 			me._initDomain(conf.domainId, conf.nullable, function() {
 				me._chartStore = me._createStore();
 				me._initChart();

 				me.loadData(conf.calls);
 			});
 		},
 		_initDomain: function(domainId, nullable, callback) {
 			var me = this;
 			if (!Ext.isNumber(domainId)) {
 				// return;
 			}
 			Ext.Ajax.request({
 				method: 'get',
 				url: '/stratum/api/metadata/domains/' + domainId + '?apikey=bK3H9bwaG4o=',
 				success: function(re, call) {
 					var domainValues,
 						success = true;
 					if (re.status !== 200) {
 						call.failure();
 						return;
 					}
 					try {
 						domainValues = Ext.decode(re.responseText).data.DomainValues;
 						Ext.Array.sort(domainValues, function(a, b) {
 							return a.Sequence > b.Sequence;
 						});
 						domainValues = Ext.Array.pluck(domainValues, 'ValueName');
 					} catch (e) {
 						//could not parse domain values...
 						success = false;
 						call.failure(e);
 					} finally {
 						me.domainFields = domainValues || [];
 						nullable && me.domainFields.push('null');
 						Ext.isFunction(callback) && callback(success);
 					}
 				},
 				failure: function() {
 					console.log('error');
 				}
 			});
 		},
 		loadData: function(apiConf) {
 			var me = this,
 				currCall = apiConf && Ext.isArray(apiConf) && apiConf.shift();
 			if (!currCall || !currCall.url || (!(Profile.Context && Profile.Context.Unit) && currCall.unit != 'Registret')) {
 				return;
 			}
 			Ext.Ajax.request({
 				method: 'get',
 				url: currCall.url + '?apikey=bK3H9bwaG4o=',
 				success: function(re, ajaxCall) {
 					if (re.status !== 200) {
 						ajaxCall.failure();
 						return;
 					}
 					var data = Ext.decode(re.responseText).data || {},
 						sum, ratios = {};
 					if (!conf.nullable && data['null']) {
 						delete data['null'];
 					}
 					sum = Ext.Array.sum(Ext.Object.getValues(data));
 					Ext.Object.each(data, function(k, v) {
 						ratios[k + '_r'] = 100 * v / sum;
 					});
 					Ext.apply(data, ratios);
 					data.unit = currCall.unit;
 					data.sum = sum;
 					sum >= (conf.lowerLimit || 0) && me._chartStore.loadRawData(data, true);
 					me.loadData(apiConf, {
 						recurse: true
 					});
 				},
 				failure: function() {
 					console.log('Fail');
 				}
 			});
 		},
 		_initChart: function() {
 			var me = this;
 			Ext.chart.theme.ONH = Ext.extend(Ext.chart.theme.Base, {
 				constructor: function(config) {
 					var nullPos = Ext.Array.indexOf(me.getDomainFields(), 'null');
 					var colors = conf.colors || me.getColorShades() /*|| ["#104521", "#145a2b", "#196e35", "#1e833f", "#239849", "#28ac53", "#2cc15d"]*/ ;
 					if (nullPos > -1 && colors.length > nullPos) {
 						colors[nullPos] = '#aaa';
 					}
 					Ext.chart.theme.Base.prototype.constructor.call(this, Ext.apply({
 						colors: colors,
 						axis: {
 							stroke: '#ccc',
 							'stroke-width': 1
 						}
 					}, config));
 				}
 			});
 			Ext.create('Ext.chart.Chart', {
 				renderTo: conf.renderTo,
 				width: '100%',
 				height: 400,
 				shadow: false,
 				store: me._chartStore,
 				margin: {bottom: 15},
 				animate: true,
 				flipXY: !!conf.bar,
 				colors: conf.colors || me.getColorShades(),
 				legend: {
 					position: 'bottom',
 					boxStrokeWidth: 0
 				},
 				axes: [{
 					type: 'numeric',
 					position: conf.bar ? 'bottom' : 'left',
 					renderer: function(axis, label) { return Ext.util.Format.number(label, '0%'); },
 					style: {
 						strokeStyle: '#ccc'
 					},
 					fields: me.getRatioDomainFields()
 				}, {
 					type: 'category',
 					position: conf.bar ? 'left' : 'bottom',
 					fields: ['unit'],
 					style: {
 						strokeStyle: '#ccc'
 					}
 				}],
 				series: [{
 					type: 'bar',
 					//axis: conf.bar ? 'bottom' : 'left',
 					stacked: conf.stacked,
 					title: me.getFieldTitles(),
 					yField: me.getRatioDomainFields(),
 					xField: 'unit',
 					groupGutter: 0,
 					style: {
 						minBarWidth: 60,
 						maxGapWidth: 0
 					},
 					tips: {
 						trackMouse: true,
 						renderer: function(tooltip, storeItem, item) {
 							var yField = item.field || '',
 								nField = Ext.String.endsWith(yField, '') ? Ext.util.Format.substr(yField, 0, yField.length - 2) : yField;
 							tooltip.update(Ext.String.format('<b>{0} ({2}):</b><br/>{1} observationer av totalt {3}', storeItem.get('unit'), storeItem.get(nField),
 								Ext.util.Format.number(storeItem.get(yField), '0.0%'), storeItem.get('sum')));
 						}
 					}
 				}]
 			});
 		},
 		_createStore: function() {
 			return Ext.create('Ext.data.Store', {
 				storeId: conf.storeId,
 				fields: Ext.Array.merge(this.getDomainFields(), ['unit', 'sum'], Ext.Array.map(this.getDomainFields(), function(v) {
 					return v + '_r';
 				}))
 			});
 		},
 		getDomainFields: function() {
 			return (this.domainFields || []).slice(0);
 		},
 		getFieldTitles: function() {
 			var domainFields = this.getDomainFields();
 			if (!conf.nullTitle || !conf.nullable) {
 				return domainFields;
 			}
 			return Ext.Array.replace(domainFields, Ext.Array.indexOf(domainFields, 'null'), 1, [conf.nullTitle]);
 		},
 		getRatioDomainFields: function() {
 			return Ext.Array.map(this.getDomainFields(), function(d) {
 				return d + '_r';
 			});
 		},
 		getColorShades: function(color) {
 			var baseColor, startColor, lightness, colorArr = [],
 				i;
 			try {
 				baseColor = Profile.Site.ThemeSettings.BaseColor;
 			} catch (e) {
 				// console.error('Missing BaseColor ');
 			}
 			if (!color && !baseColor) {
 				return;
 			}
 			baseColor = Ext.draw.Color.fromString(color || baseColor);
 			lightness = baseColor.getHSL()[2];
 			startColor = baseColor.createDarker(lightness - 0.15);
 			for (i = 0; i < 7; i++) {
 				colorArr.push(startColor.toString());
 				startColor = startColor.createLighter(0.075);
 			}
 			return colorArr;
 		}
 	};
 	RatioBarChart.init();
 }(typeof _ratioBarChartConf === 'object' ? window._ratioBarChartConf : null));
