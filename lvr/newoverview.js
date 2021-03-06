
(function(Ext) {
    var WIDGET_NAME = 'RC.ui.RatioGauge';
    var HEATGUAGE_NAME = 'RC.ui.HeateGuage';
    var FREQUENCE_LIMIT = 60;

    function defineHeatGauge() {
        Ext.define(HEATGUAGE_NAME, {
            extend: 'Ext.chart.PolarChart',
            alias: 'widget.heatgauge',
            constructor: function(config) {
                if (config && config.valueField) {
                    var renderer;
                    if (config.limitField) {
                        renderer = {
                            renderer: function(
                                sprite,
                                record,
                                attribute,
                                index
                            ) {
                                if (
                                    index !== 0 ||
                                        !record.get(config.limitField)
                                ) {
                                    return attribute;
                                }
                                return attribute; //TEST
                            }
                        };
                    }
                    config.series = {
                        type: 'gauge',
                        angleField: config.valueField,
                        donut: 50,
                        colors: ['#3CB6CE', '#ddd'],
                        minimum: 0,
                        maximum: 100,
                        steps: 1,
                        totalAngle: Math.PI,
                        needleLength: 100,
                        // background: {fill: '#fff', fillOpacity: 0, globalAlpha: 0}
                        background: config.background || 'rgb(247, 247, 247)'
                    };
                }
                this.callParent([config]);
            },
            animate: true,
            insetPadding: 0
        });
    }
    function getChoiceFromState(state, danger, success, standard, insufficient, missing) {
        switch (state) {
            case 'danger':
                return danger;
            case 'success':
                return success;
            case 'insufficient':
                return insufficient;
            case 'missing':
                return missing;
            default:
                return standard;
        }
    }

    function getState(report) {
        if (report.value === null) {
            return 'missing';
        }
        if (report.Svarsfrekvens < FREQUENCE_LIMIT) {
            return 'insufficient';
        }
        if (report.limit !== null) {
            return (report.value > report.limit ? !report.invert : report.invert)
                ? 'success'
                : 'danger'
        }
        return '';
    }
    function itemsFactory(report, state, clickHandler) {
        return [
            {
                xtype: 'heatgauge',
                valueField: 'value',
                style: {},
                margin: '8 0 0 0',
                limitField: 'limit',
                invertLimitField: 'invert',
                store: Ext.create('Ext.data.Store', {
                    fields: ['value', 'limit', 'invert'],
                    data: [report]
                }),
                width: 75,
                height: 30
            },
            {
                xtype: 'button',
                ui: 'none',
                flex: 1,
                height: '100%',
                width: '100%',
                padding: '4 7 7 2',
                enableToggle: true,
                allowDepress: false,
                toggleGroup: 'heatg',
                pressedCls: 'gauge-button-pressed',
                cls: 'gauge-btn gauge-btn' +
                    getChoiceFromState(state, '-danger', '-success', '-info', '-insufficient', '-missing'),
                style: {
                    borderLeft: '1px solid #ccc',
                    width: '100%'
                },
                // shrinkWrap: false,
                frame: false,
                data: {
                    text: report.description,
                    value: Ext.isNumber(report.value) ? Ext.util.Format.number(report.value, '0%') : '?'
                },
                textAlign: 'left',
                tooltip: '<div>' + report.tooltip + '</div>',
                // height: 40,
                tpl: '<div style="position:relative;">' +
                    '<div class="value-text pull-left">{value}</div>' +
                    '<div class="gauge-desc pull-left">{text}</div>' +
                    '<div class="gauge-icon pull-right">' +
                    getChoiceFromState(state, '&#xf071;', '&#xf00c;', '', '', '') +
                    '</div>' +
                    '</div>',
                listeners: {
                    beforerender: function(bt) {
                        var tpl = new Ext.XTemplate(bt.tpl);
                        bt.setText(tpl.apply(bt.data));
                    },
                    click: function() {
                        var ratioGuage = this.ownerCt;
                        clickHandler.apply(ratioGuage);
                    }
                }
            }
        ];
    }
    function defineRatioGauge() {
        Ext.define(WIDGET_NAME, function(data) {
            return {
                extend: 'Ext.container.Container',
                cls: 'gauge-button',
                margin: '2px',
                layout: 'hbox',
                style: {
                    border: '1px solid',
                    background: '#f7f7f7',
                    borderRadius: '3px'
                },
                minHeight: 50,
                constructor: function(config) {
                    var report = config.report;
                    var clickHandler = typeof config.onClick === 'function'
                        ? config.onClick
                        : Repository.Local.Methods.noOp;
                    var state = getState(report);
                    this.style.borderColor = getChoiceFromState(
                        state,
                        '#ebccd1',
                        '#d6e9c6',
                        '#bce8f1',
                        '#ccc',
                        '#ccc'
                    );
                    config.items = itemsFactory(report, state, clickHandler);
                    this.callParent(arguments);
                }
            };
        });
    }
    function init() {
        if (!Ext)
            throw new Error(
                'window.Ext not defined. WidgetScript must be loaded after Ext libs'
            );
        !Ext.ClassManager.isCreated(HEATGUAGE_NAME) && defineHeatGauge();
        !Ext.ClassManager.isCreated(WIDGET_NAME) && defineRatioGauge();
    }
    init();
})(window.Ext);

