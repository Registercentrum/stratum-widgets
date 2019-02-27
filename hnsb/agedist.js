
function displayDenominator (n){
	var denominatorSpan = Ext.fly('hnsb-denominator');
	denominatorSpan && denominatorSpan.setHtml(n);
}

function initializeDefinitions() {
	Ext.each(['Pie', 'Bar'], function(sType) {
		!Ext.chart.series['Null:'+sType] && Ext.define('Ext.chart.series.Null:' + sType, {
			alias: 'series.' + sType.toLowerCase() + ':null',
			extend: 'Ext.chart.series.' + sType,
			constructor: function() {
				this.callParent(arguments);
				this.nullValue = this.nullValue || 'null';
				this.nullColor = this.nullColor || '#b7b7b7';
				this._oldColorArrayStyle = Ext.isArray(this.colorArrayStyle) && this.colorArrayStyle.slice(0);
				this.getChart().on('refresh', this.refreshTitle, this);
			},
			refreshTitle: function() {
				var title = Ext.isArray(this.yField) && this.yField.slice(0),
					nullPos;
				nullPos = title ? Ext.Array.indexOf(title, this.nullValue) : -1;
				if (nullPos >= 0) {
					if (Ext.isArray(this._oldColorArrayStyle) && this._oldColorArrayStyle.length > nullPos) {
						this.colorArrayStyle = this._oldColorArrayStyle.slice(0);
						Ext.Array.insert(this.colorArrayStyle, nullPos, [this.nullColor]);
					}
					if (this.nullTitle) {
						title[nullPos] = this.nullTitle;
						this.title = title;
					}
					this.chart.redraw();
				}
			}
		});
	});
}

function go() {
	initializeDefinitions();
	var container = Stratum.containers && Stratum.containers['HNSB/AgeDist'] || 'main-container';

    var store;
        Profile.APIKey = 'bK3H9bwaG4o=';
        store = Ext.create('Ext.data.Store', {
        fields: ['key', 'value', 'frequency'],
        autoLoad: true,
        proxy: {
            type: 'ajax',
            url: '/stratum/api/aggregate/HNSB/HNSBBase/Total/Count/AAge/',
            reader: {
                type: 'objecttoarray.frequency',
                frequencyField: 'frequency',
                toPercent: true,
                rootProperty: 'data'
            }
        },
        listeners: {
            load: function(st) {
                displayDenominator(st.sum('value'));
            }
        }
    });
    Ext.create('Ext.chart.Chart', {
        renderTo: container,
        width: '100%',
        height: 300,
        animate: true,
        colors: ['#E98300', '#4BACC6', '#1e833f'],
        shadow: false,
        store: store,
        innerPadding: {top: 60, left: 5, right: 5},
        axes: [{
            type: 'numeric',
            position: 'left',
            fields: ['value'],
            label: function(v) {
                return Ext.util.Format.number(v, '0');
            },
            style: {
                strokeStyle: '#ccc'
            },
            grid: true
        }, {
            type: 'category',
            position: 'bottom',
            fields: ['key'],
            style: {
                strokeStyle: '#ccc'
            }
        }],
        series: [{
            type: 'bar',
            highlight: false,
            tooltip: {
                trackMouse: true,
                renderer: function(tooltip, storeItem) {
                    tooltip.setHtml(Ext.String.format('{0} år<hr/><b>{1}</b> observationer.', storeItem.get('key'), storeItem.get('value')));
                }
            },
            // labelOverflowPadding: 0,
            label: {
                display: 'outside',
                field: 'frequency',
                orientation: 'horizontal',
                renderer: Ext.util.Format.numberRenderer('0.0%')
            },
            xField: 'key',
            yField: 'value'
        }]
    });
}
go();
