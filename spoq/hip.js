
//grå:'#E3E4E5', lila:'#6F6789', oragne:'#EA9430', mörkbblå:'#0075A4', ljusblå:#77C7D2 grön:'#C6D069'
	var containerHtml=
	'<div>'+
	'<h1>Ålder (år) vid operation för höftfyseolys fördelat på kön</h1>'+
	'<div id="utdataHoft"></div>'+
	'<div id="utdataHoft2"></div>'+
	'<h1>Fördelning av glidningsvinkel mätt på sidobild eller frontalplan (grader)</h1>'+
	'<div id="utdataHoftGlidningsvinkelSidoFrontal"></div>'+
	'<div id="utdataHoftGlidningsvinkelSidoFrontal2"></div>'+
	'<h1>Operationsmetod vid operation för höftfyseolys</h1>'+
	'<div id="utdataHoftscreening"></div>'+
	'<div id="utdataHoftscreening2"></div>'+
	'</div>';
	
	Ext.create('Ext.container.Container', {
    renderTo:
        (Stratum.containers && Stratum.containers['SPOQ/utdata_hoft']) ||
        'main-container',
    html: containerHtml,
    listeners: {
        afterRender: function() {

	var configHoft = {
		url: '/stratum/api/statistics/spoq/agesexdistr/?registerid=2166',
		isPercentage:false,
		validYnames: ['Pojkar', 'Flickor'],
		categoryAttrib: 'Ålderskategori',
		isBarChart: true,
		legendText: 'Kön',
		fixedColors:['#0479A6', '#992B4E'],
		rotateText:false
	}
	
	var configHoftGlidningsvinkelSidoFrontal = {
		url: '/stratum/api/statistics/spoq/tmpscreening/?registerid=2166&sortorder=2',
		isPercentage:false,
		validYnames: ['10-<=30', '31-<=50', '>50', '<=110', '>110', 'Uppgift saknas'],
		categoryAttrib: 'metmetod',
		isBarChart: true,
		fixedColors:['#6F6789',  '#77C7D2', '#0075A4', '#EA9430', '#992B4E', '#E3E4E5'],
		legendText:' ',
		rotateText:false
	}
	
	var configHoftScreening = {
		url: '/stratum/api/statistics/spoq/tmpscreening/?registerid=2166&sortorder=3',
		isPercentage:true,
		validYnames: ['%'],
		categoryAttrib: 'SCFE_Op_OpMethod',
		isBarChart: true,
		legendText: '',
		//colors: [ '#6F6789',  '#C6D069', '#0075A4', '#EA9430', '#77C7D2',  '#E3E4E5' ],
		fixedColors: ['#77C7D2'],
		rotateText:true
	}
	 if (!Profile.Context) {
                document.getElementById('unitHeader1').style.visibility =
                    'hidden';
                document.getElementById('unitHeader2').style.visibility =
                    'hidden';
            }
	var renderStatistics=Repository.Local.Methods.renderStatistics;
	renderStatistics(true, 'utdataHoft', configHoft);
	renderStatistics(false, 'utdataHoft2', configHoft);
	renderStatistics(true, 'utdataHoftGlidningsvinkelSidoFrontal', configHoftGlidningsvinkelSidoFrontal);
	renderStatistics(false, 'utdataHoftGlidningsvinkelSidoFrontal2', configHoftGlidningsvinkelSidoFrontal);		
	renderStatistics(true, 'utdataHoftscreening', configHoftScreening);
	renderStatistics(false, 'utdataHoftscreening2', configHoftScreening);
	},
    },
});