(function(Ext) {
    var WIDGET_NAME = 'RC.ui.RatioGaugeContainer';

    function itemsFactory(storeItems, container, clickHandler) {
        Ext.Array.each(storeItems, function(storeItem) {
            container.add(
                Ext.create('RC.ui.RatioGauge', {
                    columnWidth: 0.5,
                    report: storeItem.getData(),
                    onClick: clickHandler
                })
            );
        });
    }

    function defineRatioGauges() {
        Ext.define(WIDGET_NAME, function() {
            var store;
            return {
                extend: 'Ext.container.Container',
                constructor: function(config) {
                    var self = this;
                    var store = config.store;
                    var onGaugeClick = typeof config.onClick === 'function'
                        ? config.onClick
                        : Repository.Local.Methods.noOp;

                    store.on('load', function(record, operation) {
                        itemsFactory(operation, self, onGaugeClick);
                    });
                    config.layout = config.layout ||
                        {type: 'column', align: 'center'};
                    config.width = config.width || '100%';
                    this.callParent(arguments);
                }
            };
        });
    }

    function init() {
        if (!Ext)
            throw new Error(
                'window.Ext not defined. WidgetScript must be loaded after Ext libs'
            );
        // Ext.util.CSS.createStyleSheet('');
        !Ext.ClassManager.isCreated(WIDGET_NAME) && defineRatioGauges();
    }

    init();
})(window.Ext);

