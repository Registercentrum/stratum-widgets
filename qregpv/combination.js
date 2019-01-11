
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
                var data = Ext.decode(resp.responseText).data;

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
                window.Stratum.containers['QRegPV/CombinationKS']) ||
            'main-container';
        Repository.Local.Methods.initialize(function(_m) {
            var clinicComboPrimary,
                clinicComboSecondary,
                currMonth = _m.getCurrentMonth(), //TODO: Better solution
                currYear = _m.getCurrentYear(), //TODO: Better solution
                startMonth = _m.getStartMonth(),
                startYear = _m.getStartYear(),
                clinicChangeFn,
                scatterStore,
                combinationStore,
                rankingChart,
                combinedMeasureChart,
                scatterTitle,
                rankingChartContainer,
                rankingChartDescription,
                configContainer,
                primaryGradient,
                secondaryGradient;

            secondaryGradient = Ext.create('Ext.draw.gradient.Linear', {
                degrees: 90,
                stops: [
                    {
                        offset: 0,
                        color: _m.getSecondaryColor(0.5),
                    },
                    {
                        offset: 0.5,
                        color: 'rgba(255,255,255,0)',
                    },
                ],
            });
            primaryGradient = Ext.create('Ext.draw.gradient.Linear', {
                degrees: 90,
                stops: [
                    {
                        offset: 0,
                        color: _m.getPrimaryColor(0.5),
                    },
                    {
                        offset: 0.5,
                        color: 'rgba(255,255,255,0)',
                    },
                ],
            });
            scatterStore = Ext.create('Ext.data.Store', {
                fields: ['Q_Varde', 'Q_Unit'],
                sorters: [
                    {
                        property: 'Q_Varde',
                        direction: 'ASC',
                    },
                ],
                proxy: {
                    type: 'ajax',
                    localCall: true, //TODO: remove change...
                    reader: {
                        type: 'json',
                        rootProperty: 'data',
                    },
                },
                listeners: {
                    load: function() {
                        rankingChart.setLoading(false);
                    },
                },
                loadNewMonthData: function(year, month) {
                    var loadFn = function() {
                        rankingChart.setLoading('Laddar...');
                        var url =
                            '/stratum/api/registrations/form/2179?query=Q_Year%20eq%20{0},Q_Month%20eq%20{1},Q_Indicator%20eq%20{2}';
                        this.proxy.url = Ext.String.format(
                            url,
                            year,
                            month,
                            _m.getCombinedIndicatorId()
                        );
                        this.load(); //true?
                    };
                    if (this.isLoading()) {
                        this.on('load', loadFn, this, {
                            single: true,
                        });
                    } else {
                        loadFn.call(this);
                    }
                },
            });

            combinationStore = _m.getMainStore({
                beforeLoadFn: function() {
                    combinedMeasureChart &&
                        combinedMeasureChart.setLoading('Laddar...');
                },
                onLoadFn: function() {
                    combinedMeasureChart &&
                        combinedMeasureChart.setLoading(false);
                },
                triggerLoadFn: true,
                filter: function(item) {
                    return (
                        item.get('Q_Indicator') ===
                            _m.getCombinedIndicatorId() &&
                        (item.get('Q_Year') === startYear
                            ? item.get('Q_Month') >= startMonth
                            : item.get('Q_Year') === currYear &&
                              item.get('Q_Month') <= currMonth)
                    );
                },
                sorters: [
                    {
                        property: 'Date',
                        direction: 'ASC',
                    },
                ],
            });
            clinicComboPrimary = Ext.create('QRegPV.ClinicCombo', {
                isPrimary: true,
            });
            clinicComboSecondary = Ext.create('QRegPV.ClinicCombo', {});
            scatterTitle = Ext.create('Ext.container.Container', {
                html:
                    '<span class="box-description">Klicka på en punkt för att visa rankning bland andra enheter för vald månad</span>',
            });
            rankingChart = Ext.create('Ext.chart.Chart', {
                animate: true,
                shadow: false,
                store: scatterStore,
                colors: [_m.getSecondaryColor()],
                margin: '10px 0',
                height: 400,
                hidden: true,
                insetPadding: {
                    top: 60,
                },
                innerPadding: 14,
                background: '#F7F7F9',
                axes: [
                    {
                        type: 'numeric',
                        position: 'left',
                        majorTickSteps: 5,
                        minimum: 0,
                        maximum: 100,
                        grid: {
                            style: {
                                stroke: '#ccc',
                                'stroke-dasharray': [2, 2],
                            },
                        },
                        style: {
                            strokeStyle: '#F7F7F9',
                        },
                        renderer: function(axis, label) {
                            return Ext.util.Format.number(label, '0 %');
                        },
                    },
                    {
                        type: 'category',
                        position: 'bottom',
                        hidden: true,
                    },
                ],
                series: [
                    {
                        type: 'scatter',
                        xField: 'Q_Unit',
                        yField: 'Q_Varde',
                        isThisClinic: function(record) {
                            return (
                                record.get('Q_Unit') ===
                                clinicComboPrimary.getValue()
                            );
                        },
                        marker: {
                            type: 'diamond',
                            scale: 2,
                            lineWidth: 2,
                        },
                        renderer: function(
                            sprite,
                            config,
                            rendererConfig,
                            index
                        ) {
                            try {
                                if (
                                    sprite
                                        .getStore()
                                        .getAt(index)
                                        .get('Q_Unit') ===
                                    clinicComboPrimary.getValue()
                                ) {
                                    return {
                                        scale: 3,
                                        fill: _m.getPrimaryColor(),
                                        stroke: Ext.draw.Color.fly(
                                            _m.getPrimaryColor()
                                        ).createDarker(0.1),
                                    };
                                } else {
                                    return {
                                        scale: 2,
                                        fill: _m.getSecondaryColor(),
                                        stroke: Ext.draw.Color.fly(
                                            _m.getSecondaryColor()
                                        ).createDarker(0.1),
                                    };
                                }
                            } catch (e) {}
                        },
                        tooltip: {
                            trackMouse: true,
                            renderer: function(tooltip, storeItem) {
                                tooltip.setHtml(
                                    Ext.String.format(
                                        '<b>{0}</b><br/>{1}<br/>Plats {2} av {3}',
                                        _m.getUnitName(storeItem.get('Q_Unit')),
                                        Ext.util.Format.number(
                                            storeItem.get('Q_Varde'),
                                            '0.0 %'
                                        ),
                                        storeItem.store.indexOf(storeItem) + 1,
                                        storeItem.store.count()
                                    )
                                );
                            },
                        },
                        highlight: true,
                        highlightCfg: {
                            fill: _m.getPrimaryColor(),
                            stroke: _m.getPrimaryColor(),
                            scale: 2.5,
                        },
                    },
                ],
                listeners: {
                    boxready: function() {
                        window.scrollToTop(rankingChartContainer.getY());
                    },
                },
            });
            rankingChartDescription = Ext.create('Ext.container.Container', {
                hidden: true,
                html: '<i>*) Punktdiagrammet visar vårdcentralens ranking bland samtliga vårdcentraler, för det senaste rapporterade värdet.</i>'
            });
            rankingChartContainer = Ext.create('Ext.container.Container', {
                cls: 'chartbox',
                margin: '20px 0',
                layout: {
                    type: 'vbox',
                    align: 'stretch',
                },
                items: [scatterTitle, rankingChart, rankingChartDescription],
            });

            function getSeriesConfiguration(order) {
                return {
                    type: 'line',
                    fill: true,
                    cls: 'testcls',
                    axis: 'left',
                    useDarkerStrokeColor: false,
                    xField: 'Date',
                    yField: 'Q_Varde_' + (order ? '0' : '1'),
                    title: 'Val saknas',
                    marker: {
                        type: 'circle',
                        size: 4,
                        radius: 7,
                        fill: '#fff',
                        margin: 4,
                        'stroke-width': 4,
                    },
                    style: {
                        fill: order ? primaryGradient : secondaryGradient, //'url(#' + (order ? (_m.isHypertoni() ? 'hypertoni' : 'kransk') : 'first') + ')',
                        'stroke-width': 3,
                    },
                    // highlight: {
                    //     fillStyle: Ext.draw.Color.fly(order ? _m.getPrimaryColor() : _m.getSecondaryColor()).createLighter(0.2),
                    //     radius: 10,
                    //     strokeStyle: order ? _m.getPrimaryColor() : _m.getSecondaryColor(),
                    //     lineWidth: 5
                    // },
                    tooltip: {
                        trackMouse: true,
                        style: {
                            // background: '#fff',
                        },
                        padding: 3,
                        renderer: function(tooltip, storeItem) {
                            var unit, value, date, denominator;
                            if (
                                !storeItem.get('Q_Unit_' + (order ? '0' : '1'))
                            ) {
                                tooltip.update('<em>Registrerad data saknas</em>');
                                return;
                            }
                            unit = _m.getUnitName(
                                storeItem.get('Q_Unit_' + (order ? '0' : '1'))
                            );
                            value = Ext.util.Format.number(
                                storeItem.get('Q_Varde_' + (order ? '0' : '1')),
                                '0.0 %'
                            );
                            date = Ext.Date.format(
                                storeItem.get('Date'),
                                'F Y'
                            );
                            denominator = storeItem.get(
                                'Q_Namnare_' + (order ? '0' : '1')
                            );
                            tooltip.setHtml(
                                Ext.String.format(
                                    '{0}<br/><b>{1}</b> ({2})<br/>{3} uppfyller registrering<hr/><i>Klicka för att se ranking nedan.</i>',
                                    unit,
                                    value,
                                    date,
                                    denominator
                                )
                            );
                        },
                    },
                    listeners: {
                        itemmouseup: function(series, item) {
                            var record = item.record,
                                year = record.get('Q_Year'),
                                month = record.get('Q_Month');

                            if (rankingChart.isHidden()) {
                                scatterTitle.destroy();
                                rankingChartDescription.show();
                                rankingChart.show();
                            } else {
                                window.scrollToTop(
                                    rankingChartContainer.getY()
                                );
                            }

                            scatterStore.loadNewMonthData(year, month);
                        },
                    },
                };
            }
            combinedMeasureChart = Ext.create('Ext.chart.CartesianChart', {
                animate: true,
                shadow: false,
                innerPadding: {
                    top: 10,
                },
                plugins: {
                    ptype: 'chartitemevents',
                },
                colors: [_m.getPrimaryColor(), _m.getSecondaryColor()],
                store: combinationStore,
                height: 400,
                scatterStore: scatterStore,
                getSelectedScatter: function() {
                    return this.__selectedScatter;
                },
                setSelectedScatter: function(seriesName) {
                    this.__selectedScatter = seriesName;
                },
                legend: {
                    docked: 'bottom',
                    style: {
                        boxStrokeWidth: 0,
                        padding: 15,
                        itemSpacing: 30,
                    },
                },
                axes: [
                    {
                        type: 'numeric',
                        position: 'left',
                        style: {
                            strokeStyle: '#fff',
                        },
                        renderer: function (axis, label) {return Ext.util.Format.numberRenderer('0.0 %')(label); },
                        dashSize: 0,
                        grid: true,
                    },
                    {
                        type: 'category',
                        position: 'bottom',
                        style: {
                            strokeStyle: '#fff',
                        },
                        renderer: function(axis, label) {
                            return Ext.isDate(label)
                                ? Ext.Date.format(
                                      label,
                                      label.getMonth() === 0 ? 'Y' : 'M'
                                  )
                                : label;
                        },
                    },
                ],
                series: [getSeriesConfiguration(1), getSeriesConfiguration(0)],
            });
            scatterStore.on('datachanged', function(store) {
                _m.setRankingTitle(store, rankingChart, function(record) {
                    return Ext.String.capitalize(
                        Ext.Date.format(
                            new Date(
                                record.get('Q_Year') +
                                    '/' +
                                    record.get('Q_Month') +
                                    '/01'
                            ),
                            'F Y'
                        )
                    );
                });
            });
            configContainer = Ext.create('QRegPV.ConfigContainer', {
                margin: '0 0 20px 0',
                layout: {
                    type: 'vbox',
                    align: 'stretch',
                },
                items: [clinicComboPrimary, clinicComboSecondary],
            });
            Ext.create('Ext.container.Container', {
                renderTo: container,
                layout: {
                    type: 'vbox',
                    align: 'stretch',
                },
                items: [
                    configContainer,
                    Ext.create('QRegPV.CountView', {
                        hypertoni: _m.isHypertoni(),
                    }),
                    combinedMeasureChart,
                    rankingChartContainer,
                ],
            });

            //Initialize combo boxes for changing clinic
            clinicChangeFn = function() {
                var val = this.getValue();
                if (val) {
                    try {
                        combinedMeasureChart
                            .getSeries()
                            [!this.isPrimary ? 1 : 0].setTitle([
                                this.getRawValue(),
                            ]);
                    } catch (e) {
                        Ext.log('Could not set legend title');
                    }
                }
                if (this.isPrimary && !rankingChart.isHidden()) {
                    scatterStore.fireEvent('datachanged', scatterStore);
                    _m.setRankingTitle(scatterStore, rankingChart, function(
                        record
                    ) {
                        return Ext.String.capitalize(
                            Ext.Date.format(
                                new Date(
                                    record.get('Q_Year') +
                                        '/' +
                                        record.get('Q_Month') +
                                        '/01'
                                ),
                                'F Y'
                            )
                        );
                    });
                }
            };

            clinicComboPrimary.addSingleListener('select', clinicChangeFn);
            clinicComboSecondary.addSingleListener('select', clinicChangeFn);
            combinedMeasureChart.refreshLegendStore();

            clinicChangeFn.call(clinicComboPrimary);
            clinicChangeFn.call(clinicComboSecondary);
            combinedMeasureChart.redraw();
            //END
        });
    }
})();
//# sourceURL=QRegPV/CombinationKS
