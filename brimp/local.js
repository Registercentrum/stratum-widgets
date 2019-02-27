{
	TitleOfEvent: function(aRegistration) {	
		var text = Ext.util.Format.date(Repository.Global.Methods.ParseDate(aRegistration[aRegistration.Form.MappedEventDate]),'Y-m-d');
		if (aRegistration.OpSide === 1) {
			text = text + '  <img style="float: right; margin-top: 2px" src="Handlers/ResourceManager.ashx?ID=31779" />'; 
		} 
		if (aRegistration.OpSide === 3) {
			text = text + '  <img style="float: right; margin-top: 2px" src="Handlers/ResourceManager.ashx?ID=31779" />' + 
			'  <img style="float: right; margin-top: 2px" src="Handlers/ResourceManager.ashx?ID=31780" />'; 
		} if (aRegistration.OpSide === 2)  {
			text = text + '  <img style="float: right; margin-top: 2px" src="Handlers/ResourceManager.ashx?ID=31780" />';
		}
		return text;
    },
	
	RenderReOpStatistics: function(isUnitLevel, renderTo, config, title, prefetchedData) {
		if(arguments.length==0){
			RenderReOpStatistics.generateDynamicCharts = function (config) {
			Ext.Ajax.request({
				url: config.url + appendUnitID(),
				method: 'GET',
				success: function (response, opts) {
					var responseData = Ext.decode(response.responseText).data;
					var manufacts = [];
					for (k in responseData) {
						for (var k2 in responseData[k]) {
							if (k2 == 'Tillverkare_Ut') {
								if (manufacts.indexOf(responseData[k][k2]) < 0) {
									manufacts.push(responseData[k][k2]);
								}
							}
						}
					}

					var i = 0;
					for (i = 0; i < manufacts.length; i++) {
						var result = [];
						for (k in responseData) {
							for (var k2 in responseData[k]) {
								if (responseData[k][k2] == manufacts[i]) {
									result.push(responseData[k]);
								}
							}
						}

						var data = transformData(true, result, config);
						if (data.data.length > 0) {
							RenderReOpStatistics(true, 'utdata' + config.chartID, config, data.data[0].Status + ' ' + data.data[0].Tillverkare_Ut, data);
						}
					}
				},
				failure: function (response, opts) {
					unspin();
					Ext.fly(renderTo).update('<p style="color:red">FEL! Just nu går det inte att nå datalagret, var god försök igen senare!</p>');
					console.log('Fel vid ajax-anrop mot Stratum och R. Felkod:' + response.status);
					console.log('Felmeddelande: ' + response.responseText);
				}
			});
			}
			return;
		}
		var g_nTotal;
		var url = config.url + appendUnitID();
		var createStore = function (myData) {
			var myStore = new Ext.data.JsonStore({ fields: [] });
			myStore.loadData(myData);
			return myStore;
		};
		var createChart = function (fields, fields2, fieldPercents, labels, store) {
			var series = [];
			if (fields2.length > 0) {
				series.push({
					type: 'bar',
					style: {
						scalingX: 0.4,
						translationX: config.flipChart ? -16 : -10,
						fillOpacity: 0.7
					},
					stacked: config.StackedChart,
					xField: config.categoryAttrib,
					yField: fields2,
					title: config.yTitles2,
					label: {
						display: 'insideEnd',
						field: fields2,
						orientation: 'horizontal',
						color: '#fff',
						fontSize: 12,
						renderer: function (value, sprite, renderData, index) {
							return {
								text: value == 0 || !config.displayBarLabel2 || config.chartID == 13 || config.chartID == 15 ? '' : value
							};
						}
					},
					tooltip: {
						trackMouse: true,
						renderer: function (tooltip, rec, item) {

							tooltip.setHtml(getToolTips(rec, item, config));
						}
					}
				});
			}
			series.push(
			{
				type: 'bar',
				style: {
					scalingX: fields2.length > 0 ? 0.4 : 1,
					translationX: 0,
					fillOpacity: 1
				},
				stacked: config.StackedChart,
				xField: config.categoryAttrib,
				yField: fields,
				title: config.yTitles,
				label: {
					display: 'insideEnd',
					field: fields,
					orientation: 'horizontal',
					color: '#fff',
					renderer: function (value, sprite, renderData, index) {
						return {
							text: (value == 0 || !config.displayBarLabel || config.chartID == 13 || config.chartID == 15) ? '' : value
						};
					}
				},
				tooltip: {
					trackMouse: true,
					renderer: function (tooltip, rec, item) {
						tooltip.setHtml(getToolTips(rec, item, config))
					}
				},
				renderer: function (sprite, config, renderData, index) {
					var store = renderData.store,
						storeItems = store.getData().items,
						record = storeItems[index],
						surface = sprite.getSurface(),
						textSprites, textSprite;
					if (!record) {
						return;
					}

					if (record.data.isNA) {
						textSprites = surface.myTextSprites;
						if (!textSprites) {
							textSprites = surface.myTextSprites = [];
						}
						textSprite = textSprites[index];
						if (!textSprite) {
							textSprite = textSprites[index] = surface.add({ type: 'text' });
						}
						textSprite.setAttributes({
							text: 'n < 10',
							x: config.x + 5,
							y: config.y + 40,
							fill: 'red',
							fontSize: 16,
							zIndex: 10000,
							rotation: 90
						});
					}
				}
			});

			return Ext.create('Ext.chart.Chart', {
				renderTo: renderTo,
				flipXY: config.flipChart,
				width: '100%',
				height: 500,
				margin: '10 5 30 0',
				insetPadding: 30,
				animation: false,
				border: false,
				colors: config.colors,
				background: '#fff',
				title: title,
				style: {
					borderWidth: '1px',
					borderColor: '#ddd',
					borderStyle: 'solid',
					opacity: 0
				},
				store: store,
				legend: {
					html: config.legendTitle,
					toggleable: false
				},
				insetPadding: {
					top: 50,
					left: 20,
					right: 20,
					bottom: 20
				},
				axes: [{
					type: 'numeric',
					position: config.flipChart ? 'top' : 'left',
					fields: config.validYnames2 ? config.validYnames.concat(config.validYnames2) : config.validYnames,
					title: config.yAxisTitle,
					grid: {
						stroke: '#ddd'
					},
					minimum: 0,
					renderer: function (axis, label, layout, lastLabel) {
						return label % 1 === 0 ? label : '';
					}

				}, {
					type: 'category',
					position: config.flipChart ? 'left' : 'bottom',
					label: {
						rotate: {
							degrees: config.chartID == '09' ? 315 : 0
						}
					},
					fields: [config.categoryAttrib],
					renderer: function (axis, label) {
						return label.replace(' ', '\n');
					}
				}],
				series: series
			});
		};
		var myChart;
		var myStore;
		if (prefetchedData) {
			myStore = createStore(prefetchedData.data);
			myChart = createChart(prefetchedData.yNames, prefetchedData.yNames2, prefetchedData.fieldPercents, prefetchedData.categories, myStore);
			myChart.setAnimation(true);
			myChart.animate({
				duration: 500,
				from: { opacity: 0 },
				to: { opacity: 1 }
			});
			return;
		}

		spin(renderTo, 'Hämtar underlag', 310, 170);
		Ext.Ajax.request({
			url: url,
			method: 'GET',
			success: function (response, opts) {
				var responseData = Ext.decode(response.responseText).data;
				var myData = transformData(true, responseData, config);
				myStore = createStore(myData.data);
				myChart = createChart(myData.yNames, myData.yNames2, myData.fieldPercents, myData.categories, myStore);
				unspin();
				myChart.setAnimation(true);
				myChart.animate({
					duration: 500,
					from: { opacity: 0 },
					to: { opacity: 1 }
				});
			},
			failure: function (response, opts) {
				unspin();
				Ext.fly(renderTo).update('<p style="color:red">FEL! Just nu går det inte att nå datalagret, var god försök igen senare!</p>');
				console.log('Fel vid ajax-anrop mot Stratum och R. Felkod:' + response.status);
				console.log('Felmeddelande: ' + response.responseText);
			}
		});

		function transformData(isUnitLevel, arrData, config) {
			var unit = Profile.Context.Unit;
			var unitCode = unit.UnitCode;
			var unitName = unit.UnitName;
			var maxTextLength = 0;
			var result = {};
			var data = [];
			var names = [];
			var names2 = [];
			var category = '';
			var categories = [];
			g_nTotal = 0;
			var n = 0;
			if (config.chartID == '09') {
				arrData = transformMonths(arrData);
			}
			for (k in arrData) {
				n = 0;
				var item = {};
				var skipItem = false;
				for (var k2 in arrData[k]) {
					if (arrData[k][k2] == 'NA') {
						arrData[k][k2] = "0";
					}
					var currentValue = arrData[k][k2];
					if (config.filter && k2 == config.filter.attrib && config.filter.value != currentValue) {
						skipItem = true;
					}
					if (k2 == config.categoryAttrib) {
						category = currentValue;
						if (currentValue.length > maxTextLength) {
							maxTextLength = currentValue.length;
						}
						item[k2] = category;
						categories.push(category);
					}
					else if (config.validYnames.indexOf(k2) > -1) {
						item[k2] = currentValue;

						if (names.indexOf(k2) < 0) {
							names.push(k2);
						}
						n += parseInt(currentValue);
					}
					else if (config.hasOwnProperty('validYnames2') && config.validYnames2.indexOf(k2) > -1) {
						item[k2] = currentValue;
						if (names2.indexOf(k2) < 0) {
							names2.push(k2);
						}
						n += parseInt(currentValue);
					}
					else if (k2 == 'Enhet') {
						if (currentValue != unitCode && isUnitLevel) {
							skipItem = true;
						}
						else if (currentValue == unitCode && !isUnitLevel) {
							skipItem = true;
						}
					}
					else {
						item[k2] = currentValue;
					}
				}
				if (!skipItem) {
					data.push(item);
					g_nTotal += n;
				}
			}

			result.data = data;
			if (data.Antal_E2) {
				names.push('Antal_E2');
			}
			result.yNames = names;
			result.yNames2 = names2;


			return result;
		};

		
		function getToolTips(rec, item, config) {
			var data = rec.data;
			var text = '';
			var andel_e = '';
			var totAntal = '';
			var antal_e = '';
			var category = '';
			var totAntal_e = '';
			var andel_r = '';
			var totAntal_r = '';
			var antal_r = '';
			if (rec.data.Andel_E) {
				andel_e = data.Andel_E;
			}

			if (rec.data.Antal_E) {
				antal_e = data.Antal_E;
			}

			if (rec.data.TotAntal_E) {
				totAntal_e = data.TotAntal_E;
			}
			if (rec.data.Andel_R) {
				andel_r = data.Andel_R;
			}

			if (rec.data.Antal_R) {
				antal_r = data.Antal_R;
			}

			if (rec.data.TotAntal_R) {
				totAntal_r = data.TotAntal_R;
			}
			if (rec.data.TotAntal) {
				totAntal = data.TotAntal;
			}
			var category = data[config.categoryAttrib];
			switch (config.chartID) {
				case '09': text = category + ': ' + antal_e + ' patienter (' + andel_e + '% av BRIMP)<br/>' + data.ForegPeriod + ': ' + data.AntalForeg_E + ' patienter';
					break;
				case '10': text = 'Min klinik (' + category + '): ' + andel_e + '% (' + antal_e + ' av ' + totAntal_e + ')<br/> BRIMP (' + category + '): ' + andel_r + '% (' + antal_r + ' av ' + totAntal_r + ')';
					break;
				case '11': text = 'Min klinik (' + category + '): ' + andel_e + '% (' + antal_e + ' av ' + totAntal_e + ')<br/> BRIMP (' + category + '): ' + andel_r + '% (' + antal_r + ' av ' + totAntal_r + ')';
					break;
				case '12': text = 'Min klinik (' + category + '): ' + andel_e + '% (' + antal_e + ' av ' + totAntal_e + ')<br/> BRIMP (' + category + '): ' + andel_r + '% (' + antal_r + ' av ' + totAntal_r + ')';
					break;
				case '13': text = 'Min klinik:<br/>' + category + '/Implantat: ' + data.Imp_Andel_E + '% (' + data.Imp_Antal_E + ' av ' + data.Imp_TotAntal_E + ')<br/>' +
												category + '/Expander: ' + data.Exp_Andel_E + '% (' + data.Exp_Antal_E + ' av ' + data.Exp_TotAntal_E + ')<br/>BRIMP:<br/>' +
												category + '/Implantat: ' + data.Imp_Andel_R + '% (' + data.Imp_Antal_R + ' av ' + data.Imp_TotAntal_R + ')<br/>' +
												category + '/Expander: ' + data.Exp_Andel_R + '% (' + data.Exp_Antal_R + ' av ' + data.Exp_TotAntal_R + ')';
					break;
				case '14': text = 'Min klinik (' + category + '): ' + andel_e + '% (' + antal_e + ' av ' + totAntal_e + ')<br/> BRIMP (' + category + '): ' + andel_r + '% (' + antal_r + ' av ' + totAntal_r + ')';
					break;
				case '15': text = 'Min klinik:<br/>' + category + '/Implantat: ' + data.Imp_Andel_E + '% (' + data.Imp_Antal_E + ' av ' + data.Imp_TotAntal_E + ')<br/>' +
												category + '/Expander: ' + data.Exp_Andel_E + '% (' + data.Exp_Antal_E + ' av ' + data.Exp_TotAntal_E + ')<br/>BRIMP:<br/>' +
												category + '/Implantat: ' + data.Imp_Andel_R + '% (' + data.Imp_Antal_R + ' av ' + data.Imp_TotAntal_R + ')<br/>' +
												category + '/Expander: ' + data.Exp_Andel_R + '% (' + data.Exp_Antal_R + ' av ' + data.Exp_TotAntal_R + ')';
					break;
				case '16':
				case '17':
				case '18':
					text = 'Min klinik (' + category + ')<br/>Antal:<br/>Subfaciellt: ' + data.Subfaciellt_Antal_E + '<br/>Subglandulärt: ' + data.Subglandulart_Antal_E + '<br/>Submuskulärt: ' + data.Submuskulart_Antal_E + '<br/>Submuskulärt och subglandulärt: ' + data.Submusk_o_subgl_Antal_E;
					break;

			}
			text = text.replace(/ 0%/g, ' -%');
			text = text.replace(/:0%/g, ':-%');
			return text;
		}

		function appendUnitID() {
			var unit = Profile.Context.Unit;
			var unitCode = unit.UnitCode;
			return '&unitId=' + unitCode;
		}

		function transformMonths(data) {
			var i = 0;
			var newData = [];
			for (i = 12; i < data.length; i++) {
				var currentPeriod = data[i];
				var prevPeriod = data[i - 12]
				currentPeriod.ForegPeriod = prevPeriod['Manad'] + '-' + prevPeriod['Ar'];
				currentPeriod['Manad'] = prevPeriod['Manad'] = currentPeriod['Manad'] + '-' + currentPeriod['Ar'];
				currentPeriod.AntalForeg_E = prevPeriod.Antal_E;
				delete prevPeriod.Antal_E;
				newData.push(currentPeriod);
			}
			return newData;
		}

	}
}