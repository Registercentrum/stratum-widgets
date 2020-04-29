var hipstherWidget = function(parameters, _subjectManagement) {

    Ext.util.CSS.createStyleSheet(''
        + '.hipsther-window .x-panel-body-default { border-width: 0; }'
        + '.hipsther-window h2 { color: #934a93; text-transform: none; margin-bottom: 1em; }'
        + '.hipsther-window .EventFormFieldPrefix { float: none; display: inline; }'
        + '.hipsther-window .EventFormHelpNoteButton { margin-right: 8px; }'
        + '.hipsther-dialog .x-window-header-default-top { background-color: #934a93; }'
        + '.hipsther-dialog .x-message-box-question { color: #934a93; }'
        + '.hipsther-dialog .x-btn-default-small { background-color: #934a93; border-color: #7d3e7d; }'
        + '.hipsther-dialog .x-btn-focus.x-btn-default-small { background-color: #934a93; }'
        , 'sfr-hipsther'
    );

    var BASE_URL = Repository.Local.Methods.Hipsther.getBaseUrl();

    var hipstherWindow;
    var scope = {
        participationQuestions: {
            alreadyTreated: null,
            suitableForRandomization: null,
            bothTreatmentsAvailable: null,
            consent: null,
            noConsentReason: null
        },
        subject: {
            subjectKey: parameters.subjectKey,
            status: 'Ej screenad'
        },
        eventId: parameters.eventId
    };

    _subjectManagement.GetPerson(scope.subject.subjectKey, function(response) {
        Repository.Local.Methods.Hipsther.log("Response from GetPerson:");
        Repository.Local.Methods.Hipsther.log(response);
        if(response.success) {
            scope.subject.fullName = response.data.FirstName + " " + response.data.LastName;
            initWidget();
        }
    });

    function initWidget() {

        var loadingPanel = new Ext.Panel({
            layout: {
                type: 'hbox',
                align: 'center',
                pack: 'center'
            }, 
            items: [
                {
                    xtype: 'label',
                    html: '<span class="loading-indicator"></span>'
                }
            ]
        });

        var windowItems = getWindowItems();

        hipstherWindow = new Ext.Window({
            width: 640, 
            //height: 600,
            modal: true,
            layout: "fit",
            frame: false,
            cls: "hipsther-window hipsther-dialog",
            scrollable: "vertical",
            title: "HIPSTHER",
            items: [{
                xtype: "container",
                layout: "fit",
                items: [{
                    xtype: "container",
                    layout: "fit",
                    items: windowItems
                }]
            }],
            listeners: {
                beforeclose: function(a, b) {
                    if(hipstherWindow.confirmClose === true) {
                        hipstherWindow.confirmClose = false;
                        return true;
                    }
                    confirmClose();
                    return false;
                }
            }
        });

        Repository.Local.Methods.Hipsther.getResource("/candidates/" + scope.eventId).then(function(data) {
            scope.subject.screened = true;
            Repository.Local.Methods.Hipsther.log("Response from: /candidates/" + scope.eventId);
            Repository.Local.Methods.Hipsther.log(data);
            if(!data.Included) {
                hipstherWindow.show();         
                updateStatus("Screening fail");
                return;
            }

            Repository.Local.Methods.Hipsther.getResource("/subjects/" + scope.subject.subjectKey).then(function(data) {
                Repository.Local.Methods.Hipsther.log("Response from getSubject:");
                Repository.Local.Methods.Hipsther.log(data);
                scope.subject.studyGroup = data.StudyGroup;
                scope.subject.subjectId = data.SubjectId;
                scope.subject.screened = true;
                hipstherWindow.show();         
                updateStatus("Randomiserad");
            }, function() {
                Repository.Local.Methods.Hipsther.log("Subject not there...");
                hipstherWindow.show();         
            });
        }, function(response) {
            Repository.Local.Methods.Hipsther.log(response);
            if(response.code === 404) {
                Repository.Local.Methods.Hipsther.log("Subject not screened...");
                hipstherWindow.show();         
            }
            else {
                Ext.Msg.alert(
                    'FEL: HIPSTHER', 
                    'Ett oväntat fel uppstod. Försök igen senare eller kontakta studieledningen!', 
                    Ext.emptyFn
                );
            }
        })
    }

    function getWindowItems() {
        
        var yesNoStore = Ext.create('Ext.data.Store', {
            fields: ['name', 'value'],
            data : [
                {"name": "", "value": ""},
                {"name": "Ja", "value": true},
                {"name": "Nej", "value": false},
            ]
        });

        var consentDetailStore = Ext.create('Ext.data.Store', {
            fields: ['name', 'value'],
            data : [
                {"name": "", "value": ""},
                {"name": "Kan inte", "value": "CAN_NOT_GIVE_CONSENT"},
                {"name": "Vill inte", "value": "NOT_WILLING"},
                {"name": "Föredrar en av behandlingarna", "value": "PREFER_ONE_TREATMENT"},
                {"name": "Oklart/okänt", "value": "UNKNOWN"},
            ]
        });

        return [{
                xtype: "panel",
                id: "EventFormPanel",
                cls: "EventFormPanel",
                items: [{
                    xtype: "panel",
                    layout: 'column',
                    items: [{
                        xtype: 'label',
                        html: 'Patient:',
                        columnWidth: 0.3
                    },{
                        xtype: 'label',
                        html: scope.subject.fullName + " (" + scope.subject.subjectKey + ")",
                        columnWidth: 0.7
                    },{
                        xtype: 'label',
                        html: 'Status i studien:',
                        columnWidth: 0.3
                    },{
                        xtype: 'label',
                        html: scope.subject.status,
                        id: 'StatusLabel',
                        columnWidth: 0.7
                    }]
                }, {
                    xtype: "panel",
                    id: "RandomizationPanel",
                    layout: 'column',
                    hidden: true,
                    items: [{
                        xtype: 'label',
                        html: 'Randomiseringsnummer:',
                        columnWidth: 0.3
                    },{
                        xtype: 'label',
                        html: '.',
                        id: 'SubjectIdLabel',
                        columnWidth: 0.7
                    },{
                        xtype: 'label',
                        html: '<strong>Randomiserad till:</strong>',
                        columnWidth: 0.3
                    },{
                        xtype: 'label',
                        html: ".",
                        id: 'TreatmentLabel',
                        columnWidth: 0.7
                    }]
                }, {
                    xtype: "label",
                    hidden: true,
                    id: 'PatientNotRandomizedLabel',
                    html: "Patienten kunde inte randomiseras till studien för denna fraktur. Tack för din medverkan."
                }, {
                    xtype: "panel",
                    id: "QuestionForm",
                    layout:'column',
                    items: [
                        {
                            html: "<h2>Denna patient uppfyller inklusionkriterierna för HIPSTHER med randomisering  mellan protes och osteosyntes vid Garden I-II frakturer. Besvara följande frågor endast om du vill försöka randomisera.</h2>",
                            columnWidth: 1
                        },
                        getQuestionRow(
                            {
                                label: "Är patienten redan behandlad för den aktuella höftfrakturen?", 
                                store: yesNoStore,
                                componentId: "AlreadyTreatedComboBox",
                                disabled: false,
                                hidden: false
                            },
                            function(value) {
                                scope.participationQuestions.alreadyTreated = value;
                                if(!value) {
                                    Ext.getCmp("SuitableComboBox").enable();
                                }
                                else {
                                    Ext.getCmp("SuitableComboBox").disable();
                                }
                                updateUi();
                        }),
                        getQuestionRow(
                            {
                                label: "Klarar patienten båda behandlingarna? (Tex. ur anestesiologisk synpunkt eller olämplig pga symptomgivande artros) OCH Är frakturen verifierad med slätröntgen? (Enbart CT eller MR gäller inte)", 
                                store: yesNoStore,
                                componentId: "SuitableComboBox",
                                disabled: true,
                                hidden: false
                            },
                            function(value) {
                                scope.participationQuestions.suitableForRandomization = value;
                                if(value) {
                                    Ext.getCmp("BothTreatmentsComboBox").enable();
                                }
                                else {
                                    Ext.getCmp("BothTreatmentsComboBox").disable();
                                }
                                updateUi();
                        }),
                        getQuestionRow(
                            {
                                label: "Klarar kliniken av att utföra båda behandlingsalternativen?",
                                store: yesNoStore,
                                componentId: "BothTreatmentsComboBox",
                                disabled: true,
                                hidden: false
                            },
                            function(value) {
                                scope.participationQuestions.bothTreatmentsAvailable = value;
                                if(value) {
                                    Ext.getCmp("ConsentComboBox").enable();
                                }
                                else {
                                    Ext.getCmp("ConsentComboBox").disable();
                                }
                                updateUi();
                        }),
                        getQuestionRow(
                            {
                                label: "Har patienten givit informerat samtycke till medverkan i studien?",
                                store: yesNoStore,
                                helpNote: 'Se <a href="https://sfr.registercentrum.se/forskning/hipsther-hip-screws-or-total-hip-replacement/p/BJY92DdQS" target="_blank">denna länk</a> för skriftligt samtyckesformulär.',
                                componentId: "ConsentComboBox",
                                disabled: true,
                                hidden: false
                            },
                            function(value) {
                                scope.participationQuestions.consent = value;
                                if(value) {
                                    Ext.getCmp("ConsentDetailRow").hide();
                                }
                                else {
                                    Ext.getCmp("ConsentDetailRow").show();
                                }
                                updateUi();
                        }),
                        getQuestionRow(
                            {
                                label: "Vad är orsaken till att inget samtycke erhållits?",
                                store: consentDetailStore,
                                componentId: "ConsentDetailComboBox",
                                rowComponentId: "ConsentDetailRow",
                                disabled: false,
                                hidden: true
                            },
                            function(value) {
                                scope.participationQuestions.noConsentReason = value;
                                updateUi();
                        })
                    ]
                }, 
                {
                    xtype: "label",
                    id: "ErrorLabel",
                    hidden: true,
                    html: '<span style="color: red;">Svaren som angetts kommer leda till en screening fail.</span>',
                },
                {
                    xtype: "toolbar",
                    id: "ButtonToolbar",
                    cls: "x-toolbar-footer",
                    items: [
                            {
                            xtype: "button",
                            id: "ContinueButton",
                            text: "Fortsätt",
                            disabled: true,
                            listeners: {
                                click: function(e, opts) {
                                    handleContinueClick();
                                }
                            }
                        },{
                            xtype: "button",
                            text: "Avbryt",
                            listeners: {
                                click: function(e, opts) {
                                    confirmClose();
                                }
                            }
                        }
                    ]
                }
                ]
            }]        
    }

    function getQuestionRow(parameters, changeCallback) {

        var labelItems = [];

        if(parameters.helpNote) {
            var helpButton =  {
                            xtype: "button",
                            isHelpNote: true,
                            width: 16,
                            height: 16,
                            border: false,
                            frame: false,
                            helpNote: parameters.helpNote,
                            tabIndex: -1,
                            glyph: 0xf0e6, //fa-question-circle=0xf059, 
                            ui: "toolbar",
                            cls: "EventFormHelpNoteButton",
                            listeners: {
                                render: function(button) {
                                    createHoveringHelpNote(button);
                                },
                                click: function(button) {
                                    createFloatingHelpNote(button);
                                }
                            }
                        };
            
            labelItems.push(helpButton);
        }
        
        labelItems.push({
                            xtype: "label",
                            html: parameters.label,
                            cls: "EventFormFieldPrefix"
                        });

        var row = {
            xtype: "panel",
            layout:'column',
            hidden: parameters.hidden,
            columnWidth: 1,
            items: [
                {
                    xtype: "panel",
                    columnWidth: 0.7,
                    items: labelItems
                },
                {
                    xtype: "combobox",
                    store: parameters.store,
                    id: parameters.componentId,
                    queryMode: 'local',
                    displayField: 'name',
                    valueField: 'value',
                    editable: false,
                    disabled: parameters.disabled,
                    columnWidth: 0.3,
                    listeners: {
                        select: function(combo, records) {
                            changeCallback(records.data.value === "" ? null : records.data.value);
                        }
                    }
                }                                
            ]
        }

        if(parameters.rowComponentId) {
            row.id = parameters.rowComponentId
        };

        return row;
    }

    function confirmClose() {
        if(scope.subject.screened) {
            hipstherWindow.confirmClose = true;
            hipstherWindow.close();
            return;
        }

        Ext.MessageBox.show ({
            title: 'HIPSTHER',
            msg: "Vill du avbryta screeningen? Du kan alltid återkomma senare.",
            buttons: Ext.MessageBox.YESNO,
            icon: Ext.MessageBox.QUESTION,
            fn: function(b) {
                switch (b) {
                    case 'yes':
                    hipstherWindow.confirmClose = true;
                    hipstherWindow.close();
                }
            }
        });        
    }

    function formIsValid() {
        if(scope.participationQuestions.alreadyTreated === true) return false;
        if(scope.participationQuestions.suitableForRandomization === false) return false;
        if(scope.participationQuestions.bothTreatmentsAvailable === false) return false;
        if(scope.participationQuestions.consent === false) return false;

        return true;
    }

    function updateUi() {
        Repository.Local.Methods.Hipsther.log("updateUi ::");
        var errorLabel = Ext.get("ErrorLabel");
        if(formIsValid()) {
            errorLabel.hide();
        }
        else {
            errorLabel.show();
        }

        var continueButton = Ext.getCmp("ContinueButton");
        if(scope.participationQuestions.alreadyTreated !== null) {
            continueButton.enable();
        }
        else {
            continueButton.disable();
        }

        if(scope.subject.studyGroup && scope.subject.subjectId) {
            var treatmentLabel = Ext.getCmp("TreatmentLabel");
            treatmentLabel.setHtml("<strong>" + scope.subject.studyGroup + "</strong>");

            var subjectIdLabel = Ext.getCmp("SubjectIdLabel");
            subjectIdLabel.setHtml(scope.subject.subjectId);

            var randomizationPanel = Ext.getCmp("RandomizationPanel");
            randomizationPanel.show();
        }

        if(scope.subject.screened) {
            Repository.Local.Methods.Hipsther.log("updateUi :: Subject is screened");
            var questionForm = Ext.getCmp("QuestionForm");
            questionForm.hide();

            var toolbar = Ext.getCmp("ButtonToolbar");
            toolbar.hide();

            errorLabel.hide();
        }

        hipstherWindow.updateLayout();
    }

    function updateStatus(status) {
        var statusLabel = Ext.getCmp("StatusLabel");
        statusLabel.setHtml(status);

        if(status === "Screening fail") {
            var patientNotRandomizedLabel = Ext.getCmp("PatientNotRandomizedLabel");
            patientNotRandomizedLabel.show();
        }

        updateUi();
    }

    function handleContinueClick() {
        Repository.Local.Methods.Hipsther.log("Participation questions:");
        Repository.Local.Methods.Hipsther.log(scope.participationQuestions);

        if( scope.participationQuestions.alreadyTreated === false &&
            scope.participationQuestions.suitableForRandomization === true &&
            scope.participationQuestions.bothTreatmentsAvailable === true &&
            scope.participationQuestions.consent === true
            ) {
                showScreeningDialog();
        }
        else {
            showScreeningFailDialog();
        }        
    }

    function showScreeningDialog() {
        Ext.MessageBox.show ({
            title: 'HIPSTHER',
            msg: "Genom att fortsätta kommer patienten att randomiseras. Vill du fortsätta?",
            buttons: Ext.MessageBox.YESNO,
            icon: Ext.MessageBox.QUESTION,
            fn: function(b) {
                switch (b) {
                    case 'yes':
                        Ext.Ajax.request({
                            url: BASE_URL + "/subjects",
                            method: "POST",
                            jsonData: {
                                subjectKey: scope.subject.subjectKey,
                                eventId: scope.eventId,
                                stratificationParameters: [
                                    { 
                                        key: "GENDER",
                                        value: "{GENDER}"
                                    }
                                ]
                            },
                            success: function(response) {
                                Repository.Local.Methods.Hipsther.log("Candidate was successfully randomized in study. Response:");
                                var json = Ext.util.JSON.decode(response.responseText);
                                Repository.Local.Methods.Hipsther.log(json);
                                scope.subject.studyGroup = json.data.StudyGroup;
                                scope.subject.subjectId = json.data.SubjectId;
                                scope.subject.screened = true;
                                updateStatus("Randomiserad");
                                Repository.Local.Methods.Hipsther.log("Study variables (initial):");
                                Repository.Local.Methods.Hipsther.log("Inj_Cause:   " + parameters.studyVariables.injuryCause);
                                Repository.Local.Methods.Hipsther.log("Inj_Dat:     " + Ext.Date.format(parameters.studyVariables.injuryDate, "Y-m-d"));
                                Repository.Local.Methods.Hipsther.log("Inj_Age:     " + parameters.studyVariables.ageAtInjuryDate);
                                Repository.Local.Methods.Hipsther.log("Fx_XrayDat:  " + parameters.studyVariables.xRayDate);
                                Repository.Local.Methods.Hipsther.log("Fx_XrayTime: " + parameters.studyVariables.xRayTime);
                                Repository.Local.Methods.Hipsther.writeInitialStudyData(parameters, scope.subject.subjectKey)
                                    .then(function() {
                                        Ext.Msg.alert(
                                            'HIPSTHER', 
                                            'Patienten är nu inkluderad i HIPSTHER och randomiserad till: ' + json.data.StudyGroup, 
                                            Ext.emptyFn
                                        );
                                    }, function() {
                                        Ext.Msg.alert(
                                            'FEL: HIPSTHER', 
                                            'Patienten blev randomiserad men initiala studievariabler kunde inte sparas. Vänligen kontakta studieledningen.', 
                                            Ext.emptyFn
                                        );
                                    });
                            },
                            failure: function(response) {
                                Repository.Local.Methods.Hipsther.log("Failure. Response:");
                                Repository.Local.Methods.Hipsther.log(response);
                                Ext.Msg.alert(
                                    'FEL: HIPSTHER', 
                                    'Ett fel uppstod vid randomisering. Försök igen senare eller kontakta studieledningen!', 
                                    Ext.emptyFn
                                );
                                var json = Ext.util.JSON.decode(response.responseText);
                                Repository.Local.Methods.Hipsther.log(json);
                            }
                        });
                        break;
                    default:
                        Repository.Local.Methods.Hipsther.log("No randomization will be done");
                    break;
                }
            }
        });        
    }

    function showScreeningFailDialog() {
        Ext.MessageBox.show ({
            title: 'HIPSTHER',
            msg: "Svaren som angetts kommer leda till en screening fail. Randomisering kommer INTE att ske. Vill du fortsätta?",
            cls: "hipsther-dialog",
            buttons: Ext.MessageBox.YESNO,
            icon: Ext.MessageBox.QUESTION,
            fn: function(b) {

                switch (b) {
                    case 'yes':
                        reasonNotIncluded = getReasonNotIncluded();
                        reasonNotIncludedDetail = getReasonNotIncludedDetail();
                        Ext.Ajax.request({
                            url: BASE_URL + "/candidates/fail",
                            method: "POST",
                            jsonData: {
                                subjectKey: scope.subject.subjectKey,
                                eventId: scope.eventId,
                                reasonNotIncluded: reasonNotIncluded,
                                reasonNotIncludedDetail: reasonNotIncludedDetail
                            },
                            success: function() {
                                scope.subject.screened = true;
                                updateStatus("Screening fail");
                            },
                            failure: function() {
                                Ext.Msg.alert(
                                    'FEL: HIPSTHER', 
                                    'Kunde inte skriva till screeningloggen. Vänligen försök igen senare.', 
                                    Ext.emptyFn
                                );
                            }
                        });
                        break;
                    case 'no':
                        Repository.Local.Methods.Hipsther.log("No screening failure... Yet.");
                        break;
                }
            }
        });
    }

    function getReasonNotIncluded() {
        if(scope.participationQuestions.alreadyTreated === true) {
            return "ALREADY_TREATED";
        }
        if(scope.participationQuestions.suitableForRandomization === false) {
            return "NOT_SUITABLE";
        }
        if(scope.participationQuestions.bothTreatmentsAvailable === false) {
            return "LACK_OF_CLINICAL_RESOURCES";
        }
        if(scope.participationQuestions.consent === false) {
            return "NO_INFORMED_CONSENT";
        }

        return "";
    }

    function getReasonNotIncludedDetail() {
        if(scope.participationQuestions.consent === false) {
            return scope.participationQuestions.noConsentReason;
        }

        return "";
    }
};
// SiteId: 206
// WidgetId: SFR/Hipsther
// WidgetName: Hipsther
//! Applikation för Hipsther-studien
