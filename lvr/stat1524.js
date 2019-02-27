
//Caching of data currently disabled due to context switches...
Repository.Local.LVRKOL = /*Repository.Local.LVRKOL ||*/ { //Calculates overview values from the data in 'unitOverviewData'
    //and appends them as a property to 'overviewKOL'
    overviewKOL: {
        '3087': {
            indicator: 'Spirometri',
            descName: 'med utförd <b>spirometri</b>',
            desc: 'Andel KOL-patienter med registrerad spirometri'
        },
        '3090': {
            indicator: 'Röker',
            descName: 'som <b>röker</b>',
            desc: 'KOL-Patienters Rökvanor',
            upperLimit: 0,
            invert: true,
            colors: ["#4F6228", "#9BBB59", "#C0504D"]
        },
        '3091': {
            indicator: 'Vaccinerad',
            descName: '<b>vaccinerade</b> för influensa',
            desc: 'Andel KOL-patienter med influensavaccinationsskydd ',
            upperLimit: 80,
            lowerLimit: 80,
            colors: ['#C0504D', '#9BBB59']
        },
        '3092': {
            indicator: '0 dagar',
            descName: '<b>fysisk akt. 0 dagar</b> i veckan',
            desc: 'Fördelning av Grad av fysisk aktivitet bland KOL-patienter',
            upperLimit: 0,
            invert: true,
            colors: ["#C0504D", "#F79646", "#9BBB59", "#4F6228"]
        },
        '3093': {
            indicator: 'Erhållit utbildning',
            descName: 'som erhållit <b>utbildning</b>',
            desc: 'Andel KOL-patienter som någon gång erhållit Patientutbildning',
            upperLimit: 80,
            lowerLimit: 40,
            colors: ['#C0504D', '#9BBB59']
        },
        '3094': {
            indicator: '>=2',
            descName: 'får <b>&gt;=2 exacerbationer</b> per år',
            desc: 'Fördelning av antal exacerbationer per år bland KOL-patienter',
            upperLimit: 0,
            invert: true,
            colors: ['#9BBB59', '#C0504D']
        },
        '3095': {
            indicator: 'Registrerade',
            descName: 'Registreringsandel',
            desc: 'Andel KOL-patienter med någon registrering',
            hidden: true
        },
        '3120': {
            indicator: '>30',
            descName: 'har <b>CAT &gt;30</b>',
            desc: 'CAT',
            upperLimit: 0,
            invert: true,
            colors: ["#4F6228", "#9BBB59", "#F79646", "#C0504D"]
        }
    }
};
    Ext.fly('mainContainer').mask('Laddar data ...');
    Repository.Local.Methods.initialize(Repository.Local.LVRKOL.overviewKOL, function() {
        var lvrkol = Repository.Local.LVRKOL;

        //Create big Gauge for registration ratio
        Ext.create('Ext.container.Container', {
            margin: '10px 10px',
            renderTo: 'mainContainer',
            layout: {
                type: 'vbox',
                align: 'center'
            },
            items: [{
                xtype: 'container',
                data: lvrkol.overviewKOL['3095'] || [],
                tpl: '{descName}',
                style: {
                    fontSize: '20px'
                },
                margin: '0 0 10px 0'
            }, {
                xtype: 'heatgauge',
                width: 120,
                height: 60,
                valueField: 'value',
                background: '#fff',
                lowerLimitField: 'lowerLimit',
                upperLimitField: 'upperLimit',
                store: Ext.create('Ext.data.JsonStore', {
                    fields: ['value', 'lowerLimit', 'upperLimit'],
                    data: [lvrkol.overviewKOL['3095']]
                })
            }, {
                xtype: 'container',
                data: lvrkol.overviewKOL['3095'],
                tpl: '{[Ext.util.Format.number(values.value || 0, "0%")]}',
                margin: '0 2px 0 10px',
                style: {
                    fontSize: '24px'
                }
            }]
        });
        /*
         * Create hidden bar chart for comparison with the registry
         * shown when clicking on gauges...
         */
        var chart = Ext.create('Ext.chart.Chart', {
            store: Ext.create('Ext.data.Store', {
                fields: ['unit', 'value']
            }),
            // theme: 'LVRTheme',
            hidden: true,
            animate: true,
            shadow: false,
            columnWidth: 1,
            height: 400,
            insetPadding: {top: 55, right: 25, left: 25, bottom: 25},
            margin: 2,
            style: {
                border: '1px solid #ddd',
                borderRadius: '3px'
            },
            legend: {
                dock: 'bottom'
                // boxStrokeWidth: 0
            },
            axes: [{
                type: 'numeric',
                position: 'left',
                minimum: 0,
                grid: true,
                dashSize: 0,
                renderer: function(a, b) { return Ext.util.Format.numberRenderer('0%')(b); }
            }, {
                type: 'category',
                position: 'bottom',
                fields: ['unit']
            }]
        });
        Ext.create('Ext.container.Container', {
            renderTo: 'mainContainer',
            layout: {
                type: 'column',
                align: 'center'
            },
            items: Repository.Local.Methods.getSmallGaugesInits(Repository.Local.LVRKOL.overviewKOL, chart, true)
        });
        Ext.fly('mainContainer').unmask();
    });
