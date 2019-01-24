{
    initialize: function (callbackFn) {
        var me = this,
            collectionDate = Ext.fly('data-collection-date'),
            __qregPVSettings = window.__qregPVSettings || null; // getglobalSettingsObject defined under htmlmarkup
        // collectionDate && collectionDate.setHtml(Ext.Date.format(new Date(), 'Y-m-d'));
        if (typeof Profile !== 'undefined') {
            Profile.APIKey = 'Hoe8m0raiO4=';
        }
        if (typeof __qregPVSettings === 'object') {
            me.qregPVSettings = Ext.apply(
                me._qregPVSettings(),
                __qregPVSettings
            );
            __qregPVSettings = null;
        } else {
            me.qregPVSettings = me._qregPVSettings();
        }
        if (!me._initOnce) {
            me._initializeDefinitions();
            me.initializeUnitStore();
            me.initializeIndicatorStore();
            me.initializeLatestDate(function (resp) {
                if (resp && resp.success) {
                    collectionDate &&
                        collectionDate.setHtml(
                            me.getCurrentDate('F Y')
                        );
                    me.getLocal()._unitStore.load({
                        callback: function () {
                            me.getLocal()._indicatorStore.load({
                                callback: function () {
                                    me._initializeWithDialog(
                                        function () {
                                            me.initializeCountStore();
                                            typeof callbackFn ===
                                                'function' &&
                                                callbackFn(me);
                                        }
                                    );
                                    // callbackFn(me);
                                }
                            });
                        }
                    });
                } else {
                    //TODO: Better errorhandling
                    Ext.log(resp && resp.message);
                }
            });
        } else {
            collectionDate &&
                collectionDate.setHtml(me.getCurrentDate('F Y'));
            typeof callbackFn === 'function' && callbackFn(me);
        }
        me._initOnce = me._initOnce || true;
    },
    _initializeWithDialog: function (callbackFn) {
        var me = this,
            cookieUnit = me.updateUnitFromCookie();
        if (cookieUnit) {
            callbackFn();
        } else {
            me.createPrimaryUnitInitilizer(function () {
                callbackFn();
                // me.storeUnitInCookie();
            });
        }
    },
    updateUnitFromCookie: function () {
        var unit = Ext.util.Cookies.get('_qregPVUnit');
        if (unit) {
            this.getLocal()._primaryClinic = unit;
        }
        return unit;
    },
    storeUnitInCookie: function () {
        //Currently low expireDate for testing...
        var unit = this.getPrimaryUnit(),
            expireDate = Ext.Date.add(new Date(), Ext.Date.YEAR, 1);
        if (unit) {
            Ext.util.Cookies.set('_qregPVUnit', unit, expireDate);
        }
    },
    clearCookie: function () {
        Ext.util.Cookies.clear('_qregPVUnit');
    },
    getCurrentDate: function (toStringFormat) {
        var d = new Date(
            this.getCurrentYear() + '/' + this.getCurrentMonth() + '/01'
        );
        if (toStringFormat) {
            return Ext.Date.format(d, toStringFormat);
        }
        return d;
    },
    getLocal: function () {
        //TODO: Fix cause of undefined when not
        Repository.Local.current = Repository.Local.current || {};
        return Repository.Local.current;
    },
    setCurrentMonth: function (month) {
        this.getLocal()._currentMonth = month;
    },
    getCurrentMonth: function () {
        return this.getLocal()._currentMonth || 12; //TODO: Implement initialization of month
    },
    getCurrentYear: function () {
        return this.getLocal()._currentYear || 2013; //TODO: Implement initialization of year
    },
    setCurrentYear: function (year) {
        this.getLocal()._currentYear = year;
    },
    getStartMonth: function () {
        var month = this.getCurrentMonth();
        return month === 12 ? 1 : (month + 1) % 13;
    },
    getStartYear: function () {
        var month = this.getCurrentMonth(),
            year = this.getCurrentYear();
        return month === 12 ? year : year - 1;
    },
    initializeUnitStore: function () {
        var conf = {
                model: typeof QRegPV.UnitModel !== 'undefined' ? QRegPV.UnitModel :
                 Ext.define('QRegPV.UnitModel', {
                    extend: 'Ext.data.Model',
                    fields: [{
                        name: 'UnitID',
                        mapping: 'key'
                    }, {
                        name: 'UnitName',
                        mapping: 'value'
                    }],
                    idProperty: 'UnitID'
                }),
                sorters: [{
                    property: 'UnitName'
                }],
                filters: [
                    function (a) {
                        return !!a.get('UnitID');
                    }
                ]
            },
            primaryId = 'QregPVUnitStore',
            secondaryId = primaryId + 'Secondary';
        this.getLocal()._unitStore = Ext.StoreManager.lookup(
            'QregPVUnitStore'
        );
  
        if (!this.getLocal()._unitStore) {
            this.getLocal()._unitStore = Ext.create(
                'Ext.data.Store',
                Ext.apply({
                        storeId: primaryId,
                        proxy: {
                            type: 'ajax',
                            cors: true, //TODO: remove in production
                            url: '/stratum/api/metadata/domains/map/5656',
                            reader: {
                                type: 'objecttoarray',
                                rootProperty: 'data.Unit'
                            }
                        },
                        listeners: {
                            load: function (s, records) {
                                var secondaryStore = Ext.StoreManager.lookup(
                                    secondaryId
                                );
                                if (secondaryStore) {
                                    secondaryStore.loadData(records);
                                }
                            }
                        }
                    },
                    conf
                )
            );
            this.getLocal()._unitStoreSecondary = Ext.create(
                'Ext.data.Store',
                Ext.apply({
                        storeId: secondaryId
                    },
                    conf
                )
            );
        }
    },
    initializeLatestDate: function (callback) {
        var repo = this;
        Ext.Ajax.request({
            url: '/stratum/api/aggregate/QRegPV/QRegPV/Total/Max(Q_Month)/Q_Year',
            localCall: true, //TODO: Remove
            method: 'get',
            success: function (response) {
                var obj = Ext.decode(response.responseText);
                var currYear = Ext.max(Ext.Object.getKeys(obj.data)),
                    collectionDate = Ext.fly('data-collection-date'),
                    currMonth;
                if (currYear) {
                    currMonth = obj.data[currYear];
                    repo.setCurrentYear(parseInt(currYear, 10));
                    repo.setCurrentMonth(currMonth);
                    collectionDate &&
                        collectionDate.setHtml(
                            currYear + '-' + currMonth + '-01'
                        );
                    Ext.isFunction(callback) &&
                        callback({
                            success: true
                        });
                    return;
                }
                Ext.isFunction(callback) &&
                    callback({
                        success: false,
                        message: 'Failed parsing year'
                    });
            },
            failure: function (resp) {
                Ext.isFunction(callback) &&
                    callback({
                        success: false,
                        message: 'Server side failure ' + resp.status
                    });
            }
        });
    },
    initializeIndicatorStore: function () {
        this.getLocal()._indicatorStore = Ext.StoreManager.lookup(
                'QregPVIndicatorStore'
            ) ||
            Ext.create('Ext.data.Store', {
                storeId: 'QregPVIndicatorStore',
                model: Ext.define('QRegPV.IndicatorModel', {
                    extend: 'Ext.data.Model',
                    fields: [{
                        name: 'Indicator',
                        mapping: 'key'
                    }, {
                        name: 'IndicatorName',
                        mapping: 'value'
                    }],
                    idProperty: 'Indicator'
                }),
                proxy: {
                    type: 'ajax',
                    url: '/stratum/api/metadata/domains/map/5655',
                    reader: {
                        type: 'objecttoarray',
                        rootProperty: 'data.Indikatorer'
                    }
                }
            });
    },
    initializeCountStore: function () {
        var me = this,
            currentUnit = me.getLocal()._primaryClinic || me.getHSAID();
        me.getLocal()._countStoreKrs = Ext.StoreManager.lookup(
                'QRegPVCountStoreKrs'
            ) ||
            Ext.create('Ext.data.Store', {
                storeId: 'QRegPVCountStoreKrs',
                fields: [
                    'Q_Varde',
                    'Date',
                    'Q_Unit',
                    'Q_Year',
                    'Q_Month',
                    'Q_Indicator',
                    'Sickness'
                ],
                filters: [
                    function (v) {
                        return v.get('Q_Indicator') === 2023;
                    }
                ]
            });
        me.getLocal()._countStoreHyp = Ext.StoreManager.lookup(
                'QRegPVCountStoreHyp'
            ) ||
            Ext.create('Ext.data.Store', {
                storeId: 'QRegPVCountStoreHyp',
                fields: [
                    'Q_Varde', {
                        name: 'Date',
                        convert: function (v, r) {
                            return Ext.Date.format(
                                new Date(
                                    r.get('Q_Year') +
                                    '/' +
                                    r.get('Q_Month') +
                                    '/1'
                                ),
                                'F Y'
                            );
                        }
                    }, {
                        name: 'Q_Unit',
                        convert: function (v) {
                            return me.getUnitName(v);
                        }
                    },
                    'Q_Month',
                    'Q_Year',
                    'Q_Indicator', {
                        name: 'Sickness',
                        convert: function (v, r) {
                            return Ext.String.startsWith(
                                    r.get('Q_Indicator') + '',
                                    '10'
                                ) ?
                                'hypertoni' :
                                'kranskärlssjukdom';
                        }
                    }
                ],
                proxy: {
                    type: 'ajax',
                    localCall: true, //TODO: remove change...
                    reader: {
                        type: 'json',
                        rootProperty: 'data'
                    }
                },
                loadCountData: function (HSAID, year, month) {
                    var loadFn = function () {
                        var url = '/stratum/api/registrations/form/2179?query=Q_Year%20eq%20{1},Q_Month%20eq%20{2},Q_Indicator%20in%20{3}|{4},Q_Unit%20eq%20{0}';
                        this.proxy.url = Ext.String.format(
                            url,
                            HSAID,
                            year,
                            month,
                            1022,
                            2023
                        );
                        this.load();
                    };
                    if (this.isLoading()) {
                        this.on('load', loadFn, this, {
                            single: true
                        });
                    } else {
                        loadFn.call(this);
                    }
                },
                listeners: {
                    load: function (s, records) {
                        me.getLocal()._countStoreKrs.loadData(records);
                    }
                },
                filters: [
                    function (v) {
                        return v.get('Q_Indicator') === 1022;
                    }
                ]
            });
        // Initialize preselected unit data
        if (currentUnit) {
            me.loadCountData(
                currentUnit,
                me.getCurrentYear(),
                me.getCurrentMonth()
            );
        }
    },
    getMainStore: function (conf) {
        var me = this,
            mainStore = Ext.StoreManager.lookup('QRegPV.MainStore'),
            first = false;
        if (!mainStore) {
            first = true;
            mainStore = Ext.create('Ext.data.Store', {
                storeId: 'QRegPV.MainStore',
                model: 'qRegMainModel',
                proxy: {
                    // url: '../src/json/twounit.json',
                    type: 'ajax',
                    localCall: true, //TODO: remove change...
                    reader: {
                        type: 'twounitreader',
                        rootProperty: 'data',
                        unitSpecificFields: [
                            'Q_Varde',
                            'Q_Unit',
                            'Q_Namnare'
                        ]
                    }
                },
                // todo, call this method on widjet sitch? and set defaults here?
                loadNewUnitData: function (skipLoad) {
                    var firstHSAID = me.getPrimaryUnit(),
                        secondHSAID = me.getSecondaryUnit();
                    var offSet = me.qregPVSettings.offsetStartDate || -1;
                    var startDate = Ext.Date.format(
                        Ext.Date.add(
                            me.getCurrentDate(),
                            Ext.Date.YEAR,
                            offSet
                        ),
                        'Y-m-d'
                    );
                    var loadFn = function () {
                        var url = '/stratum/api/registrations/form/2179?query=Q_Date%20gt%20' +
                            startDate +
                            ',Q_Unit%20in%20{0}|{1}';
                        // var filters;
                        Ext.isFunction(this.beforeLoadFn) &&
                            this.beforeLoadFn.call(this);
  
                        this.proxy.url = Ext.String.format(
                            url,
                            firstHSAID,
                            secondHSAID
                        );
                        this.proxy.reader.setFirstUnit(firstHSAID);
                        this.proxy.reader.setSecondUnit(secondHSAID);
  
                        if (!skipLoad) {
                            //filters = this.getFilters();
                            this.clearFilter(true); //Needed since extjs 5 does not remove filtered records.
                            // this.setFilters(filters);
                            // console.log(filters);
                            this.load({
                                scope: this,
                                callback: function () {
                                    Ext.isFunction(this._currFilter) &&
                                        this.filter(this._currFilter);
                                }
                            });
                        }
                    };
                    if (this.isLoading()) {
                        this.on('load', loadFn, this, {
                            single: true
                        });
                    } else {
                        loadFn.call(this);
                    }
                },
                listeners: {
                    load: function () {
                        Ext.isFunction(this.onLoadFn) &&
                            this.onLoadFn.apply(this, arguments);
                    }
                }
            });
            mainStore.loadNewUnitData();
        }
        // Initialize view specific config
        if (Ext.isObject(conf)) {
            //--Clean up
            delete mainStore.beforeLoadFn;
            delete mainStore.onLoadFn;
            delete mainStore.checkboxFilter;
            delete mainStore.viewIds;
            delete mainStore._currFilter;
            mainStore.clearFilter(true);
            //--
            if (Ext.isFunction(conf.beforeLoadFn)) {
                mainStore.beforeLoadFn = conf.beforeLoadFn;
            }
            if (Ext.isFunction(conf.onLoadFn)) {
                mainStore.onLoadFn = conf.onLoadFn;
            }
            // if (Ext.isArray(conf.viewIds)) {
            //     mainStore.viewIds = conf.viewIds;
            // }
            // if (Ext.isFunction(conf.checkboxFilter)) {
            //     mainStore.checkboxFilter = conf.checkboxFilter;
            // }
            if (!first && conf.triggerLoadFn) {
                mainStore.fireEvent(
                    'load',
                    mainStore,
                    mainStore.getRange()
                );
            }
            if (Ext.isFunction(conf.filter)) {
                mainStore._currFilter = conf.filter;
                mainStore.filterBy(conf.filter);
            }
            if (Ext.isArray(conf.sorters)) {
                mainStore.sort(conf.sorters);
            }
        }
        return mainStore;
    },
    loadCountData: function (HSAID, year, month) {
        if (this.getLocal()._countStoreHyp) {
            this
                .getLocal()
                ._countStoreHyp.loadCountData(HSAID, year, month);
        }
    },
    createPrimaryUnitInitilizer: function (callbackFn) {
        var me = this;
        Ext
            .create('Ext.window.Window', {
                // renderTo: Ext.getBody(),
                width: 500,
                // height: 300,
                layout: 'vbox',
                bodyPadding: 10,
                glyph: 0xf013,
                items: [
                    Ext.create('QRegPV.ClinicCombo', {
                        isPrimary: true,
                        width: '100%',
                        fieldLabel: 'Välj din vårdcentral',
                        skipStoreLoad: true
                    })
                ],
                y: 200,
                resizable: false,
                modal: true,
                buttons: [{
                    text: 'Avbryt',
                    handler: function () {
                        var parentWin = this.up('window', 2);
                        parentWin && parentWin.close();
                    }
                }],
                listeners: {
                    close: function () {
                        callbackFn();
                        this.destroy();
                    }
                }
            })
            .show();
    },
    /**
        * CSS to style the config-panel
        * A bit excessive for use with the inline stylesheet creation..
        * Should preferably be handled in a component specific css file, part of the theme
        */
    _initConfigPanelCSS: function () {
        if (!this._initConfigPanelCSS.initialized) {
            Ext.util.CSS.createStyleSheet(
                '.qreg-config-panel {' +
                '   background: #eee;' +
                '   float: right;' +
                '   border-radius: 16px;' +
                '   border: 1px solid #c7c7c7;' +
                '}' +
                '.qreg-config-panel .x-title-icon {' +
                '   font-size: 26px;' +
                '   color: #555;' +
                '   cursor: pointer;' +
                '   right: 6px;' +
                '   position: absolute;' +
                '   top: -2px;' +
                '}' +
                '.qreg-config-panel:after {' +
                'content: ".";' +
                'visibility: hidden;' +
                'display: block;' +
                'height: 0;' +
                'clear: both;' +
                '}' +
                '.qregpv-clinic-input input::-ms-clear{display: none;}' +
                '.qreg-config-over { cursor: pointer; background:#ddd; border-radius: 16px;background:-moz-linear-gradient(top,#cacaca 0,#eee 100%);' +
                'background:-webkit-gradient(linear,left top,left bottom,color-stop(0%,#cacaca),color-stop(100%,#eee));' +
                'background:-webkit-linear-gradient(top,#cacaca 0,#eee 100%);background:-o-linear-gradient(top,#cacaca 0,#eee 100%);' +
                'background:-ms-linear-gradient(top,#cacaca 0,#eee 100%);background:linear-gradient(to bottom,#cacaca 0,#eee 100%);}' +
                '.qreg-config-over .x-title-icon{color:#333;-webkit-animation:spin 1s ease 1;-moz-animation:spin 1s ease 1;animation:spin 1s ease 1}@-moz-keyframes spin{100%{-moz-transform:rotate(360deg)}}@-webkit-keyframes spin{100%{-webkit-transform:rotate(360deg)}}@keyframes spin{100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}' +
                '.qreg-combo-list li {padding: 5px 9px; border-bottom: 1px solid #F4F4F4; font-size: 14px;}'
            );
            this._initConfigPanelCSS.initialized = true;
        }
    },
    _qregPVSettings: function () {
        return {
            colors: ['#B39C85', '#FF5335'],
            indicatorType: '10',
            viewIds: ['1001', '1004', '1003', '1005', '1006'],
            selectedIndicator: '1001'
        };
    },
    getHSAID: function () {
        try {
            return Profile.Context.Unit.HSAID;
        } catch (e) {
            Ext.log({
                    level: 'error',
                    dump: e,
                    stack: true
                },
                'Could not find HSAID'
            );
            return null;
        }
    },
    getIndicatorName: function (id) {
        var indicator = this.getLocal()._indicatorStore.getById(id);
        return indicator && indicator.get('IndicatorName');
    },
    getIndicatorType: function () {
        return this.qregPVSettings.indicatorType;
    },
    getCombinedMeasureIds: function () {
        return this.qregPVSettings.combinedMeasureIds || [];
    },
    getCombinedIndicatorId: function () {
        return this.qregPVSettings.combinedIndicatorId;
    },
    getPopulationIndicatorId: function () {
        return this.qregPVSettings.populationIndicatorId;
    },
    getViewIds: function () {
        return this.qregPVSettings.viewIds;
    },
    getCurrentId: function () {
        return this.qregPVSettings.selectedIndicator ||
            this.qregPVSettings.viewIds[0];
    },
    getViewIdFirstOrDefault: function () {
        return this.qregPVSettings.viewId &&
            this.qregPVSettings.viewIds[0];
    },
    _getAlphaColor: function (color, alpha) {
        var aColor = Ext.draw.Color.fly(color);
        return Ext.String.format(
            'rgba({0}, {1}, {2}, {3})',
            aColor.r,
            aColor.g,
            aColor.b,
            alpha
        );
    },
    getPrimaryColor: function (alpha) {
        var color = this.qregPVSettings.colors &&
            this.qregPVSettings.colors[1] ||
            '#555';
        return Ext.isNumeric(alpha) ?
            this._getAlphaColor(color, alpha) :
            color;
    },
    getSecondaryColor: function (alpha) {
        var color = this.qregPVSettings.colors &&
            this.qregPVSettings.colors[0] ||
            '#999';
        return Ext.isNumeric(alpha) ?
            this._getAlphaColor(color, alpha) :
            color;
    },
    getPrimaryUnit: function () {
        return this._getUnit();
    },
    getSecondaryUnit: function () {
        return this._getUnit(true);
    },
    _getUnit: function (isSecondary) {
        var unit;
        try {
            unit = isSecondary ?
                this.getLocal()._secondaryClinic :
                this.getLocal()._primaryClinic;
        } catch (e) {
            unit = null;
        } finally {
            unit = !unit ?
                isSecondary ? this.getRegionHSAID() : this.getHSAID() :
                unit;
        }
        return unit;
    },
    getUnitName: function (id) {
        var unit = this.getLocal()._unitStore.getById(id);
        return unit && unit.get('UnitName');
    },
    getRegionHSAID: function () {
        return 'SE2321000131-E000000000001';
    },
    isHypertoni: function () {
        return !!this.qregPVSettings.hypertoni;
    },
    setRankingSprites: function (chart, indicator, place, total) {
        chart.setSprites([{
            type: 'text',
            text: 'Ranking bland alla vårdcentraler*:',
            textAlign: 'left',
            fontSize: 18,
            fontFamily: 'open_sans, sans-serif',
            width: 200,
            height: 20,
            x: 5,
            y: 15
        }, {
            type: 'text',
            text: Ext.String.format(
                '{0} ({1} av {2} från vänster)',
                indicator,
                place,
                total
            ),
            textAlign: 'left',
            fontSize: 14,
            fontFamily: 'open_sans, sans-serif',
            width: 200,
            height: 20,
            x: 5,
            y: 35
        }]);
    },
    jsonToCSV: function (arrData, title) {
        var CSV = '';
        var firstRow = arrData[0];
        var keys = [];
        Ext.Object.each(firstRow, function (propName) {
            if (firstRow.hasOwnProperty(propName)) {
                keys.push(propName);
            }
        });
        CSV += keys.join(';');
        CSV += '\r\n';
  
        Ext.each(arrData, function (row) {
            var rowString = '';
            Ext.Array.each(keys, function (propName) {
                var value = row[propName];
                if(typeof value === 'number') {
                    value = value.toLocaleString();
                }
                if(value instanceof Date) {
                    value = value.toLocaleDateString();
                }
                rowString += value + ';';
            });
            rowString = rowString.slice(0, -1);
            CSV += rowString + '\r\n';
        });
  
  
        if (CSV === '') {
            return;
        }
  
        //Generate a file name
        var fileName = 'Tabell_' + title.replace(/\s/g, '_') + '.csv';
  
  
        var data = 'data:text/plain;charset=utf-8,' + encodeURIComponent(CSV);
        return {
            filename: fileName,
            data: data
        }
    },
    setRankingTitle: function (store, chart, subtitleFn) {
        var count = store.count(),
            primaryUnit = this.getPrimaryUnit(),
            place = store.find('Q_Unit', primaryUnit) + 1,
            indicator = Ext.isFunction(subtitleFn) ?
            subtitleFn(store.first()) :
            this.getIndicatorName(
                store.first().get('Q_Indicator')
            );
  
        this.setRankingSprites(chart, indicator, place, count);
    },
    initializeLoader: function () {
        if (Ext.LoadMask) {
            Ext.override(Ext.LoadMask, {
                cls: 'greg-loader',
                msgCls: 'qreg-loader-msg',
                msg: 'Laddar...',
                height: 160,
                width: 136
            });
            Ext.util.CSS.createStyleSheet(
                '.greg-loader {' +
                '   border: 0;' +
                '   padding: 0;' +
                '   background-color: #fff;' +
                '   -webkit-background-clip: padding-box;' +
                '   background-clip: padding-box;' +
                '   border: 1px solid #C8C8C8;' +
                '   border-radius: 6px;' +
                '   outline: 0;' +
                '   -webkit-box-shadow: 0 3px 9px rgba(0,0,0,0.3);' +
                '   box-shadow: 0 3px 9px rgba(0,0,0,0.3);' +
                '   ' +
                '}' +
                '.qreg-loader-msg,.qreg-loader-msg .x-mask-msg-text {' +
                '   padding: 0;' +
                '   border: 0;' +
                '   width: 100%; height: 100%;' +
                '   background-color: #fff;' +
                '   text-align: center;' +
                // '   text-transform: uppercase;' +
                '   font-size: 11px;' +
                '   color: #696969;' +
                '}' +
                '.qreg-loader-msg .x-mask-msg-text{' +
                '   background-image: url(../img/qregring.gif);' +
                '   background-position: center 30px;' +
                '   padding: 115px 0 0 0;' +
                '}'
            );
        }
    },
    //Initializes all the Ext 'defines' used by the QRegPV app
    _initializeDefinitions: function () {
        var repo = this;
        this._initConfigPanelCSS();
        Ext.namespace('QRegPV');
        // this.initializeLoader();
        Ext.util.CSS.createStyleSheet(
            '.chartbox {' +
            '    padding: 9px 14px 9px 14px;' +
            '    margin-left: 10px;' +
            '    background-color: #f7f7f9;' +
            '    border: 1px solid #e1e1e8;' +
            '    border-radius: 4px;' +
            '}' +
            // '.super-tip { background-color: #fff; }'+
            // '.super-tip .x-tip-header-body { border: none; padding-bottom: 0; padding-top: 8px; }' +
            // '.super-tip .x-tip-header-text { font-size: 14px !important; font-style: normal;}' +
            '.box-description{ margin: 0; padding: 0; font-style: italic; font-size: 16px; }' +
            '.qregpv-slider .x-slider-thumb:hover {cursor: pointer;background-color: #bebebe;}' +
            '.qregpv-slider .x-slider-thumb {background: #dedede;border-radius: 8px;width: 16px;height: 16px;border: 1px solid #666;}' +
            '.qreg-count-row {margin: 0 6px 4px 0; padding-right: 5px; text-align: right;font-style: italic; font-size: 12px; color: #555;}' +
            '.qreg-count-row p {margin: 0;}' +
            '.qreg-count-row .qreg-count-desc {font-size: 10px;}' +
            '.qreg-count-row.x-view-item-focused { outline: 0 !important; }'
        );
  
        typeof qRegMainModel !== 'undefined' || Ext.define('qRegMainModel', {
            extend: 'Ext.data.Model',
            fields: [{
                    name: 'Q_Indicator',
                    type: 'string'
                }, {
                    name: 'Date',
                    convert: function (v, r) {
                        return Ext.Date.parse(
                            r.get('Q_Year') + '-' + r.get('Q_Month'),
                            'Y-n'
                        );
                    }
                }, {
                    name: 'IndicatorName',
                    convert: function (v, record) {
                        return repo.getIndicatorName(
                            record.get('Q_Indicator')
                        );
                    }
                }, {
                    name: 'Q_Month',
                    type: 'number'
                }, {
                    name: 'Q_Year',
                    type: 'number'
                },
                'Q_Unit_0', {
                    name: 'Q_Varde_0',
                    type: 'number'
                },
                'Q_Unit_1', {
                    name: 'Q_Varde_1',
                    type: 'number'
                },
                'Q_Namnare_0',
                'Q_Namnare_1'
            ]
        });
  
        !Ext.ClassManager.isCreated('QRegPV.TipStore') &&
            Ext.define('QRegPV.TipStore', {
                extend: 'Ext.data.Store',
                sorters: [{
                    property: 'Year',
                    direction: 'ASC'
                }, {
                    property: 'Month',
                    direction: 'ASC'
                }],
                setLastLoadedIndicator: function (indicatorId) {
                    this._lastLoadedIndicator = indicatorId;
                },
                getLastLoadedIndicator: function () {
                    return this._lastLoadedIndicator;
                },
                clearLastLoadedIndicator: function () {
                    delete this._lastLoadedIndicator;
                }
            });
  
        /**
            * Defines a standard look for the charts visible in tooltips.
            */
        !Ext.ClassManager.isCreated('QRegPV.TipChart') &&
            Ext.define('QRegPV.TipChart', {
                extend: 'Ext.chart.Chart',
                animation: false,
                shadow: false,
                // colors: [this.getPrimaryColor(), this.getSecondaryColor()],
                width: 280,
                height: 180,
                padding: 0,
                margin: 0,
                innerPadding: {
                    top: 10,
                    bottom: 10,
                    right: 6
                },
                legend: false,
                constructor: function (config) {
                    config.series = [];
                    Ext.Array.each(config.yField, function (yField) {
                        config.series.push({
                            type: 'line',
                            // axis: 'left',
                            xField: config.xField,
                            yField: yField,
                            showMarkers: false,
                            style: {
                                lineWidth: 2.5
                            },
                            useDarkerStrokeColor: false
                        });
                    });
                    config.axes = [{
                        type: 'numeric',
                        position: 'left',
                        // fields: config.yField,
                        renderer: function (axis, label) {
                            return Ext.util.Format.number(label, '0 %');
                        },
                        label: {
                            fontSize: 11
                        },
                        // maximum: 100,
                        // minimum: 0,
                        majorTickSteps: 4,
                        // minorTickSteps: 0,
                        grid: true,
                        style: {
                            strokeStyle: '#ccc'
                        }
                    }, {
                        type: 'category',
                        position: 'bottom',
                        // fields: config.xField,
                        label: {
                            rotate: {
                                degrees: 270
                            },
                            fontSize: 11
                                //, fontStyle: '#999'
                        },
                        renderer: function (axis, label) {
                            return Ext.isDate(label) ?
                                Ext.Date.format(
                                    label,
                                    label.getMonth() === 0 ? 'Y' : 'M'
                                ) :
                                label;
                        },
                        style: {
                            strokeStyle: '#ccc'
                        }
                    }];
                    this.callParent([config]);
                }
            });
        !Ext.ClassManager.isCreated('QRegPV.ConfigContainer') &&
            Ext.define('QRegPV.ConfigContainer', {
                extend: 'Ext.container.Container',
                initComponent: function () {
                    var innerPanel = Ext.create('QRegPV.ConfigPanel', {
                        items: this.items,
                        width: this.width,
                        layout: this.layout
                    });
                    Ext.apply(this, {
                        layout: {
                            type: 'hbox',
                            pack: 'end'
                                // align: 'stretch'
                        },
                        items: [innerPanel],
                        collapse: function () {
                            innerPanel.collapse();
                        }
                    });
                    this.callParent();
                }
            });
        !Ext.ClassManager.isCreated('QRegPV.ConfigPanel') &&
            Ext.define('QRegPV.ConfigPanel', {
                extend: 'Ext.panel.Panel',
                collapseFn: function (p) {
                    p.normalWidth = p.normalWidth ||
                        p.ownerCt && p.ownerCt.getWidth();
                    p.setWidth(
                        p.collapsed ? p.normalWidth : p.collapsedWidth
                    );
                    // p.setTitle(p.getWidth() === p.normalWidth ? '' : 'Alternativ');
                },
                initComponent: function () {
                    var collapsedWidth = 50 || 120 || 50;
                    this.on({
                        beforecollapse: this.collapseFn,
                        beforeexpand: this.collapseFn,
                        boxready: function () {
                            //Start expanded if no primary unit was preselected
                            if (!repo.getPrimaryUnit()) {
                                this.expand();
                            }
                        }
                    });
                    Ext.apply(this, {
                        unstyled: true,
                        collapsible: true,
                        headerOverCls: 'qreg-config-over',
                        cls: 'qreg-config-panel',
                        titleCollapse: true,
                        collapsedWidth: collapsedWidth,
                        width: collapsedWidth, //start collapsed
                        header: {
                            height: 32
                        },
                        // title: 'Alternativ',
                        bodyPadding: '0 20px 20px 20px',
                        hideCollapseTool: true,
                        glyph: 0xf013,
                        collapsed: true,
                        animCollapse: false,
                        normalWidth: this.width
                    });
                    this.callParent();
                }
            });
        //Requires chart property...
        !Ext.ClassManager.isCreated('QRegPV.ChartSaveButton') &&
            Ext.define('QRegPV.ChartSaveButton', {
                alias: 'widget.chartsavebutton',
                extend: 'Ext.button.Button',
                initComponent: function () {
                    Ext.applyIf(this, {
                        glyph: 0xf080,
                        handler: this.saveChart
                    });
                    this.callParent();
                },
                saveChart: function () {
                    if (!this.chart || !this.chart.save) {
                        return;
                    }
                    this.chart.save({
                        type: 'image/png',
                        width: 640,
                        height: 400
                    });
                }
            });
  
        !Ext.ClassManager.isCreated('QRegPV.BaseIndicatorCombo') &&
            Ext.define('QRegPV.BaseIndicatorCombo', {
                extend: 'Ext.form.field.ComboBox',
                alias: 'widget.qregbasecombo',
                flex: 1,
                editable: true,
                sendEmptyText: false,
                checkChangeEvents: ['change', 'keyup'], //Stratum specific fix
                // autoRender: true,
                selectOnFocus: true,
                listConfig: {
                    cls: 'qreg-combo-list',
                    border: false
                },
                queryMode: 'local',
                labelAlign: 'top',
                margin: '0 0 20px 0',
                labelCls: 'qreg-config-label',                        
                fieldBodyCls: 'qregpv-clinic-input',
                fieldLabel: '',
                constructor: function (config) {
                    config = Ext.merge(config, {
                        fieldStyle: {
                            'background-color': '#FFF !important',
                            'font-size': '15px',
                            height: '32px',
                            // 'border-width': '1px 1px 1px 5px',
                            
                            'border-color': '#ccc',
                            'border-style': 'solid',
                            padding: '5px'
                        }
                    });
                    this.callParent([config]);
                },
                
                msgTarget: 'side',                        
                listeners: {
                    focus: function () {
                        this.expand();
                    }
                }
            });
  
        !Ext.ClassManager.isCreated('QRegPV.IndicatorCombo') &&
            Ext.define('QRegPV.IndicatorCombo', {
                extend: 'QRegPV.BaseIndicatorCombo',
                alias: 'widget.qregindicatorcombo',
                fieldLabel: 'Välj Indikator',
                constructor: function (config) {
                    this.callParent([config]);
                }
            });
  
        !Ext.ClassManager.isCreated('QRegPV.ClinicCombo') &&
            Ext.define('QRegPV.ClinicCombo', {
                extend: 'QRegPV.BaseIndicatorCombo',
                alias: 'widget.qregcliniccombo',
                // height: 48,
                config: {
                    isPrimary: false
                },
                _singleListeners: {},
                // initComponent: function () {
                //     var me = this;
                //     Ext.Object.merge(me, {
                //         _singleListeners: {}
                //     });
                //     // me.addEvents('storeLoad');
                //     me.callParent(arguments);
                // },
                applyIsPrimary: function (newValue) {
                    var store = Ext.data.StoreManager.lookup(
                        'QregPVUnitStore' +
                        (newValue ? '' : 'Secondary')
                    );
                    this.store = store;
  
                    Ext.Object.merge(this, {
                        store: Ext.data.StoreManager.lookup(
                            'QregPVUnitStore' +
                            (newValue ? '' : 'Secondary')
                        ),
                        value: (
                            newValue ?
                            repo.getPrimaryUnit() :
                            repo.getSecondaryUnit()
                        ),
                        fieldStyle: {
                            'border-left-color': (
                                newValue ?
                                repo.getPrimaryColor() :
                                repo.getSecondaryColor()
                            )
                        },
                        fieldLabel: (
                            this.fieldLabel ||
                            (newValue ?
                                'Välj primär vårdcentral' :
                                'Välj vårdcentral för jämförelse')
                        ),
                        columnDataIndex: (
                            newValue ? 'Q_Varde_0' : 'Q_Varde_1'
                        )
                    });
                    return newValue;
                },
                constructor: function (config) {
                    config = Ext.merge(config || {}, {
                        fieldStyle: {
                            'border-left-width': '5px'
                        }
                    });
                    this.callParent([config]);
                },
                typeAhead: true,
                anyMatch: true,
                forceSelection: true,
                displayField: 'UnitName',
                valueField: 'UnitID',
                emptyText: 'Sök efter en vårdcentral...',
                hideTrigger: true,
                afterBodyEl: '<span style="position: absolute;right: 9px;top: 30px; font-size: 18px; font-family: fontawesome; color: #DADADA; pointer-events: none;">&#xf002;</span>',
                listeners: {
                    select: function (cb, records) {
                        var me = this,
                            unitId;
                        if (!records) {
                            return;
                        }
                        unitId = Ext.isArray(records) ?
                            records[0].get('UnitID') :
                            records.get('UnitID');
                        if (this.isPrimary) {
                            repo.getLocal()._primaryClinic = unitId;
                            if (!this.skipStoreLoad) {
                                repo.loadCountData(
                                    unitId,
                                    repo.getCurrentYear(),
                                    repo.getCurrentMonth()
                                );
                            }
                            repo.storeUnitInCookie();
                        } else {
                            repo.getLocal()._secondaryClinic = unitId;
                        }
                        if (!this.skipStoreLoad) {
                            repo.getMainStore().loadNewUnitData();
                        }
                        // repo.getMainStore().loadNewUnitData(this.isPrimary ? this.getValue() : null, this.isPrimary ? null : this.getValue());
                        //Collapse container on change
                        window.setTimeout(
                            function () {
                                var parentPanel = me.up('panel', 1),
                                    parentWindow = me.up('window', 2);
                                if (parentWindow) {
                                    parentWindow.close();
                                } else if (parentPanel) {
                                    //Weird bug where IE8 gets widthModel undefined error when animation is turned of
                                    parentPanel.collapse(
                                        Ext.Component.DIRECTION_TOP,
                                        Ext.isIE
                                    );
                                }
                            },
                            100
                        );
                    }
                },
                addSingleListener: function (event, eventFn) {
                    if (this._singleListeners[event]) {
                        this.un(event, this._singleListeners[event]);
                    }
                    this._singleListeners[event] = eventFn;
                    this.addListener(
                        event,
                        this._singleListeners[event],
                        this
                    );
                },
                getOtherCombo: function () {
                    return this._otherCombo;
                },
                setOtherCombo: function (c) {
                    this._otherCombo = c;
                }
            });
        !Ext.ClassManager.isCreated('QRegPV.TwoUnitReader') &&
            Ext.define('QRegPV.TwoUnitReader', {
                extend: 'Ext.data.reader.Json',
                alias: 'reader.twounitreader',
                rootProperty: 'data',
                unitSpecificFields: ['Q_Varde', 'Q_Unit'],
                fieldFormat: '{0}_{1}',
                setFirstUnit: function (hsaid) {
                    this.firstUnit = typeof hsaid === 'string' ?
                        hsaid :
                        this.firstUnit;
                },
                setSecondUnit: function (hsaid) {
                    this.secondUnit = typeof hsaid === 'string' ?
                        hsaid :
                        this.secondUnit;
                },
                getFirstUnit: function () {
                    return this.firstUnit;
                },
                getSecondUnit: function () {
                    return this.secondUnit;
                },
                getFirstFieldInstance: function (field) {
                    return Ext.String.format(
                        this.fieldFormat,
                        field,
                        0
                    );
                },
                getSecondFieldInstance: function (field) {
                    return Ext.String.format(
                        this.fieldFormat,
                        field,
                        1
                    );
                },
                getResponseData: function (aResponse) {
                    var me = this,
                        oj, data, tmp = {},
                        newData = [];
                    try {
                        oj = aResponse.responseJson ? aResponse.responseJson : Stratum.JSON.decode(aResponse.responseText);
                        data = oj[this.getRootProperty()];
  
                        Ext.each(data, function (r) {
                            var m = {},
                                fieldInstanceFn;
                            if (
                                me.getFirstUnit() &&
                                r['Q_Unit'] === me.getFirstUnit()
                            ) {
                                fieldInstanceFn = me.getFirstFieldInstance;
                            } else if (
                                me.getSecondUnit() &&
                                r['Q_Unit'] === me.getSecondUnit()
                            ) {
                                fieldInstanceFn = me.getSecondFieldInstance;
                            } else {
                                return;
                            }
                            tmp[r['Q_Indicator']] = tmp[
                                r['Q_Indicator']
                            ] || {};
                            tmp[r['Q_Indicator']][r['Q_Year']] = tmp[
                                r['Q_Indicator']
                            ][r['Q_Year']] || {};
                            Ext.each(me.unitSpecificFields, function (
                                f
                            ) {
                                m[fieldInstanceFn.call(me, f)] = r[f];
                                delete r[f];
                            });
                            if (!tmp[r['Q_Indicator']][r['Q_Year']][
                                    r['Q_Month']
                                ]) {
                                tmp[r['Q_Indicator']][r['Q_Year']][
                                    r['Q_Month']
                                ] = r;
                                newData.push(r);
                            }
                            Ext.merge(
                                tmp[r['Q_Indicator']][r['Q_Year']][
                                    r['Q_Month']
                                ],
                                m
                            );
                        });
                        oj[this.getRootProperty()] = newData;
                        Ext.isFunction(this._extendResponseFn) &&
                            this._extendResponseFn(
                                oj[this.getRootProperty()]
                            );
                        return oj;
                    } catch (ex) {
                        return this.nullResultSet;
                    }
                }
            });
        !Ext.ClassManager.isCreated('QRegPV.CountView') &&
            Ext.define('QRegPV.CountView', {
                extend: 'Ext.view.View',
                initComponent: function () {
                    this.store = this.hypertoni ?
                        'QRegPVCountStoreHyp' :
                        'QRegPVCountStoreKrs';
                    this.tpl = new Ext.XTemplate(
                        '<tpl for=".">',
                        this.generateTemplateEl(
                            '{Q_Varde} med {Sickness}, {Date}',
                            '{Q_Unit}'
                        ),
                        '</tpl>'
                    );
                    this.emptyText = this.generateTemplateEl(
                        'Registreringar saknas',
                        '(avser senaste tidsperiod för vald primär vårdcentral)'
                    );
                    this.callParent();
                },
                loadMask: false,
                width: '100%',
                deferEmptyText: false,
                itemSelector: '.qreg-count-row',
                generateTemplateEl: function (mainContent, description) {
                    return Ext.String.format(
                        '<div class="qreg-count-row" style="border-right: 4px solid ' +
                        (this.hypertoni ? '#E98300' : '#614D7D') +
                        '"">' +
                        '<p class="qreg-count-count">{0}</p>' +
                        '<p class="qreg-count-desc">{1}</p>' +
                        '</div>',
                        mainContent,
                        description
                    );
                }
            });
        //TODO: Remove after stratum deploy...
        //Temporarily available unit stratum has been updated...
        window.scrollToTop = function (offset) {
            (Ext.isChrome ?
                Ext.getBody() :
                Ext.get(document.documentElement)).scrollTo(
                'top',
                typeof offset === 'number' ? offset : 0,
                true
            );
        };
    }
  }