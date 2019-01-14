
var RenderReOpStatistics=Repository.Local.Methods.RenderReOpStatistics;
var config15 = {
	chartID: '15',
	url: '/api/statistics/brimp/utdata_15?apikey=bK3H9bwaG4o%3D',
	validYnames: ['Imp_Andel_E'],
	validYnames2: ['Exp_Andel_E'],
	yTitles: ['Implantat'],
	yTitles2: ['Expander'],
	displayBarLabel: true,
	displayBarLabel2: true,
	categoryAttrib: 'Atgard',
	flipChart: true,
	StackedChart: false,
	yAxisTitle: 'Andel',
	legendTitle: '',
	colors: ['#614D7D', '#3CB6CE']
}
RenderReOpStatistics(true, 'utdata15', config15, 'Åtgärd');
