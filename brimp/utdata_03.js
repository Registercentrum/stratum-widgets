
(function() {
	// API account: Ronny
	Profile.APIKey = 'SJ9-63odWfc=';
	var unit = Profile.Context.Unit ;
	var unitCode = unit.UnitCode;
	var unitName = unit.UnitName;
	
	var baseUrl = '/stratum/api/statistics/brimp/utdata_03?rinvoke=1&unitId={0}';
	var url = Ext.String.format(baseUrl, unitCode);
	// Get any Keystone template defined container, or use this Stratum page's utdata as default
	var container = Stratum.containers && Stratum.containers['BRIMP/utdata_03'] || 'utdata';

	/*
	Incoming data (after objectToArray):
	[{
		key: "a-1",							ID code: a-f (indication), 1-4 (size)
		value: [
			0: "1035",						UnitCode
			1: "Patientupplevd hypoplasi",	Indication (6 possible, DomainID:4264)
			2: "0-199",                     Size (0-199, 200-399, 400-599, 600+)
			3: "8",                         Count for this Unit
			4: "737",                       Total Count for Brimp
			5: "1.1"                        Percentage of Total
		]
	}, ...]
	*/
	var transformData = function(arrData) {
		var result = {
			categories:[],							// Array av indicators
			labels:[],								// Array of sizes ('0-199', etc)
			fields: ['a','b','c','d'],              // Identifiers of the count data for this Unit for each size
			fieldLabels: ['al','bl','cl','dl'],     // The labels for each counter (same as labels above)
			fieldTotals: ['at','bt','ct','dt'],     // Identifiers of the total count for this Unit
			fieldPercents: ['ap','bp','cp','dp'],   // Identifiers of the percentage compared to total count
			data:[]                                 // Array of objects containing the count data, percentage, etc.
		};											// Data är en array av {category:category, count:0, isNA: false, a..d, ap..dp, at..dt, al..dl}
		
		for (key in arrData) {
			var category = arrData[key].value[1];
			var label = arrData[key].value[2];
			var value = arrData[key].value[3];
			var total = arrData[key].value[4];
			var percent = arrData[key].value[5];
			
			if (result.labels.indexOf(label) < 0)
				result.labels.push(label);
			
			var index = result.categories.indexOf(category);
			if (index < 0) {
				result.categories.push(category);
				var item = {
					category: category,
					count: 0,
					isNA: false
				};
				result.data.push(item);
				index = result.categories.length - 1;
			}
			
			var counter = result.data[index].count++;
			var fieldName = result.fields[counter];
			var fieldLabel = result.fieldLabels[counter];
			var fieldTotal = result.fieldTotals[counter];
			var fieldPercent = result.fieldPercents[counter];
			if (value === 'NA') {
				value = 0;
				total = 0;
				percent = 0;
				result.data[index].isNA = true;
			}
			if (value >= 0) {
				result.data[index][fieldName] = value;
				result.data[index][fieldLabel] = label;
				result.data[index][fieldTotal] = total;
				result.data[index][fieldPercent] = percent;
			}
		}

		return result;
	};
	
	var createStore = function(myData) {
		// No need to declare individual fields if no calculation is needed
		var myStore = new Ext.data.JsonStore({fields:[]});
		myStore.loadData(myData);
		return myStore;
	};
	
	var createChart = function(header, fields, fieldPercents, labels, store) {
		return Ext.create('Ext.chart.Chart', {
			renderTo: container, 
			width: '100%',
			height: 500,
			margin: '10 5 30 0',
			insetPadding: 30,
			animation: false,
			border: false,
			colors: ['#A2AD00', '#614D7D', '#3CB6CE', '#E98300'],
			background: '#fff',
			title: header,
			style: {
				borderWidth: '1px',
				borderColor: '#ddd',
				borderStyle: 'solid',
				opacity: 0
			},
			store: store,
			legend: {
				html: 'Protesvolym:',
				toggleable: false
			},
			insetPadding: {
				top: 50,
				left: 20,
				right: 20,
				bottom: 20
			},
			/*
			sprites: [{
				type: 'text',
				text: header,
				fontSize: 18,
				width: 100,
				height: 30,
				x: 220,
				y: 30
			}],
			*/
			axes: [{
				type: 'numeric',
				position: 'left',
				fields: fields,
				title: 'Andel',
				grid: {
					stroke: '#ddd'
				},
				minimum: 0,
				maximum: 100,
				majorTickSteps: 10,
				renderer:  Ext.util.Format.numberRenderer('0%')
			},{
				type: 'category',
				position: 'bottom',
				fields: ['category'],
				renderer: function(v) {
					return v.replace(' ','\n');
				}
			}],
			series: [{
				type: 'bar',
				stacked: true,
				fullStack: true,
				title: labels,
				xField: 'category',
				yField: fields,
				label: {
					display: 'insideEnd',
					field: fieldPercents,
					orientation: 'horizontal',
					color: '#fff',
					renderer: function(v) {
						return (v == 0) ? '' : Ext.util.Format.number(v, '0%');
					}
				},
				tooltip: {
					trackMouse: true,
					renderer: function(rec, item) {
						this.setTitle(Ext.String.format('{0}', rec.data.category));
						var text = '';
						if (rec.data.isNA === true) {
							text += '<span style="color:red">Det finns färre än 10 registreringar!</span';
						} else {
							text += Ext.String.format('{0}: {1} ({2} av {3})<br>', rec.data.al, Ext.util.Format.number(rec.data.ap, '0.0%'), rec.data.a, rec.data.at);
							text += Ext.String.format('{0}: {1} ({2} av {3})<br>', rec.data.bl, Ext.util.Format.number(rec.data.bp, '0.0%'), rec.data.b, rec.data.bt);
							text += Ext.String.format('{0}: {1} ({2} av {3})<br>', rec.data.cl, Ext.util.Format.number(rec.data.cp, '0.0%'), rec.data.c, rec.data.ct);
							text += Ext.String.format('{0}: {1} ({2} av {3})', rec.data.dl, Ext.util.Format.number(rec.data.dp, '0.0%'), rec.data.d, rec.data.dt);
						}
						this.setHtml(text);
					}
				},
				renderer: function(sprite, config, renderData, index) {
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
							textSprite = textSprites[index] = surface.add({type:'text'});
						}
						textSprite.setAttributes({
							text: 'n < 10',
							x: config.x+20,
							y: config.y+20,
							fill: 'red',
							fontSize: 16,
							zIndex: 10000,
							scalingY: -1
						});
					}
				}
			}]
		});
	};
	
	spin(container, 'Hämtar underlag', 310, 170);
	Ext.Ajax.request({
		url: url,
		method: 'GET',
		success: function(response, opts) {
			var responseData = Ext.decode(response.responseText).data;
			var arrData = objectToArray(responseData);
			if (arrData.length === 0)
				Ext.fly(container).update('<p>Det saknas data för ' + unitName + '.</p>');
			else
				Ext.fly(container).update('<p>Andel implantat/explantat per volymkategori och per indikation (ingen begränsning av tid - all data från registret tas) för ' + unitName + '.</p>');
			var myData = transformData(arrData);
			var myStore = createStore(myData.data);
			var header = 'Protesvolym per indikation vid primäroperation';
			var myChart = createChart(header, myData.fields, myData.fieldPercents, myData.labels, myStore);
			unspin();
			
			myChart.setAnimation(true);
			myChart.animate({
				duration: 500,
				from:	{ opacity: 0 },
				to:		{ opacity: 1 }
			});
		},
		failure: function(response, opts) {
			unspin();
			Ext.fly(container).update('<p style="color:red">FEL! Just nu går det inte att nå datalagret, var god försök igen senare!</p>');
			console.log('Fel vid ajax-anrop mot Stratum och R. Felkod:' + response.status);
			console.log('Felmeddelande: ' + response.responseText);
		}
	});

})();

