{
	TitleOfPanel: function(currentRegistration) {
		var formTitle = currentRegistration.Form.FormTitle,
			formTitleAndADate,
			eventDate = currentRegistration[currentRegistration.Form.MappedEventDate];
				
				formTitleAndADate = formTitle + ' &nbsp; ' + Ext.util.Format.date(Repository.Global.Methods.ParseDate(eventDate), 'Y-m-d');
			return formTitleAndADate;				
	},
/*SubjectOverviewAll, filtreras på parentformulär, i detta fall RorPre.*/	
	SubjectOverviewAll: {
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
		repeatingLevel: 'RorPre',
		contentProvider: function(aHistory, anEventID) {
			var gm = Repository.Global.Methods;
			var list = [];
			var rorPre = aHistory[anEventID];
			var rorOp, rorPost3, rorPost3;

			for (var ie in aHistory) {
				var currentEvent = aHistory[ie];
				if (currentEvent.ParentEventID === anEventID && currentEvent.FormName === 'RorOp') {
					rorOp = currentEvent;
				}
				if (rorOp && currentEvent.ParentEventID === rorOp.EventID) {
					if (currentEvent.FormName === 'RorPost3') {
						rorPost3 = currentEvent;
					} else {
						if (currentEvent.FormName === 'RorPost6') {
							rorPost3 = currentEvent;
						}
					}
				}
			}

			list.push(Ext.util.Format.date(gm.ParseDate(rorPre.PreDate),'Y-m-d'));
			list.push((rorOp && rorOp.OpDate) ? Ext.util.Format.date(gm.ParseDate(rorOp.OpDate),'Y-m-d') : '');
			list.push((rorPost3 && rorPost3.Post3Date) ? Ext.util.Format.date(gm.ParseDate(rorPost3.Post3Date),'Y-m-d')  : '');
			list.push((rorPost3 && rorPost3.Post6Date) ? Ext.util.Format.date(gm.ParseDate(rorPost3.Post6Date),'Y-m-d')  : '');
			return list;
			
		},
		filterDate: 'PreDate',		
		headingProvider: function() {
			return [
				{ header: 'Op beslut',	width: 120 },
				{ header: 'Op datum',	width: 120 },
				{ header: 'Återbesök 3 mån',	width: 120 },
				{ header: 'Enkät 6 mån',	flex: 1 }
			];
		}
	},
/*SubjectOverviewOp, filtreras på childformulär, i detta fall RorOp.*/		
	SubjectOverviewOp: {
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
		repeatingLevel: 'RorOp',
		contentProvider: function(aHistory, anEventID) {
			var gm = Repository.Global.Methods;
			var list = [];
			var rorOp = aHistory[anEventID];
			var rorPre, rorPost3, rorPost6;

			for (var ie in aHistory) {
				var currentEvent = aHistory[ie];
				if (currentEvent.EventID === rorOp.ParentEventID) {
					rorPre = currentEvent;
				}
				if (rorOp && currentEvent.ParentEventID === rorOp.EventID) {
					if (currentEvent.FormName === 'RorPost3') {
						rorPost3 = currentEvent;
					} else {
						if (currentEvent.FormName === 'RorPost6') {
							rorPost6 = currentEvent;
						}
					}
				}
			}

			list.push(Ext.util.Format.date(gm.ParseDate(rorPre.PreDate),'Y-m-d'));
			list.push((rorOp && rorOp.OpDate) ? Ext.util.Format.date(gm.ParseDate(rorOp.OpDate),'Y-m-d') : '');
			list.push((rorPost3 && rorPost3.Post3Date) ? Ext.util.Format.date(gm.ParseDate(rorPost3.Post3Date),'Y-m-d')  : '');
			list.push((rorPost6 && rorPost6.Post6Date) ? Ext.util.Format.date(gm.ParseDate(rorPost6.Post6Date),'Y-m-d')  : '');
			return list;
			
		},
		filterDate: 'OpDate',			
		headingProvider: function() {
			return [
				{ header: 'Op beslut',	width: 120 },
				{ header: 'Op datum',	width: 120 },
				{ header: 'Återbesök 3 mån',	width: 120 },
				{ header: 'Enkät 6 mån',	flex: 1 }
			];
		}
	}
}