
var RenderReOpStatistics=Repository.Local.Methods.RenderReOpStatistics;

var currentDate = new Date();

var year = currentDate.getFullYear();
var month = currentDate.getMonth();
var day = 1;

var dt = new Date(year, month, day);
dt = dt.setDate(dt.getDate() - 1);
dt = new Date(dt);

var year = dt.getFullYear();
var month = dt.getMonth();
var day = dt.getDate();

month++;
var fromYear = year - 2;
var fromMonth = month - 11;
if (fromMonth <= 0) {
	fromMonth = 12 + fromMonth;
}

var fromDay = '01';
if (fromMonth < 10) {
	fromMonth = '0' + fromMonth;
}
if (month < 10) {
	month = '0' + month;
}

if (day < 10) {
	day = '0' + day;
}

var fromDate = fromYear + '-' + fromMonth + '-' + fromDay;
var toDate = year + '-' + month + '-' + day;

var config09 = {
	chartID: '09',
	url: '/api/statistics/brimp/utdata_09?start_month=' + fromDate + '&end_month=' + toDate + '&apikey=bK3H9bwaG4o%3D',
	validYnames: ['Antal_E'],
	validYnames2: ['AntalForeg_E'],
	yTitles: ['Senaste 12 månader'],
	yTitles2: ['Föregående period'],
	displayBarLabel: true,
	displayBarLabel2: false,
	categoryAttrib: 'Manad',
	flipChart: false,
	StackedChart: false,
	yAxisTitle: 'Antal',
	legendTitle: '',
	colors: ['#9DDBE7', '#3CB6CE']

}



RenderReOpStatistics(true, 'utdata09', config09, 'Antal reopererade patienter');



