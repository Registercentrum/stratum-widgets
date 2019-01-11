
var RenderReOpStatistics=Repository.Local.Methods.RenderReOpStatistics;
var config17 = {
	chartID: '17',
	url: '/api/statistics/brimp/utdata_17?apikey=bK3H9bwaG4o%3D',
	validYnames: ['Subfaciellt_Antal_E', 'Subglandulart_Antal_E', 'Submuskulart_Antal_E', 'Submusk_o_subgl_Antal_E'],
	yTitles: ['Subfaciellt', 'Subglandulärt', 'Submuskulärt', 'Submuskulärt och Subglandulärt'],
	displayBarLabel: true,
	categoryAttrib: 'Form_Ut',
	flipChart: true,
	StackedChart: true,
	filter: null,
	yAxisTitle: 'Antal',
	legendTitle: '',
	colors: ['#3CB6CE', '#614D7D', '#E98300', '#A2AD00']
}
RenderReOpStatistics();
RenderReOpStatistics.generateDynamicCharts(config17);