(function() {
    // var API_KEY = 'bK3H9bwaG4o=';
    // var UNIT_ID = '21';
    // var DIAGNOSIS = '1';

    Ext.define('RatioGaugeModel', {
        extend: 'Ext.data.Model',
        fields: [
            {name: 'value', type: 'number', mapping: 'Value', convert: function(v) {
                return v === '?' ? null : parseFloat(v);
            }},
            {name: 'limit', type: 'number', mapping: 'malvarde', convert: function(v) {
                return v === 'NA' ? null : parseFloat(v);
            }},
            {name: 'description', type: 'string', mapping: 'big5namn'},
            {name: 'descName', type: 'string', allowNull: true, mapping: 'big5description'},
            {name: 'tooltip', type: 'string', mapping: 'big5mouseover'},
            {name: 'indicator', type: 'string', mapping: 'valueid'},
            {name: 'invert', type: 'boolean', defaultValue: false, mapping: 'inverted'},
            {name: 'frequency', type: 'number', mapping: 'Svarsfrekvens'},
            {name: 'colors'}
        ]
    });
    Ext.define('TableModel', {
        extend: 'Ext.data.Model',
        fields: [
            {name: 'value', type: 'string', allowNull: true, mapping: 'V1'},
            {name: 'description', mapping: 'V2'}
        ]
    });
    Ext.define('DetailChartModel', {
        extend: 'Ext.data.Model',
        fields: [
            {name: 'unit', type: 'string', allowNull: true, mapping: 'Enhet'},
            {name: 'value', type: 'number', allowNull: true, mapping: 'Andel'}
        ]
    });
    Ext.create('Ext.data.Store', {
        storeId: 'TableStore',
        model: 'TableModel',
        autoLoad: false,
        proxy: {
            type: 'ajax',
            url: '/stratum/api/statistics/lvr/snabboversikt',
            reader: {
                type: 'json',
                rootProperty: 'data.tabell', 
            },
            extraParams: {
                // apikey: API_KEY,
                // unitid: UNIT_ID,
                // diagnos: DIAGNOSIS,
                panels: '1'
            },
            withCredentials: true,
            pageParam: false,
            startParam: false,
            limitParam: false
        }
    });
    Ext.create('Ext.data.Store', {
        storeId: 'DetailChartStore',
        model: 'DetailChartModel',
        autoLoad: false,
        proxy: {
            type: 'ajax',
            url: '/stratum/api/statistics/lvr/snabboversikt',
            reader: {
                type: 'json',
                rootProperty: 'data', 
                transform: function (data) {
                    var newData = [];
                    var unitData = {};
                    Ext.each(data.data, function(x) {
                        unitData[x.Enhet] = unitData[x.Enhet] || [];
                        unitData[x.Enhet].push(x);
                    });
                    Ext.Object.eachValue(unitData, function(unit) {
                        var tVal = {};
                        var i = 1;
                        Ext.Object.eachValue(unit, function(val) {
                            tVal['total' + (i)] = val.Antal;
                            tVal['ratio' + (i)] = val.Andel;
                            tVal['title' + (i)] = val.Utfall;
                            tVal['freq'] = parseFloat(val.Svarsfrekvens);
                            tVal['unit'] = val.Enhet;
                            i++;
                        });
                        newData.push(tVal);
                    });
                    return newData;
                }
            },
            extraParams: {
                // apikey: API_KEY,
                // unitid: UNIT_ID,
                // diagnos: DIAGNOSIS,
                panels: '0',
                indicators: '1002'
            },
            withCredentials: true,
            pageParam: false,
            startParam: false,
            limitParam: false
        },
        sorters: function(record) {
            return record.unit === 'Riket' ? -1 : 1;
        }
    });
    Ext.create('Ext.data.Store', {
        storeId: 'ratioGaugeStore',
        model: 'RatioGaugeModel',
        proxy: {
            type: 'ajax',
            url: '/stratum/api/statistics/lvr/snabboversikt/',
            reader: {type: 'json', rootProperty: 'data.indikatorer'},
            extraParams: {
                rinvoke: 1,
                // apikey: API_KEY,
                // unitid: UNIT_ID,
                // diagnos: DIAGNOSIS,
                panels: '1',
            },
            noCache: false,
            withCredentials: true,
            pageParam: '',
            startParam: '',
            limitParam: ''
        }
    });
})();

