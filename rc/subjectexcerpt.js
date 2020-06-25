(function () {
	try {
		// https://github.com/MrRio/jsPDF
		// http://mrrio.github.io/
		// https://parall.ax/products/jspdf
		Ext.Loader.loadScript({
			url: '/js/jsPDF/jspdf.debug.js'
			,onLoad: function(){
			new jsPDF();
			if (!window.console) { console = {log: function() {}} };
			var page;
			}
			,onError: function(){
				console.log('error');
			}
		});
	}
	catch(e) {
		console.log('%c Jösses! jsPDF är inte installerat. ', 'color: #F00');
		return;
	}

	function failureFn(aReq) {		
		if (!Ext.isEmpty(Spinners))
			unspin();
		console.log(aReq.status + ': ' + aReq.statusText);
	}

	var messageContainer;
	function createContainer() {
		return Ext.create('Ext.container.Container', {
			layout: 'vbox',
			renderTo: 'sw-registerutdrag'
		});
	}

	getRegisters();

	function getRegisters() {
		var r = [];
		Ext.Ajax.request({
			method: 'get',
			url: '/stratum/api/metadata/registers',
			success: function(rRegisters) {
				var dRegisters = Ext.decode(rRegisters.responseText);
				for(i=0; i<dRegisters.data.length; i++){
					r.push({
						valueName: dRegisters.data[i].RegisterName,
						valueCode: dRegisters.data[i].RegisterID.toString() + ';' + dRegisters.data[i].ShortName
					});
				}
				createPanel(r);
				messageContainer = createContainer();
			},
			failure: function(e) {
				failureFn(e);
			}
		});
	}

	function createPanel(aRegisterStore) {
		Ext.create('Ext.form.Panel', {
			title: 'Registerutdrag',
			width: 425,
			bodyPadding: 10,
			frame: true,
			renderTo: 'sw-registerutdrag',
			items: [{
				xtype: 'textfield',
				fieldLabel: 'Personnummer',
				width: 220,
				name: 'personnummer',
				//value: '19410321-9202',
				emptyText: 'yyyymmdd-xxxx',
				allowBlank: false
			}, {
				xtype: 'combobox',
				name: 'registernamn',
				fieldLabel: 'Register',
				width: 400,
				queryMode: 'local',
				displayField: 'valueName',
				valueField: 'valueCode',
				emptyText: 'Välj register ...',
				checkChangeEvents: ['change','keyup'],
				store: Ext.create('Ext.data.Store', {
					fields: ['valueCode', 'valueName'],
					data: aRegisterStore
				}),
				listeners: {
					beforequery: function(aQueryEvent) {
						aQueryEvent.query = new RegExp(aQueryEvent.query, 'i');
						aQueryEvent.forceAll = true;
					}
				}
			}],
			buttons: [{
				xtype: 'button',
				name: 'createExcerpt',
				text: 'Skapa utdrag',
				handler: function(aButton) {
					spin('mainContainer', 'Hämtar data', 300, 200);
					messageContainer.removeAll();
					page = 1;
					var doc = new jsPDF();
					var form = this.up('form').getForm();
					var personnummer = form.findField('personnummer').getValue();
					if (!Ext.isEmpty(form.findField('registernamn').getValue())) {
						var valueCode = form.findField('registernamn').getValue().split(";");
						var registerID = valueCode[0];
						var shortname  = valueCode[1];
					}
					if (Ext.isDefined(shortname))
						subjectOverview(personnummer, registerID, shortname, doc); else
						addMessage('');
				}
			}]
		});
	}

	function notUnitBound(el, index, array) {
		return (!array[index].IsUnitBound);
	}
	function ascendingSequence(f1, f2) {
		return f1.Sequence - f2.Sequence;
	}
	function ascendingFormIDSequence(q1, q2) {
		return q1.OriginalFormID - q2.OriginalFormID || q1.Sequence - q2.Sequence;
	}

	function subjectOverview(aPersonnummer, aRegisterID, aShortName, aDoc) {
		Ext.Ajax.request({
			method: 'get',
			url: '/stratum/api/overview/excerpt/' + aPersonnummer + '',
			success: function(rRegistrations) {
				var dRegistrations = Ext.decode(rRegistrations.responseText);
				if (!Ext.isDefined(dRegistrations.data[aShortName])) {
					addMessage(aShortName);
					return;
				}
				Ext.Ajax.request({
					method: 'get',
					url: '/stratum/api/metadata/registers/' + aRegisterID + '',
					success: function(rRegister) {
						var dRegister = Ext.decode(rRegister.responseText);
						var aQuestions = [];
						var formCounter = 0;
						var forms = dRegister.data.Forms.filter(notUnitBound).sort(ascendingSequence);
						Ext.Object.each(forms, function(i) {
							Ext.Ajax.request({
								method: 'get',
								url: '/stratum/api/metadata/questions/form/' + forms[i].FormID + '',		// http://w8-xxx.rcvg.local/api/metadata/questions/form/xxx?APIKey=ReVbnDIhUBw=
								success: function(rQuestions) {
									var dQuestions = Ext.decode(rQuestions.responseText);
									formCounter++;
									for (var j=0; j<dQuestions.data.length; j++) {
										switch (forms[i].FormID) {
											case 1084: case 1085: case 1086: case 1087: case 1089: case 1090: case 1091: case 1092: case 1093: case 1094: case 1095: case 1096: case 1097: case 1098:
												dQuestions.data[j].FormID = forms[0].FormID; // HACK: för LVR
												break;
											default:
												dQuestions.data[j].FormID = forms[i].FormID;
										}
										dQuestions.data[j].OriginalFormID = forms[i].FormID; // HACK: för LVR
										aQuestions.push(dQuestions.data[j]);
									}
									if (formCounter==forms.length) {
										Ext.Ajax.request({
											method: 'get',
											url: '/stratum/api/metadata/domains/map/common',		// http://w8-xxx.rcvg.local/api/metadata/domains/map/common?APIKey=ReVbnDIhUBw=
											success: function(rCommonDomains) {
												var dCommonDomains = Ext.decode(rCommonDomains.responseText);
												Ext.Ajax.request({
													method: 'get',
													url: '/stratum/api/metadata/domains/map/register/' + aRegisterID + '',		// http://w8-xxx.rcvg.local/api/metadata/domains/map/register/xxx?APIKey=ReVbnDIhUBw=
													success: function(rRegisterDomains) {
														var dRegisterDomains = Ext.decode(rRegisterDomains.responseText);
														Ext.apply(dRegisterDomains.data, dCommonDomains.data);
														manageRegistrations(dRegister, dRegistrations, aPersonnummer, aDoc, aQuestions, dRegisterDomains);
													},
													failure: function(e) {
														failureFn(e);
													}
												});
											},
											failure: function(e) {
												failureFn(e);
											}
										});
									}
								},
								failure: function(e) {
									failureFn(e);
								}
							});
						});
					},
					failure: function(e) {
						failureFn(e);
					}
				});
			},
			failure: function(e) {
				failureFn(e);
			}
		});
	};

	function manageRegistrations(aRegister, allRegistrations, aPersonnummer, aDoc, aQuestions, allDomains) {
		var isFirst = true;
		var forms = aRegister.data.Forms;
		aQuestions = aQuestions.sort(ascendingFormIDSequence);
		for (var i=0; i<forms.length; i++) {
			fs = allRegistrations.data[aRegister.data.ShortName][forms[i].FormName];
			fs = !fs ? {} : fs;
			var prev = -1;
			for (var j=0; j<fs.length; j++) {
				var row = 0;
				for (var k=0; k<aQuestions.length; k++) {
					if (aQuestions[k].FormID != forms[i].FormID) {
						continue;
					}
					var key = aQuestions[k].MappedTo=='UnitCode' ? aQuestions[k].MappedTo : aQuestions[k].ColumnName;
					if (fs && fs[j]) {
						var text = aQuestions[k].PrefixText == null ? '' : aQuestions[k].PrefixText;
						text = text.length > 70 ? text.substring(0,70) + '...' : text;
						var v;
						//allDomains.data[DomainName][ValueCode]
						if (key=='UnitCode') {
							v = fs[j].Unit.UnitName;
						} else {
							//if (!(Ext.isEmpty(allDomains.data[aQuestions[k].Domain.DomainName]) || Object.keys(allDomains.data[aQuestions[k].Domain.DomainName]).length===0))
							//	v = Ext.isEmpty(fs[j][key]) ? '' : allDomains.data[aQuestions[k].Domain.DomainName][fs[j][key]]; else
							//	v = Ext.isEmpty(fs[j][key]) ? '' : fs[j][key].toString();
							if (!(Ext.isEmpty(allDomains.data[aQuestions[k].Domain.DomainName]) || Object.keys(allDomains.data[aQuestions[k].Domain.DomainName]).length===0)) {
								if (aQuestions[k].Domain.DomainName == 'County') {
									fs[j][key] = fs[j][key] > 9 ? "" + fs[j][key] : "0" + fs[j][key];
								}
								v = Ext.isEmpty(fs[j][key]) ? '' : allDomains.data[aQuestions[k].Domain.DomainName][fs[j][key]];
							} else {
								v = Ext.isEmpty(fs[j][key]) ? '' : fs[j][key].toString();
							}
							v = v ? v : '';
							v = v.length > 70 ? v.substring(0,70) + '\n' + v.substring(70,v.length) : v;
						}
						switch (aQuestions[k].Domain.DomainID) {
							case 1030: // 'Date'
								v = (v.indexOf('T00:00:00') > -1) ? v.substring(0, v.length - 9) : v;
								break;
							case 1015: // 'Boolean'
								v = (v=='') ? v : (v=='true') ? 'Ja' : 'Nej';
								break;
							case 1036: //'Timestamp'
								v = v.replace('T', ' ');
								break;
							case 1050: // 'Float'
								v = (!Ext.isEmpty(v)) ? Number(v).toFixed(8) : '';
								v = v.replace('.', ',');
								break;
							case 1051: // 'Decimal1'
								v = (!Ext.isEmpty(v)) ? Number(v).toFixed(1) : '';
								v = v.replace('.', ',');
								break;
							case 1052: // 'Decimal2'
								v = (!Ext.isEmpty(v)) ? Number(v).toFixed(2) : '';
								v = v.replace('.', ',');
								break;
							case 1053: // 'Decimal3'
								v = (!Ext.isEmpty(v)) ? Number(v).toFixed(3) : '';
								v = v.replace('.', ',');
								break;
							case 1080: // 'Label'
								if (Ext.isEmpty(aQuestions[k].PrefixText) && Ext.isEmpty(aQuestions[k].SuffixText)) {
									continue;
								}
								text = '---- ';
								if (!Ext.isEmpty(aQuestions[k].SuffixText) && !Ext.isEmpty(aQuestions[k].PrefixText)) {
									text += aQuestions[k].PrefixText + ' ' + aQuestions[k].SuffixText;
								} else if (Ext.isEmpty(aQuestions[k].SuffixText)) 
									text += aQuestions[k].PrefixText; else
									text += aQuestions[k].SuffixText;
								text = text.replace(/(<([^>]+)>)/ig, ''); // ta bort html-taggar
								text = text.length > 70 ? text.substring(0,70) + '...' : text;
								break;
						}
/*						if (!Ext.isEmpty(aQuestions[k].CalculationScript) && aQuestions[k].CalculationScript.substring(0, 3) == '//#') {
							continue;
						} 
*/
						v = Ext.isEmpty(aQuestions[k].SuffixText) || Ext.isEmpty(v) ? v : Ext.isEmpty(aQuestions[k].SuffixText) ? v : v + ' ' + aQuestions[k].SuffixText;
						if (row==0 || row>55) {
							row = 0;
							if (!isFirst) {
								aDoc.addPage();
							}
							isFirst = false;
							addHeader(aRegister, aPersonnummer, aDoc);
							aDoc.setFontSize(12);
							if (prev==j) {
								aDoc.text(15, 40, forms[i].FormTitle + ' (forts.)');
							} else {
								aDoc.text(15, 40, forms[i].FormTitle);
								prev = j;
							}
							aDoc.setFontSize(7);
							addFooter(aDoc);
						}
						if (row%2==0) {
							aDoc.setDrawColor(0);
							aDoc.setFillColor(232, 232, 232);
							aDoc.rect(15, 47.5 + row*4, 180, 3.5, 'F');
						}
						aDoc.text(15, 50 + row*4, text);
						aDoc.setFontType('bold');
						aDoc.text(110, 50 + row*4, v);
						row = row + (v.match(/\n/g) || []).length;
						aDoc.setFontType('normal');
						/*if (text.indexOf("<") > -1) {
							text = '<p style="font-family:helvetica; font-size:10px">' + text +'</p>';
							aDoc.fromHTML(text, 10, 46 + row*4);
							v = '<p style="font-family:helvetica; font-size:10px"><b>' + v +'</b></p>';
							aDoc.fromHTML(v, 110, 46 + row*4);
						} else {*/
						row++;
					}
				}
			}
		}
		printToPDF(aDoc);
	}

	function printToPDF(aDoc) {
		// $('iframe').attr('src', doc.output('datauristring')); does not work in IE11 #229 
		// https://github.com/MrRio/jsPDF/issues/229
/*		
		if (Ext.isIE)
			aDoc.save('Patientutdrag.pdf'); else
			aDoc.output('dataurlnewwindow');
*/
		aDoc.save('Patientutdrag.pdf');
		unspin();
	}

	function pad(n) { return n<10 ? '0'+n : n }

	function addHeader(aRegister, aPersonnummer, aDoc) {

/*
//var filename = 'RC-logga.jpg';
//var file = new File('RC-logga.jpg');
var reader = new FileReader();
reader.onload = function() {
	var dataURL = reader.result;
	console.log(dataURL);
};
*/
		// You'll need to make your image into a Data URL
		// Use http://dataurl.net/#dataurlmaker		
		var imgData = 'data:image/jpeg;base64,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SU0D9QAAAAAASAAvZmYAAQBsZmYABgAAAAAAAQAvZmYAAQChmZoABgAAAAAAAQAyAAAAAQBaAAAABgAAAAAAAQA1AAAAAQAtAAAABgAAAAAAAThCSU0D+AAAAAAAcAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAA4QklNBAgAAAAAABAAAAABAAACQAAAAkAAAAAAOEJJTQQeAAAAAAAEAAAAADhCSU0EGgAAAAADdQAAAAYAAAAAAAAAAAAAAEEAAADHAAAAIABSAEMAXwBzAHYAZQBuAHMAawBfAGwAaQBnAGcAYQBuAGQAZQBfAFIARwBCACAAYgByAGUAZABkACAAMgAwADAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAMcAAABBAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAEAAAAAAABudWxsAAAAAgAAAAZib3VuZHNPYmpjAAAAAQAAAAAAAFJjdDEAAAAEAAAAAFRvcCBsb25nAAAAAAAAAABMZWZ0bG9uZwAAAAAAAAAAQnRvbWxvbmcAAABBAAAAAFJnaHRsb25nAAAAxwAAAAZzbGljZXNWbExzAAAAAU9iamMAAAABAAAAAAAFc2xpY2UAAAASAAAAB3NsaWNlSURsb25nAAAAAAAAAAdncm91cElEbG9uZwAAAAAAAAAGb3JpZ2luZW51bQAAAAxFU2xpY2VPcmlnaW4AAAANYXV0b0dlbmVyYXRlZAAAAABUeXBlZW51bQAAAApFU2xpY2VUeXBlAAAAAEltZyAAAAAGYm91bmRzT2JqYwAAAAEAAAAAAABSY3QxAAAABAAAAABUb3AgbG9uZwAAAAAAAAAATGVmdGxvbmcAAAAAAAAAAEJ0b21sb25nAAAAQQAAAABSZ2h0bG9uZwAAAMcAAAADdXJsVEVYVAAAAAEAAAAAAABudWxsVEVYVAAAAAEAAAAAAABNc2dlVEVYVAAAAAEAAAAAAAZhbHRUYWdURVhUAAAAAQAAAAAADmNlbGxUZXh0SXNIVE1MYm9vbAEAAAAIY2VsbFRleHRURVhUAAAAAQAAAAAACWhvcnpBbGlnbmVudW0AAAAPRVNsaWNlSG9yekFsaWduAAAAB2RlZmF1bHQAAAAJdmVydEFsaWduZW51bQAAAA9FU2xpY2VWZXJ0QWxpZ24AAAAHZGVmYXVsdAAAAAtiZ0NvbG9yVHlwZWVudW0AAAARRVNsaWNlQkdDb2xvclR5cGUAAAAATm9uZQAAAAl0b3BPdXRzZXRsb25nAAAAAAAAAApsZWZ0T3V0c2V0bG9uZwAAAAAAAAAMYm90dG9tT3V0c2V0bG9uZwAAAAAAAAALcmlnaHRPdXRzZXRsb25nAAAAAAA4QklNBCgAAAAAAAwAAAACP/AAAAAAAAA4QklNBBQAAAAAAAQAAAACOEJJTQQMAAAAABn8AAAAAQAAAKAAAAA0AAAB4AAAYYAAABngABgAAf/Y/+AAEEpGSUYAAQIAAEgASAAA/+IMWElDQ19QUk9GSUxFAAEBAAAMSExpbm8CEAAAbW50clJHQiBYWVogB84AAgAJAAYAMQAAYWNzcE1TRlQAAAAASUVDIHNSR0IAAAAAAAAAAAAAAAAAAPbWAAEAAAAA0y1IUCAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARY3BydAAAAVAAAAAzZGVzYwAAAYQAAABsd3RwdAAAAfAAAAAUYmtwdAAAAgQAAAAUclhZWgAAAhgAAAAUZ1hZWgAAAiwAAAAUYlhZWgAAAkAAAAAUZG1uZAAAAlQAAABwZG1kZAAAAsQAAACIdnVlZAAAA0wAAACGdmlldwAAA9QAAAAkbHVtaQAAA/gAAAAUbWVhcwAABAwAAAAkdGVjaAAABDAAAAAMclRSQwAABDwAAAgMZ1RSQwAABDwAAAgMYlRSQwAABDwAAAgMdGV4dAAAAABDb3B5cmlnaHQgKGMpIDE5OTggSGV3bGV0dC1QYWNrYXJkIENvbXBhbnkAAGRlc2MAAAAAAAAAEnNSR0IgSUVDNjE5NjYtMi4xAAAAAAAAAAAAAAASc1JHQiBJRUM2MTk2Ni0yLjEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAADzUQABAAAAARbMWFlaIAAAAAAAAAAAAAAAAAAAAABYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9kZXNjAAAAAAAAABZJRUMgaHR0cDovL3d3dy5pZWMuY2gAAAAAAAAAAAAAABZJRUMgaHR0cDovL3d3dy5pZWMuY2gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZGVzYwAAAAAAAAAuSUVDIDYxOTY2LTIuMSBEZWZhdWx0IFJHQiBjb2xvdXIgc3BhY2UgLSBzUkdCAAAAAAAAAAAAAAAuSUVDIDYxOTY2LTIuMSBEZWZhdWx0IFJHQiBjb2xvdXIgc3BhY2UgLSBzUkdCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGRlc2MAAAAAAAAALFJlZmVyZW5jZSBWaWV3aW5nIENvbmRpdGlvbiBpbiBJRUM2MTk2Ni0yLjEAAAAAAAAAAAAAACxSZWZlcmVuY2UgVmlld2luZyBDb25kaXRpb24gaW4gSUVDNjE5NjYtMi4xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB2aWV3AAAAAAATpP4AFF8uABDPFAAD7cwABBMLAANcngAAAAFYWVogAAAAAABMCVYAUAAAAFcf521lYXMAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAKPAAAAAnNpZyAAAAAAQ1JUIGN1cnYAAAAAAAAEAAAAAAUACgAPABQAGQAeACMAKAAtADIANwA7AEAARQBKAE8AVABZAF4AYwBoAG0AcgB3AHwAgQCGAIsAkACVAJoAnwCkAKkArgCyALcAvADBAMYAywDQANUA2wDgAOUA6wDwAPYA+wEBAQcBDQETARkBHwElASsBMgE4AT4BRQFMAVIBWQFgAWcBbgF1AXwBgwGLAZIBmgGhAakBsQG5AcEByQHRAdkB4QHpAfIB+gIDAgwCFAIdAiYCLwI4AkECSwJUAl0CZwJxAnoChAKOApgCogKsArYCwQLLAtUC4ALrAvUDAAMLAxYDIQMtAzgDQwNPA1oDZgNyA34DigOWA6IDrgO6A8cD0wPgA+wD+QQGBBMEIAQtBDsESARVBGMEcQR+BIwEmgSoBLYExATTBOEE8AT+BQ0FHAUrBToFSQVYBWcFdwWGBZYFpgW1BcUF1QXlBfYGBgYWBicGNwZIBlkGagZ7BowGnQavBsAG0QbjBvUHBwcZBysHPQdPB2EHdAeGB5kHrAe/B9IH5Qf4CAsIHwgyCEYIWghuCIIIlgiqCL4I0gjnCPsJEAklCToJTwlkCXkJjwmkCboJzwnlCfsKEQonCj0KVApqCoEKmAquCsUK3ArzCwsLIgs5C1ELaQuAC5gLsAvIC+EL+QwSDCoMQwxcDHUMjgynDMAM2QzzDQ0NJg1ADVoNdA2ODakNww3eDfgOEw4uDkkOZA5/DpsOtg7SDu4PCQ8lD0EPXg96D5YPsw/PD+wQCRAmEEMQYRB+EJsQuRDXEPURExExEU8RbRGMEaoRyRHoEgcSJhJFEmQShBKjEsMS4xMDEyMTQxNjE4MTpBPFE+UUBhQnFEkUahSLFK0UzhTwFRIVNBVWFXgVmxW9FeAWAxYmFkkWbBaPFrIW1hb6Fx0XQRdlF4kXrhfSF/cYGxhAGGUYihivGNUY+hkgGUUZaxmRGbcZ3RoEGioaURp3Gp4axRrsGxQbOxtjG4obshvaHAIcKhxSHHscoxzMHPUdHh1HHXAdmR3DHeweFh5AHmoelB6+HukfEx8+H2kflB+/H+ogFSBBIGwgmCDEIPAhHCFIIXUhoSHOIfsiJyJVIoIiryLdIwojOCNmI5QjwiPwJB8kTSR8JKsk2iUJJTglaCWXJccl9yYnJlcmhya3JugnGCdJJ3onqyfcKA0oPyhxKKIo1CkGKTgpaymdKdAqAio1KmgqmyrPKwIrNitpK50r0SwFLDksbiyiLNctDC1BLXYtqy3hLhYuTC6CLrcu7i8kL1ovkS/HL/4wNTBsMKQw2zESMUoxgjG6MfIyKjJjMpsy1DMNM0YzfzO4M/E0KzRlNJ402DUTNU01hzXCNf02NzZyNq426TckN2A3nDfXOBQ4UDiMOMg5BTlCOX85vDn5OjY6dDqyOu87LTtrO6o76DwnPGU8pDzjPSI9YT2hPeA+ID5gPqA+4D8hP2E/oj/iQCNAZECmQOdBKUFqQaxB7kIwQnJCtUL3QzpDfUPARANER0SKRM5FEkVVRZpF3kYiRmdGq0bwRzVHe0fASAVIS0iRSNdJHUljSalJ8Eo3Sn1KxEsMS1NLmkviTCpMcky6TQJNSk2TTdxOJU5uTrdPAE9JT5NP3VAnUHFQu1EGUVBRm1HmUjFSfFLHUxNTX1OqU/ZUQlSPVNtVKFV1VcJWD1ZcVqlW91dEV5JX4FgvWH1Yy1kaWWlZuFoHWlZaplr1W0VblVvlXDVchlzWXSddeF3JXhpebF69Xw9fYV+zYAVgV2CqYPxhT2GiYfViSWKcYvBjQ2OXY+tkQGSUZOllPWWSZedmPWaSZuhnPWeTZ+loP2iWaOxpQ2maafFqSGqfavdrT2una/9sV2yvbQhtYG25bhJua27Ebx5veG/RcCtwhnDgcTpxlXHwcktypnMBc11zuHQUdHB0zHUodYV14XY+dpt2+HdWd7N4EXhueMx5KnmJeed6RnqlewR7Y3vCfCF8gXzhfUF9oX4BfmJ+wn8jf4R/5YBHgKiBCoFrgc2CMIKSgvSDV4O6hB2EgITjhUeFq4YOhnKG14c7h5+IBIhpiM6JM4mZif6KZIrKizCLlov8jGOMyo0xjZiN/45mjs6PNo+ekAaQbpDWkT+RqJIRknqS45NNk7aUIJSKlPSVX5XJljSWn5cKl3WX4JhMmLiZJJmQmfyaaJrVm0Kbr5wcnImc951kndKeQJ6unx2fi5/6oGmg2KFHobaiJqKWowajdqPmpFakx6U4pammGqaLpv2nbqfgqFKoxKk3qamqHKqPqwKrdavprFys0K1ErbiuLa6hrxavi7AAsHWw6rFgsdayS7LCszizrrQltJy1E7WKtgG2ebbwt2i34LhZuNG5SrnCuju6tbsuu6e8IbybvRW9j74KvoS+/796v/XAcMDswWfB48JfwtvDWMPUxFHEzsVLxcjGRsbDx0HHv8g9yLzJOsm5yjjKt8s2y7bMNcy1zTXNtc42zrbPN8+40DnQutE80b7SP9LB00TTxtRJ1MvVTtXR1lXW2Ndc1+DYZNjo2WzZ8dp22vvbgNwF3IrdEN2W3hzeot8p36/gNuC94UThzOJT4tvjY+Pr5HPk/OWE5g3mlucf56noMui86Ubp0Opb6uXrcOv77IbtEe2c7ijutO9A78zwWPDl8XLx//KM8xnzp/Q09ML1UPXe9m32+/eK+Bn4qPk4+cf6V/rn+3f8B/yY/Sn9uv5L/tz/bf///+0ADEFkb2JlX0NNAAH/7gAOQWRvYmUAZIAAAAAB/9sAhAAMCAgICQgMCQkMEQsKCxEVDwwMDxUYExMVExMYEQwMDAwMDBEMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAQ0LCw0ODRAODhAUDg4OFBQODg4OFBEMDAwMDBERDAwMDAwMEQwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAA0AKADASIAAhEBAxEB/90ABAAK/8QBPwAAAQUBAQEBAQEAAAAAAAAAAwABAgQFBgcICQoLAQABBQEBAQEBAQAAAAAAAAABAAIDBAUGBwgJCgsQAAEEAQMCBAIFBwYIBQMMMwEAAhEDBCESMQVBUWETInGBMgYUkaGxQiMkFVLBYjM0coLRQwclklPw4fFjczUWorKDJkSTVGRFwqN0NhfSVeJl8rOEw9N14/NGJ5SkhbSVxNTk9KW1xdXl9VZmdoaWprbG1ub2N0dXZ3eHl6e3x9fn9xEAAgIBAgQEAwQFBgcHBgU1AQACEQMhMRIEQVFhcSITBTKBkRShsUIjwVLR8DMkYuFygpJDUxVjczTxJQYWorKDByY1wtJEk1SjF2RFVTZ0ZeLys4TD03Xj80aUpIW0lcTU5PSltcXV5fVWZnaGlqa2xtbm9ic3R1dnd4eXp7fH/9oADAMBAAIRAxEAPwD1VRc9jBL3Bo4kmFJYX1vAPTaZE/p28/1LVFny+1inkq+AXTJhx+5kjC64jVuz69H+kZ/nBeY/Xn/xU5P/ABNH/UvRrGM9N/tH0T28lX+u/wD4p8j/AImj/qXpnwvnTzMsno4OADrxfM2OZ5QYOGpcXHxdOH5eFl9Rv/FRjf8AF3f9SvUl5b9Rv/FRjf8AF3f9SvUldzfMPJqS3UkkkokKSSSSUpJJJJSkkkklKSSSSUpJJJJSkkkklP8A/9DS+05X/ci7/t2z/wAmrTrLbOgvNj32EZzQC9xcQPQBiXlyoK6P+QbP/D7f/PDVL8WA+45v7v7XM+CSJ5/Dr1P/AEWhb/Nv/qn8irfXf/xT5H/E0f8AUvVm3+bf/VP5FW+u/wD4p8j/AImj/qXrF/4vfNn8of8AdPUfE9sX+H/3C/1G/wDFRjf8Xd/1K9SXlX1Mc5v1iqc3RzabyD5hi6Bv1j60Wgm9vH+jatD4hzuLlpwGQSPENOEXs5hBJe1SWV9X87JzMF92U8Pe21zd0BsNAafzfijY3X+hZfqHF6liZAoYbbvSvrfsrb9O2zY93p1t/fcnYskckI5I3wyFi91rfSVHF650XMZbZiZ+NkMx2773VXVvFbdTvtdW93ps9rvpqNP1g6DkVWXUdSxLaqNousZfW5rDYfTq9R7X7WerZ7K93009ToJKjZ1zotWRbi2dQxmZFDS+6l11YexrW+o99tZfvrYyv9I5zvzEJn1m+rdjbHV9Wwntpbvtc3IqIa0ubXvsiz2M9Syuvc78+xJTppLMP1m+rYpbeeq4Qpe5zG2nIq2lzQ11lbX+pt3sbZXvb/wjFYyeq9LxMavLysyjHxbo9K+21jK37h6jPTte5rH72De3akptpLP/AOcHQfXrxv2lievfsNNXr173+qGuo9Ovfvs9dr2ejt/nEWvqvS7WepVmUPrFwxi9trCPXJDW424O/pG57P0P84kptpLMq+s/1budsq6thWODXOLW5FTjtY02WP8AbZ9GutjrH/yESrr/AEK7HuyqepYlmPjx69zL63Mr3Haz1rGv2V7/AMzekpvpKrkdT6bi2Pqycuiiyur17GWWMY5tW70vtD2vc3bR6n6P1f5veo2dY6TVi1ZludjsxbyG05DrWCt7jO1tVpd6djnbHfQSU//Ruq6P+QbP/D7f/PDVSV0f8g2f+H2/+eGqX4v/ALhzf3f2uX8E/wC2GHzP/RaFv82/+qfyKt9d/wDxT5H/ABNH/UvVm3+bf/VP5FW+u/8A4p8j/iaP+pesX/i982fyh/3T1PxPbF/h/wDcMPqf/wAv1/8AEZH/AFCvs+i34BUPqf8A8v1/8Rkf9Qr7Pot+ATf+MP8AOYf7svzc4bvVfVb/AJJu/wCNf5/msXnfRui5mP03Gsy8Kwm7o3Ua8M047qbG5EXC3G6j6bXW5Pq0e7Bfc5jP9Fjet+mXov1U3fsu3aAXes+ATAnazv7lKn6yC7p3TslmM77V1G9uL9jJLXV2sc9vUmPe9jf+TmY2Y936P9P9n/R/zzFe5H/cuL+6Fh3LwGN0vLu+q1VNQfnCi3p1vVem1dPfh3HGpD/tGF62xv7Xt9X03b93+Afd/hVbzrDmdP65V0qlt2CHYP2d1HT3YjgWZo/UXbmNsy/sWP6f5n/Wq10vTPrPc+rquVe26+rDoGTh0hjA/Ix9+V6efjtrO/08r0fRqqs/wGNRmf8Aa5Wcr6w9Ux+hW9aZi4OTRQyy5xx819jHVVt3bqLxgbbLXPbYzZ7K/wDhv3LKHnul4uPR9dcnCw6m9Rw8/IzH9UZlYLm2YjrGOc4N6i+ttWRi59jXVsr/AO4/p/zm/wBRUMnopH1M+swqwCzKf1WxtO3H/SGj7ViWtbUwVh9uNtZv2M/Rfo11XU/rbmdLyPs+Xh44sqx25WQ1uWdzg+26hlHTm24tX27Lcyjf6D/sm+2z0Gfvq/1D6wMwurYnT/QdZXds+15IJDcf13Oxunb69jnWfbc1n2b/AIH+dt9iSnhczpWT1C/odPTDTl2izqXq5N3THYuN6jsep1bMrAtYxn6Rvp0sybN//X/R9JT6NX03pNnR87qvT8n9k1dLNFdmRRZeMbNGRbZ1D1scMssx7LbHNZTkfZ6/Uq/R1fo/U2d/1fqf7Ox2OrpflZWTYKMPGZobLi19oY636FFTKqrbr73/AM1TVZ/OWfon0n9fysbFybczHx3XU2VUU0YWUL3Pvvf9nqx7PtGPgtxn+s6r+c/M3v8A8Ekp4/Gxaj9e8nJr/UsC1/THYFb+mPubYxlNQbTRe6trekeh7K9/6P0X/wDhZAweldQ6dTgXVY19tHVeqVuy2bX/AKvkYvUXuqzHMP0asrp/6Gz9Gz+j0/vrsMXqn1ixcr9mdQx6Lc/Jr9bBeMiMd7aRRTm0vuZhsyKsje/7b/QbKv0/pV3foVGj61dSs6JX1M9NrffmvbV03CpyC991hNnq12224uPTi+lVRZf6u66v0q7ElOFf0Olmf9eX1dPawDBqHTnNpAG52FkVX/YiGfSfv9O30Fz7/q51P7B1Gp2E5+dldEwzgfZscUNdU2yi/Noya/8ACdVqdSz/AAn2i6uv+a/mqV6di9ex8zI6czFb6lHU8S3MquJgtbUcUCt1cH3P+2+73/ovSQ8v6yY+N1yjpJrLm2bWX5Qc0MpuuFjsDGsZ9P1Mv7Pf/wAV+rf9y6klPEfWG93X87q/VemY+RbhjoRwi91FrD9p+1NuditZYxrrLa2fznpb/TVTqvS+oDEyujNwsh/TegF+T08sbYWvdmXYr8Fvo+6y9/T6b+pN/P8A+EXbP+uTK8brNr8Uts6R67qay+Bk1459K62qzZ7PTyP0ORXst+z78d//AGpqU3/WfMrOdlOwGnpXTciyjKyG3k3tbU1r7sr7F9nax9NW73tZmev6f83VZ/NpKf/Suq6P+QbP/D7f/PDV4gkpfi/+4c3939rl/BP+2GHzP/RfYLf5t/8AVP5FW+u//inyP+Jo/wCpevKEli/8Xvmz+UP+6ep+J7Yv8P8A7h9U+p//AC/X/wARkf8AUK+z6LfgF44km/8AGH+cw/3Zfm5w3fo/6pf8m2f8e/8AIxcz1P0/2x179lz9p+z2/Y42bfXjF/5x/Y9v6T7Z9k/Znp+p/wBrftf/AHaXiySvcj/uXF/dCw7l9txv2d+0+nf8zftH2z7Jfs+3favs32H0h9l2/tT9N9m/aX7N9L9m/wCD9b/BKu37T+wfrp9s9H7Z6b/tP2D+gep6L/V+z7v0v7S37v2r6/6X+jLxpJWUPun1r+w/tjqf2qfW/ZOP9h9P+kfavtGV9j+w7P032n7X9n9P0/8ACen6izuo/sP0uu/85/tn7Xn9d+xfavs2zYP2R6P2f9T9PZs9D9p/96X2z/BLxxJJT9EdX+2fsXpf2nd/zg31fZPQjb9v9C31vU/wX2H0ftv2v/up6v2f9Z9Bc3b+0fV61+1Psv7V2dN+y/sfbs+1fa8n7B637R9v2v7f/SvV9n2NeNpJKffumftr/nRj/wDOj0Ptn2W79l/YZ+yxuq+3+p9p/Xft+37Ns/7SfZvU9P8ATeqsTp32T0egftb7V9j+yX/s/wCw/afV+1+q77Vv/Zf6z/Qf6P8A4P0v2h6v+DXjiSSn2Tp/7Y+24P8AzW9H7PPVPsH7V9afs3q9N+07vR/WvU/af2r7P9s/S/ZP5/8ATJrvQ/ZXVf2n9u/5y+vZv+zfbfsn26a/2L6Ho/5P/wDKr7F9r/TfzH2heOJJKfWuveh/zZ6v/wCW/wC0OofZvSjft2f5Z+n7vsH2X1vW/wDQP/tV9nWjd+046563p/8ANj7df+0/Q3fbdm1n2vf6n6D7F6f899l/XPsv8z+sLxRJJT//2ThCSU0EIQAAAAAAewAAAAEBAAAAGABBAGQAbwBiAGUAIABQAGgAbwB0AG8AcwBoAG8AcAAgAEUAbABlAG0AZQBuAHQAcwAAAB0AQQBkAG8AYgBlACAAUABoAG8AdABvAHMAaABvAHAAIABFAGwAZQBtAGUAbgB0AHMAIAAxADAALgAwAAAAAQA4QklNBAYAAAAAAAcACAAAAAEBAP/hIExodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMi1jMDAxIDYzLjEzOTQzOSwgMjAxMC8xMC8xMi0wODo0NTozMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6aWxsdXN0cmF0b3I9Imh0dHA6Ly9ucy5hZG9iZS5jb20vaWxsdXN0cmF0b3IvMS4wLyIgeG1sbnM6eG1wVFBnPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvdC9wZy8iIHhtbG5zOnN0RGltPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvRGltZW5zaW9ucyMiIHhtbG5zOnhtcEc9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9nLyIgeG1sbnM6cGRmPSJodHRwOi8vbnMuYWRvYmUuY29tL3BkZi8xLjMvIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIiB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIgZGM6Zm9ybWF0PSJpbWFnZS9qcGVnIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDEzLTExLTIwVDEyOjMzOjIzKzAxOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAxMy0xMS0yMFQxMjozMzoyMyswMTowMCIgeG1wOkNyZWF0ZURhdGU9IjIwMTMtMTAtMzBUMTE6NDY6NTArMDE6MDAiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgSWxsdXN0cmF0b3IgQ1M2IChNYWNpbnRvc2gpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkMwQkNCRDU2RDc1MUUzMTE4MEYyQ0M5NzhDQkIzMDJEIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkQxM0U1MEY2RDY1MUUzMTE4MEYyQ0M5NzhDQkIzMDJEIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InV1aWQ6NUQyMDg5MjQ5M0JGREIxMTkxNEE4NTkwRDMxNTA4QzgiIHhtcE1NOlJlbmRpdGlvbkNsYXNzPSJwcm9vZjpwZGYiIGlsbHVzdHJhdG9yOlR5cGU9IkRvY3VtZW50IiBpbGx1c3RyYXRvcjpTdGFydHVwUHJvZmlsZT0iUHJpbnQiIHhtcFRQZzpIYXNWaXNpYmxlT3ZlcnByaW50PSJGYWxzZSIgeG1wVFBnOkhhc1Zpc2libGVUcmFuc3BhcmVuY3k9IkZhbHNlIiB4bXBUUGc6TlBhZ2VzPSIxIiBwZGY6UHJvZHVjZXI9IkFkb2JlIFBERiBsaWJyYXJ5IDEwLjAxIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiIHRpZmY6T3JpZW50YXRpb249IjEiIHRpZmY6WFJlc29sdXRpb249IjMwMDAwMDAvMTAwMDAiIHRpZmY6WVJlc29sdXRpb249IjMwMDAwMDAvMTAwMDAiIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiIHRpZmY6TmF0aXZlRGlnZXN0PSIyNTYsMjU3LDI1OCwyNTksMjYyLDI3NCwyNzcsMjg0LDUzMCw1MzEsMjgyLDI4MywyOTYsMzAxLDMxOCwzMTksNTI5LDUzMiwzMDYsMjcwLDI3MSwyNzIsMzA1LDMxNSwzMzQzMjs0NzUyNDFBMTMxRTVBMzZBQzcwQ0RCMUJFQkY2OUE1MiIgZXhpZjpQaXhlbFhEaW1lbnNpb249IjE5OSIgZXhpZjpQaXhlbFlEaW1lbnNpb249IjY1IiBleGlmOkNvbG9yU3BhY2U9IjEiIGV4aWY6TmF0aXZlRGlnZXN0PSIzNjg2NCw0MDk2MCw0MDk2MSwzNzEyMSwzNzEyMiw0MDk2Miw0MDk2MywzNzUxMCw0MDk2NCwzNjg2NywzNjg2OCwzMzQzNCwzMzQzNywzNDg1MCwzNDg1MiwzNDg1NSwzNDg1NiwzNzM3NywzNzM3OCwzNzM3OSwzNzM4MCwzNzM4MSwzNzM4MiwzNzM4MywzNzM4NCwzNzM4NSwzNzM4NiwzNzM5Niw0MTQ4Myw0MTQ4NCw0MTQ4Niw0MTQ4Nyw0MTQ4OCw0MTQ5Miw0MTQ5Myw0MTQ5NSw0MTcyOCw0MTcyOSw0MTczMCw0MTk4NSw0MTk4Niw0MTk4Nyw0MTk4OCw0MTk4OSw0MTk5MCw0MTk5MSw0MTk5Miw0MTk5Myw0MTk5NCw0MTk5NSw0MTk5Niw0MjAxNiwwLDIsNCw1LDYsNyw4LDksMTAsMTEsMTIsMTMsMTQsMTUsMTYsMTcsMTgsMjAsMjIsMjMsMjQsMjUsMjYsMjcsMjgsMzA7MkJDMEM1MERCOTUyNTc5RjNCM0ZGNjQzRTY4ODkxQzQiPiA8ZGM6dGl0bGU+IDxyZGY6QWx0PiA8cmRmOmxpIHhtbDpsYW5nPSJ4LWRlZmF1bHQiPlJDX3N2ZW5za19saWdnYW5kZV9jbXlrX0NfcmVkLmJhcjwvcmRmOmxpPiA8L3JkZjpBbHQ+IDwvZGM6dGl0bGU+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkQxM0U1MEY2RDY1MUUzMTE4MEYyQ0M5NzhDQkIzMDJEIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkQxM0U1MEY2RDY1MUUzMTE4MEYyQ0M5NzhDQkIzMDJEIiBzdFJlZjpvcmlnaW5hbERvY3VtZW50SUQ9InV1aWQ6NUQyMDg5MjQ5M0JGREIxMTkxNEE4NTkwRDMxNTA4QzgiIHN0UmVmOnJlbmRpdGlvbkNsYXNzPSJwcm9vZjpwZGYiLz4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6QUJFNTIyQjgxMzIwNjgxMThBNkRGMEZCOTQ4NTFGQjgiIHN0RXZ0OndoZW49IjIwMTMtMDgtMjFUMTM6MTk6MDkrMDI6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIElsbHVzdHJhdG9yIENTNSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MDM4MDExNzQwNzIwNjgxMTgyMkFGMjEzNUFDNDEwMkIiIHN0RXZ0OndoZW49IjIwMTMtMTAtMzBUMTE6NDY6NDcrMDE6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIElsbHVzdHJhdG9yIENTNiAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY29udmVydGVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJmcm9tIGFwcGxpY2F0aW9uL3BkZiB0byBhcHBsaWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpEMTNFNTBGNkQ2NTFFMzExODBGMkNDOTc4Q0JCMzAyRCIgc3RFdnQ6d2hlbj0iMjAxMy0xMS0yMFQxMjoyOTowNCswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIEVsZW1lbnRzIDEwLjAgV2luZG93cyIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY29udmVydGVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJmcm9tIGFwcGxpY2F0aW9uL3BkZiB0byBpbWFnZS9qcGVnIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJkZXJpdmVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJjb252ZXJ0ZWQgZnJvbSBhcHBsaWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIHRvIGltYWdlL2pwZWciLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOkQyM0U1MEY2RDY1MUUzMTE4MEYyQ0M5NzhDQkIzMDJEIiBzdEV2dDp3aGVuPSIyMDEzLTExLTIwVDEyOjI5OjA0KzAxOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgRWxlbWVudHMgMTAuMCBXaW5kb3dzIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpDMEJDQkQ1NkQ3NTFFMzExODBGMkNDOTc4Q0JCMzAyRCIgc3RFdnQ6d2hlbj0iMjAxMy0xMS0yMFQxMjozMzoyMyswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIEVsZW1lbnRzIDEwLjAgV2luZG93cyIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPHhtcFRQZzpNYXhQYWdlU2l6ZSBzdERpbTp3PSI2MC41MzQxMTciIHN0RGltOmg9IjE5LjgxNDQ2NyIgc3REaW06dW5pdD0iTWlsbGltZXRlcnMiLz4gPHhtcFRQZzpQbGF0ZU5hbWVzPiA8cmRmOlNlcT4gPHJkZjpsaT5DeWFuPC9yZGY6bGk+IDxyZGY6bGk+TWFnZW50YTwvcmRmOmxpPiA8cmRmOmxpPlllbGxvdzwvcmRmOmxpPiA8cmRmOmxpPkJsYWNrPC9yZGY6bGk+IDwvcmRmOlNlcT4gPC94bXBUUGc6UGxhdGVOYW1lcz4gPHhtcFRQZzpTd2F0Y2hHcm91cHM+IDxyZGY6U2VxPiA8cmRmOmxpPiA8cmRmOkRlc2NyaXB0aW9uIHhtcEc6Z3JvdXBOYW1lPSJTdGFuZGFyZGbDpHJncnV0ZWdydXBwIiB4bXBHOmdyb3VwVHlwZT0iMCI+IDx4bXBHOkNvbG9yYW50cz4gPHJkZjpTZXE+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJWaXQiIHhtcEc6bW9kZT0iUkdCIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6cmVkPSIyNTUiIHhtcEc6Z3JlZW49IjI1NSIgeG1wRzpibHVlPSIyNTUiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IlN2YXJ0IiB4bXBHOm1vZGU9IlJHQiIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOnJlZD0iMjYiIHhtcEc6Z3JlZW49IjIzIiB4bXBHOmJsdWU9IjI3Ii8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTkwIE09MzAgWT05NSBLPTMwIiB4bXBHOm1vZGU9IlJHQiIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOnJlZD0iMCIgeG1wRzpncmVlbj0iOTkiIHhtcEc6Ymx1ZT0iNDYiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9NTUgTT0wIFk9MTcgSz0xIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6dGludD0iMTAwLjAwMDAwMCIgeG1wRzptb2RlPSJSR0IiIHhtcEc6cmVkPSIxMTgiIHhtcEc6Z3JlZW49IjE5OCIgeG1wRzpibHVlPSIyMDkiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MCBNPTQ5IFk9ODYgSz01IiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6dGludD0iMTAwLjAwMDAwMCIgeG1wRzptb2RlPSJSR0IiIHhtcEc6cmVkPSIyMzMiIHhtcEc6Z3JlZW49IjE0NiIgeG1wRzpibHVlPSI0NyIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz02MyBNPTYwIFk9MjUgSz02IiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6dGludD0iMTAwLjAwMDAwMCIgeG1wRzptb2RlPSJSR0IiIHhtcEc6cmVkPSIxMTEiIHhtcEc6Z3JlZW49IjEwMyIgeG1wRzpibHVlPSIxMzYiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MzMgTT01IFk9NzYgSz01IGtvcGlhIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6dGludD0iMTAwLjAwMDAwMCIgeG1wRzptb2RlPSJSR0IiIHhtcEc6cmVkPSIxODQiIHhtcEc6Z3JlZW49IjE5NiIgeG1wRzpibHVlPSI4NiIvPiA8L3JkZjpTZXE+IDwveG1wRzpDb2xvcmFudHM+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpsaT4gPHJkZjpsaT4gPHJkZjpEZXNjcmlwdGlvbiB4bXBHOmdyb3VwTmFtZT0iR3LDpXNrYWxhIiB4bXBHOmdyb3VwVHlwZT0iMSI+IDx4bXBHOkNvbG9yYW50cz4gPHJkZjpTZXE+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTAgTT0wIFk9MCBLPTEwMCIgeG1wRzptb2RlPSJSR0IiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpyZWQ9IjI2IiB4bXBHOmdyZWVuPSIyMyIgeG1wRzpibHVlPSIyNyIvPiA8L3JkZjpTZXE+IDwveG1wRzpDb2xvcmFudHM+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpsaT4gPHJkZjpsaT4gPHJkZjpEZXNjcmlwdGlvbiB4bXBHOmdyb3VwTmFtZT0iTGp1c3QiIHhtcEc6Z3JvdXBUeXBlPSIxIj4gPHhtcEc6Q29sb3JhbnRzPiA8cmRmOlNlcT4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MCBNPTc1IFk9MTAwIEs9MCIgeG1wRzptb2RlPSJSR0IiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpyZWQ9IjIzMiIgeG1wRzpncmVlbj0iOTMiIHhtcEc6Ymx1ZT0iMTUiLz4gPC9yZGY6U2VxPiA8L3htcEc6Q29sb3JhbnRzPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6bGk+IDwvcmRmOlNlcT4gPC94bXBUUGc6U3dhdGNoR3JvdXBzPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg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31X3l2rs/qbb2wOzMNmt5TZyGgymfg2guHpXwO1s5uyp+8bF7syVeBNRYCSOPRA/7rpq0qWZSTmD2n3nlvZr/e7rdLSS3twhKp4us65FiFNUSrguCe7hX5DoX+3/AN6jk73D5x2PkvbOWt3t9wv2lCyTC28JDFbTXLa/DuXfKQlV0o3cwrRasNbzLf8AF4y//a0yP/ufUe/kr3n/AJKd/wD81pP+Pnr6grH/AHBsv+aEf/HOjWfAf/ssPo7/ALXW5v8A33m9PeRX3N//ABI722/5q3X/AGhXHUPfeP8A+nI+4P8AzQt/+020614/lT/2VV8pv/FmfkJ/79/efv6kNt/5JW1/88kP/VrrlTF/ZRf6Uf4OhJ/l6/8AZd/w9/8AFjOqf/eqx/tNzD/yQt7/AOeaT/n7pu6/3Gn/ANKevo8e8cugv1737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691/9I0XvoL1wH6OP8Ay+f+yzei/wDqP7E/9812R7APuf8A8qBzH/pYP+0q36nb7sv/AE/n26/5qXv/AHa77onuW/4vGX/7WmR/9z6j38Wm8/8AJTv/APmtJ/x89fbLY/7g2X/NCP8A450az4D/APZYfR3/AGutzf8AvvN6e8ivub/+JHe23/NW6/7QrjqHvvH/APTkfcH/AJoW/wD2m2nWvH8qf+yqvlN/4sz8hP8A37+8/f1Ibb/yStr/AOeSH/q11ypi/sov9KP8HQk/y9f+y7/h7/4sZ1T/AO9Vj/abmH/khb3/AM80n/P3Td1/uNP/AKU9fR4945dBfr3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r/9M0XvoL1wH6OP8Ay+f+yzei/wDqP7E/9812R7APuf8A8qBzH/pYP+0q36nb7sv/AE/n26/5qXv/AHa77onuW/4vGX/7WmR/9z6j38Wm8/8AJTv/APmtJ/x89fbLY/7g2X/NCP8A450az4D/APZYfR3/AGutzf8AvvN6e8ivub/+JHe23/NW6/7QrjqHvvH/APTkfcH/AJoW/wD2m2nWvH8qf+yqvlN/4sz8hP8A37+8/f1Ibb/yStr/AOeSH/q11ypi/sov9KP8HQk/y9f+y7/h7/4sZ1T/AO9Vj/abmH/khb3/AM80n/P3Td1/uNP/AKU9X2/Jbt3t3E/Ifu/F4ntjtDF42g7Q3lSUGNxfYe8Mfj8fSQ5qqjp6SioqPMwUtJSwRgKkcaKiDgD38uPvv7qe521e9Puptu2+4m+W+3w7/fJHGl9dLGiLcSBERBKAqKO1UUAKtAooAArsraB7W2Z4VYlB6f5/9X29JbpzuPuGv7i6hoa7t3tSuoq7tTrejrqKs7H3pV0dXSVe9MJDVUVbSz5qWGqpqmGQpJG4ZXUkEMG9k/tN7te6O4e6PtxY3/uRvs1lNvtikkb310yOjXUQZWUykMrAkEEEEEgjpy6tbdbeekC6tPyzgj0/l1sxdv8Ad/S/x82dN2N33291f0h17TZChxFRvvt7f+0+tdnQZbKu8eMxc25955bC4SLIZF42WngacSTFSFBI9/Qz0COgs2d84vhV2H172B25sD5gfFvfPVHU8dJN2p2ds75A9T7m6960ir1d6GXf+9MJu2t23s2OtWNjEcjU04lAOkkD36h9OvdSuk/mt8NfktuPJ7O+OXy1+Mnf+7sLhZdzZnavSffPVfau5MRtuCvoMVNuDJ4PYu689k6DCQ5PKUtO1XLEkCz1MUZfXIgb3XukHtz+ZN/Ly3h2lQ9I7T+c/wARdy9vZTPR7TxXW+B+RPUuW3jl92y5BMTFtDEYKh3ZPXZXd0mTf7cYunWSv8wZPDqVgN0PXul5nvmr8Odrdeb97b3D8rfjhh+rurewsr1F2V2JXd29bRbM2F23hFpGy/VO7tyHcn8K2/2djvv6cS7eqpYsujVESmn1SIG9Q5x17oPKr+Zh/LkoNm7Q7Eyfz7+F+H2Hv+o3BRbH3fm/lB0nhdubur9pHEruzHbey+V3tR0WWyW1Xz9CuUpoXknx71kC1CRtKgbVDxpjr3XUP8zP+W9U7TyW/YP5gnwiqNjYbcWF2hl96Q/K7oeXaWL3ZuXG5/M7d2vktxpv1sRQ7hz2H2plKuiopZkqaumxtVLEjpTzFPU8/Lr3z8up0n8yD+XhBsKi7Vm+enwvh6uyW78p19juyZflJ0fHsGv39hMNiNx5nY9FvBt9DbtVu/Ebd3BQV9TjI6hq2noq2nnkjWKaNm917obNg/Iv4+dr9X5Hu7q7vbpvsnpfDQbgq8v29sDtDZO8OsMVS7Shlqt1VOS3/t3OZHalDT7ZpoHkyDy1arRxozTaAD7917ov+2P5nH8uDemE35ubavz6+Gmd251bRUeV7H3Dj/kv03Lgtj4bJbnwuysVn905c7xXH4XbmX3juXHYmjyE8iUVXkshTU0MrzTxI/uvdPWE/mM/y99zbP3z2Htv53fDTcOwOsP7s/6St84P5QdI5bZ/Xg3rlJcHs7+/O5aDfE+F2n/ezNU8lHjPv56f7+qRooPJICvv3XuhV3H8ofjPs/FdeZ7dvyJ6K2tg+39pbh391Nmdx9ubAwmK7Q2LtHZa9kbq3r13kcnuClpN67S2x15IueyGRxj1NHRYUiumkSmPl97ofTr3QJbX/mdfy1977l27svZf8wr4O7u3ju7O4na+09p7X+WXQuf3LujcufyFPisFt7b2CxO/6rKZvO5vKVcVNSUlNFLUVNRKscaM7AHXXulL1Z/MG+BPeW98R1n0n83viF3D2RuBa58D191Z8lemewd7ZtMZQVOVyb4jam0t6ZfPZJcdjKOapnMNO4ip4nkbSisR7r3Qr4v5G/HrObe7g3dhe+OmcxtP495rem3O/dz4vtDY+Q270fuHrahmyfYuB7fzVJnZcb1pmtgY2B6nN0uakop8VAjSVKxKCR7r3SFrPm98Lsdn+otqZD5efF+g3R8gsZtLOdC7bre/uqKXP93YXf2XOA2Jl+osPNuyPI9k4veudU0WIqMNHWxZKr/Zp2kk9Pv3XulTvb5SfGTrXtbZfQ/Y3yM6I2B3j2PBh6rrzpnevbvX+1e1t+024cvkdvYGo2Z11ndw0G790QZvPYeroaNqGjnWprKWaGPVLE6r7r3X/9Q0XvoL1wH6OP8Ay+f+yzei/wDqP7E/9812R7APuf8A8qBzH/pYP+0q36nb7sv/AE/n26/5qXv/AHa77onuW/4vGX/7WmR/9z6j38Wm8/8AJTv/APmtJ/x89fbLY/7g2X/NCP8A450az4D/APZYfR3/AGutzf8AvvN6e8ivub/+JHe23/NW6/7QrjqHvvH/APTkfcH/AJoW/wD2m2nWvH8qf+yqvlN/4sz8hP8A37+8/f1Ibb/yStr/AOeSH/q11ypi/sov9KP8HQk/y9f+y7/h7/4sZ1T/AO9Vj/abmH/khb3/AM80n/P3Td1/uNP/AKU9XUfKX/spTvr/AMSzvr/3fVnv5NPvEf8AT9vd7/xYr7/tJk6MbH/cKH/mmvSW6R/5nd0v/wCJe6y/97vBeyP2Z/6e57X/APiw7d/2lRdOXn+41z/pW/wP0cD/AIVNRzzfyrqiGlhxtTVTfKb4vxUtPmVlfD1FTL2NBHTwZdIIaid8VNMwWpWON3MBbSrHj39Lsfxfl0A14jrXj3D11VbLH/Cm3H9+7F6O+NHy52N8Nurdn1Pxm+Hu0YtlfE/P9Q7hO1t3DvTr9q2uG5N67pzNb/BJslUVmHwT4yXcLNNHJWZSqpMS4tf0tIxXq2KLTh0aTem0vlZsr+RZ8vt1bIxH8rOn3Ll/5e3QIwNd/L/673PtT5hf6DsrunpyX5EVnyj3BktzZL+KYyi+PU2YqdzzUkUERyMdTO6qiqh1/og1E/F59exqFa0r0KO0e7fjX8Taf+Syfgv8ff5S3c3xQ+Qvd3wN6Eg33ldtQ7y/mFdd9/8AbOXixXanb+6P4DSU2K2jvbauDoxS1WTyOTfcWI3hI1DV0XgQRRaqxVyxP+Tj1rJ1Ek9Fc60+Fs3zG+NvzSXbHfvxn6h7b6L/AOFOXza7k6k6/wDmRWYp/jT8idxbY6860rMt1T2Dtquhrq7cKy7cpamsdKWgyj/wSHKU0lKkdW1dQ6B0sTTy/wAnXiaMcdGc3H3x0v8APj/hPh/Mj7U3L8IfiV0b3X8QMr8gek63J9B7M6y3N1JF2zS4/qfc++u2fjrvbAYzLU2God+Lm8c1RVYrM5Y1v2NNVrla6nkpJ/dgGV1qxoevUzxz02/zNOlNgbG/lvf8J+H6T6r+NGwd69t/NL+WblNyVu+et8HiOnewN/Vnx73HFhs18nKPaFJgcpvzrj+K52c7mE9R95UYSqr0jmjaZn91FNT19D/q/wA/W/4vt6b/AOYn1n2dDsf+TxsTFbG/lO7j7w3T/NOzFMuy/ipsncW1vgVu3eeU6+21j9qYzubb9JDvreFVW5Pb1Pi4NySfb1lU+OFIsURiSL3ZMB/i+H/V+XXhTu48P9X8uqnnwO0dufy/O5F7vx+U6l2fvT/hRR1Zsf8Am7fHPobamV2D0r8a+gtind71uxeu9l7N3Fu3M03UVTnmZsNlWWHXuHC4bD0UUlTiaKryds610/win7P8P+WnXv8AUOthj+fJtX+W/iv5J/y/zvw2258LKDcM3Wvxixu3s18XMV0VTbnqOk2+cXxczMtDt7K9XQLkZetn3DX42r8cLtiWr56WYjyvExaXVVK1pUdV8xXj0S/+Zzs3sXYX8jX+YDl+xsT/ACkaHO1e4Pg1VYKT+V715nti1NRgqH5EbXqzF3624txbgrctMMhOn8BEbRRRE5JjqaSy2BIJJqSPX8v9R6sCRQ93Sc6fw28Ohf5rX8sn+UR33S5Dd+O+FHyk+c4+PWZ3jj59x4nt7+Xl8ovih2DmOk6LO5XK0aYrdGR2TLgtxbPztH9pTYumjo48XRxzwUM7L49wLHgT/n61xyOPVmP8vj4z/G+H+fj/ADudsxfHvo2PbvSFJ/LF3T0tg06k6/XE9P7lqvjfR7oqtwdW0C7e+26+zVXuamiyUtTiFo5pchElQzGZFcVJJRc+Z/ydaqStCcdaw/8ALo62zuS2P/wnjre8utfjF1j8Yd+/Pvcee62+XvU3Xebq/mVne7enO6t2V+yfj38h+y8nJtXF7f2F2d2k1JjsDFh5sy4w2Mpa5pKapxT0zOYKsf6P+Uf5erHh+XVyfS/ePTPW3wg/4VvdZ9h9qdf7F7Fz3zN/m01WB2PvDdeG21urPQdydd7l6/6ofB4XM1dHXZo9i73p2xWHSlSV66uKRRhmliDtFT2Y4j/Keqeg6rA+VfSO7e39sfysG2FNmsL3H0N/wnB6y+X/AEnX46mqpcpR9j/GHdOO7qw0tFhggObqc9tHAZOkoIGSRZKqtp541keOK7ykqHpwDf8AFdXBoD0I/fvy4wvyN+T+xP5+max25qnqXrf54/FXoD49bFyjVtDW4Tqn4y/CHuf5QfJ3blPNPj4WymOzne+4ozjMglHaOojr1US6mRKgMP06d3+x1senX//VNF76C9cB+jj/AMvn/ss3ov8A6j+xP/fNdkewD7n/APKgcx/6WD/tKt+p2+7L/wBP59uv+al7/wB2u+6J7lv+Lxl/+1pkf/c+o9/FpvP/ACU7/wD5rSf8fPX2y2P+4Nl/zQj/AOOdGs+A/wD2WH0d/wBrrc3/AL7zenvIr7m//iR3tt/zVuv+0K46h77x/wD05H3B/wCaFv8A9ptp1rx/Kn/sqr5Tf+LM/IT/AN+/vP39SG2/8kra/wDnkh/6tdcqYv7KL/Sj/B0JP8vX/su/4e/+LGdU/wDvVY/2m5h/5IW9/wDPNJ/z903df7jT/wClPV1Hyl/7KU76/wDEs76/931Z7+TT7xH/AE/b3e/8WK+/7SZOjGx/3Ch/5pr0lukf+Z3dL/8AiXusv/e7wXsj9mf+nue1/wD4sO3f9pUXTl5/uNc/6Vv8D9bPPyO2D8Y+0dl7f6/+Vu2+mt5bB3X2Fs7F7V2j3dT7Srtt7k7Ueukl2FidvYveB+xzG+6jIROcVS0yyV0sqt4UJB9/S2K+XQDFfLpFdy/HP4Sbo3rXb1776k+OmU3/AN+bQpvivX7k7P21sT+83cezclXyb/ouhHr9xQx12+8dXV+0Hy0O3w1UZDizULCRTFk1WnWuit/BrrD4BbK7j7Jofih8BdnfGHsDA7A/u/2tvba3T3Rew5cUclv/ADNEeit9V/We7M7uPF74rsZsrD72/geRpYYJdsZ3B5DyGaoenp95oK8OvVr0FW2egv8AhPh1v8ltybi2ps7+VXsz5R9G1OU7A3PhsTlvjVhuwek8n1POm7M32Hkeu4crC/Vec60qceuTq84cbj6vDSQCpknhZA493HFOvUPSiy2x/wCQ98kcBleg56v+Wj2ziezO2d7fIuu612/2B8f83kt2dz5DbVTU9i9xUeL2zuU5yq31V7O27PJmcxTWqnxlFK1TIYIntujCpoet0NPl0ZDojA/yxO3ej92fEn4xxfCXs/4947DGj338fuhsh0rvPrajw+6K+eplk3j1/wBe1eSw0aboy9FNPLU11P5MhWRySu8kodvejqHGvWvP59LrtH44fBXvjEbM+I/cPUPxq7XxXUG1tr772J8ct87c2Buv/R3snGUeW6z2bvDAdXZWGsqdu7VpKSlrcFj8hFRx0Y8M1LFJqjZBqtOvdYdk/wAvH4Jda4zY+F6++IHx02Vh+s+2D3v15itr9SbMwmP2T3Q2JwGBbtPa1Hj8TBT4Tfb4fauMpjk6dY6oxUECl7RrbdT17oFtgbv/AJPvZfb/AHp1H1hvj+XT2P3l8rHqcX8j+odl72+Oe9+xfkFJsTDbjnyVB251hiMvlc52TNtbBVeXmrIspj6tqamlrJJgFaZj7Pn17PRKu2erv5Enwj7F3Z8bN0fEf4c7L3P8iMR0xQbn2BVR/FDazdrYPsT5B7RxGC2tT7D7W7V2dufP7e623vtLE72y2OosS+Mosdi4q2iSryEaUh93VBHW6Vz0YjdnQ38ij43UXZvxy33sT+WP0PS9p4zYuW7c6U3i/wAcesZt74faGWq9z9dZXeuw85V4Wry2OwWYM9dip6qmaOObXJE1wT73RjkA069Q/OnRqKqL+Xr3HvDpP5pz1vxI7L3riM+nUHx6+UaZvqbdWWj3RujMZ7Z0HV/VfbtPXVjVmfze4c3lMZBhcbXSVM1fVVMEcJnkkU6oR69a6GLEde/HLrXvDdm/cNtfqXZHyK+S9Di23huSlpNsYPtjvDG9M4CgwmMbJVI+33Nvuh6z21kKWnU/5QmKpJ4lbxo6X9XFPLr3+DoC+wviR/Ln60+N22+ru2OiPihsD4odPb7xXYG1Npdh7R612r0p1p2RnNwZHE4PeGHg3JBQ7U2rvHL7n7AqaSkrY2gq6iszLwRs0lSUfwJqCOPXvn0ivkl8Bv5VvZ/cWzu5Pld8Y/hzuXujf+68Tsza+7u49l9ax7l7c3s2Hio9u7QrIdxxU8fce5o9u7dWHH46vhy1VHQUXjgjEMRA9U9e4dDjvfZnwq2x25Qdndj4X43bb7t62+PO9P4fu/eY67wm/dj/ABW21VRw9h1UVbmXpcrgOidt1e4kjzFR+1gqJ65UqHj8wDarinXuit7S62/kwdudDV3TGwsN/Lr7L+N3x8Xd3a2Y692dlOgN4dUdNw5fC7opd8di57D4LIZDbmxqas29uDLrkcrVrTRmkqajyyBC1rdwIxnrdTX59f/WNF76C9cB+jj/AMvn/ss3ov8A6j+xP/fNdkewD7n/APKgcx/6WD/tKt+p2+7L/wBP59uv+al7/wB2u+6J7lv+Lxl/+1pkf/c+o9/FpvP/ACU7/wD5rSf8fPX2y2P+4Nl/zQj/AOOdGs+A/wD2WH0d/wBrrc3/AL7zenvIr7m//iR3tt/zVuv+0K46h77x/wD05H3B/wCaFv8A9ptp1rx/Kn/sqr5Tf+LM/IT/AN+/vP39SG2/8kra/wDnkh/6tdcqYv7KL/Sj/B0JP8vX/su/4e/+LGdU/wDvVY/2m5h/5IW9/wDPNJ/z903df7jT/wClPV1Hyl/7KU76/wDEs76/931Z7+TT7xH/AE/b3e/8WK+/7SZOjGx/3Ch/5pr0lukf+Z3dL/8AiXusv/e7wXsj9mf+nue1/wD4sO3f9pUXTl5/uNc/6Vv8D9bHHz2+NWS+WnxO7d6Z2tuKo2T2jV4vE776G7Doqk0Ff1n8i+pdw4jtH4/9iUtekM89NHs/t7aGHrapYwGqaGOenJCTN7+lsGhr0AgadUst/MLw/wAj8xjf5h+V2nlI+pf5bfxIwufj6Ygod0rufcH82/5m7cpus0+LD0z0doe1egtrZun68almp1mizPdf77RR02v3alDTzJ+XDrePz/ydAt8AN57k+EPyx+MdV2J8avlX0lj/AJ37Kq+jPnT3P8g+uer9gbD7K/mU7m3tv/5FdXdw4vPbS39u/K5Cp7f372X2VsKgpamCmZaWq2ZilmkjoKaIeIrXhUf4Ot8Qc8Ojv/FbH5z+XH2V8M/5e2fpfj38hviP8jpu4tq/CfvPaMG2dq/JHb8W3esOwe99yUPyF65xWOqtl984HcHWWJXH1vbm0ZMRJk8jJRnceG+4zAyk2jQ1Pn1rjUnj0stnbZ23S7o/4UA1dPt/B01Tie1cVT4uqgxOOhqsZTP/ACg/hwkkFBPHTiajgZK2YaIyqWmk/wBW19DiPt68fh6IZ8BchuPrjvf+Wh2B8zct8f8Ap3r7an8njIbv+IW/+qcQm0qfsbb2M6u+PmV+Tmz/AJR9hb+3M+bq9xdPdcYPAbw29icNiqPC1FDWbgyVTVyPg1T3dsa6evWz5/b0W7ZnyI7F2h2h1r/OE3r8QPmx19vrevyR3t2F8i+3N39W7KxnSGC/lI964DZ/VfX/AFvms7tbeuV37U4b4+9X9a9a9xVEVRhGSk3vRbr0+GPL1U3v1BSlR17+jXq/3+clUJT/AAC7I/j9VvKg6dqO0PjBQ/KfJbBO8RuPG/DSu+T3UFJ8wK6R9gJLu2DaMPxvm3L/AHmlpI5PFtc5F5QIVkZaLWop1ocR0wdudwVfxz3v/L0ougOtPh5nPhZ3H3F1R8f+nqjYlDLj9w9er2X1n29uKHeXSD7Kon6npev5dibSp6SgTF+IVdFkKgB/t9IffGuqtetdAr/LSoPjRnfiH8yKr5PUfUWT7SrPk380Mf8AzNX73HX+Qdcth+9+0ocFi++59wy1e1Y+pcN8e6Xbw2pFUyHbcGx0oWo7U+o+/Nx7a6fLrefz6KR1bhBkP5Mf8tnNZ3EZHI0Ev8wL+XXR9LZzfuIWTfFT8Tv+HcusKT4h/wAVrsrRpmmjqfilLtIR/cETSUko8oLO9/N8R62eLdY/5lD4T5mfJ3sT4uw/G75YdtfG74i9Nb22TjN0fEfqnA7nxXWX8yX5A7Jwu4NqdtTy7i7Z6l2+OxPhl0RuvF5zbbY0V8wzXZtb9xPQT45FqdqKCtRX/J1oYFehd+PPyhzfzE+Rv8lzt3fWGG1+8MN1B/Mr6r+TvX8lLS4/K9XfJrqDD/H7rXvfZWZwNPXV9RtY0XYuBqqigpalxK+HraKexjqInb3BXHljrRx06fzUt6bZ+Svyd61+EW6/jn8i/lj8a+nOt9x97fMHrj41bO2fv2fKdgdv7Y3t1H8UOtew13J2HsSgwlNgcfNvHskQSyT1tFnNu7PyMdKySw1MehgE1z1sYz59Ec3I+Y/mG/Hj+Ux8WvlvF3PsHv8A6X/mC9h/FPv7OZEZrqv5A7O7g6m/l3/KHsDoD5LYvJLXZcbf7X3Psiu2D21jqukq8tiKbcFd4Y5q6nppPJs0VqjI62OJpw/2Ogo+TXf3YvbnaHzq61+RFLicP8u/jD/wnB/m59IfJbFYOBqXb26dxYzdPxzzexO+thQfa0kSdX/I/rrLY/duHgRdWGmrqzCVFq3FVSjRFAPT/iutEdWo/wAyzAfHCmyP8vnbmx8J1zT/AMwhvkd8csf07gdh4zbkXyCboGqqKhPmbQ7gxOBp13qfjjU/FCbfC7miyUZ2s9e9AJlOSON96Hn6U69iv9Hr/9c0XvoL1wH6OP8Ay+f+yzei/wDqP7E/9812R7APuf8A8qBzH/pYP+0q36nb7sv/AE/n26/5qXv/AHa77onuW/4vGX/7WmR/9z6j38Wm8/8AJTv/APmtJ/x89fbLY/7g2X/NCP8A450az4D/APZYfR3/AGutzf8AvvN6e8ivub/+JHe23/NW6/7QrjqHvvH/APTkfcH/AJoW/wD2m2nWvH8qf+yqvlN/4sz8hP8A37+8/f1Ibb/yStr/AOeSH/q11ypi/sov9KP8HQk/y9f+y7/h7/4sZ1T/AO9Vj/abmH/khb3/AM80n/P3Td1/uNP/AKU9XUfKX/spTvr/AMSzvr/3fVnv5NPvEf8AT9vd7/xYr7/tJk6MbH/cKH/mmvSW6R/5nd0v/wCJe6y/97vBeyP2Z/6e57X/APiw7d/2lRdOXn+41z/pW/wP1t8+/pa6AXWnX19/zJTun/x8Uov/AIYD1Z7dHn/pOnB5/wCl6vq/m0f9keYz/wAXU/lf/wDwzb4he2uqDiOtHz/hGF/28X+XP/it2W/9+3tH3Y/i+3/P1s+f29bhG1/+Pg/4UKf+JZxH/wAKG+GHvQ4j7eteQ6pr/m4/9uLv5VP/AIq/uf8A+EX/ADR97P8AaN+fW/xn8+tkz+aR/wBuyv5i3/iiXy6/+B/7B96X4l+3rS/EPt6Eb4L/APZEvw7/APFWPj5/76XaPvzfEft68eJ6+X//ACN/+4jTrn/xYn5Jf+4fZPu3m/59eP4v9Xn0b7/hTZ/3EDdE/wDam+I//vap78OEf29eHl9vW+B/NN/5kZ8fv/GlP8qn/wCGLfGj3Trw8+kh/Kn/AOLb/ML/APGrHzb/APes277s34fs62fL7OtEL/hSv/ne6v8Axsz8xf8A4Af+V37sPhf7B/k6r1sEf8I1v+yLPlL/AOLA9Zf/AAKnRvvTfCv+ryHWz5f6vToV96/9v5M7/wCNJPg5/wDCVvn972f7Nf8AV69X/CPz/wAvSL/mz/8AbzT+Y7/46K/N/wD+CA3Z7p+Efb/m6p5DqiT+QX/26Q/nh/8AjPT5cf8Avmew/bx/tU/0x/w9WP4ft6//2Q=='		
		aDoc.addImage(imgData, 'JPEG', 10, 8, 35, 11);
		var d = new Date();
		var iso8601 = d.getUTCFullYear() + '-' + pad(d.getUTCMonth()+1) + '-' + pad(d.getUTCDate());
		aDoc.setFontSize(7);
		aDoc.text(185, 15, iso8601.toString());
		aDoc.setFontSize(16);
		aDoc.text(10, 28, 'Registerutdrag från ' + aRegister.data.RegisterName + ' för ' + aPersonnummer);
		aDoc.line(10, 31, 200, 31); // horizontal line
	}

	function addFooter(aDoc) {
		aDoc.line(10, 275, 200, 275); // horizontal line
		aDoc.text(10, 282, 'Registercentrum Västra Götaland • 413 45 Göteborg');
		aDoc.text(10, 285, 'Växel 010-441 29 00');
		aDoc.text(10, 288, 'info@registercentrum.se • www.registercentrum.se');
		var imgData = 'data:image/png;base64,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'
		aDoc.addImage(imgData, 'PNG', 155, 280, 40, 10);
		aDoc.text(100, 285, 'sida ' + page++ );
	}

	function addMessage(aShortName) {
		var titleCmp = Ext.create('Ext.Component', {
			margin: '0 0 10 0',
			html: '<p>Det finns ingen information för patienten i registret ' + aShortName + '</p>',
			style: {color:'#F00'},
			width: 640
		});
		messageContainer.add(titleCmp);
		console.log('Det finns ingen information för patienten i ' + aShortName + '.');
		unspin();
	}



	var createPDF = function(anImgData) {
		aDoc.addImage(anImgData, 'JPEG', 10, 8, 35, 11);

		// Output as Data URI
		//doc.output('dataurlnewwindow');
	}

	// Because of security restrictions, getImageFromUrl will
	// not load images from other domains.  Chrome has added
	// security restrictions that prevent it from loading images
	// when running local files.  Run with: chromium --allow-file-access-from-files --allow-file-access
	// to temporarily get around this issue.
	var getImageFromUrl = function(url, callback) {
		var img = new Image, data, ret={data: null, pending: true};
		
		img.onError = function() {
			throw new Error('Cannot load image: "'+url+'"');
		}
		img.onload = function() {
			var canvas = document.createElement('canvas');
			document.body.appendChild(canvas);
			canvas.width = img.width;
			canvas.height = img.height;

			var ctx = canvas.getContext('2d');
			ctx.drawImage(img, 0, 0);
			// Grab the image as a jpeg encoded in base64, but only the data
			data = canvas.toDataURL('image/jpeg').slice('data:image/jpeg;base64,'.length);
			// Convert the data to binary form
			data = atob(data)
			document.body.removeChild(canvas);

			ret['data'] = data;
			ret['pending'] = false;
			if (typeof callback === 'function') {
				callback(data);
			}
		}
		img.src = url;

		return ret;
	}

	// Since images are loaded asyncronously, we must wait to create
	// the pdf until we actually have the image data.
	// If we already had the jpeg image binary data loaded into
	// a string, we create the pdf without delay.
	var copyImage = function(imgData) {
		//var doc = new jsPDF();

		doc.addImage(imgData, 'JPEG', 10, 10, 50, 50);
		//doc.addImage(imgData, 'JPEG', 70, 10, 100, 120);

		// Output as Data URI
		//doc.output('datauri');
	}

	//getImageFromUrl('RC-logga.jpg', createPDF);

}());
