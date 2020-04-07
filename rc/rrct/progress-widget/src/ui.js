
export function renderUI(model, container) {
    var formattedDate = Ext.Date.format(new Date(model.latestInclusionDate), "Y-m-d H:i");
    Ext.create("Ext.container.Container", {
        renderTo: container,
        margin: "0 0 20 0",
        items: [
            getChart(model), {
                xtype: "container",
                html: `
                    <p>Senast inkluderande enhet:</p>
                    <p>
                        <strong style="font-size: 16px;">${model.latestIncludedUnitName}</strong><br>
                        ${formattedDate}
                    </p>
                `
            }
        ]
    });
}

function getChart(model) {
    return Ext.create('Ext.chart.CartesianChart', {
        width: 150,
        height: 300,
        border: false,
        background: "#f1f1f1",
        animation: {
            easing: 'backOut',
            duration: 5000
        },
        store: {
            fields: ['name', 'numIncluded'],
            data: [
                {"name": "", "numIncluded": model.numIncluded}
            ]
        },  
        axes: [{
            type: 'numeric',
            position: 'left',
            maximum: model.inclusionGoal,
            majorTickSteps: 10,
            minorTickSteps: 1
        }, {
            type: 'category',
            position: 'bottom'
        }],
        series: [{
            type: 'bar',
            xField: 'name',
            yField: ['numIncluded'],
            axis: 'bottom',
            colors: ["#005B91"],
            tooltip: {
                trackMouse: true,
                renderer: function (toolTip, record) {
                    toolTip.setHtml(record.get('numIncluded') + ' patienter');
                }
            }
       }]
    });
}