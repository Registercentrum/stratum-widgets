
var RenderReOpStatistics=Repository.Local.Methods.RenderReOpStatistics;
var config13 = {
	chartID: '13',
	url: '/api/statistics/brimp/utdata_13?apikey=bK3H9bwaG4o%3D',
	validYnames: ['Imp_Andel_E'],
	validYnames2: ['Exp_Andel_E'],
	yTitles: ['Implantat'],
	yTitles2: ['Expander'],
	displayBarLabel: true,
	displayBarLabel2: true,
	categoryAttrib: 'Status',
	flipChart: true,
	StackedChart: false,
	yAxisTitle: 'Andel',
	legendTitle: '',
	colors: ['#614D7D', '#3CB6CE']
}
RenderReOpStatistics(true, 'utdata13', config13, 'Peroperativ status - Protesrelaterat');
