
(function() {
	var container = Stratum.containers && Stratum.containers['RC/NumberOfRegistrations'] || 'sw-container1',
		chart;

	chart = Ext.widget('cartesian', {
		renderTo: container, 
		width: '100%',
		height: 300,
		insetPadding: 30,
		interactions: 'itemhighlight',
		animation: false,
		border: false,
		plugins: {
			ptype: 'chartitemevents'
		},
		style: {
			borderWidth: '1px',
			borderColor: '#ddd',
			borderStyle: 'solid',
			borderRadius: '5px',
			opacity: 0
		},
		background: '#eee',
		store: {
			storeId: 'chartStore',
			autoLoad: true,
			proxy: {
				type: 'ajax',
				url: '/stratum/api/overview/monthly?apikey=9-ufjxVFXgc=',
				reader: {
					type: 'json',
					rootProperty: 'data'
				}
			},
			fields: [
				'Year', 
				'Month', 
				'Count', 
				{
					name: 'Label',
					type: 'string',
					convert: function(n,m) {
						return m.get('Year') + '-' + (m.get('Month') < 10 ? '0'+m.get('Month') : m.get('Month'));
					}
				}
			],
			listeners: {
				beforeload: function() {
					spin(container, 'Hämtar senaste uppgifterna');				
				},
				load: function() {
					unspin();
					chart.setAnimation(true);
					chart.animate({
						duration: 500,
						from:	{ opacity: 0 },
						to:		{ opacity: 1 }
					});
				}
			}
		},
		axes: [{
			type: 'numeric',
			position: 'left',
			renderer: Ext.util.Format.numberRenderer('0,0'),
			grid: {
				odd: {
					opacity: 0.5,
					fill: '#ddd'
				}
			},
			label: {
				rotate: {
					degrees: 0
				}
			}
		}, {
			type: 'category',
			position: 'bottom',
			label: {
				rotate: {
					degrees: 270
				}
			}
		}],
		series: [{
			type: 'bar',
			axis: 'left',
			xField: 'Label',
			yField: 'Count',
			highlight: {
				opacity: 1.0,
				fill: '#E98300',
				stroke: 'transparent'
			},
			style: {
				opacity: 0.7,
				fill: '#E98300',
				stroke: 'transparent',
				minGapWidth: 10
			}
		}],
		listeners: {
			itemclick: function(aSeries, anItem) {
				anItem.record.hidden = true; // Store item visibility state in store record (is used in filter function).
				Ext.data.StoreManager.lookup('chartStore').filterBy(function(se) {
					return !se.hidden;
				});
			}
		}
	});
})();
//! Visar diagram över antal registreringar i Stratum per månad senaste året.
