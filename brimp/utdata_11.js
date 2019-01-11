
var RenderReOpStatistics=Repository.Local.Methods.RenderReOpStatistics;


var config11 = {
	chartID: '11',
	url: '/api/statistics/brimp/utdata_11?apikey=bK3H9bwaG4o%3D',
	validYnames: ['Andel_E'],
	yTitles: ['Reoperation (Min klnik)'],
	displayBarLabel: true,
	categoryAttrib: 'Tidskategori',
	flipChart: true,
	StackedChart: false,
	yAxisTitle: 'Andel',
	legendTitle: '',
	colors: ['#3CB6CE']
}

RenderReOpStatistics(true, 'utdata11', config11, 'Tid till reoperation av aktuellt implantat');

