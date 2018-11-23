! function() {
	var RegisterOverview = {
		clinics: [],
		countyClinics: {},
		registerShortName: '{{registerShortName}}',
		registerId: '{{registerId}}',
		formName: '{{formName}}',
		surgery: '{{surgery}}',
		months: isTemplate('{{months}}') ? 6 : parseInt('{{months}}',10),
		skipFirst: !isTemplate('{{skipFirst}}') && 'true' === 'true',
		aggregate: !isTemplate('{{aggregate}}') && '{{aggregate}}' === 'true',
        container: Stratum.containers && Stratum.containers['RC/RegistrationOverviewAll'] || 'main-container',
		init: function() {
			var me = this;

			if(isTemplate(me.registerShortName) || isTemplate(me.registerId) || isTemplate(me.surgery) || isTemplate(me.formName)){
				Ext.log('Missing any of following required arguments @registerShortName, @registerId, @surger, @formName');
				return;
			}
			// Fix for legend container width
			Ext.util.CSS.createStyleSheet('.registration-overview-all-chart .x-legend-container { width: 100%; }');
			Ext.Ajax.request({
				url: Ext.String.format('/stratum/api/metadata/units/map/{0}',me.registerId),
				method: 'GET',
				success: function(response) {
					var data;
					if (!response || !response.responseText || response.status !== 200) {
						return;
					}
					data = Ext.decode(response.responseText).data;
					if (data && data.County) {
						Ext.Object.each(data.County, function(k, v) {
							me.countyClinics[v] = me.countyClinics[v] || [];
							me.countyClinics[v].push(k);
						});
						me.loadRegisterData();
					}
				}
			});
		},
		loadRegisterData: function() {
			var me = this;
			var overviewStore = Ext.create('Ext.data.Store', {
				storeId: 'registerOverviewStore',
				fields: Ext.Array.merge(Ext.Array.map(me.getAllClinics(), function(c) {
					return {
						name: c,
						type: 'int'
					};
				}), {
					name: 'month',
					type: 'date',
					dateFormat: 'Y-m'
				}),
				filters: [{
					filterFn: function(r) {
						return r.get('month') < this.getEndDate() && r.get('month') > this.getStartDate();
					},
					getEndDate: function() {
						//Remove unfinished month
						this._endDate = this._endDate || Ext.Date.subtract(new Date(), Ext.Date.MONTH, 1);
						return this._endDate;
					},
					getStartDate: function() {
						this._startDate = this._startDate || Ext.Date.subtract(new Date(), Ext.Date.MONTH, (me.months) + 1);
						return this._startDate;
					}
				}]
			});
			Ext.Ajax.request({
				url: Ext.String.format('/stratum/api/aggregate/{0}/{1}/Total/Count/month(InsertedAt)/{2}',me.registerShortName, me.formName, me.surgery),
				method: 'GET',
				success: function(response) {
					var data, currentCounty, tmpAgg = {}, first = !!me.skipFirst;
					if (!response || !response.responseText || response.status !== 200) {
						Ext.log('not');
						return;
					}
					data = Ext.decode(response.responseText).data;
					Ext.Object.each(data, function(k, v) {
						if (first && !me.aggregate) {
							first = false;
							return;
						}
						if(me.aggregate){
							Ext.Object.each(v, function(unit, val){
							    data[k][unit] = val + (tmpAgg[unit] || 0);
							    tmpAgg[unit] = data[k][unit];
							});
							data[k] = Ext.applyIf(data[k], tmpAgg);
						}
						overviewStore.loadRawData(Ext.apply(v, {
							month: k
						}), true);
					});
				}
			});
			this.createInitialView();
		},
		createInitialView: function() {
			var currentCounty = this.getInitialCounty();
			this.createCheckboxes(this.getCounties(), currentCounty);
			this.createGraph(this.getClinicsInCounty(currentCounty));
		},
		getInitialCounty: function() {
			var county;
			try {
				county = Ext.Array.findBy(Profile.Context.Unit.Bindings, function(e) {
					return e.Domain.DomainID === 3003;
				}).ValueName;
			} finally {
				return county;
			}
		},
		getCounties: function() {
			return Ext.Object.getKeys(this.countyClinics);
		},
		getClinicsInCounty: function(county) {
			var clinics, me = this;
			if (!county) {
				return;
			}
			if (Ext.isArray(county)) {
				clinics = [];
				Ext.each(county, function(c) {
					clinics = Ext.Array.merge(clinics, me.countyClinics[c]);
				});
			}
			return clinics || me.countyClinics[county];
		},
		getAllClinics: function() {
			return Ext.flatten(Ext.Object.getValues(this.countyClinics));
		},
		createCheckboxes: function(counties, preSelected) {
			var items = [],
				me = this;
			Ext.create('Ext.container.Container', {
				renderTo: me.container,
				style: {
					background: '#f7f7f7',
					border: '1px solid #e8e8e8',
					borderRadius: '4px'
				},
				padding: 16,
				width: '100%',
				layout: 'hbox',
				margin: '20 0',
				items: [{
					xtype: 'checkboxgroup',
					labelAlign: 'top',
					flex: 1,
					columns: 4,
					items: Ext.Array.map(Ext.Array.sort(counties || []), function(county) {
						return {
							xtype: 'checkboxfield',
							boxLabel: county,
							name: county,
							checked: preSelected === county,
							inputValue: county
						};
					}),
					listeners: {
						change: function(field, newValue) {
							var cs = me.getClinicsInCounty(Ext.Object.getKeys(newValue));
							me.chart && me.chart.destroy();
							me.createGraph(cs);
						}
					}
				}]
			});
		},
		createGraph: function(clinics) {
            var me = this;
			this.chart = Ext.create('Ext.chart.Chart', {
				animate: true,
				store: 'registerOverviewStore',
				shadow: false,
				renderTo: me.container,
				width: '100%',
				height: 600,
				animate: true,
                                                                cls: 'registration-overview-all-chart',
				colors: ['#a2ad00', '#614d7d', '#3cb6ce',
					'#e98300', '#fecb00', '#aaa38e', '#bfc82f',
					'#7a6597', '#5fd2ea', '#ff9d2b', '#ffe736',
					'#c5bea8', '#dce44d', '#957eb2', '#7eeeff',
					'#ffb948', '#ffff56', '#e1dac4'
				],
				insetPadding: 20,
				innerPadding: {
					top: 20,
					left: 10,
					right: 10
				},
				legend: {
					docked: 'right',
					border: false,
					width: 220
				},
				axes: [{
					type: 'numeric',
					minimum: 0,
					position: 'left',
					fields: clinics,
					style: {
						strokeStyle: '#ccc'
					}
				}, {
					type: 'category',
					position: 'bottom',
					fields: ['month'],
					renderer: function(v) {
						return Ext.Date.format(v, 'y/m');
					},
					style: {
						strokeStyle: '#ccc'
					}
				}],
				series: (function(c) {
					var arr = [];
					Ext.each(c, function(clinic) {
						arr.push({
							type: 'line',
							// smooth: true,
							highlight: true,
							style: {
								lineWidth: 2
							},
							useDarkerStrokeColor: false,
							axis: 'left',
							xField: 'month',
							yField: clinic,
							tooltip: {
								trackMouse: true,
								renderer: function(storeItem, item) {
									this.update(Ext.String.capitalize(Ext.Date.format(storeItem.get('month'), 'F Y')) + '<br> ' + (item.field) + '<br/>' + storeItem.get(item.field) + ' registreringar.');
								}
							},
							showMarkers: true,
							marker: {
								radius: 2
							}
						});
					});
					return arr;
				}(Ext.Array.sort(clinics || [])))
			});
		}
	};
	RegisterOverview.init();
}();