
(function () {
	
    //ATT Åtgärda
    //*Cacha återkommande EXTJS-komponenter
    //*Faktorisera Filterfunktion
    //*Möjlighet att söka på personnummer
    //*Config-objekt i init
	
	function getCmpByName(cmpName, panel) {
		var i = 0;
		if (panel instanceof Ext.form.Panel || panel instanceof Ext.panel.Panel || panel instanceof Ext.window.Window) { //TODO:Better way?
			for (i = 0; i < panel.items.length; i++) {
				switch (panel.items.items[i].name) {
					case cmpName:
						return panel.items.items[i];
						break;
				}
			}
			for (i = 0; i < panel.dockedItems.length; i++) {
				var toolbars=panel.dockedItems.items;
				var j=0;
				for(j=0; j<toolbars.length; j++){
					var currentToolBar=toolbars[j];
					var k=0;
					for(k=0; k< currentToolBar.items.length; k++){
						var items;
						if(currentToolBar.items.items){
							items=currentToolBar.items.items;
						}
						else{
							items=currentToolBar.items;
						}
						
						switch (items[k].name) {
							case cmpName:
								return items[k];
								break;
						}
					}
				}
				
			}
		}
		else if (panel instanceof Ext.form.BasicForm) {
			for (i = 0; i < panel.items.length; i++) {
				switch (panel.items[i].name) {
					case cmpName:
						return panel.items[i];
						break;
				}
			}
		}
		return null;
    }
	var parentEventStore=new Ext.data.JsonStore({ fields: [ { name: 'EventDate', type: 'string',convert: function (value, record) {
                                            var v = record.get('EventDate');
                                            if (v !== null) {
                                                return v.substring(0,10);
                                            }
                                        }} , { name: 'EventID'}] });
    if (!Ext.ClassManager.isCreated('Stratum.ProxyExtended')) {
        Ext.define('Stratum.ProxyExtended', {
            extend: 'Stratum.Proxy',
            fields: [
               
				{ name: 'SubjectKey', type: 'auto', mapping: 'SubjectKey' }, 
                { name: 'FormTitle', type: 'auto', mapping: 'Form.FormTitle' },
				{ name: 'Custom1Column', type: 'auto' },
				{ name: 'Custom2Column', type: 'auto' }
            ]
        });
    }
	var g_NrOfCanceled=0;
    var pageManager = {
		encryptSubjectKey: Repository.Global.Methods.EncryptNIN || function(x) { return x; },
        init: function (config) {
            this.config = config;            
            //this.initSampleData();                        			                        
            pageManager.initStores();
        },
        initStores: function () {	

		            this.replyStatusStore2 = new Ext.data.JsonStore({
                autoLoad: true,
                storeId: 'replyStatusStore2',
                fields: [{ name: 'ValueCode', type: 'int' },
                        { name: 'ValueName', type: 'string' }
                ],
                proxy: {
                    type: 'rest',
                    url: '/stratum/api/metadata/domainvalues/domain/3101',
                    reader: { type: 'compactjson' }
                },
				filters: [
					function(item) {
						return item.data.ValueCode < 100 || item.data.ValueCode==110;
					}
				]                
            });

            this.replyStatusStore = new Ext.data.JsonStore({
                autoLoad: true,
                storeId: 'replyStatusStore',
                fields: [{ name: 'ValueCode', type: 'int' },
                        { name: 'ValueName', type: 'string' }
                ],
                proxy: {
                    type: 'rest',
                    url: '/stratum/api/metadata/domainvalues/domain/3101',
                    reader: { type: 'compactjson' }
                },
				filters: [
					function(item) {
						return item.data.ValueCode < 100;
					}
				],
                listeners: {
                    load: function (store, records) {
                        store.insert(0, [{
                            ValueName: 'Alla',
                            ValueCode: -1
                        }]);
                        pageManager.formInfoStore = new Ext.data.JsonStore({
                            autoLoad: true,
                            storeId: 'Forms',
                            fields: [{ name: 'FormID', type: 'int' },
                                    { name: 'FormTitle', type: 'string' },
                                    { name: 'FormName', type: 'string' },
                                    { name: 'FormScope', type: 'int' },
									{ name: 'ParentFormID', type: 'int' }
                            ],
                            proxy: {
                                type: 'rest',
                                url: '/stratum/api/metadata/forms/register/' + Profile.Context.Unit.Register.RegisterID,
                                reader: { type: 'compactjson' }
                            },
                            listeners: {
                                load: function () {
									pageManager.formInfoStore.filter('FormScope',3);
                                    pageManager.store = Ext.create('Ext.data.Store', {
                                        autoLoad: true,
                                        autoSync: false,
                                        model: 'Stratum.ProxyExtended',//'Stratum.Proxy',

                                        listeners: {
                                            beforeload: function() {
												spin('promAdministration', 'Hämtar', 310, 170);
											},
											load: function (a, b, c) {												
                                                var i=0;
												for(i=0; i<a.data.items.length; i++){
													var r=a.data.items[i].data;
													if(r.ReplyStatus==110){
														g_NrOfCanceled++;
													}
													if(r.SourceEvent){
														r.SubjectKey=r.SourceEvent.Subject.SubjectKey;
													}
												}
												pageManager.initGrid();
                                                pageManager.initGridForm();
                                                pageManager.filterGrid();
												try{
													unspin();
												}
												catch(err){}
                                            }
                                        }
                                    });
                                }
                            }/*,
				filters: [{property:'FormScope', value:/4/}] //TODO:change to 3*/
                        });


                    }
                }/*,
				filters: [{property:'FormScope', value:/4/}] //TODO:change to 3*/
            });
        },
        filter: {
            process: '0', //initialFilterValues
            status: '0', //initialFilterValues
            text: ''
        },
		
        initGrid: function () {

            
			var columns=[{
                    header: 'Personnummer',
                    width: 127,
                    dataIndex: 'SubjectKey',
                    filterable: true,
                    renderer: function (value, record) {
                        return '<a rel="' + value + '" href="#!subject?key=' + pageManager.encryptSubjectKey(value) + '">' + value + '</a>';                         
                    }
                }, {
                    header: 'Formulär',
                    flex: 0.6,
                    dataIndex: 'FormTitle',
                    renderer: function (value, record) {
                        return value;
                    }
                }, {
                    header: 'Status',
                    flex: 0.4,
                    dataIndex: 'ReplyStatus',
                    filterable: true,
                    renderer: function (value, record) {
                        var r = pageManager.replyStatusStore.findRecord('ValueCode', value);
                        return r.data.ValueName;
                    }
                }, {
                    header: 'Statusdatum',
                    width: 110,
                    dataIndex: 'StatusDate',
                    filterable: true,
                    renderer: function (value, record) {
                        return Ext.Date.format(value, 'Y-m-d');
                    }
                }, {
                    header: 'PIN',
                    width: 60,
                    dataIndex: 'ProxyID',
                    filterable: true,
                    renderer: function (value, record) {
                        return getPinCode(value);
                    }
                }, {
                    header: 'ProxyID',
                    width: 1,
                    dataIndex: 'ProxyID',
                    hidden: true,
                    renderer: function (value, metadata, record) {
                        return value;
                    }
                },{
                    header: (typeof customColumnsConfig != 'undefined' && customColumnsConfig.customColumn1Header) ? customColumnsConfig.customColumn1Header : '',
                    width: 100,
                    dataIndex: 'Custom1Column',
                    hidden: !(typeof customColumnsConfig != 'undefined' && customColumnsConfig.customColumn1Header)
                },{
                    header: (typeof customColumnsConfig != 'undefined' && customColumnsConfig.customColumn2Header) ? customColumnsConfig.customColumn2Header : '',
                    width: 100,
                    dataIndex: 'Custom2Column',
                    hidden: !(typeof customColumnsConfig != 'undefined' && customColumnsConfig.customColumn2Header)
                }

                ]
				
			
            pageManager.grid = Ext.create('Ext.grid.Panel', {
                store: pageManager.store,
                columns: columns,
                stripeRows: true,
                height: 410,
                multiSelect: true,
                enableTextSelection: true,
                listeners: {
                    selectionchange: function (model, selected) {
                        if(selected.length==0){
							return;
						}							
						pageManager.selectedRecords = selected;
                        pageManager.enableButtons(selected.length);											
						if(typeof customColumnsConfig != 'undefined'){
							var storeRecord = pageManager.store.findRecord('ProxyID', selected[0].data.ProxyID);
							if(customColumnsConfig.customColumn1Function){
								customColumnsConfig.customColumn1Function(storeRecord);
							}
							if(customColumnsConfig.customColumn2Function){
								customColumnsConfig.customColumn2Function(storeRecord);
							}
						}                        
                    },
                    itemclick: function (dv, record, item, index, e) {
                        pageManager.activeRecord = record;
                    },
                    itemdblclick: function (dv, record, item, index, e) {
                        pageManager.activeRecord = record;
                        pageManager.onEditClick();
                    }
                }
            });

        },
        timer: { //timer som används när man använder sökfältet
        },
        initGridForm: function () {

          

            this.gridPanel = Ext.create('Ext.form.Panel', {
                width: '100%',
                renderTo: pageManager.config.promContainer,
                border: true,
                items: pageManager.grid,
                dockedItems: [{
                    xtype: 'toolbar',
                    title: 'Filter',
                    dock: 'top',
                    defaults: {
                        margin: '5px'
                    },
                    items: [{
                        xtype: 'textfield',
                        fieldLabel: 'Sök:',
                        labelWidth: 30,
                        name: 'searchField',
                        enableKeyEvents: true,
                        renderer: function () {
                            pageManager.searchField = getCmpByName('searchField', this.gridPanel);
                        },
                        listeners: {
                            keyup: function () {
                                clearTimeout(pageManager.timer);
                                pageManager.timer = setTimeout(function () {
                                    pageManager.filter.text = pageManager.searchField.getValue();
                                    pageManager.filterGrid();
                                }, 400);
                            }
                        }
                    }, {
                        xtype: 'combo',
                        fieldLabel: 'Statusfilter:',
                        labelWidth: 80,
                        displayField: 'ValueName',
                        valueField: 'ValueCode',						
						width:300,
                        value: 0,
                        store: 'replyStatusStore',
                        queryMode: 'local',
                        editable: false,
                        listeners: {
                            select: function (combo, record, index) {
                                pageManager.filter.status = record.get('ValueCode');
                                pageManager.filterGrid();
                            },
                            afterrender: function () {

                            }
                        }
                    }
                    ]
                }, {
                    xtype: 'toolbar',
					name: 'tbMisc',
                    dock: 'top',
                    defaults: {
                        disabled: true
                    },
                    items: [{
                        text: 'Redigera',
                        scope: this,
                        name: 'bnEdit',
                        handler: this.onEditClick
                    }, '-', {
                        text: 'Ny inbjudan',
                        disabled: false,
                        name: 'bnNew',
                        scope: this,
                        handler: this.onAddClick
                    }, '-', {
                        text: 'Hämta adress',
                        name: 'bnCreateSendList',
                        scope: this,
                        handler: function () {
                            this.onDownloadAddressList();
                        }
                    }, '-', {
                        text: 'Mer information',
                        name: 'bnMoreInfo',
                        scope: this,
                        handler: function () {
                            this.onMoreInfoClick();
                        }
                    }
                    ]
                }, {
                    xtype: 'toolbar',
                    dock: 'top',
					name: 'tbSetStatus',
                    defaults: {
                        disabled: true
                    },
                    items: [ {
                        text: 'Sätt<br/>' + pageManager.replyStatusStore.findRecord('ValueCode', 2).data.ValueName,
                        name: 'bnS2',
                        scope: this,
                        handler: function () {
                            this.onSetDateClick(2);
                        }
                    }, '-', {
                        text: 'Sätt<br/>' + pageManager.replyStatusStore.findRecord('ValueCode', 11).data.ValueName,
                        name: 'bnS11',
                        scope: this,
                        handler: function () {
                            this.onSetDateClick(11);
                        }
                    }, '-', {
                        text: 'Sätt<br/>' + pageManager.replyStatusStore.findRecord('ValueCode', 12).data.ValueName,
                        name: 'bnS12',
                        scope: this,
                        handler: function () {
                            this.onSetDateClick(12);
                        }
                    }
                    ]
                }, {
                    xtype: 'toolbar',
                    dock: 'bottom',
                    defaults: {
                        disabled: true
                    },
                    items: [{
                        xtype: 'tbfill'
                    }, {
                        xtype: 'label',
                        name: 'filterLabel',
                        //text: 'hej',
                        margin: '2px 5px'
                    }
                    ]
                }
                ]
            });

            this.searchField = getCmpByName('searchField', this.gridPanel); //används återkommande cachas
            this.filterLabel = getCmpByName('filterLabel', this.gridPanel); //används återkommande cachas
            this.myMask = new Ext.LoadMask({
                msg: "Var god vänta ...",
                target: this.gridPanel
            });
        },
		getNewDialog: function(){
			          
               return  Ext.create('Ext.window.Window', {
                    //extend: 'Ext.window.Window',
                    //alias: 'widget.MyNewDialog',
                    cls: 'winDialog',
                    autoShow: true,
                    width: 400,
                    title: 'Ny inbjudan',
                    modal: true,
                    items: [{
                        xtype: 'form',
                        layout: 'form',
                        name: 'frmSearch',
                        bodyPadding: 15,
                        defaults: {
                            xtype: 'textfield'
                        },
                        items: [{
                            xtype: 'label',
                            text: 'Personnr. (ÅÅÅÅMMDD-XXXX):'
                        }, {
                            name: 'SubjectKey',
                            id: 'inputSocialnumber',
                            regex: /^[12]{1}[90]{1}[0-9]{6}-?[0-9]{4}$/,                            
                            fieldLabel: 'Personnummer',
                            listeners: {
                                change: function () {

                                    var text = Ext.getCmp('inputSocialnumber');

                                    if (text.isValid() && text.getValue() !== ''){
                                        Ext.getCmp('bnSearch').enable();										
									}
                                    else{
                                        Ext.getCmp('bnSearch').disable();
										Ext.getCmp('inviteForms').setDisabled(true);
									}
                                }
                            }
                        }
                        ],
                        buttons: [{
                            text: 'Sök Person',
                            id: 'bnSearch',
                            disabled: false,
                            scope: this,
                            handler: pageManager.onSearchSocialNumber
                        }
                        ]
                    }, {
                        xtype: 'form',
                        layout: 'form',
                        bodyPadding: 15,
                        id: 'navetPerson',
                        readonly: true,
                        defaults: {
                            xtype: 'textfield',
							readOnly:true,
                        },
                        items: [{
                            name: 'SubjectKey',
                            fieldLabel: 'Personnummer',							
                        },  {
                            name: 'Name',
                            fieldLabel: 'Namn'
                        }, {
                            name: 'StreetAddress',
                            fieldLabel: 'Gatuadress'
                        }, {
                            name: 'City',
                            fieldLabel: 'Ort'
                        }
                        ]
                    }, {
                        xtype: 'form',
                        layout: 'form',
                        cls: 'myButtonForms',
                        bodyPadding: 15,
                        id: 'newInvitation',
                        disabled: true,
                        items: [{
                            xtype: 'label',
                            text: 'PROM-typ:'
                        },
                        {
                            xtype: 'combo',
                            id: 'inviteForms',
                            store: 'Forms',
                            name: 'FormID',
                            displayField: 'FormTitle',
                            valueField: 'FormID',
                            //hiddenName: 'TargetFormID',
                            fieldLabel: 'Bjud formulär',
                            queryMode: 'local',
                            editable: false,
							disabled:true,
							
							listeners: {
                                change: function (cmp, newValue, oldValue, eOpts) {
									var navetPers=Ext.getCmp('navetPerson');
									var subjectKey=getCmpByName('SubjectKey', navetPers).getValue();
									var parent=cmp.getStore().findRecord('FormID', newValue).data.Parent;
									var parentFormID=null;
									if(parent){
										parentFormID=parent.FormID;
									}
									if(parentFormID){
												Ext.Ajax.request({
												url: '/stratum/api/overview/history/' + subjectKey ,
												method: 'GET',
												success: function (response, opts) {
													var responseData = Ext.decode(response.responseText).data;
													var result=[];
													for (var p in responseData.History){
														if(responseData.History[p].FormID==parentFormID){
															var i=0;
															for(i=0; i< responseData.History[p].Registrations.length; i++){
																	var eventDate=responseData.History[p].Registrations[i][responseData.History[p].MappedEventDate];
																	var eventID=responseData.History[p].Registrations[i].EventID;
																	result.push({EventDate: eventDate, EventID:eventID});
															}																													
														}
													}
													parentEventStore.loadData(result);																															
												}
											});
									}
                                }
                            }
                        },{
                            xtype: 'combo',
                            id: 'parentEvents',
                            store: parentEventStore,
                            name: 'SourceEventID',
                            displayField: 'EventDate',
                            valueField: 'EventID',
                            //hiddenName: 'TargetFormID',
                            fieldLabel: 'Förälderformulär',
                            queryMode: 'local',
                            editable: false
							
                        }, {
							xtype: 'combo',
                            width: 220,
                            fieldLabel: 'PIN-kod',
							name: 'PinCode',                            
                            submitValue: false,
                            readOnly: true
                            
                        }
                        ],
                        buttons: [{

                            text: 'Bjud formulär',
                            listeners: {
                                click: function () {
                                    //todo Lägg in egen funktion
                                    var form = this.ownerCt.ownerCt;
									var formID=getCmpByName('FormID',form).getValue();
									if(!formID){
										Ext.Msg.alert('Fel', 'Måste ange vilket formulär som skall bjudas');
										return;
									}
									if(hasParent(formID) && !getCmpByName('SourceEventID',form).getValue()){
										Ext.Msg.alert('Fel', 'Måste ange till vilket formulär bjudningen tillhör');
										return;
									}
									
									var navetPers=Ext.getCmp('navetPerson');
									var subjectKey=getCmpByName('SubjectKey', navetPers).getValue();
                                    var values = form.getValues();									
									if(!values.SourceEvent){
										values.SubjectKey=subjectKey;
									}
                                    //seelf.store.add(values);																																																												
                                    //values.TargetFormID =values.FormID;
                                    
                                    //values.ReplyStatus = 1;
                                    //values.EventID=null;
                                    var r = createRegistration(values);
									
									Ext.Ajax.request({
										url : '/stratum/api/proxies',
										method : 'POST',
										jsonData : r,
										headers : 
										{
											'Content-Type' : 'application/json'
										},
										success : function(response){
											var d = Ext.decode(response.responseText);										
											var pinCmp=getCmpByName('PinCode',form);
											var pin=getPinCode(d.data.ProxyID);
											pinCmp.setValue(pin);	
											Ext.Msg.alert('Bjudning skapad', 'PIN-kod:' + pin);											
										},
										failure : function(response){
											var d = Ext.decode(response.responseText);
											if(d.message=='Proxy already exists'){
												Ext.Msg.alert('Fel', 'En sådan bjudning för patienten existerar redan');																							
											}
											else {
												Ext.Msg.alert('Okänt fel', 'Lyckades inte spara bjudning');																																			
											}
											var i=0;
											
										}
									});
                                    //var i = Ext.create('Invitation', r);
                                    //i.set('EnteredAt','2014-01-01T00:00:00');

                                   /* i.save({
                                        callback: function (record, operation) {
                                            if (operation.success) {

                                            } else {
                                                console.log('save failure');
                                            }
                                        }
                                    });*/

                                    //Här kan man eventuellt behöva välja den nya posten i griden görs enligt nedan
                                    //seelf.grid.getSelectionModel().select(self.store.getTotalCount()-1);
                                }
                            }
                        }
                        ]
                    }
                    ]
                });
            
		
		},
		getEditDialog: function(){
			            
              /* pageManager.reducedReplyStatusStore.filterBy(function (record, id) {
						var val = record.data.ValueCode;
						if (val==1 || val == 100){
							return false;
						}
						return true;
					});*/
				return Ext.create('Ext.window.Window', {
                   
                    id: 'editDialog',
					cls: 'winDialog',
                    autoShow: true,
                    //style: {
                    //    margin: '0 0 3px'
                    //},
                    //				y:100,
                    modal: true,
                    maximizable: false,
                    resizable: false,
                    //				width: 270,
                    title: 'Redigera inbjudan',
                    items: [{
                        xtype: 'form',
                        layout: 'auto',
                        bodyPadding: 10,
                        cls: 'myButtonForms',
                        name: 'editForm',
                        defaults: {
                            xtype: 'datefield',
                            labelAlign: 'top'
                        },
                        items: [{
                            xtype: 'label',
                            text: 'Personnummer:'
                        }, {
                            xtype: 'textfield',
                            width: 120,
                            submitValue: false,
                            displayField: 'Subject.SubjectKey',
                            valueField: 'Subject.SubjectID',
                            disabled: true,
                            listeners: {
                                afterrender: function (cmp, a, b) {
                                    var r = pageManager.onEditClick.currentRecord;                                                                       
                                    var subjectKey = r.data ? r.data.SubjectKey : r.SubjectKey;                                                                      
                                    cmp.setValue(subjectKey);
                                }
                            }
                        }, {
                            xtype: 'label',
                            text: 'Formulär:'
                        }, {
                            xtype: 'combo',
                            width: 320,
                            store: 'Forms',
                            displayField: 'FormTitle',
                            valueField: 'FormID',
                            submitValue: false,
                            queryMode: 'local',
                            disabled: true,
                            editable: false,
                            listeners: {
                                afterrender: function (cmp, a, b) {
                                    var r = pageManager.onEditClick.currentRecord;
                                    var v = r.data.Form.FormID;
                                    cmp.setValue(v);
                                }
                            }
                        }, {
                            xtype: 'label',
                            text: 'Status:'
                        }, {
                            xtype: 'combo',
                            width: 220,
                            store: 'replyStatusStore2',
                            name: 'ReplyStatus',
                            displayField: 'ValueName',
                            valueField: 'ValueCode',
                            queryMode: 'local',
                            disabled: false,
                            editable: true
                        },
						
						{
                            xtype: 'label',
                            text: 'Statusdatum:'
                        }, 
						//CreateHelpNoteButton('t'),	
						{
                            name: 'StatusDate',
                            width: 120,
                            format: 'Y-m-d',
                            maxValue: new Date(),
                            startDay: 1,
							readOnly:true,
                            altFormats: 'Ymd|ymd',
                            submitFormat: Date.JSONDateTime
                        }, {
                            xtype: 'label',
                            text: 'Adress till enkät:'
                        }, {
                            xtype: 'textareafield',
                            name: 'Token',
                            width: 420,
                            submitValue: false,
                            readOnly: true,
                            listeners: {
                                afterrender: function (cmp, a, b) {
                                    var r = pageManager.onEditClick.currentRecord;
                                    var proxyID = r.data.ProxyID;
                                    setToken(proxyID, cmp);
                                }
                            }
                        }, {
                            xtype: 'label',
                            text: 'PIN-kod:'
                        }, {
							xtype: 'combo',
                            width: 220,
                            name: 'PinCode',                            
                            submitValue: false,
                            readOnly: true,
                            listeners: {
                                afterrender: function (cmp, a, b) {
                                    var r = pageManager.onEditClick.currentRecord;
                                    var proxyID = r.data.ProxyID;
                                    var pin=getPinCode(proxyID);
									cmp.setValue(pin);
                                }
                            }
                        }, {
                            xtype: 'hiddenfield',
                            grow: true,
                            name: 'ProxyID'
                        }

                        ],
                        buttons: [{
                            text: 'Uppdatera',
                            scope: this,
                            listeners: {
                                click: function () {
                                    //todo Lägg i egen funktion
                                    var form = this.ownerCt.ownerCt;
									var stDate=getCmpByName('StatusDate', form);
									stDate.originalValue=new Date(2000, 1,1);
                                    var record = form.getRecord();
									if(!record){
										return;
									}
								
                                    var values = form.getValues();
                                    var record = pageManager.store.findRecord('ProxyID', values.ProxyID);
                                   
									updateRegistration(values, record);
                                    //console.log(record);										                                										
                                    this.ownerCt.ownerCt.ownerCt.close();

                                    pageManager.filterGrid();
                                }
                            }
                        }
                        ]
                    }
                    ]
                });
            
		
		},
		getSetDateDialog: function(){
			           
                return Ext.create('Ext.window.Window', {
                    
                    autoShow: true,
                    cls: 'winDialog',
                    title: 'Sätt',
                    width: 320,
                    maximizable: false,
                    resizable: false,
                    modal: true,
                    items: [{
						name:'form',
                        xtype: 'form',
                        bodyPadding: 10,
                        layout: 'auto',
                        cls: 'myButtonForms',
                        items: [{
                            xtype: 'label',
                            style: {
                                color: '#900000'
                            },
                            name: 'lblWarning',
                            text: ''
                        }, {
                            xtype: 'label',
                            text: 'Borttagen:',
                            name: 'editDateDateLabel'
                        }, {
                            xtype: 'datefield',
                            width: 120,
                            name: 'setDate',
                            name: 'date',
                            value: new Date(),
                            format: 'Y-m-d',
                            startDay: 1,
                            altFormats: 'Ymd|ymd',
                            submitFormat: Date.JSONDateTime,
                            maxValue: new Date(),
							readOnly:true
                        }, {
                            xtype: 'hiddenfield',
                            name: 'hiddenRecords',
                            name: 'hiddenRecords'
                        }, {
                            xtype: 'hiddenfield',
                            name: 'property',
                            name: 'property'
                        }

                        ],
                        buttons: [{
                            text: 'Uppdatera',
                            listeners: {
                                click: function () {
                                    //todo Lägg i egen funktion
                                    var form = this.ownerCt.ownerCt;
                                    var values = form.getValues();
                                    var recordIds = values.hiddenRecords.split(';');

                                    for (var i = 0; i < recordIds.length; i++) {
                                        var record = pageManager.store.findRecord('ProxyID', recordIds[i]);
                                        if(!record){
											alertMessage('Det gick inte att uppdatera. Ingen patient verkar vara vald i listan');
											return;
										}
										//record.data[values.property] = values.date;                                            											

                                        var r = {};
                                        r.ProxyID = record.get('ProxyID');
                                        r['StatusDate'] = values.date;
                                        r['ReplyStatus'] = values.property;
                                        updateRegistration(r, record);

                                        /*var r=createRegistration(record.data);
                                        var i = Ext.create('Invitation', r);
                                        i.save({
                                        callback: function(record, operation) {
                                            if (operation.success) {
                                                console.log('update success');
                                                //form.reset();
                                                //displayNewUnitPanel(false);
                                                //msg.update('Ansökan skickades...');
                                                //msg.getEl().move('r', 700, false);
                                                //msg.getEl().move('l', 700, {duration: 1000, easing: 'bounceOut'});
                                            } else {
                                                console.log('update failure');
                                                console.log(operation);
                                                //msg.update('Ansökan misslyckades! ' + operation.error.statusText)
                                                //msg.getEl().move('r', 700, false);
                                                //msg.getEl().move('l', 700, {duration: 1000, easing: 'bounceOut'});
                                            }
                                        }
                                        });*/
                                    }

                                    this.ownerCt.ownerCt.ownerCt.close();

                                    pageManager.filterGrid();
                                }
                            }
                        }
                        ]
                    }
                    ]
                });
            
		},
        openPdfNewWindow: function (sUrl, sWidth, sHeight) {
            var win;
            win = window.open(sUrl, '_blank', "height=" + sHeight + ",width=" + sWidth + ",resizable=yes,scrollbars=yes, status=yes,toolbar=no,menubar=yes,location=no");
            win.focus();
        },
        downloadFile: function (sUrl) {
            window.location = sUrl;
        },
        onOpenInvitation: function () {
            this.myMask.show();

            //här kommer serveranrop för att skapa inbjudan

            this.openPdfNewWindow('tempDocuments/invitation.pdf', 950, 950);

            this.myMask.hide();
        },
        onOpenNotification: function () {
            this.myMask.show();

            //här kommer serveranrop för att skapa påminnelse

            this.openPdfNewWindow('tempDocuments/notification.pdf', 950, 950);

            this.myMask.hide();
        },
        onMoreInfoClick: function () {
            var record = pageManager.grid.getSelectionModel().getSelection()[0]
			if(!record){
				return;
			}
            var subjectKey = record.get('SubjectKey');
            var parentEvent = record.get('SourceEvent');
            var parentEventID = parentEvent.EventID;
            var parentFormID;
            var parentReg;
            var questionMappings = {};
            var domainIDMappings = {};
            var domainValues = {};
            var s='';
            /*if (Ext.isEmpty(subject)) {
                if (!Ext.isEmpty(parentEvent)) {
                    subject = parentEvent.Subject;
                }
            }*/
            if (Ext.isEmpty(subjectKey)) {
                alertMessage('Markerad inbjudan har inget personnummer');
                return;
            }
            
            Ext.Ajax.request({
                url: '/stratum/api/overview/history/' + subjectKey,
                method: 'get',
                success: function (r) {
                    var d = Ext.decode(r.responseText);
                    for (var prop in d.data.History) {
                        var i = 0;
                        for (i = 0; i < d.data.History[prop].Registrations.length; i++) {
                            if (d.data.History[prop].Registrations[i].EventID == parentEventID) {
                                parentFormID = d.data.History[prop].FormID;
                                parentReg = d.data.History[prop].Registrations[i];                                
                            }
                        }
                    }
                    Ext.Ajax.request({
                        url: "/stratum/api/metadata/questions/form/" + parentFormID,
                        method: 'get',
                        success: function (r) {
                            var q = Ext.decode(r.responseText);
                            var domainIDsStr = '';
                            var testMapped = {};
                            for (var prop in q.data) {
                                if (!Ext.isEmpty(q.data[prop].PrefixText) && q.data[prop].IsMandatory) {
                                    questionMappings[q.data[prop].ColumnName] = q.data[prop].PrefixText;
                                    domainIDMappings[q.data[prop].ColumnName] = q.data[prop].Domain.DomainName;
                                    if (domainIDsStr == '') {
                                        domainIDsStr += q.data[prop].Domain.DomainID;
                                    }
                                    else {
                                        if (Ext.isEmpty(testMapped[q.data[prop].Domain.DomainID])) {
                                            domainIDsStr += ',' + q.data[prop].Domain.DomainID;
                                        }
                                    }
                                    testMapped[q.data[prop].Domain.DomainID] = true;
                                }
                            }                            
                            Ext.Ajax.request({
                                url: '/stratum/api/metadata/domains/map/' + domainIDsStr,
                                method: 'get',
                                success: function (r) {
                                    var dv = Ext.decode(r.responseText);
                                    var i = 0;
                                    for (var prop in questionMappings) {
                                        if (Ext.isEmpty(questionMappings[prop].trim()) || Ext.isEmpty(parentReg[prop]) ) {
                                            continue;
                                        }
                                        s += '<b>' + questionMappings[prop] + '</b>:';
                                        if (Ext.isEmpty(dv.data[domainIDMappings[prop]][parentReg[prop]])) {                                            
                                            s += parentReg[prop];
                                        }
                                        else {
                                            s+=dv.data[domainIDMappings[prop]][parentReg[prop]];
                                        }
                                        s += '<br/>';                                        
                                    }
                                    s=s.replace(/T00:00:00/g, '');
                                    Ext.Msg.alert('Mer information', s);
                                }
                            });


                        }
                    });
                }
            });
        },
        onDownloadAddressList: function () {

            var record = pageManager.grid.getSelectionModel().getSelection()[0]
			if(!record){
				return;
			}
            var subjectKey = record.get('SubjectKey');
            if (Ext.isEmpty(subjectKey)) {
                alertMessage('Markerad inbjudan har inget personnummer');
                return;
            }
            
            SubjectManagement.GetPerson(subjectKey, function (e, r) {
                if (r.result.success) {
                    var patData = r.result.data;
                    var s = '';
                    if (!Ext.isEmpty(patData.DateOfDeath)) {
                        s = 'Patienten är avliden.';
                    }
                    else {
                        s = s + patData.FirstName + ' ' + patData.LastName + "<br/>";
                        s += patData.Address2 + "<br/>";
                        s = s + patData.PostCode + ' ' + patData.City + "<br/>";
                    }
                    alertMessage(s);

                } else {
                    switch (r.result.code) {
                        case 1:
                            alertMessage('Inga uppgifter hittades på angivet personnummer.');
                            break;
                        case 2:
                            alertMessage('<b>Det personnummer du skrivit in är ogiltigt.</b><br>Generellt gäller att personnummer skall inledas med sekel och ha en giltig kontrollsiffra i slutet. Registret kan också ha specificerat ytterligare regler som tillämpas.');
                            break;
                        default:
                            alertMessage('Okänt fel:' + r.result.message);
                            break;
                    }
                }
            });

        },
        onAddClick: function () {            
			pageManager.getNewDialog();            
        },
        onEditClick: function () {

            if(!this.activeRecord){
				return;
			}
			pageManager.onEditClick.currentRecord = this.activeRecord;        
			var dialog=pageManager.getEditDialog();
            var form = getCmpByName('editForm', dialog);           
            form.getForm().loadRecord(this.activeRecord);

        },
        onSetDateClick: function (statusCode) {         
			var win=pageManager.getSetDateDialog();
			var form=getCmpByName('form', win);
            var recordLabel = new Array();
            var sRecords = '',
                sMessage = '';

            var lblWarning = getCmpByName('lblWarning', form).hide();
            var sMessage = pageManager.replyStatusStore.findRecord('ValueCode', statusCode).data.ValueName;
            getCmpByName('editDateDateLabel', form).setText('Datum för ' + sMessage + ':');
            var selectedRecords = pageManager.grid.getSelectionModel().getSelection();
            for (var i = 0; i < selectedRecords.length; i++) {
                recordLabel.push(selectedRecords[i].get('ProxyID'));
            }
            sRecords = recordLabel.join(';');
            getCmpByName('hiddenRecords',form).setValue(sRecords);
            getCmpByName('property',form).setValue(statusCode);
            win.setTitle('Sätt datum för ' + sMessage);
        },
        getNavetSearch: function (socialnumber) {         
            var ret = {
                SubjectKey: socialnumber,
                Name: 'Henrik Milefors',
                StreetAddress: 'Västra Götaland',
                City: 'Göteborg'
            };

            return ret;
        },
        validateSocialNumber: function (socialnumber) {
            return true;
        },
        onSearchSocialNumber: function () {
			var formInvitation = Ext.getCmp('newInvitation');
			var inviteFormsCmp=Ext.getCmp('inviteForms')
            var socialnumber = Ext.getCmp('inputSocialnumber').getValue();

            if (socialnumber.length == 12)
                socialnumber = socialnumber.substring(0, 8) + '-' + socialnumber.substring(8, 12);

            if (!this.validateSocialNumber(socialnumber)) {               
                return;
            }

            var patObj = {};
            var formPerson = Ext.getCmp('navetPerson');
            
            SubjectManagement.GetPerson(socialnumber, function (e, r) {
                if (r.result.success) {
                    var patData = r.result.data;
                    patObj.SubjectKey = patData.SocialNumber;
                    patObj.Name = patData.FirstName + ' ' + patData.LastName;
                    patObj.StreetAddress = patData.Address2;
                    patObj.City = patData.PostCode + ' ' + patData.City;


                    formPerson.getForm().setValues(patObj);
                    if (!Ext.isEmpty(patData.DateOfDeath)) {
						inviteFormsCmp.disable();
                        formInvitation.disable();
						alertMessage('Patienten är avliden.');
                        return;
                    }
                    formInvitation.enable();
					inviteFormsCmp.enable();
                } else {
					formInvitation.disable();
					inviteFormsCmp.disable();
                    switch (r.result.code) {
                        case 1:
                            alertMessage('Inga uppgifter hittades på angivet personnummer.');
                            break;
                        case 2:
                            alertMessage('<b>Det personnummer du skrivit in är ogiltigt.</b><br>Generellt gäller att personnummer skall inledas med sekel och ha en giltig kontrollsiffra i slutet. Registret kan också ha specificerat ytterligare regler som tillämpas.');
                            break;
                        default:
                            alertMessage('Okänt fel:' + r.result.message);
                            break;
                    }
                }
            });          
        },
        filterGrid: function () {
            function meetFilterStatus(rec) {
                return rec.get("ReplyStatus") == pageManager.filter.status || pageManager.filter.status == -1;
            }

            function meetFilterSearch(rec) {
                var filterText = pageManager.filter.text.toUpperCase();               
                var subjectKey = rec.get('SubjectKey');              
                var formID = rec.get('Form').FormID;
                var formTitle = '';
                var i = 0;
                for (i = 0; i < pageManager.formInfoStore.data.items.length; i++) {
                    var r = pageManager.formInfoStore.data.items[i];
                    if (r.data.FormID == formID) {
                        formTitle = r.data.FormTitle;
                    }
                }
                var statusDate = rec.data.StatusDate;
                var statusDateText = Ext.Date.format(statusDate, 'Y-m-d');

                var status = pageManager.replyStatusStore.findRecord('ValueCode', rec.data.ReplyStatus);
				if(status==null)
					return;
                var statusText = status.data.ValueName;

                if (pageManager.filter.text != '') {
                    return subjectKey.toUpperCase().indexOf(filterText) !== -1 ||
                    formTitle.toUpperCase().indexOf(filterText) !== -1 ||
                    statusDateText.toUpperCase().indexOf(filterText) !== -1 ||
                    statusText.toUpperCase().indexOf(filterText) !== -1;
                }
                else {
                    return 1;
                }
            }

            function meetAllConditions(rec) {
                var ret;
                ret = meetFilterStatus(rec);
                if (!ret)
                    return ret;
                ret = meetFilterSearch(rec);
                if (!ret)
                    return ret;
                return ret;
            }

            this.store.filterBy(function (rec, id) {
                return meetAllConditions(rec);
            });

            this.filterLabel.setText('visar ' + this.store.getCount() + ' av ' + (this.store.getTotalCount() - g_NrOfCanceled));           
        },
        enableButtons: function (count) {        
            getCmpByName('bnEdit', this.gridPanel ).enable();          
            getCmpByName('bnS2', this.gridPanel).enable();
            getCmpByName('bnS11', this.gridPanel).enable();
            getCmpByName('bnS12', this.gridPanel).enable();           
            getCmpByName('bnCreateSendList', this.gridPanel).enable();
            getCmpByName('bnMoreInfo', this.gridPanel).enable();          
            if (count > 1) {
                getCmpByName('bnEdit', this.gridPanel).disable();
            }
            else {
                getCmpByName('bnEdit', this.gridPanel).enable();
            }
        }       
    };

    function createRegistration(record) {
        var r = {};
        for (var prop in record) {
            if (record[prop] instanceof Date) {
                r[prop] = Ext.util.Format.date(record[prop], 'Y-m-d');
                r[prop] += 'T00:00:00';
            }
            else if (prop == 'SubjectKey') {                
				if(!record.SourceEventID){
					r.Subject = {
						SubjectKey: record[prop]
					};				
				}
            }
			else if (prop == 'SourceEventID') {                
				if(record.SourceEventID){
					r.SourceEvent = {
						EventID: record[prop]
					};				
				}
            }
			else if (prop == 'FormID') {                				
				r.Form = {
					FormID: record[prop]
				};								
            }
            else {
                r[prop] = record[prop];
            }
        }				
        return r;
    }

    function updateRegistration(r, storeRecord, oldStatus) {
        if(!storeRecord){
			alertMessage('Kunde inte uppdatera. Ingen patient verkar vara vald i listan.');
			return;
		}
		var oldStatus=storeRecord.data.ReplyStatus;
		var newStatus= r.ReplyStatus;
		if(newStatus==1 || newStatus==100 || newStatus==111){
			alertMessage('Fel. Denna status kan inte sättas manuellt.');
			return;
		}
		if(newStatus<oldStatus){
			Ext.MessageBox.show({
					title: 'Tidigare status',
					msg: 'Du försöker gå bakåt i status. Gör detta bara för att korrigera en tidigare felaktig manuell statussättning.',
					buttons: Ext.Msg.OKCANCEL,
					fn: function (aDialogButton) {
						if (aDialogButton === 'ok') {
							updateSub(r, storeRecord);
						}
					}
				});
		}
		else {
			updateSub(r, storeRecord);
		}		
    }
	
	function updateSub(r, storeRecord){
		var oldValues = {};
        for (var prop in r) {
            if (prop == 'Subject' || prop == 'Unit' || prop == 'SubjectKey') {
                continue;
            }
            oldValues[prop] = storeRecord.get(prop);
            storeRecord.set(prop, r[prop]);					
        }
		var subKey=storeRecord.data.SubjectKey;		
        storeRecord.save({
            callback: function (record, operation) {
                if (operation.success) {	
					
                } else {
                    for (var prop in r) {
                        storeRecord.set(prop, oldValues[prop]);
                    }
                    alertMessage('Otillåten statusuppdatering. Föregående status kan inte uppdateras till vald status.');
                    pageManager.filterGrid();
                }
				storeRecord.data.SubjectKey=subKey;
            }
        });
	}

    function setToken(proxyID, cmp) {
        Ext.Ajax.request({
            url: '/stratum/api/proxies/token/' + proxyID,
            method: 'get',
            success: function (r) {
                var d = Ext.decode(r.responseText);
                var i = 0;
                i++;
                cmp.setValue('https://svara.registercentrum.se/?token=' + d.data);
            }
        });
    }
	
	function getPinCode(proxyID){
		var s=proxyID.toString();
		return s.substring(s.length-4, s.length);
	}
	function hasParent(formID){
		for(var i=0; i< pageManager.formInfoStore.data.items.length; i++){
			var f=pageManager.formInfoStore.data.items[i].data;
			if(f.FormID==formID && f.Parent!==null){
				return true;
			}
		}
		return false;
	}
	function CreateHelpNoteButton(aHelpNote)
	{
		return { 
			xtype: "button",
			isHelpNote: true,
			width: 16,
			height: 16,
			border: false,
			frame: false,
			helpNote: aHelpNote, // HttpUtility.JavaScriptStringEncode(aHelpNote),
			tabIndex:1,
			glyph: 0xf0e6, //fa-question-circle=0xf059, 
			ui:"toolbar",
			cls:"EventFormHelpNoteButton",
			listeners: {
				render: createHoveringHelpNote,
				click: createFloatingHelpNote
			}
		};
	}

    pageManager.init({
        promContainer: Stratum.containers && Stratum.containers['RC/PROMADM'] || 'promAdministration'
    });

})();

Ext.util.CSS.removeStyleSheet('prom-administration');
Ext.util.CSS.createStyleSheet(
  ' '

+ '.x-grid-item-alt {'  
+ '  background-color: #F8F8F8;'
+ '}'
+ '.x-grid-item-selected {'
+ '  background-color: #d8d8d8;'
+ '}', 'bsw-units'
);
//# sourceURL=RC/PROMADM