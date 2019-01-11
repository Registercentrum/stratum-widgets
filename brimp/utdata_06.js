
(function() {
	// API account: Ronny
	Profile.APIKey = 'SJ9-63odWfc=';
	var unit = Profile.Context.Unit;
	var unitCode = unit.UnitCode;
	var unitName = unit.UnitName;
	
	var baseUrl = '/api/statistics/brimp/utdata_06?rinvoke=1&unitId={0}';
	var url = Ext.String.format(baseUrl, unitCode);

	// See script utdata_03 for more information
	var transformData = function(arrData) {
		var result = {
			categories:[], 
			labels:[], 
			fields: ['a','b','c','d','e','f'], 
			fieldLabels: ['al','bl','cl','dl','el','fl'],
			fieldTotals: ['at','bt','ct','dt','et','ft'],
			fieldPercents: ['ap','bp','cp','dp','ep','fp'], 
			data:[] 
		};
		var categories = { names:[] };

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
			var percentName = result.fieldPercents[counter];
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
				result.data[index][fieldName+'p'] = percent;
			}
		}

		return result;
	};
	
	var createStore = function(myData) {
		var myStore = new Ext.data.JsonStore({fields:[]}); 
		myStore.loadData(myData);
		return myStore;
	};

	var createChart = function(header, fields, fieldPercents, labels, store) {
		var chart1 = Ext.create('Ext.chart.Chart', {
			renderTo: 'utdata', 
			flipXY: true,
			width: '100%',
			height: 500,
			margin: '10 5 30 0',
			insetPadding: 30,
			animation: false,
			border: false,
			colors: ['#A2AD00', '#614D7D', '#3CB6CE', '#E98300', '#8497B0', '#B854aa'],
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
				html: 'BMI:',
				toggleable: false,
				tpl: [
					'<div class="', Ext.baseCSSPrefix, 'legend-container">', 
					'<tpl for=".">', 
						'<div class="', Ext.baseCSSPrefix, 'legend-item">', 
							'<span ', 'class="', Ext.baseCSSPrefix, 'legend-item-marker {[ values.disabled ? Ext.baseCSSPrefix + \'legend-inactive\' : \'\' ]}" ', 'style="background:{mark};">', '</span>{name}', 
						'</div>', 
						'<tpl if="xindex==3">',
							'<div>&nbsp;</div>',
						'</tpl>',
					'</tpl>', 
					'</div>'
				]
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
				x: 200,
				y: 30
			}],
			*/
			axes: [{
				type: 'numeric',
				position: 'top',
				fields: fields,
				title: 'Andel',
				grid: {
					stroke: '#ddd'
				},
				minimum: 0,
				maximum: 100,
				majorTickSteps: 10,
				renderer: Ext.util.Format.numberRenderer('0%')
			},{
				type: 'category',
				position: 'left',
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
					renderer: function(v) {
						return (v == 0) ? '' : Ext.util.Format.number(v, '0%');
					},
					orientation: 'horizontal',
					color: '#fff'
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
							text += Ext.String.format('{0}: {1} ({2} av {3})<br>', rec.data.dl, Ext.util.Format.number(rec.data.dp, '0.0%'), rec.data.d, rec.data.dt);
							text += Ext.String.format('{0}: {1} ({2} av {3})<br>', rec.data.el, Ext.util.Format.number(rec.data.ep, '0.0%'), rec.data.e, rec.data.et);
							text += Ext.String.format('{0}: {1} ({2} av {3})', rec.data.fl, Ext.util.Format.number(rec.data.fp, '0.0%'), rec.data.f, rec.data.ft);
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
							x: config.x+5,
							y: config.y+40,
							fill: 'red',
							fontSize: 16,
							zIndex: 10000,
							rotation: 90
						});
					}
				}
			}]
		});
		
		return chart1;
	};

	spin('utdata', 'Hämtar underlag', 310, 170);
	Ext.Ajax.request({
		url: url,
		method: 'GET',
		success: function(response, opts) {
			var responseData = Ext.decode(response.responseText).data;
			var arrData = objectToArray(responseData);
			if (arrData.length === 0)
				Ext.fly('utdata').update('<p>Det saknas data för ' + unitName + '.</p>');
			else
				Ext.fly('utdata').update('<p>BMI per indikation vid primäroperation för ' + unitName + '.</p>');
			var myData = transformData(arrData);
			var myStore = createStore(myData.data);
			var header = 'BMI per indikation vid primäroperation';
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
			Ext.fly('utdata').update('<p style="color:red">FEL! Just nu går det inte att nå datalagret, var god försök igen senare!</p>');
			console.log('Fel vid ajax-anrop mot Stratum och R. Felkod:' + response.status);
			console.log('Felmeddelande: ' + response.responseText);
		}
	});

})();

