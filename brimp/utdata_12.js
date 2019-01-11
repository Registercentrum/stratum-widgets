
var RenderReOpStatistics=Repository.Local.Methods.RenderReOpStatistics;
var config12 = {
	chartID: '12',
	url: '/api/statistics/brimp/utdata_12?apikey=bK3H9bwaG4o%3D',
	validYnames: ['Andel_E'],
	yTitles: [],
	displayBarLabel: true,
	categoryAttrib: 'Indikation',
	flipChart: true,
	StackedChart: false,
	yAxisTitle: 'Andel',
	legendTitle: '',
	colors: ['#3CB6CE']
}
RenderReOpStatistics(true, 'utdata12', config12, 'Indikation till reoperation - Patientrapporterade besvär');
