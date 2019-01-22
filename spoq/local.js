{
	TitleOfPanel: function(currentRegistration) { /*current registration, den jag håller på med*/
		var formTitle = currentRegistration.Form.FormTitle,
			formID = currentRegistration.Form.FormID,
			eventDate = currentRegistration[currentRegistration.Form.MappedEventDate], 
			isCB = currentRegistration.IsCrossBorder,
			conProf = Profile.Context.Role.IsPermittedToCrossBorder,
			roleNotPermittedToViewCrossBorder = currentRegistration.IsCrossBorder && !Profile.Context.Role.IsPermittedToCrossBorder,
			badgeHoger = '<span class="Badge Blueish">Höger</span>',
			badgeVanster = '<span class="Badge Orangeish">Vänster</span>',
			formTitleWithBadge;

			
			if (roleNotPermittedToViewCrossBorder){
					
				formTitle += ' &nbsp; ' + "<i>   (dold – registrerat på annan vårdenhet)<i>";
				if (formID === 2166 || !formID === 2171 || formID === 2174 || formID === 2177 || formID === 2190){
						switch 
						((currentRegistration.SCFE_Op_Side) || 
						(currentRegistration.Knee_Pr_Side) || 
						(currentRegistration.DDH_DiTr_Side) || 
						(currentRegistration.PEVA_Diag_Side) || 
						(currentRegistration.LCPD_Diag_Side)){
							case 1:
								formTitleWithBadge = formTitle + badgeHoger;
								break;
							case 2:
								formTitleWithBadge = formTitle + badgeVanster;
								break;
						}
							return formTitleWithBadge;

					} else {
						return formTitle;
						}	
			} 
			
			else {
	
				var formattedDate = Ext.util.Format.date(Repository.Global.Methods.ParseDate(eventDate) , 'Y-m-d');
				formTitle += ' &nbsp; ' + formattedDate;
				if (formID === 2166 || !formID === 2171 || formID === 2174 || formID === 2177 || formID === 2190){
						switch 
						((currentRegistration.SCFE_Op_Side) || 
						(currentRegistration.Knee_Pr_Side) || 
						(currentRegistration.DDH_DiTr_Side) || 
						(currentRegistration.PEVA_Diag_Side) || 
						(currentRegistration.LCPD_Diag_Side)){
							case 1:
								formTitleWithBadge = formTitle + badgeHoger;
								break;
							case 2:
								formTitleWithBadge = formTitle + badgeVanster;
								break;
						}
						return formTitleWithBadge;

				} else {
					return formTitle;	
				}		
			}
	},

	TitleOfEvent: function(currentRegistration) {
		var eventDate = currentRegistration[currentRegistration.Form.MappedEventDate], 
			roleNotPermittedToViewCrossBorder = currentRegistration.IsCrossBorder && !Profile.Context.Role.IsPermittedToCrossBorder,
			badgeHoger = '<span class="Badge Blueish">Hö</span>',
			badgeVanster = '<span class="Badge Orangeish">Vä</span>';
	
		if (roleNotPermittedToViewCrossBorder){
			var hidden = "<i>(dold) </i>";
				switch ((currentRegistration.SCFE_Op_Side) || 
				(currentRegistration.Knee_Pr_Side) || 
				(currentRegistration.DDH_DiTr_Side) || 
				(currentRegistration.PEVA_Diag_Side) || 
				(currentRegistration.LCPD_Diag_Side)){
					case 1:
						hidden += badgeHoger;
						break;
					case 2:
						hidden += badgeVanster;
						break;
				}
			return hidden;		
		} else {
				var formattedDate = Ext.util.Format.date(Repository.Global.Methods.ParseDate(eventDate), 'Y-m-d');
				
				switch 
				((currentRegistration.SCFE_Op_Side) || 
				(currentRegistration.Knee_Pr_Side) || 
				(currentRegistration.DDH_DiTr_Side) || 
				(currentRegistration.PEVA_Diag_Side) || 
				(currentRegistration.LCPD_Diag_Side)){
					case 1:
						formattedDate += badgeHoger;
						break;
					case 2:
						formattedDate += badgeVanster;
						break;
				}
				return formattedDate;
			}
	}, 


SubjectOverviewKnee: {
		beforeProcess: function(aCallback) {
			/*
			// Do your asynchronous stuff ...
			Ext.Ajax.request({
				url: 'api/metadata/domains/map/4001',
				method: 'get',
				success: function(r) {
					this.domainsMap = r = Ext.decode(r.responseText).data;
					aCallback();
				}
			});
			*/
			aCallback();
		},
		repeatingLevel: 'SPOQKneePr',
		contentProvider: function(aHistory, anEventID) {
			var gm = Repository.Global.Methods;
			var list = [];
			var spoqKneePr = aHistory[anEventID];
            var spoqKneeRe;
            var formatMyDate = function(date){
                var formattedDate = Ext.util.Format.date(gm.ParseDate(date),'Y-m-d');
                return formattedDate;
            }

			for (var ie in aHistory) {
				var currentEvent = aHistory[ie];
				if (currentEvent.ParentEventID === anEventID && currentEvent.FormName === 'SPOQKneeRe') {
					spoqKneeRe = currentEvent;					
				}
			}
			list.push(spoqKneePr.Knee_Pr_Side == 1 ? 'Höger' :
					spoqKneePr.Knee_Pr_Side == 2 ? 'Vänster' :	
						'');			
			list.push(spoqKneePr.Knee_Pr_DiagMain == 1 ? 'Patellaluxation' :
					spoqKneePr.Knee_Pr_DiagMain == 2 ? 'ACL (anterior cruciate ligament) ruptur' :
					spoqKneePr.Knee_Pr_DiagMain == 3 ? 'Eminentiafraktur' :
					spoqKneePr.Knee_Pr_DiagMain == 4 ? 'MCL (medial collateral ligament) skada' :
					spoqKneePr.Knee_Pr_DiagMain == 5 ? 'LCL (lateral collateral ligament) skada' :
					spoqKneePr.Knee_Pr_DiagMain == 6 ? 'Medial meniskskada' :
					spoqKneePr.Knee_Pr_DiagMain == 7 ? 'Lateral meniskskada' :
					spoqKneePr.Knee_Pr_DiagMain == 8 ? 'PCL ( posterior cruciate ligament) ruptur' :
					spoqKneePr.Knee_Pr_DiagMain == 9 ? 'Avulsionsfraktur i bakre korsbandets fäste i tibia' :
					spoqKneePr.Knee_Pr_DiagMain == 10 ? 'PLC Avulsionsfraktur i proximala fästet för laterala kollateralligamentet och/eller popliteussenan' :
					spoqKneePr.Knee_Pr_DiagMain == 11 ? 'Osteokondralskada/ broskskada ( ej patellalux)' :
					spoqKneePr.Knee_Pr_DiagMain == 12 ? 'Broskkontusion ospecifikt benmärgsödem på MR' :
					spoqKneePr.Knee_Pr_DiagMain == 13 ? 'Distorsion UNS, ospecificerat kapselödem på MR' :
					spoqKneePr.Knee_Pr_DiagMain == 14 ? 'Fyseolys/epifysfraktur distala femur, enligt AO (33-E/x.x)' :
					spoqKneePr.Knee_Pr_DiagMain == 15 ? 'Fyseolys/epifysfraktur proximala tibia, enligt AO (41t-E/x.x)' :
					spoqKneePr.Knee_Pr_DiagMain == 16 ? 'Patellafraktur, enligt AO (34-x.x)' :
					spoqKneePr.Knee_Pr_DiagMain == 8888 ? 'Annan specifik diagnos' :	
						'');	
			
			list.push(formatMyDate(spoqKneePr.Knee_Pr_AccidentDate));						

			list.push((spoqKneeRe && spoqKneeRe.Knee_Re_ReDate) ? formatMyDate(spoqKneeRe.Knee_Re_ReDate)  : '');
			return list;
		},
		defaultPeriod: 'Alla',		
		filterDate: 'Knee_Pr_AccidentDate',		
		headingProvider: function() {
			return [

				{ header: 'Sida',	width:70 },				
				{ header: 'Huvuddiagnos',	flex:1 },
				{ header: 'Skadedatum',	width:108 },					
				{ header: 'Reop/ändrad beh.',	width:130 } 

			];
		}
	},


SubjectOverviewSCFE: {
		beforeProcess: function(aCallback) {
			/*
			// Do your asynchronous stuff ...
			Ext.Ajax.request({
				url: 'api/metadata/domains/map/4001',
				method: 'get',
				success: function(r) {
					this.domainsMap = r = Ext.decode(r.responseText).data;
					aCallback();
				}
			});
			*/
			aCallback();
		},
		repeatingLevel: 'SPOQSCFEOp',
		contentProvider: function(aHistory, anEventID) {
			var gm = Repository.Global.Methods;
			var list = [];
			var spoqScfeOp = aHistory[anEventID];
            var spoqScfeRe, spoqScfeEnd, rreop;
            var formatMyDate = function(date){
                var formattedDate = Ext.util.Format.date(gm.ParseDate(date),'Y-m-d');
                return formattedDate;
            }

			for (var ie in aHistory) {
				var currentEvent = aHistory[ie];
				if (currentEvent.ParentEventID === anEventID && currentEvent.FormName === 'SPOQSCFERe') {
					spoqScfeRe = currentEvent;
					
					
				}
				else if (currentEvent.ParentEventID === anEventID && currentEvent.FormName === 'SPOQSCFEEnd'){
					spoqScfeEnd=currentEvent;
				}

			}
			list.push(spoqScfeOp.SCFE_Op_Side == 1 ? 'Höger' :
					spoqScfeOp.SCFE_Op_Side == 2 ? 'Vänster' :
						'');
			list.push (formatMyDate(spoqScfeOp.SCFE_Op_OpDate));
			
			list.push(spoqScfeOp.SCFE_Op_Cause == 1 ? 'Höftfyseolys' :
					spoqScfeOp.SCFE_Op_Cause == 2 ? 'Profylaktisk' :
						'');	
			list.push((spoqScfeRe && spoqScfeRe.SCFE_Re_ReOpDate) ? formatMyDate(spoqScfeRe.SCFE_Re_ReOpDate)  : '');
			
			list.push((spoqScfeEnd && spoqScfeEnd.SCFE_End_Date) ? formatMyDate(spoqScfeEnd.SCFE_End_Date)  : '');

			return list;
			
		},
		defaultPeriod: 'Alla',		
		filterDate: 'SCFE_Op_OpDate',			
		headingProvider: function() {
			return [
				{ header: 'Sida',	width: 70 },			
				{ header: 'Operation',	width : 90 },
				{ header: 'Diagnos',	flex: 1 },				
				{ header: 'Reoperation',	width: 110 },
				{ header: 'Slutktr',	width: 90 }
			];
		}
	},



SubjectOverviewPEVA: {
		beforeProcess: function(aCallback) {
			/*
			// Do your asynchronous stuff ...
			Ext.Ajax.request({
				url: 'api/metadata/domains/map/4001',
				method: 'get',
				success: function(r) {
					this.domainsMap = r = Ext.decode(r.responseText).data;
					aCallback();
				}
			});
			*/
			aCallback();
		},
		repeatingLevel: 'SPOQPEVADiag',
		contentProvider: function(aHistory, anEventID) {
			var gm = Repository.Global.Methods;
			var list = [];
			var spoqPevaDiag = aHistory[anEventID];
            var peva1, pevare, peva4, peva10, peva18, spoqPevaTr, rreop, rs;
            var formatMyDate = function(date){
                var formattedDate = Ext.util.Format.date(gm.ParseDate(date),'Y-m-d');
                return formattedDate;
            }

			for (var ie in aHistory) {
				var currentEvent = aHistory[ie];
				if (currentEvent.ParentEventID === anEventID && currentEvent.FormName === 'SPOQPEVATr') {
					spoqPevaTr = currentEvent;					
				}

				if (spoqPevaTr && currentEvent.ParentEventID === spoqPevaTr.EventID) {
					if (currentEvent.FormName === 'SPOQPEVA1') {
						peva1 = currentEvent;
					}
					else if (currentEvent.FormName === 'SPOQPEVARe') {
						pevare = currentEvent;
					} 
					else if (currentEvent.FormName === 'SPOQPEVA4') {
						peva4 = currentEvent;
					} 
					else if (currentEvent.FormName === 'SPOQPEVA10') {
						peva10 = currentEvent;
					} 	
					else if (currentEvent.FormName === 'SPOQPEVA18') {
						peva18 = currentEvent;
					} 					
					
				}
			}
			list.push(
                spoqPevaDiag.PEVA_Diag_Side == 1 ? 'Höger' :
				spoqPevaDiag.PEVA_Diag_Side == 2 ? 'Vänster' :
				'');
			list.push((spoqPevaTr && spoqPevaTr.PEVA_Tr_PlastStartDate) ? formatMyDate(spoqPevaTr.PEVA_Tr_PlastStartDate) : '');
			list.push((peva1 && peva1.PEVA_1_Date) ? formatMyDate(peva1.PEVA_1_Date)  : '');
			list.push((pevare && pevare.PEVA_Re_DiagDate) ? formatMyDate(pevare.PEVA_Re_DiagDate)  : '');
			list.push((peva4 && peva4.PEVA_4_Date) ? formatMyDate(peva4.PEVA_4_Date)  : '');
			list.push((peva10 && peva10.PEVA_10_Date) ? formatMyDate(peva10.PEVA_10_Date)  : '');
			list.push((peva18 && peva18.PEVA_18_Date) ? formatMyDate(peva18.PEVA_18_Date) : '');			

			return list;
			
		},
		defaultPeriod: 'Alla',	
	
		headingProvider: function() {
			return [
				{ header: 'Sida',	width:70 },
				{ header: 'Gipsstart',	flex: 1 },
				{ header: 'Ktr 1 års å',	width:90 },
				{ header: 'Recidiv',	width:90 },
				{ header: 'Ktr 4 års å',	width:90 },
				{ header: 'Ktr 10 års å',	width:90 },
				{ header: 'Ktr 18 års å',	width:90 }
			];
		}
	},
	
SubjectOverviewDDH: {
		beforeProcess: function(aCallback) {
			/*
			// Do your asynchronous stuff ...
			Ext.Ajax.request({
				url: 'api/metadata/domains/map/4001',
				method: 'get',
				success: function(r) {
					this.domainsMap = r = Ext.decode(r.responseText).data;
					aCallback();
				}
			});
			*/
			aCallback();
		},
		repeatingLevel: 'SPOQDDHDiTr',
		contentProvider: function(aHistory, anEventID) {
			var gm = Repository.Global.Methods;
			var list = [];
			var spoqDdhDiTr = aHistory[anEventID];
            var ddh4, ddh10, ddh18;
            var formatMyDate = function(date){
                var formattedDate = Ext.util.Format.date(gm.ParseDate(date),'Y-m-d');
                return formattedDate;
            }

			for (var ie in aHistory) {
				var currentEvent = aHistory[ie];
				if (currentEvent.ParentEventID === anEventID && currentEvent.FormName === 'SPOQDDH4') {
					ddh4 = currentEvent;	
				}
				else if (currentEvent.ParentEventID === anEventID && currentEvent.FormName === 'SPOQDDH10'){
					ddh10 = currentEvent;
				}
				else if (currentEvent.ParentEventID === anEventID && currentEvent.FormName === 'SPOQDDH18'){
					ddh18 = currentEvent;
				}		
            }
            
    		list.push(
                spoqDdhDiTr.DDH_DiTr_Side == 1 ? 'Höger' :
				spoqDdhDiTr.DDH_DiTr_Side == 2 ? 'Vänster' :	
				'');			
			list.push(
                spoqDdhDiTr.DDH_DiTr_Diag == 1 ? 'Sent upptäckt höftledsluxation' :
				spoqDdhDiTr.DDH_DiTr_Diag == 2 ? 'Komplikation till tidigt upptäckt höftledsluxation' :	
				'');	
			list.push(formatMyDate(spoqDdhDiTr.DDH_DiTr_DiagDate));
			list.push((ddh4 && ddh4.DDH_4_VisitDate)    ? formatMyDate(ddh4.DDH_4_VisitDate) : '');	
			list.push((ddh10 && ddh10.DDH_10_VisitDate) ? formatMyDate(ddh10.DDH_10_VisitDate) : '');	
			list.push((ddh18 && ddh18.DDH_18_VisitDate) ? formatMyDate(ddh18.DDH_18_VisitDate) : '');
			return list;
			
		},
		defaultPeriod: 'Alla',		
		headingProvider: function() {
			return [

				{ header: 'Sida',	width:70 },				
				{ header: 'Diagnos',	flex:1 },	
				{ header: 'Diagnosdatum',	width:110 },	
				{ header: 'Ktr 4 å åld',	width:110 },	
				{ header: 'Ktr 10 å åld',	width:110 },
				{ header: 'Ktr 18 å åld',	width:110 }					


			];
		}
	},
	
	
	
SubjectOverviewLCPD: {
		beforeProcess: function(aCallback) {
			aCallback();
		},
		repeatingLevel: 'SPOQLCPDDiag',
		contentProvider: function(aHistory, anEventID) {
			var gm = Repository.Global.Methods;
			var list = [];
			var spoqLcpdDiag = aHistory[anEventID];
            var lcpdop, lcpd2yfu, lcpd10, lcpd18;
            var formatMyDate = function(date){
                var formattedDate = Ext.util.Format.date(gm.ParseDate(date),'Y-m-d');
                return formattedDate;
            }

			for (var ie in aHistory) {
				var currentEvent = aHistory[ie];
				if (currentEvent.ParentEventID === anEventID && currentEvent.FormName === 'SPOQLCPDOp') {
					lcpdop = currentEvent;	
				}
				else if (currentEvent.ParentEventID === anEventID && currentEvent.FormName === 'SPOQLCPD2YFU'){
					lcpd2yfu=currentEvent;
				}
				else if (currentEvent.ParentEventID === anEventID && currentEvent.FormName === 'SPOQLCPD10'){
					lcpd10 = currentEvent;
				}	
				else if (currentEvent.ParentEventID === anEventID && currentEvent.FormName === 'SPOQLCPD18'){
					lcpd18 = currentEvent;
				}		
				
			}
	

			list.push(
                spoqLcpdDiag.LCPD_Diag_Side == 1 ? 'Höger' :
				spoqLcpdDiag.LCPD_Diag_Side == 2 ? 'Vänster' :
				'');
			list.push(formatMyDate(spoqLcpdDiag.LCPD_Diag_DiagDate));
			list.push((lcpdop && lcpdop.LCPD_Op_Date) ? formatMyDate(lcpdop.LCPD_Op_Date) : '');
			list.push((lcpd2yfu && lcpd2yfu.LCPD_2YFU_Date) ? formatMyDate(lcpd2yfu.LCPD_2YFU_Date) : '');
			list.push((lcpd10 && lcpd10.LCPD_10_Date) ? formatMyDate(lcpd10.LCPD_10_Date) : '');
			list.push((lcpd18 && lcpd18.LCPD_18_Date) ? formatMyDate(lcpd18.LCPD_18_Date) : '');
			return list;
		},
		defaultPeriod: 'Alla',	
		
		headingProvider: function() {
			return [
				{ header: 'Sida',	width: 70 },			
				{ header: 'Diagnos',	flex: 1 },
				{ header: 'Operation',	width: 90  },
				{ header: 'Ktr 2 å e D',	width: 90  },
				{ header: 'Ktr 10 års å',	width: 90  },	
				{ header: 'Ktr 18 års å',	width: 90  }			
			];
		}
	},	
	renderStatistics: function(isUnitLevel, renderTo, config) {		
		
        Ext.define("Ext.draw.Animator", {
			override : 'Ext.draw.Animator',
			
			fireFrameCallbacks: function() {
				var callbacks = this.frameCallbacks,
					id, fn, cb;
				for (id in callbacks) {
					cb = callbacks[id];
					fn = cb.fn;
					if (Ext.isString(fn)) {
						fn = cb.scope[fn];
					}
					
					if(cb.scope.el.dom === null){
						delete callbacks[id];	
						continue;
					}
					
					fn.call(cb.scope);
					if (callbacks[id] && cb.once) {
						this.scheduled--;
						delete callbacks[id];
					}
				}
			},
		});
		var g_nTotal;		
		var unit = Profile.Context.Unit;
		var unitCode = unit.UnitCode;
		var unitName = unit.UnitName;
		var url = config.url + '&unitcode=' + unitCode;
		Ext.util.CSS.removeStyleSheet('spoq-stat-styles');
				Ext.util.CSS.createStyleSheet(			
					' '  
					+'  .x-legend-panel .x-panel-body-default {'
					+'      border: none;'
					+'  }'
					+'  .x-legend-container {'
					+'      width: 95%;'
					+'      float: right;'
					+'  }'	 
					+'  .x-legend {'
					+'      text-align: center;'
					+'  }'	
					+'  .x-panel-body-default {'
					+' 	border:none;'
					+'  }'
				,'spoq-stat-styles');

		var transformData = function (arrData) {			
			var result = {};
			var data = [];	
			var category = '';
			var categories = [];
			g_nTotal = 0;
			var n = 0;
			for (k in arrData) {
				n = 0;
				var item = {};
				var skipItem = false;
				for (var k2 in arrData[k]) {
					var currentValue = arrData[k][k2];
					if (k2 == config.categoryAttrib) {
						category = currentValue;						
						item[k2] = category;
						categories.push(category);
					}
					else if (config.validYnames.indexOf(k2) > -1 || config.isGrid) {
						item[k2] = currentValue;						
						if((!arrData[k].n || config.validYnames.indexOf('n') > -1 ) && !arrData[k].ntot && !config.isPercentage){
							n += parseInt(currentValue);
						}
					}
					
					else if (k2.toLowerCase() == 'n' || k2.toLowerCase() == 'ntot' ) {
						item[k2] = currentValue;
						n += parseInt(currentValue);
					}	
					else if (k2.indexOf('(n)')>=0) {
						item[k2] = currentValue;						
					}

					if (k2 == 'Enhet') {
						if (currentValue != unitCode && isUnitLevel) {
							skipItem = true;
						}
						else if (currentValue == unitCode && !isUnitLevel) {
							skipItem = true;
						}
					}					
				}
				if (!skipItem) {
					data.push(item);
					g_nTotal += n;
				}
			}			
			result.data = data;
			return result;
		};

		var createStore = function (myData) {
			var myStore = new Ext.data.JsonStore({ fields: [] });
			myStore.loadData(myData);
			return myStore;
		};
		
		function getColorsArray(store) {
            var colors = [];
            var i = 0;
            store.each(function (record) {
                colors[i] = getColor(record.data[config.categoryAttrib]);                
                i++;
            });

            return colors;            
		}
		
		function getColor(value){
			var i=0;
			for (i=0; i<config.colorTranslate.length; i++){
				if (value.toLowerCase().indexOf(config.colorTranslate[i].toLowerCase())>=0){
					return config.colorTranslate[i+1];
				}									
			}
			return null;
		}

		var createChart = function (store) {
			var backgroundClr = '#fff';
			if (config.isBarChart) {
				return Ext.create('Ext.chart.Chart', {
					renderTo: renderTo,
					flipXY: false,
					width: '100%',
					height: 350,
					margin: '10 5 30 0',					
					animation: false,
					border: false,
					colors: config.fixedColors? config.fixedColors : '',
					background: backgroundClr,
					style: {
						borderWidth: '1px',
						borderColor: '#ddd',
						borderStyle: 'solid',
						opacity: 0
					},
					store: store,
					legend: {
            type: 'dom',
						hidden:!config.legendText,
						html: config.legendText,
						toggleable: false,
						style: {
							background: "#fffffe",
						}
					},
					insetPadding: {
						top: 50,
						left: 20,
						right: 20,
						bottom: 20
					},
					sprites: [{
						text: isUnitLevel ? 'Aktuell enhet' : 'Riket',
						type: 'text',
						fontSize: 18,
						width: 100,
						height: 30,
						x: 100,
						y: 30
					},
					{
						text: 'Totalt antal:' + ' ' + g_nTotal,
						type: 'text',
						fontSize: 12,
						width: 100,
						height: 30,
						x: 600,
						y: 30
					}
					],
					axes: [{
						type: 'numeric',
						position: 'left',
						fields: config.validYnames,
						title: !config.isPercentage ? 'Antal' : 'Andel',
						grid: {
							stroke: '#ddd'
						},
						minimum: 0,						
						renderer: function (axis, label, layout, lastLabel) {
							// Don't display decimal numbers
							return label % 1 === 0 ? label : '';
						}

					}, {
						type: 'category',
						position: 'bottom',
						fields: [config.categoryAttrib],
						label: {
							fontSize: 12,
							rotate: {
								degrees: config.rotateText ? 285 : 0
							}
						},
						renderer: function (axis, label) {
							return label.replace(' ', '\n');
						}
					}],
					series: [{
						type: 'bar',
						stacked: true,
						xField: config.categoryAttrib,
						yField: config.validYnames,
						/*label: {
							display: 'insideEnd',
							field: config.validYnames,
							orientation: 'horizontal',
							color: '#0F0F0F',
							fontSize: 12,
							renderer: function (value, sprite, conf, renderData, index) {															
								var percentChar='';
								var formattedValue=value;
								if(config.isPercentage){									
									formattedValue=Ext.util.Format.number(formattedValue, '0.0%')
								}
								return {
									text: value == 0 ? '' : formattedValue
								};
							}
						},*/
						tooltip: {
							trackMouse: true,
							renderer: function (tooltip, rec, item) {
								var total = 0;
								tooltip.setTitle(Ext.String.format('{0}', rec.data.category));
								var text = '';
								if(config.validYnames.length>1){
									for (var key in rec.data) {
										if(!config.isPercentage){
											if (config.validYnames.indexOf(key) > -1) {
												total += parseInt(rec.data[key]);
											}
										}										
									}
									for (var key in rec.data) {
										
										if (config.validYnames.indexOf(key) > -1) {
											if(!config.isPercentage){
												text += key + ': ' + Ext.util.Format.number(parseInt(rec.data[key]) / total * 100, '0.0%') + ' (' + rec.data[key] + ' av ' + total + ')<br/>';
											}
											else{
												/*var n=parseInt((rec.data[key]/100) * rec.data['n']);*/
												var n=rec.data[key + ' (n)' ];
												text += key + ': ' + Ext.util.Format.number(parseInt(rec.data[key]), '0.0%') + ' (' + n + ' av ' + rec.data['ntot'] + ')<br/>';
												
											}
										}
									}
								}
								else if (rec.data.n) {
									text = rec.data.n + ' st';
								}
								
								
								tooltip.setHtml(text);
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
					}]
				});
			}
			else {
				return Ext.create('Ext.chart.PolarChart', {
					colors:config.colors,
					renderTo: renderTo,
					width: '100%',
					height: 300,
					margin: '10 5 30 0',				
					animate: true,
					background: backgroundClr,
					style: {
						borderWidth: '1px',
						borderColor: '#ddd',
						borderStyle: 'solid',
						opacity: 50
					},
					border: false,
					store: store,
					legend: {
						docked: 'right',
						border: false
					},
					insetPadding: {
						top: 50,
						left: 20,
						right: 20,
						bottom: 20
					},
					sprites: [{
						text: isUnitLevel ? 'Aktuell enhet' : 'Riket',
						type: 'text',
						fontSize: 18,
						width: 300,
						height: 30,
						x: 100,
						y: 30
					},
					{
						text: 'Totalt antal:' + ' ' + g_nTotal,
						type: 'text',
						fontSize: 12,
						width: 100,
						height: 30,
						x: 400,
						y: 30
					}
					],
					series: [{
						type: 'pie',					
						field: config.validYnames,
						showInLegend: true,
						tooltip: {							
							trackMouse: true,
							renderer: function (tooltip, storeItem, item) {														
								var cat=item.record.data[config.categoryAttrib];
								var y=item.record.data[config.validYnames[0]];
								var n=item.record.data['n'];
								if (cat && y && n){
									tooltip.update(cat + ':' + Ext.util.Format.number(y, '0.0%') + ' (' + n + ' st)');
								}
							}
						},
						label: {
							field: config.categoryAttrib,
							display: 'middle',
							
							renderer: function (label) {						                     
								var index = store.findExact(config.categoryAttrib, label);
								if (index < 0) {
									return;
								}
								var data = store.getAt(index).data;
								var percentChar = '';								
								var value=data[config.validYnames[0]];
								if(value<5){
									return '';
								}
								return Ext.util.Format.number( value, '0.0%') + percentChar;
							}
						}
						
					}]
				});
			}
		}
		
		function createGrid(store) {     
		var backCol='#E3E3E3';
		var grid = Ext.create('Ext.grid.Panel', {
            renderTo:renderTo,
			title: '',
            store: store,
            width: '100%',
            height: 233,
            selModel: {
                allowDeselect: true
            },
			sprites: [{
						text: isUnitLevel ? 'Aktuell enhet' : 'Riket',
						type: 'text',
						fontSize: 18,
						width: 100,
						height: 30,
						x: 100,
						y: 30
			}],
            columns: [{
                header: 'Antal<br/>gipsn.',
                dataIndex: 'gipsctg',
                width: 90,
				height: 40,				
            },{
                header: 'Antal<br/>klump-<br>fötter',
                dataIndex: 'Antal klumpfötter, piraniscore 1-2',
                width: 70,
                height: 33,
				renderer: function(val, metadata, record) {                    
						metadata.style = 'background-color:' + backCol;
						return val;                        
                    }   
            },{
                header: 'Andel<br/>akilloteno<br/>tomerade<br/>(%)',
                dataIndex: 'Akillotenotomerade, piraniscore 1-2',
                width: 90,
				renderer: function(val, metadata, record){
					metadata.style = 'background-color:' + backCol;
					if(val=='NA'){
						return val;
					}
					return Ext.util.Format.round(val, 2);
				}
            }
			
			
			,{
                header: 'Antal<br/>klump-<br>fötter',
                dataIndex: 'Antal klumpfötter, piraniscore 2.5-4',
                width: 70,
                height: 30
            },{
                header: 'Andel<br/>akilloteno<br/>tomerade<br/>(%)',
                dataIndex: 'Akillotenotomerade, piraniscore 2.5-4',
                width: 90,
				renderer: function(val, metadata, record){
					if(val=='NA'){
						return val;
					}
					return Ext.util.Format.round(val, 2);
				}
            }
			
			
			
			
			,{
                header: 'Antal<br/>klump-<br>fötter',
                dataIndex: 'Antal klumpfötter, piraniscore 4.5-6',
                width: 70,
                height: 30,
				renderer: function(val, metadata, record) {                    
						metadata.style = 'background-color:' + backCol;
						return val;                        
                    }   
            },{
                header: 'Andel<br/>akilloteno<br/>tomerade<br/>(%)',
                dataIndex: 'Akillotenotomerade, piraniscore 4.5-6',
                width: 90,
				renderer: function(val, metadata, record){
					metadata.style = 'background-color:' + backCol;
					if(val=='NA'){
						return val;
					}
					return Ext.util.Format.round(val, 2);
				}
            }
			
			
			
			
			/*,{
                header: 'Antal<br/>klump-<br>fötter',
                dataIndex: 'Antal klumpfötter, piraniscore Uppgift saknas',
                width: 70,
                height: 30
            },{
                header: 'Andel<br/>akilloteno<br/>tomerade<br>(%)',
                dataIndex: 'Akillotenotomerade, piraniscore Uppgift saknas',
                width: 90,
				renderer: function(val, metadata, record){
					if(val=='NA'){
						return val;
					}
					return Ext.util.Format.round(val, 2);
				}
            }*/
			
			
			
			
			
            ]
        });
        return grid;
    }

		spin(renderTo, 'Hämtar underlag', 310, 170);
		Ext.Ajax.request({
			url: url,
			method: 'GET',
			withCredentials: true,
			success: function (response, opts) {
				var tagIsGone = Ext.get(renderTo) === null;
				
				if(tagIsGone) return;
				var responseData = Ext.decode(response.responseText).data;
				var myData;
				var myStore;
				if(!config.isGrid){
					myData = transformData(responseData);
					myStore = createStore(myData.data);				
					var myChart = createChart(myStore);					
					unspin();				
					myChart.updateLayout();
					if (config.isBarChart) {
						myChart.animate({
							duration: 500,
							from: { opacity: 0 },
							to: { opacity: 1 }
						});
					}
				}
				else {					
					unspin();
					myData = transformData(responseData);
					myStore = createStore(myData.data);
					var myGrid=createGrid(myStore);									
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
	
}