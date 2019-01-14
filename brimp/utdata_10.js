
var RenderReOpStatistics=Repository.Local.Methods.RenderReOpStatistics;
var config10 = {
	chartID: '10',
	url: '/api/statistics/brimp/utdata_10?apikey=bK3H9bwaG4o%3D',
	validYnames: ['Andel_E'],
	validYnames2: ['Andel_R'],
	yTitles: ['Reoperation (Min klnik)'],
	yTitles2: ['Reoperation (BRIMP)'],
	displayBarLabel: true,
	displayBarLabel2: false,
	categoryAttrib: 'AlderKategori',
	flipChart: false,
	StackedChart: false,
	yAxisTitle: 'Andel',
	legendTitle: '',
	colors: ['#9DDBE7', '#3CB6CE']
}
RenderReOpStatistics(true, 'utdata10', config10, 'Åldersfördelning vid reoperation');