Ext.util.CSS.createStyleSheet(".gauge-btn .x-btn-inner{display:block}.gauge-btn .x-btn-text{vertical-align:top}.pull-left{float:left}.pull-right{float:right}.gauge-btn .value-text{width:65px;text-align:center;font-size:24px;line-height:24px;float:left}.gauge-btn .gauge-desc{width:70%;width:calc(100% - 107px);float:left;overflow:hidden;white-space:normal;font-size:11px;line-height:12px}.gauge-btn .gauge-icon{width:26px;font-size:24px;line-height:24px;font-family:fontawesome;float:right;margin:1px}.gauge-btn.gauge-btn-success{color:#3c763d;background-color:#dff0d8}.gauge-btn.gauge-btn-danger{color:#a94442;background-color:#f2dede}.gauge-btn.gauge-btn-info{color:#31708f;background-color:#d9edf7}.gauge-btn.gauge-btn-insufficient{color:#858585;background-color:#e0e0e0}.gauge-btn.gauge-btn-missing{color:#858585;background-color:#fff}.gauge-btn.gauge-btn-success.x-btn-over{background-color:#cae0b7}.gauge-btn.gauge-btn-danger.x-btn-over{background-color:#ebccd1}.gauge-btn.gauge-btn-info.x-btn-over{background-color:#cbe3f0}.gauge-btn.gauge-btn-insufficient.x-btn-over{background-color:#cecece}.gauge-btn.gauge-btn-missing.x-btn-over{background-color:#f7f7f7}.gauge-btn.gauge-btn-danger .gauge-icon{text-shadow:1px 1px 0 red;color:#f19999}.gauge-btn.gauge-btn-success .gauge-icon{text-shadow:1px 1px 0 #1d9d74;color:#4c4}");
(function () {

    /**
     * External widget configuration through stratum widget api params 
     */
    var isTemplate = window.isTemplate || function() {
        return true;
    }
    var templateVariables = window._devTemplateVariables || {
        diagnosis: '{{diagnosis}}',
        container: '{{ct}}'
    };
    var config = {
        unitId: typeof Profile !== 'undefined' ? Profile.Context.Unit.UnitCode : null,
        diagnosis: !isTemplate(templateVariables.diagnosis) ? templateVariables.diagnosis : 1,
        container: !isTemplate(templateVariables.container) ? templateVariables.container
            : (typeof Stratum !== 'undefined' && Stratum.containers && Stratum.containers['LVR/NewOverview'] || 'mainContainer')
    };
    
    var widget = function () {
        function toast(msg) {
            Ext.toast(msg, '', 't');
        }
        function createChart() {
            var chart = Ext.create('Ext.chart.Chart', {
                store: Ext.data.StoreManager.lookup('DetailChartStore'),
                hidden: true,
                animate: true,
                shadow: false,
                height: 400,
                columnWidth: 1,
                width: '100%',
                insetPadding: {
                    top: 55,
                    right: 25,
                    left: 25,
                    bottom: 25
                },
                margin: 2,
                style: {
                    border: '1px solid #ddd',
                    borderRadius: '3px'
                },
                colors: ['#206876', '#04859d', '#37b6ce', '#5fbdce', '#015666'],
                legend: {
                    // boxStrokeWidth: 0
                    dock: 'bottom'
                },
                axes: [{
                        type: 'numeric',
                        position: 'left',
                        minimum: 0,
                        grid: true,
                        dashSize: 0,
                        renderer: function (cmp, label) {return Ext.util.Format.number(label, '0%'); }
                    },
                    {
                        type: 'category',
                        position: 'bottom',
                        fields: ['unit']
                    }
                ]
            });

            return chart;
        }

        function createRatioGaugesContainer(onClick) {
            var ratioGCont = Ext.create('RC.ui.RatioGaugeContainer', {
                columnWidth: 1,
                store: Ext.data.StoreManager.lookup('ratioGaugeStore'),
                onClick: onClick
            });
            return ratioGCont;
        }

        function onGaugeClickFactory(chart, callback) {
            var store = chart.getStore();
            return function loadChartAndShow() {
                chart.setLoading('Laddar data...');
                populateChartData(chart, this.report.indicator, this.report.big5description, callback);
            };
        }

        function populateTableData(config) {
            var tableStore = Ext.StoreManager.lookup('TableStore');
            tableStore.load({
                params: {
                    diagnos: config.diagnosis
                }
            });
        }
        function populateRatioGaugeStore(config, cb) {
            var store = Ext.data.StoreManager.lookup('ratioGaugeStore');
            if (!store.isLoaded() && !store.isLoading()) {
                store.load({
                    params: {
                        diagnos: config.diagnosis
                    },
                    callback: function (records, operation, success) {
                        if (success) {
                            return cb();
                        } else {
                            toast('Kunde inte hämta data, var god försök igen.');
                        }

                    }
                });
            }
        }
        function getChartFields(store, fieldType) {
            var record = store.getAt(0);
            var fields = [];
            if(record) {
                Ext.each(Ext.Object.getKeys(record.data), function(field) {
                    if(field.indexOf(fieldType) === 0){
                        fields.push(field);
                    }
                })
            }
            return fields;
        }
        function getChartTitles(store) {
            titles = [];
            titleFields = getChartFields(store, 'title');
            Ext.each(titleFields, function(title){
               titles.push(store.getAt(0).get(title)); 
            });
            return titles;
        }
        function scrollToElement(element) {
            if (!element || !element.getY) {
                return;
            }
            (Ext.isChrome
                ? Ext.getBody()
                : Ext.get(
                    document.documentElement
                )).scrollTo('top', element.getY(), true);
        }
        function populateChartData(chart, indicator, description, callback) {
            var store = Ext.data.StoreManager.lookup('DetailChartStore');
            store.load({
                params: {
                    indicators: indicator
                },
                callback: function(records, operation, success) {
                    chart.suspendLayout = true;
                    var graphFields = getChartFields(store, 'ratio');
                    try {
                        chart.getSeries().length > 0 &&
                        chart.getSeries()[0].getSurface().removeAll();
                        chart.setLoading(false);
                        chart.show();
                        scrollToElement(chart.getEl());
                        Ext.isFunction(callback) && callback(records);
                    } catch (e) {
                        Ext.log(e);
                    }
                    var newmax = getMaxValue(chart.getStore().getData(), graphFields);
                    chart.getAxes()[0].setMaximum(newmax);
                    chart.redraw();
                    chart.setSeries({
                        type: 'bar',
                        // axis: 'left',
                        groupGutter: 0,
                        xField: 'unit',
                        yField: graphFields,
                        //must be set to avoid vml-bug in ie8
                        xPadding: 30,
                        stacked: false,
                        title: getChartTitles(store),
                        tooltip: {
                            // trackMouse: true,
                            renderer: function(tooltip, record, item) {
                                var antal = 'total', field = item.field;
                                if (field.indexOf('ratio') === 0) {
                                    antal += field.substr(5);
                                    tooltip.setHtml(
                                        Ext.String.format(
                                            '<b>{1}</b><br/>{0} observationer',
                                            record.get(antal),
                                            Ext.util.Format.number(
                                                record.get(item.field),
                                                '0.0%'
                                            )
                                        )
                                    );
                                }
                            }
                        }
                    });
                    
                    chart.setSprites({
                        type: 'text',
                        text: description,
                        textAlign: 'middle',
                        fontSize: 20,
                        width: chart.getWidth(),
                        height: 30,
                        x: chart.getWidth() / 2,
                        y: 30
                    });                 
                }
            });
        }
        function getMaxValue(data, fields) {
            var max = 0;
            fields.forEach(
              function(item) {
                  if (data.max(item) > max) {
                      max = data.max(item);
                  }
              }
            );
            return Math.ceil(max / 10) * 10;
        }
        function createTable () {
            return Ext.create('Ext.grid.Panel', {
                store: Ext.StoreManager.lookup('TableStore'),
                columnWidth: 1,
                width: '100%',
                margin: {
                    bottom: 20
                },
                hideHeaders: true,
                disableSelection: true,
                columns: [
                    { text: 'Beskrivning', cellWrap: true, flex: 1, dataIndex: 'description' },
                    { text: 'Värde', dataIndex: 'value' }
                ],
            });
        }
        function createFrequenceGauge () {
            var chart = Ext.create({
                xtype: 'heatgauge',
                style: {},
                margin: '8 0 0 0',
                limitField: 'limit',
                invertLimitField: 'invert',
                store: Ext.StoreManager.lookup('DetailChartStore'),
                valueField: 'freq',
                hidden: true,
                background: '#fff',
                width: 400,
                height: 95,
                insetPadding: {
                    top: 30,
                    right: 25,
                    left: 25,
                    bottom: 25
                }
            });
            return chart;
        }
        function init(container, config) {
            var chart, ratioGauges;
            populateTableData(config);
            table = createTable();
            chart = createChart();
            frequencyGauge = createFrequenceGauge();
            ratioGauges = createRatioGaugesContainer(
                onGaugeClickFactory(chart, function (records) {
                    var frequency = records && records[1].get('freq');
                    frequencyGauge.setSprites([{ 
                        type: 'text',
                        text: 'Enhetens svarsfrekvens för indikatorn',
                        textAlign: 'middle',
                        fontSize: 20,
                        width: 400,
                        height: 30,
                        x: 400/2,
                        y: 18
                    },{ 
                        type: 'text',
                        text: Ext.util.Format.number(frequency, '0 %'),
                        textAlign: 'middle',
                        fontSize: 20,
                        width: 400,
                        height: 30,
                        x: 400/2 + 3,
                        y: frequencyGauge.height
                    }]);
                    
                    frequencyGauge.show();
                })
            );

            Ext.create('Ext.container.Container', {
                renderTo: container,
                layout: {
                    type: 'vbox',
                    align: 'center'
                },
                items: [table, ratioGauges, chart, frequencyGauge]
            });

            populateRatioGaugeStore(config, function () {
                Ext.fly(container).unmask();
            });
        }
        return {
            init: init
        };
    }();

    Ext.application({
        name: 'LVR-ratioGauges',
        launch: function () {
            var container = Ext.fly(config.container);
            if (container){
                container.mask('Laddar data ...');
                widget.init(container, config);
            }
        }
    });
})();
