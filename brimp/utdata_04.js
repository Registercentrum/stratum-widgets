
(function() {
	// API account: Brimp/Ronny
	Profile.APIKey = 'SJ9-63odWfc=';
	var unit = Profile.Context.Unit;
	var unitCode = unit.UnitCode;
	var unitName = unit.UnitName;
	
	// This script creates one chart for each Indication
	var baseUrl = '/api/statistics/brimp/utdata_04?rinvoke=1&unitId={0}';
	var url = Ext.String.format(baseUrl, unitCode);

	/* Transform incoming data from the array created by objectToArray
	Incoming data (after objectToArray):
	[{
		key: "a-1-1R",						ID code: a-f (indication), 1-4 (size), 1R/2A/3H (type)
		value: [
			0: "1035", 						UnitCode
			1: "Patientupplevd hypoplasi", 	Indication (6 possible, DomainID:4264)
			2: "-199", 						Size (-199, 200-399, 400-599, 600+)
			3: "Rund", 						Type ("Rund", "Anatomisk", "Halvmåne")
			4: "9", 						Count for this Unit
			5: "1004", 						Total Count for Brimp
			6: "0.9"						Percentage of Total
		]
	}, ...]
	*/
	var transformData = function(arrData) {
		var result = { 
			labels: [], 						// Array of types ('Rund', etc)
			fields: ['a','b','c'], 				// Identifiers of the count data for this Unit for each Type
			fieldLabels: ['al','bl','cl'],		// The labels for each counter (same as labels above)
			fieldTotals: ['at','bt','ct'],		// Identifiers of the total count for Brimp for each Type
			fieldPercents: ['ap','bp','cp'], 	// Identifiers of the percentage compared to total count
			groupNames:[], 						// Array of the indication names
			groupData:[] 						// Array of objects containing the count data, percentage, etc.
												// {categories:[], data:[]}
												// Data är en array av {category:category, count:0, isNA: false, a..c, ap..cp, at..ct, al..cl}
		};

		// Group incoming data on Category and read the unit's values
		var groupName = '';
		var groupIndex = -1;
		for (key in arrData) {
			var groupName = arrData[key].value[1];
			groupIndex = result.groupNames.indexOf(groupName);
			if (groupIndex < 0) {
				result.groupNames.push(groupName);
				result.groupData.push({categories:[], data:[]});
				groupIndex = result.groupData.length - 1;
			}
			
			var category = arrData[key].value[2];
			var label = arrData[key].value[3];
			var value = arrData[key].value[4];
			var total = arrData[key].value[5];
			var percent = arrData[key].value[6];
			
			if (result.labels.indexOf(label) < 0)
				result.labels.push(label);
			
			var index = result.groupData[groupIndex].categories.indexOf(category);
			if (index < 0) {
				result.groupData[groupIndex].categories.push(category);
				var item = {
					category: category,
					count: 0,
					isNA: false
				};
				result.groupData[groupIndex].data.push(item);
				index = result.groupData[groupIndex].categories.length - 1;
			}
			
			var counter = result.groupData[groupIndex].data[index].count++;
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
				result.groupData[groupIndex].data[index][fieldName] = value;
				result.groupData[groupIndex].data[index][fieldLabel] = label;
				result.groupData[groupIndex].data[index][fieldTotal] = total;
				result.groupData[groupIndex].data[index][fieldPercent] = percent;
			}
		}

		return result;
	};
	
	var createStore = function(myData) {
		var myStore = new Ext.data.JsonStore({fields:[]}); 
		myStore.loadData(myData);
		return myStore;
	};
	
	var createChart = function(groupName, fields, fieldPercents, labels, store) {
		return Ext.create('Ext.chart.Chart', {
			renderTo: 'utdata', 
			width: '100%',
			height: 500,
			margin: '10 5 30 0',
			insetPadding: 30,
			animation: false,
			border: false,
			colors: ['#A2AD00', '#614D7D', '#3CB6CE'],
			background: '#fff',
			title: groupName,
			style: {
				borderWidth: '1px',
				borderColor: '#ddd',
				borderStyle: 'solid',
				opacity: 0
			},
			store: store,
			legend: {
				type: 'dom',
				tpl: '<div class="x-legend-inner"><div class="x-legend-container"><div style="display: inline-block; font-size: 13px; line-height: 13px; padding: 0.4em 1em 0.4em 1.8em;  position: relative; margin: 0;  margin-top: -10px;  overflow: hidden;">Implantatform:</div><tpl for="."><div class="x-legend-item"><span class="x-legend-item-marker {[ values.disabled ? Ext.baseCSSPrefix + \'legend-item-inactive\' : \'\' ]}" style="background:{mark};"></span>{name}</div></tpl></div></div>',
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
				text: groupName,
				fontSize: 18,
				//width: 100,
				//height: 30,
				x: 100,
				y: 30
			}],
			*/
			axes: [{
				type: 'numeric',
				position: 'left',
				fields: fields,
				title: 'Antal',
				grid: {
					stroke: '#ddd'
				},
				minimum: 0,
				renderer: function(axis, label) {
					// Don't display decimal numbers
					return label % 1 === 0 ? label : '';
				}
			},{
				type: 'category',
				position: 'bottom',
				fields: ['category'],
				title: {
					text: 'Protesvolym',
				},
				renderer: function(axis, label) {
					return label.replace(' ','\n');
				}
			}],
			series: [{
				type: 'bar',
				title: labels,
				stacked: true,
				fullStack: false,
				xField: 'category',
				yField: fields,
				tooltip: {
					trackMouse: true,
					renderer: function(tooltip, rec, item) {
						tooltip.setTitle(Ext.String.format('Volym: {0}', rec.data.category));
						var text = '';
						if (rec.data.isNA === true) {
							text += '<span style="color:red">Det finns färre än 10 registreringar!</span';
						} else {
							text += Ext.String.format('{0}: {1} implantat<br>', rec.data.al, rec.data.a);
							text += Ext.String.format('{0}: {1} implantat<br>', rec.data.bl, rec.data.b);
							text += Ext.String.format('{0}: {1} implantat', rec.data.cl, rec.data.c);
						}
						tooltip.setHtml(text);
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

	spin('utdata', 'Hämtar underlag', 310, 170);
	Ext.Ajax.request({
		url: url,
		method: 'GET',
		success: function(response, opts) {
			var responseData = Ext.decode(response.responseText).data;
			var arrData = objectToArray(responseData);
			if (arrData.length === 0) {
				Ext.fly('utdata').update('<p>Det saknas data för ' + unitName + '.</p>');
			} else {
				Ext.fly('utdata').update('<p>Relation mellan implantatform (runda/anatomiska implantat) och volym (per kategori). '
				+ 'En graf per indikation. #6 (max) &gt; 6 grafer (max). Kan blir färre ; om en klinik har bara 2 indikation &gt; bara 2 grapher visas.<br>'
				+ '<br>'
				+ 'Andel runda/andel anatomiska, för volymkategori<br>'
				+ 'Primär operation för ' + unitName + '.</p>');
			}
			var myData = transformData(arrData);

			for (i=0; i<myData.groupNames.length; i++) {
				var myStore = createStore(myData.groupData[i].data);
				var myChart = createChart(myData.groupNames[i], myData.fields, myData.fieldPercents, myData.labels, myStore);
				myChart.setAnimation(true);
				myChart.animate({
					duration: 500,
					from:	{ opacity: 0 },
					to:		{ opacity: 1 }
				});
			}
			unspin();
		},
		failure: function(response, opts) {
			unspin();
			Ext.fly('utdata').update('<p style="color:red">FEL! Just nu går det inte att nå datalagret, var god försök igen senare!</p>');
			console.log('Fel vid ajax-anrop mot Stratum och R. Felkod:' + response.status);
			console.log('Felmeddelande: ' + response.responseText);
		}
	});

})();
