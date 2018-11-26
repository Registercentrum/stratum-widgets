
(function(pdbConf) {
	function failureFn(req){
		var mc = Ext.fly(pdbConf.projdbContainer);
		mc.unmask();
		req && mc.setHTML('ERROR<br/>' + req.status + ': ' + req.statusText);
	}
	function successFn() {
		var projectPanels = [],
			panelTemplate, placeholder, searchField, statusCombo;

		var performProjectSearch = new Ext.util.DelayedTask(function() {
			var queryRegEx = /^([a-zA-Z]{3,20})\:([a-zA-Z0-9åäöÅÄÖ_-]{1,20})$/,
				text, rx, queryArgs;
			if (searchField) {
				text = searchField.getValue();
				queryArgs = queryRegEx.exec(text);
				if (queryArgs) {
					filterFn(projectPanels, placeholder, queryArgs[1], new RegExp('^' + queryArgs[2] + '$'));
				} else {
					rx = new RegExp(Ext.util.Format.escapeRegex(searchField.getValue()), 'i');
					filterFn(projectPanels, placeholder, 'title', rx);
				}
			}
		});

		function hideAll(projectPanels) {
			Ext.suspendLayouts();
			Ext.each(projectPanels, function(p) {
				!p.hidden && p.hide();
			});
			Ext.resumeLayouts();
		}

		function filterWithCondition(key, value, projectPanel) {
			return Ext.isString(key) && (typeof projectPanel[key] !== 'undefined') &&
				(value instanceof RegExp ? value.test(projectPanel[key]) : projectPanel[key] === value);
		}

		function filterFromUrl(projectPanels, loader) {
			var queryString = Ext.Object.fromQueryString(window.location.hash.substr(7));
			if (queryString.projId) {
				filterFn(projectPanels, loader, 'projId', parseInt(queryString.projId, 10));
				return true;
			}
			return false;
		}

		function filterFn(projectPanels, loader, key, value) {
			loader && loader.show().toggleLoading(true);
			Ext.defer(function() {
				var visible = 0,
					currProject;
				Ext.each(projectPanels, function(item) {
					if (filterWithCondition(key, value, item)) {
						currProject = item;
						item.collapsed = true;
						item.show().updateLayout();
						visible++;
					} else {
						item.hide();
					}
				});
				if (visible === 1) {
					currProject.expand();
				}
				if (loader) {
					loader.toggleLoading(false);
					visible > 0 && loader.hide();
				}
			}, 100);
		}

		function loadProjects(aTemplate, projectPanels, placeholder, callback) {
			placeholder.toggleLoading(true);
			placeholder.render(pdbConf.projdbContainer);
			Ext.defer(function() {
				Ext.each(ProjectDatabase.db, function(project) {
					var panel = Ext.widget('panel', {
						renderTo: pdbConf.projdbContainer,
						// width: 640,
						cls: 'project-table',
						titleCollapse: true,
						margin: '0 0 5px 0',
						frame: pdbConf.noFrame ? false : true,
						collapsed: true,
						collapsible: true,
						hideCollapseTool: pdbConf.hideCollapseTool,
						bodyPadding: 10,
						hidden: true,
						tpl: aTemplate,
						title: project.ProjectName,
						projId: project.EventID,
						projStatus: project.ProjectStatus,
						loadText: function() {
							var me = this;
							var text = Ext.Array.findBy(ProjectDatabase.db, function(item) {
								return item.EventID === me.projId;
							});
							me.update(text);
						},
						listeners: {
							beforeexpand: function() {
								if (!this.dataLoaded) {
									this.loadText();
									this.dataLoaded = true;
								}
							}
						}
						/*,
					buttons: [{
						text: 'Edit'
					}]*/
					});
					projectPanels.push(panel);
				});
				Ext.isFunction(callback) && callback(projectPanels);
			}, 100);
		}
		var colors = { baseColor: '#f0ad4e', lightColor: '#fcf8f2' };
		if(!pdbConf.noStyle){
			Ext.util.CSS.createStyleSheet(
				'.WidgetFormItem input { font-size: 16px; border: 1px solid #ddd; } ' +
				'.WidgetFormItem .x-tip-header-body { padding: 0; } '
			); 
			if(typeof Profile !== 'undefined' && Profile.Site && Profile.Site.ThemeSettings && Profile.Site.ThemeSettings.BaseColor){
				var lightColor = Ext.draw.Color.fromString(Profile.Site.ThemeSettings.BaseColor).getHSL();
				lightColor[2] = 0.97;
				colors.baseColor = Profile.Site.ThemeSettings.BaseColor;
				colors.lightColor = Ext.draw.Color.fromHSL(lightColor[0], lightColor[1], lightColor[2]).toString();
			}
		}
		Ext.util.CSS.createStyleSheet(
			'.project-table { background-color: #ffffff;} ' +
			'.project-table .x-panel-header-default .x-panel-header-text { font-weight: normal !important; }'+
			'.project-table .x-panel-header { background: #f5f5f5; cursor: pointer; } ' +
			'.project-table .x-toolbar-footer { padding-bottom: 10px; }' +
			'.project-table .x-title-text { padding: 5px; font-size: 16px; white-space: normal; line-height: 1.3em; }' +
			'.project-table-tpl { width: 100%; }' +
			'.project-table-tpl th { text-align: left; padding: 10px 0px 0px 0px; color: #666; font-weight: normal; }' +
			'.description-cell { padding: 15px !important; background-color: ' + colors.lightColor + '; border-left: 3px solid ' + colors.baseColor + '; font-size: 16px; }' +
			'.description-cell > h2 { color: ' + colors.baseColor + '; margin: 0 0 4px 0; font-size: 18px; font-weight: normal; }'
		);

		panelTemplate = new Ext.XTemplate(
			'<table class="project-table-tpl" style="width: 100%;">',
			'<tr><td class="description-cell" colspan="4"><h2>Populärvetenskaplig beskrivning</h2>{[Ext.util.Format.nl2br(values.LaymansDescription) || "(populärvetenskaplig beskrivning saknas)"]}</td></tr>',
			'<tr><th>Status:</th><th colspan="3" style="text-align: right; font-style: italic">uppdaterat {[values.ModifiedAt.substr(0,10)]}</th></tr>',
			'<tr><td colspan="4"><b>{[this.status(values.ProjectStatus, values.DateOfPublication)]}</b></td></tr>',
			'<tr><th colspan="4">Författare/deltagare:</th></tr>',
			'<tr><td colspan="4"><b>{FirstAuthor}</b>, {OtherAuthor}, {LastAuthor}.</td></tr>',
			'<tr><th>Forskaruttagsbegäran:</th><th>Forskningskontrakt:</th><th></th><th></th></tr>',
			'<tr><td>{[this.nameOf("ResearchRequest",values.ResearchRequest)]}</td><td>{[this.nameOf("ResearchContract",values.ResearchContract)]}</td><td></td><td></td></tr>',
			'<tr><th>Etikgodkännande:</th><th>Etiknämnd:</th><th>Diarienummer:</th><th></th></tr>',
			'<tr><td>{[this.nameOf("EthicsApproval",values.EthicsApproval)]}</td><td>{[values.EthicsBoard || "-"]}</td><td>{[values.EthicsNumber || "-"]}</td><td></td></tr>',
			'<tr><th>Samkörning:</th><th colspan="3">Samkörning med:</th></tr>',
			'<tr><td>{[this.nameOf("Merging",values.Merging)]}</td><td colspan="3">{[values.MergeWith || "-"]}</td></tr>',
			'<tr><th colspan="4">Tidskrift:</th></tr>',
			'<tr><td colspan="4">{[values.Magazine || "-"]}</td></tr>',
			'</table>', {
				nameOf: function(aDomainName, aCode) {
					//TODO: realize maps from domains on demand.
					var map = ProjectDatabase.domain;
					if (!map) {
						return '-';
					}
					return typeof aCode !== 'undefined' ? map[aDomainName][aCode] : map[aDomainName];
				},
				status: function(s, d) {
					var r = this.nameOf("ProjectStatus", s) || "-";
					if (s === 6 && !Ext.isEmpty(d)) { // Published
						r += " " + Ext.Date.format(Ext.Date.parse(d, 'Y-m-dTH:i:s'), "F Y");
					}
					return r;
				}
			}
		);
		placeholder = Ext.widget('panel', {
			width: '100%',
			cls: 'project-table',
			collapsed: true,
			collapsible: false,
			bodyPadding: 7,
			hidden: false,
			margin: '0 0 5px 0',
			frame: pdbConf.noFrame ? false : true,
			disabled: true,
			toggleLoading: function(toggle) {
				this.setTitle(toggle ?
					'<div class="loading-indicator">Visar projekt ...</div>&nbsp;' :
					'(inga projekt uppfyller sökvilkoren ovan)');
			}
		});
		searchField = Ext.widget({
			xtype: 'textfield',
			width: '100%',
			margin: '0 0 8px 0',
			enableKeyEvents: true,
			listeners: {
				specialkey: function(field, e) {
					if (e.getKey() === e.ENTER) {
						performProjectSearch.delay(0);
					}
				},
				keyup: function(input, key) {
					//TODO: Check if result set > 1
					if ((!key.isSpecialKey() || key.getKey() === Ext.EventObject.BACKSPACE || key.getKey() === Ext.EventObject.DELETE)) {
						performProjectSearch.delay(250);
					}
					statusCombo.setValue('');
				}
			}
		});
		statusCombo = Ext.widget({
			xtype: 'combobox',
			width: '100%',
			margin: '0 0 8px 0',
			store: Ext.create('Ext.data.Store', {
				fields: ['valueCode', 'valueName'],
				data: [{
					valueCode: -1,
					valueName: 'Visa alla projekt förutom de som är publicerade eller avslutade'
				}, {
					valueCode: 1,
					valueName: 'Visa endast projekt i planeringsfasen'
				}, {
					valueCode: 2,
					valueName: 'Visa endast pågående projekt'
				}, {
					valueCode: 5,
					valueName: 'Visa endast avslutade projekt'
				}, {
					valueCode: 6,
					valueName: 'Visa endast projekt som publicerats'
				}]
			}),
			queryMode: 'local',
			editable: false,
			displayField: 'valueName',
			valueField: 'valueCode',
			value: -1,
			listeners: {
				change: function(aCombo, aSelection) { // Should be "select" event but it is not fired when calling the select method of combo.
					if (Ext.isNumber(aSelection) && aSelection >= -1 && aSelection <= 6) {
						searchField.setValue('');
						hideAll(projectPanels);
						filterFn(projectPanels, placeholder, 'projStatus', aSelection < 0 ? /^[0-4]$/ : aSelection);
					}
				},
				render: function() {
					var me = this;
					loadProjects(panelTemplate, projectPanels, placeholder, function(projectPanels) {
						if (!filterFromUrl(projectPanels, placeholder)) {
							filterFn(projectPanels, placeholder, 'projStatus', me.getValue() < 0 ? /^[0-4]$/ : me.getValue());
						}
					});
				}
			}
		});

		Ext.create('Ext.panel.Panel', {
			renderTo: pdbConf.projdbContainer,
			width: '100%',
			frame: false,
			border: false,
			layout: {
				type: 'vbox'
			},
			defaults: {
				cls: 'WidgetFormItem',
				listConfig: {
					cls: 'WidgetListItem'
				},
				width: '100%'
			},
			items: [searchField, statusCombo]
		});

		if (pdbConf.nPublications) {
			var nPub = Ext.fly(pdbConf.nPublications);
			nPub && nPub.update(Ext.Array.filter(ProjectDatabase.db, function(r) {
				return r.ProjectStatus === 6;
			}).length);
		}
		if (pdbConf.nProjects) {
			var nProj = Ext.fly(pdbConf.nProjects);
			nProj && nProj.update(ProjectDatabase.db.length);
		}

		Ext.fly(pdbConf.projdbContainer).unmask();
	}
	var ProjectDatabase = {
		db: {},
		domain: {}
	};
	pdbConf.projdbContainer = pdbConf.projdbContainer || 'projdb-container';
	Profile.APIKey = pdbConf.apiKey || Profile.APIKey;
	var mainContainer = Ext.fly(pdbConf.projdbContainer);
	if (!mainContainer) {
		return;
	}
	mainContainer.mask('Hämtar data ...');
	
	Ext.Ajax.request({
		url: '/stratum/api/registrations/form/1082',
		method: 'get',
		success: function(res) {
			var obj = Ext.decode(res.responseText);
			Ext.Array.sort(obj.data, function(a, b) {
				return (b.DateOfPublication && a.DateOfPublication) ? b.DateOfPublication.localeCompare(a.DateOfPublication) :
					b.DateOfPublication == null ? -1 : +1;
			});
			ProjectDatabase.db = obj.data;
			Ext.Ajax.request({
				url: '/stratum/api/metadata/domains/map/4293,4294,4295,4296',
				method: 'get',
				success: function(res) {
					var obj = Ext.decode(res.responseText);
					obj.data.ResearchRequest = obj.data.EthicsApproval; //TODO: Might be a good idea to add this in db instead
					ProjectDatabase.domain = obj.data;
					successFn(ProjectDatabase);
				},
				failure: failureFn
			});
		},
		failure: failureFn
	});
}(typeof _pdbConf !== 'undefined' ? _pdbConf : {}));
//! Projektdatabasen - information om planerade, pågående och publicerade projekt med utgångspunkt i register anslutna till Registercentrum Västra Götaland. Registerbaserad forskning. Vetenskapliga artiklar.
