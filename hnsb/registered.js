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
	Profile.APIKey = 'bK3H9bwaG4o=';
	initializeDefinitions();
	var container = Stratum.containers && Stratum.containers['HNSB/Registered'] || 'main-container';

    var formName = window.isTemplate('{{form}}') ? 'HNSBBase' : '{{form}}',
        question = window.isTemplate('{{question}}') ? 'AUnit' : '{{question}}',
        countType = window.isTemplate('{{counttype}}') ? 'Count' : '{{counttype}}',
        chartHeight = window.isTemplate('{{chartheight}}') ? 500 : parseInt('{{chartheight}}',10),
        store, chart, regTpl, loggedInUnit, loggedInToRegister, mainContainer, ciStore;

    store =  Ext.create('Ext.data.Store', {
        fields: ['key', 'value', 'frequency'],
        autoLoad: true,
        proxy: {
            type: 'ajax',
            url: Ext.String.format('/stratum/api/aggregate/HNSB/{0}/Total/{2}/{1}/',formName, question, countType),
            reader: {
                type: 'objecttoarray.frequency',
                frequencyField: 'frequency',
                toPercent: true,
                rootProperty: 'data'
            }
        },
        sorters: [{
            property: 'key',
            direction: 'DESC'
        }],
        listeners: {
            load: function(st){
                displayDenominator(st.sum('value'));
            }
        }
    }),
    ciStore = Ext.create('Ext.data.Store', {
        fields: ['RegTotal', {
            name: 'RegCI',
            mapping: 'data'
        }, 'UnitName'],
        autoLoad: false,
        proxy: {
            type: 'ajax',
            url: '/stratum/api/aggregate/HNSB/HNSBCI/Unit/' + countType + '/',
            reader: {
                type: 'json'
            }
        }
    });

    mainContainer = Ext.create('Ext.container.Container', {
        width: '100%',
        layout: 'hbox',
        renderTo: container
    });
    chart = Ext.create('Ext.chart.Chart', {
        width: '100%',
        flex: 3,
        height: chartHeight,
        flipXY: true,
        animate: true,
        colors: ['#3CB6CE', '#4BACC6', '#1e833f'],
        shadow: false,
        store: store,
        axes: [{
            type: 'category',
            position: 'left',
            fields: ['key']
        }],
        series: [{
            type: 'bar',
            hideUnder: 10,
            // highlight: false,
            renderer: function(sprite, config, rendererData, index) {
                var field = sprite.getField(), store = rendererData.store;
                if (store.getAt(index).get(field) < 10) {
                    return {width: 0};
                }
                // return attr;
            },
            tooltip: {
                trackMouse: true,
                renderer: function(storeItem, item) {
                    var hideUnder = 10,
                        value = storeItem.get('value') < hideUnder ? '<' + hideUnder : storeItem.get('value');
                    this.update(Ext.String.format('{0}<hr/><b>{1}</b> registreringar.', storeItem.get('key'), value));
                }
            },
            label: {
                display: 'insideEnd',
                field: 'value',
                renderer: function(value, label, storeItem, item) {
                    var hideUnder = 10;
                    return value < hideUnder ? '<' + hideUnder : Ext.util.Format.number(value, '0');
                },
                contrast: true
            },
            xField: 'key',
            yField: 'value'
        }]
    });
    mainContainer.add(chart);

    // This part is only used when the user is logged in and a unit context is found
    regTpl = new Ext.XTemplate(
        '<tpl for=".">',
        '<div class="hnsb-reg">',
        '<h3>{UnitName}</h3>',
        '<div class="hnsb-reg-total">',
        '<div class="hnsb-reg-total-inner">',
        '<span class="hnsb-reg-header">{RegTotal}</span>',
        '<span class="hnsb-reg-descr">registreringar</span>',
        '</div>',
        '</div>',
        '<div class="hnsb-reg-total">',
        '<div class="hnsb-reg-total-inner">',
        '<span class="hnsb-reg-header">{RegCI}</span>',
        '<span class="hnsb-reg-descr">CI-operationer</span>',
        '</div>',
        '</div>',
        '</div>',
        '</tpl>'
    );
    try {
        loggedInUnit = Profile.Context.Unit;
        loggedInToRegister = loggedInUnit.Register.RegisterID === 144;
    } catch (e) {
        Ext.log({
            level: 'log'
        }, 'Could not find unit in profile');
    }
    if (loggedInToRegister && window.isTemplate('{{form}}') && window.isTemplate('{{question}}')) {
        Ext.util.CSS.createStyleSheet(
            '.hnsb-reg {' +
            '  text-align: center;' +
            '  color: #194E61;' +
            '}' +
            '.hnsb-reg-total {' +
            '  margin: 10px 0px 10px 0px;' +
            '  display: inline-block;' +
            '}' +
            '.hnsb-reg-total-inner {' +
            '  height: 120px;' +
            '  width: 120px;' +
            '  display: table-cell;' +
            '  text-align: center;' +
            '  vertical-align: middle;' +
            '  border-radius: 50%;' +
            '  background: #CCEAF0;' +
            '  border: 1px solid #9BB9C0;' +
            '}' +
            '.hnsb-reg-header{' +
            '  display: block;' +
            '  font-size: 30px;' +
            '  margin-top: -5px;' +
            '}'
        );
        /*store.on('load', function() {
            ciStore.load({
                callback: function(records, op, success) {
                    var first = success && records && records[0],
                        totalRegs = store.findRecord('key', loggedInUnit.UnitName, null, null, null, true);
                    if (!first) {
                        Ext.log({
                            level: 'error'
                        }, 'Could not load CI data from server');
                        return;
                    }
                    first.set('RegTotal', totalRegs && totalRegs.get('value') || 0);
                    first.set('UnitName', loggedInUnit.UnitName);
                    mainContainer.insert(1, Ext.create('Ext.view.View', {
                        store: ciStore,
                        tpl: regTpl,
                        itemSelector: 'div.hnsb-reg',
                        flex: 1,
                        height: 500,
                        style: {
                            'border-left': '1px solid #ccc',
                            padding: '15px 10px',
                            'margin-left': '10px'
                        }
                    }));

                }
            });
        });*/
    }
}

go();