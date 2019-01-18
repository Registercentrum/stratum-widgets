
(function() {
    if (
        window.Repository &&
        window.Repository.Local &&
        window.Repository.Local.Methods &&
        window.Repository.Local.Methods.initializedMethods
    ) {
        init();
    } else {
        Ext.Ajax.request({
            url: '/stratum/api/metadata/registers/125',
            method: 'GET',
            params: {
                APIKey: 'bK3H9bwaG4o=',
            },
            callback: function(o, success, resp) {
                var data = Stratum.JSON.decode(resp.responseText).data;

                var widgetScript = Stratum.JSON.decode(data.WidgetScript);
                widgetScript.relURL = '/stratum/';
                widgetScript.initializedMethods = true;

                window.Repository = { Local: { Methods: widgetScript } };
                window.Profile = window.Profile || {};
                init();
            },
        });
    }
    function init() {
        var container =
            (window.Stratum &&
                window.Stratum.containers &&
                window.Stratum.containers['QRegPV/RegistrationViewKS']) ||
            'main-container';
        window.__qregPVSettings = {
            colors: ['#CDC9BC', '#E98300'],
        };
        Repository.Local.Methods.initialize(function(_m) {
            var hypIndicators = [
                    '1016',
                    '1017',
                    '1018',
                    '1019',
                    '1020',
                    '1021',
                ],
                krsIndicators = [
                    '2017',
                    '2018',
                    '2019',
                    '2020',
                    '2021',
                    '2022',
                ],
                clinicComboPrimary,
                clinicComboSecondary,
                currMonth = _m.getCurrentMonth(),
                currYear = _m.getCurrentYear(),
                startMonth = _m.getStartMonth(),
                startYear = _m.getStartYear(),
                clinicChangeFn,
                tipChart,
                tipChart2,
                hypStore,
                krsStore,
                tipStore,
                configPanel,
                chartConfig;

            krsStore = Ext.create('Ext.data.Store', {
                fields: [
                    {
                        name: 'Q_Indicator',
                        type: 'string',
                    },
                    'Q_Month',
                    'Q_Year',
                    'Q_Unit_0',
                    'Q_Varde_0',
                    'Q_Unit_1',
                    'Q_Varde_1',
                ],
                sorters: [
                    {
                        property: 'Q_Indicator',
                        direction: 'DESC',
                    },
                ],
            });
            tipStore = Ext.create('QRegPV.TipStore', {
                fields: [
                    'Date',
                    'Q_Indicator',
                    'Q_Month',
                    'Q_Year',
                    'Q_Unit_0',
                    'Q_Varde_0',
                    'Q_Unit_1',
                    'Q_Varde_1',
                ],
                sorters: [
                    {
                        property: 'Date',
                        direction: 'ASC',
                    },
                ],
                sortOnLoad: false,
                filters: [
                    function(item) {
                        return item.get('Q_Year') === startYear
                            ? item.get('Q_Month') >= startMonth
                            : item.get('Q_Year') === currYear &&
                                  item.get('Q_Month') <= currMonth;
                    },
                ],
            });
            var charts = {};
            hypStore = _m.getMainStore({
                beforeLoadFn: function() {
                    charts.hypertoni &&
                        charts.hypertoni.setLoading('Laddar...');
                    charts.kransk && charts.kransk.setLoading('Laddar...');
                },
                onLoadFn: function(store, records) {
                    krsStore.clearFilter(true);
                    tipStore.clearFilter(true);
                    krsStore.loadData(records);
                    tipStore.loadData(records);
                    krsStore.filterBy(function(item) {
                        return (
                            Ext.Array.contains(
                                krsIndicators,
                                item.get('Q_Indicator')
                            ) &&
                            item.get('Q_Month') === currMonth &&
                            item.get('Q_Year') === currYear
                        );
                    });
                    charts.hypertoni && charts.hypertoni.setLoading(false);
                    charts.kransk && charts.kransk.setLoading(false);
                },
                triggerLoadFn: true,
                filter: function(item) {
                    return (
                        Ext.Array.contains(
                            hypIndicators,
                            item.get('Q_Indicator')
                        ) &&
                        item.get('Q_Month') === currMonth &&
                        item.get('Q_Year') === currYear
                    );
                },
                sorters: [
                    {
                        property: 'Q_Indicator',
                        direction: 'DESC',
                    },
                ],
            });
            tipChart = Ext.create('QRegPV.TipChart', {
                shadow: false,
                colors: ['#E98300', '#CDC9BC'],
                store: tipStore,
                yField: ['Q_Varde_0', 'Q_Varde_1'],
                xField: 'Date',
            });
            tipChart2 = tipChart.cloneConfig({
                colors: ['#614D7D', '#CDC9BC'],
            });
            chartConfig = [
                {
                    chartName: 'hypertoni',
                    colors: ['#E98300', '#CDC9BC'],
                    height: 300,
                    tipChart: tipChart,
                    store: hypStore,
                },
                {
                    chartName: 'kransk',
                    tipChart: tipChart2,
                    colors: ['#614D7D', '#CDC9BC'],
                    store: krsStore,
                },
            ];
            Ext.each(chartConfig, function(chart) {
                charts[chart.chartName] = Ext.create(
                    'Ext.chart.CartesianChart',
                    {
                        colors: chart.colors,
                        plugins: {
                            ptype: 'chartitemevents',
                            moveEvents: true,
                        },
                        innerPadding: {
                            right: 30,
                        },
                        tipChart: chart.tipChart,
                        height: 300,
                        store: chart.store,
                        shadow: false,
                        animate: true,
                        flipXY: true,
                        margin: '0 0 30px 0',
                        legend: {
                            docked: 'bottom',
                            boxStrokeWidth: 0,
                        },
                        axes: [
                            {
                                type: 'numeric',
                                position: 'bottom',
                                maximum: 100,
                                minimum: 0,
                                hidden: true,
                            },
                            {
                                type: 'category',
                                position: 'left',
                                label: {
                                    renderer: function(v) {
                                        return Ext.util.Format.capitalize(v);
                                    },
                                    textAlign: 'right',
                                    color: '#333',
                                },
                                style: {
                                    strokeStyle: '#aaa',
                                },
                            },
                        ],
                        series: [
                            {
                                type: 'bar',
                                axis: 'bottom',
                                stacked: false,
                                label: {
                                    display: 'outside',
                                    field: ['Q_Varde_0', 'Q_Varde_1'],
                                    renderer: function(v) {
                                        return Ext.util.Format.number(
                                            v,
                                            '0.0 %'
                                        );
                                    },
                                    fontSize: 10,
                                },
                                renderer: function(sprite, config) {
                                    var field = sprite.getField();
                                    if (field === 'Q_Varde_0') {
                                        return {
                                            x: config.x + 3,
                                        };
                                    } else if (field === 'Q_Varde_1') {
                                        return {
                                            x: config.x - 3,
                                        };
                                    }
                                },
                                yField: ['Q_Varde_0', 'Q_Varde_1'],
                                xField: ['IndicatorName'],
                                tips: {
                                    style: {
                                        background: '#fff',
                                    },
                                    items: {
                                        xtype: 'container',
                                        layout: 'fit',
                                        items: [chart.tipChart],
                                    },
                                    trackMouse: true,
                                },
                                listeners: {
                                    itemmouseover: function(series, item) {
                                        var indicator = item.record.get(
                                            'Q_Indicator'
                                        );
                                        if (
                                            tipStore.getLastLoadedIndicator() !==
                                            indicator
                                        ) {
                                            tipStore.clearFilter(true);
                                            tipStore.filterBy(function(item2) {
                                                return (
                                                    indicator ===
                                                    item2.get('Q_Indicator')
                                                );
                                            });
                                            tipStore.sort();
                                            tipStore.setLastLoadedIndicator(
                                                indicator
                                            );
                                        }
                                    },
                                },
                            },
                        ],
                    }
                );
            });

            clinicComboPrimary = Ext.create('QRegPV.ClinicCombo', {
                isPrimary: true,
            });
            clinicComboSecondary = Ext.create('QRegPV.ClinicCombo', {});

            clinicChangeFn = function() {
                var me = this,
                    val = me.getValue(),
                    titles,
                    series;
                tipStore.clearLastLoadedIndicator();
                Ext.Object.each(charts, function(chartType, chart) {
                    series = chart.getSeries() && chart.getSeries()[0];
                    if (!series) {
                        return;
                    }
                    if (!Ext.isArray(series.getTitle())) {
                        series.setTitle(['Val saknas', 'Val saknas']);
                    }
                    if (val) {
                        titles = series.getTitle();
                        titles[me.isPrimary ? 0 : 1] = me.getRawValue();
                        series.setTitle(titles);
                    }
                });
            };

            clinicComboPrimary.addSingleListener('select', clinicChangeFn);
            clinicComboSecondary.addSingleListener('select', clinicChangeFn);

            clinicChangeFn.call(clinicComboPrimary);
            clinicChangeFn.call(clinicComboSecondary);

            Ext.Object.each(charts, function(k, chart) {
                chart.refreshLegendStore();
            });

            configPanel = Ext.create('QRegPV.ConfigContainer', {
                margin: '0 0 20px 0',
                layout: {
                    type: 'vbox',
                    align: 'stretch',
                },
                items: [clinicComboPrimary, clinicComboSecondary],
            });

            Ext.widget('container', {
                renderTo: container,
                layout: {
                    type: 'vbox',
                    align: 'stretch',
                },
                items: [
                    configPanel,
                    {
                        xtype: 'container',
                        html: '<h2>Hypertoni:</h2>',
                    },
                    Ext.create('QRegPV.CountView', {
                        hypertoni: true,
                    }),
                    charts.hypertoni,
                    {
                        xtype: 'container',
                        html: '<h2>Kranskärlssjukdom:</h2>',
                    },
                    Ext.create('QRegPV.CountView', {
                        hypertoni: false,
                    }),
                    charts.kransk,
                ],
            });
        });
    }
})();
