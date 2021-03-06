! function() {
	var RegisterOverview = {
		clinics: [],
		registerShortName: '{{registerShortName}}',
		formName: '{{formName}}',
		months: isTemplate('{{months}}') ? 6 : parseInt('{{months}}', 10),
		skipFirst: !isTemplate('{{skipFirst}}') && '{{skipFirst}}' === 'true',
		aggregate: !isTemplate('{{aggregate}}') && '{{aggregate}}' === 'true',
		container: isTemplate('{{container}}') ? 'main-container' : '{{container}}',
		init: function() {
			var me = this;

			if(isTemplate(me.registerShortName) || isTemplate(me.formName)){
				Ext.log('Missing any of following required arguments @registerShortName, @formName');
				return;
			}

			me.loadRegisterData();
		},
		loadRegisterData: function() {
			var me = this;
			var overviewStore = Ext.create('Ext.data.Store', {
				fields: [{
						name: 'value',
						type: 'int'
					},
				{
					name: 'month',
					type: 'date',
					dateFormat: 'Y-m'
				}],
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
				url: Ext.String.format('/api/aggregate/{0}/{1}/Total/Count/month(InsertedAt)',
					me.registerShortName, me.formName),
				method: 'GET',
				success: function(response) {
					var data, sum = 0, newData = [], first = !!me.skipFirst;
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
							sum += v;
						}
						newData.push({month: k, value: me.aggregate ? sum : v});
					});
					overviewStore.loadRawData(newData);
				}
			});
			this.createGraph(overviewStore);
		},
		createGraph: function(store) {
			this.chart = Ext.create('Ext.chart.Chart', {
				animate: true,
				store: store,
				shadow: false,
				renderTo: this.container,
				width: '100%',
				height: '100%',
				colors: ['#aaa38e'],
				insetPadding: 20,
				innerPadding: {
					top: 20,
					left: 10,
					right: 10
				},
				axes: [{
					type: 'numeric',
					minimum: 0,
					position: 'left',
					fields: ['value'],
					style: {
						strokeStyle: '#ccc'
					}
				}, {
					type: 'category',
					position: 'bottom',
					fields: ['month'],
					renderer: function(axis, label) {
						return Ext.Date.format(label, 'y/m');
					},
					style: {
						strokeStyle: '#ccc'
					}
				}],
				series: [{
					type: 'line',
					// smooth: true,
					highlight: true,
					style: {
						lineWidth: 2
					},
					useDarkerStrokeColor: false,
					axis: 'left',
					xField: 'month',
					yField: 'value',
					tooltip: {
						trackMouse: true,
						renderer: function(tooltip, storeItem, item) {
							tooltip.update(Ext.String.capitalize(Ext.Date.format(storeItem.get('month'), 'F Y')) + '<br> ' + (item.field) + '<br/>' + storeItem.get(item.field) + ' registreringar.');
						}
					},
					showMarkers: true,
					marker: {
						radius: 2
					}
				}]
			});
		}
	};
	RegisterOverview.init();
}();