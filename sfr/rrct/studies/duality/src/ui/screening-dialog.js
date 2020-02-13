import * as server from "../models/server";
import * as logger from "../services/logger";
import * as api from "../services/api";
import * as userTexts from "../models/user-texts";
import * as webClient from "../services/web-client";
import * as dialogs from "./dialogs";

var _screening, _current, _subject, _screeningWindow;

Ext.util.CSS.createStyleSheet(''
+ '.screening-window h2                                 { color: #208396; text-transform: none; margin-bottom: 1em; }'
+ '.screening-window .EventFormFieldPrefix              { float: none; display: inline; }'
+ '.screening-window .EventFormHelpNoteButton           { margin-right: 8px; }'
+ '.screening-dialog .x-window-header-default-top       { background-color: #208396; }'
+ '.screening-dialog .x-message-box-question            { color: #208396; }'
+ '.screening-dialog .x-btn-default-small               { background-color: #208396; }'
+ '.screening-dialog .x-btn-focus.x-btn-default-small   { background-color: #208396; }'
, 'sfr-duality-study'
);

export function init(current, subject, subjectManagement) {
    _screening = {
        participationQuestions: {
            alreadyTreated: null,
            suitableForRandomization: null,
            bothTreatmentsAvailable: null,
            consent: null,
            noConsentReason: null
        },
        subject: {
            status: 'Ej screenad'
        }
    };
    _current = current;
    _subject = subject;

    subjectManagement.GetPerson(subject.SubjectKey, function(response) {
        logger.log("Response from GetPerson:");
        logger.log(response);
        if(response.success) {
            _screening.subject.fullName = response.data.FirstName + " " + response.data.LastName;
            showWindow();
        }
    });
}

function showWindow() {
    var windowItems = getWindowItems();

    _screeningWindow = new Ext.Window({
        width: 640, 
        modal: true,
        layout: "fit",
        frame: false,
        cls: "screening-window screening-dialog",
        scrollable: "vertical",
        title: userTexts.STUDY_TITLE,
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
            beforeclose: function() {
                if(_screeningWindow.confirmClose === true) {
                    _screeningWindow.confirmClose = false;
                    return true;
                }
                confirmClose();
                return false;
            }
        }
    });

    webClient.get("/candidates/" + _current.EventID).then(function(data) {
        _screening.subject.screened = true;
        if(!data.Included) {
            _screeningWindow.show();
            updateStatus("Screening fail");
            return;
        }

        webClient.get("/subjects/" + _subject.SubjectKey).then(function(data) {
            _screening.subject.studyGroup = data.StudyGroup;
            _screening.subject.subjectId = data.SubjectId;
            _screening.subject.screened = true;
            _screeningWindow.show();         
            updateStatus("Randomiserad");
        }, function() {
            logger.log("Subject not there...");
            _screeningWindow.show();         
        });
    }, function(response) {
        logger.log(response);
        if(response.code === 404) {
            logger.log("Subject not screened...");
            _screeningWindow.show();         
        }
        else {
            dialogs.alert(
                userTexts.STUDY_ERROR_TITLE, 
                userTexts.UNKNOWN_ERROR
            );
        }
    })    
}

function getYesNoStore() {
    return Ext.create('Ext.data.Store', {
        fields: ['name', 'value'],
        data : [
            {"name": "", "value": ""},
            {"name": "Ja", "value": true},
            {"name": "Nej", "value": false},
        ]
    });
}

function getConsensDetailStore() {
    return Ext.create('Ext.data.Store', {
        fields: ['name', 'value'],
        data : [
            {"name": "", "value": ""},
            {"name": "Kan inte", "value": "CAN_NOT_GIVE_CONSENT"},
            {"name": "Vill inte", "value": "NOT_WILLING"},
            {"name": "Föredrar en av behandlingarna", "value": "PREFER_ONE_TREATMENT"},
            {"name": "Okänt/Oklart", "value": "UNKNOWN"},
        ]
    });
}

function getWindowItems() {

    var yesNoStore = getYesNoStore();
    var consentDetailStore = getConsensDetailStore();

    return [{
            xtype: "panel",
            id: "EventFormPanel",
            cls: "EventFormPanel",
            border: false,
            items: [{
                xtype: "panel",
                layout: 'column',
                border: false,
                items: [{
                    xtype: 'label',
                    html: 'Patient:',
                    columnWidth: 0.3
                },{
                    xtype: 'label',
                    html: _screening.subject.fullName + " (" + _subject.SubjectKey + ")",
                    columnWidth: 0.7
                },{
                    xtype: 'label',
                    html: 'Status i studien:',
                    columnWidth: 0.3
                },{
                    xtype: 'label',
                    html: _screening.subject.status,
                    id: 'StatusLabel',
                    columnWidth: 0.7
                }]
            }, {
                xtype: "panel",
                id: "RandomizationPanel",
                layout: 'column',
                border: false,
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
                border: false,
                items: [
                    {
                        html: `<h2>${userTexts.SCREENING_INFO}</h2>`,
                        border: false,
                        columnWidth: 1
                    },
                    getQuestionRow(
                        {
                            label: userTexts.SCREENING_QUESTION_1, 
                            store: yesNoStore,
                            componentId: "AlreadyTreatedComboBox",
                            disabled: false,
                            hidden: false
                        },
                        function(value) {
                            _screening.participationQuestions.alreadyTreated = value;
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
                            label: userTexts.SCREENING_QUESTION_2, 
                            store: yesNoStore,
                            componentId: "SuitableComboBox",
                            disabled: true,
                            hidden: false
                        },
                        function(value) {
                            _screening.participationQuestions.suitableForRandomization = value;
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
                            label: userTexts.SCREENING_QUESTION_3,
                            store: yesNoStore,
                            componentId: "BothTreatmentsComboBox",
                            disabled: true,
                            hidden: false
                        },
                        function(value) {
                            _screening.participationQuestions.bothTreatmentsAvailable = value;
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
                            label: userTexts.SCREENING_QUESTION_4,
                            store: yesNoStore,
                            helpNote: userTexts.SCREENING_QUESTION_4_HELP_NOTE,
                            componentId: "ConsentComboBox",
                            disabled: true,
                            hidden: false
                        },
                        function(value) {
                            _screening.participationQuestions.consent = value;
                            if(value) {
                                Ext.getCmp("ConsentDetailRow").hide();
                                _screening.participationQuestions.noConsentReason = null;
                            }
                            else {
                                Ext.getCmp("ConsentDetailRow").show();
                            }
                            updateUi();
                    }),
                    getQuestionRow(
                        {
                            label: userTexts.SCREENING_QUESTION_4_DETAILS,
                            store: consentDetailStore,
                            componentId: "ConsentDetailComboBox",
                            rowComponentId: "ConsentDetailRow",
                            disabled: false,
                            hidden: true
                        },
                        function(value) {
                            _screening.participationQuestions.noConsentReason = value;
                            updateUi();
                    })
                ]
            }, 
            {
                xtype: "label",
                id: "ErrorLabel",
                hidden: true,
                style: {
                    color: "red"
                },
                html: userTexts.SCREENING_FAIL_WARNING,
            },
            {
                xtype: "toolbar",
                id: "ButtonToolbar",
                cls: "x-toolbar-footer",
                items: [
                        {
                        xtype: "button",
                        id: "ContinueButton",
                        text: userTexts.BUTTON_CONTINUE,
                        disabled: true,
                        listeners: {
                            click: function() {
                                handleContinueClick();
                            }
                        }
                    },{
                        xtype: "button",
                        text: userTexts.BUTTON_CANCEL,
                        listeners: {
                            click: function() {
                                confirmClose();
                            }
                        }
                    }
                ]
            }
            ]
        }]        
}

function getQuestionRow(questionRowConfig, changeCallback) {

    var labelItems = [];

    if(questionRowConfig.helpNote) {
        var helpButton =  {
                        xtype: "button",
                        isHelpNote: true,
                        width: 16,
                        height: 16,
                        border: false,
                        frame: false,
                        helpNote: questionRowConfig.helpNote,
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
                        html: questionRowConfig.label,
                        border: false,
                        cls: "EventFormFieldPrefix"
                    });

    var row = {
        xtype: "panel",
        layout:'column',
        hidden: questionRowConfig.hidden,
        columnWidth: 1,
        border: false,
        items: [
            {
                xtype: "panel",
                columnWidth: 0.7,
                border: false,
                items: labelItems
            },
            {
                xtype: "combobox",
                store: questionRowConfig.store,
                id: questionRowConfig.componentId,
                queryMode: 'local',
                displayField: 'name',
                valueField: 'value',
                editable: false,
                disabled: questionRowConfig.disabled,
                columnWidth: 0.3,
                listeners: {
                    select: function(combo, records) {
                        changeCallback(records.data.value === "" ? null : records.data.value);
                    }
                }
            }                                
        ]
    }

    if(questionRowConfig.rowComponentId) {
        row.id = questionRowConfig.rowComponentId
    }

    return row;
}

function confirmClose() {
    if(_screening.subject.screened) {
        _screeningWindow.confirmClose = true;
        _screeningWindow.close();
        return;
    }

    Ext.MessageBox.show ({
        title: userTexts.STUDY_TITLE,
        msg: userTexts.SCREENING_ABORT_QUESTION,
        buttons: Ext.MessageBox.YESNO,
        cls: "screening-dialog",
        icon: Ext.MessageBox.QUESTION,
        fn: function(b) {
            switch (b) {
                case 'yes':
                _screeningWindow.confirmClose = true;
                _screeningWindow.close();
            }
        }
    });        
}

function formIsValid() {
    if(_screening.participationQuestions.alreadyTreated === true) return false;
    if(_screening.participationQuestions.suitableForRandomization === false) return false;
    if(_screening.participationQuestions.bothTreatmentsAvailable === false) return false;
    if(_screening.participationQuestions.consent === false) return false;

    return true;
}

function updateUi() {
    var errorLabel = Ext.get("ErrorLabel");
    if(formIsValid()) {
        errorLabel.hide();
    }
    else {
        errorLabel.show();
    }

    var continueButton = Ext.getCmp("ContinueButton");
    if(_screening.participationQuestions.alreadyTreated !== null) {
        continueButton.enable();
    }
    else {
        continueButton.disable();
    }

    if(_screening.subject.studyGroup && _screening.subject.subjectId) {
        var treatmentLabel = Ext.getCmp("TreatmentLabel");
        treatmentLabel.setHtml("<strong>" + _screening.subject.studyGroup + "</strong>");

        var subjectIdLabel = Ext.getCmp("SubjectIdLabel");
        subjectIdLabel.setHtml(_screening.subject.subjectId);

        var randomizationPanel = Ext.getCmp("RandomizationPanel");
        randomizationPanel.show();
    }

    if(_screening.subject.screened) {
        var questionForm = Ext.getCmp("QuestionForm");
        questionForm.hide();

        var toolbar = Ext.getCmp("ButtonToolbar");
        toolbar.hide();

        errorLabel.hide();
    }

    _screeningWindow.updateLayout();
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
    logger.log("Participation questions:");
    logger.log(_screening.participationQuestions);

    if( _screening.participationQuestions.alreadyTreated === false &&
        _screening.participationQuestions.suitableForRandomization === true &&
        _screening.participationQuestions.bothTreatmentsAvailable === true &&
        _screening.participationQuestions.consent === true
        ) {
            showScreeningDialog();
    }
    else {
        showScreeningFailDialog();
    }
}

function showScreeningDialog() {
    Ext.MessageBox.show ({
        title: userTexts.STUDY_TITLE,
        msg: userTexts.SCREENING_RANDOMIZATION_QUESTION,
        buttons: Ext.MessageBox.YESNO,
        cls: "screening-dialog",
        icon: Ext.MessageBox.QUESTION,
        fn: function(b) {
            switch (b) {
                case 'yes':
                    Ext.Ajax.request({
                        url: server.getBaseUrl() + "/subjects",
                        method: "POST",
                        jsonData: {
                            subjectKey: _subject.SubjectKey,
                            eventId: _current.EventID
                        },
                        success: function(response) {
                            logger.log("Candidate was successfully randomized in study. Response:");
                            var json = Ext.util.JSON.decode(response.responseText);
                            logger.log(json);
                            _screening.subject.studyGroup = json.data.StudyGroup;
                            _screening.subject.subjectId = json.data.SubjectId;
                            _screening.subject.screened = true;
                            updateStatus("Randomiserad");
                            api.writeInitialStudyData(_current, _subject)
                                .then(function() {
                                    dialogs.alert(
                                        userTexts.STUDY_TITLE, 
                                        'Patienten är nu inkluderad i DUALITY och randomiserad till: ' + json.data.StudyGroup
                                    );
                                }, function() {
                                    dialogs.alert(
                                        userTexts.STUDY_ERROR_TITLE, 
                                        userTexts.RANDOMIZATION_INITIAL_STUDY_VARIABLES_FAILURE
                                    );
                                });
                        },
                        failure: function(response) {
                            logger.log("Failure. Response:");
                            logger.log(response);
                            dialogs.alert(
                                userTexts.STUDY_ERROR_TITLE, 
                                userTexts.RANDOMIZATION_FAILURE
                            );
                            var json = Ext.util.JSON.decode(response.responseText);
                            logger.log(json);
                        }
                    });
                    break;
                default:
                    logger.log("No randomization will be done");
                break;
            }
        }
    });        
}

function showScreeningFailDialog() {
    Ext.MessageBox.show ({
        title: userTexts.STUDY_TITLE,
        msg: userTexts.SCREENING_FAIL_QUESTION,
        cls: "screening-dialog",
        buttons: Ext.MessageBox.YESNO,
        icon: Ext.MessageBox.QUESTION,
        fn: function(b) {

            switch (b) {
                case 'yes':
                    var reasonNotIncluded = getReasonNotIncluded();
                    var reasonNotIncludedDetail = getReasonNotIncludedDetail();
                    Ext.Ajax.request({
                        url: server.getBaseUrl() + "/candidates/fail",
                        method: "POST",
                        jsonData: {
                            subjectKey: _subject.SubjectKey,
                            eventId: _current.EventID,
                            reasonNotIncluded: reasonNotIncluded,
                            reasonNotIncludedDetail: reasonNotIncludedDetail
                        },
                        success: function() {
                            _screening.subject.screened = true;
                            updateStatus("Screening fail");
                        },
                        failure: function() {
                            dialogs.alert(
                                userTexts.STUDY_ERROR_TITLE, 
                                userTexts.SCREENING_FAILURE
                            );
                        }
                    });
                    break;
                case 'no':
                        logger.log("No screening failure... Yet.");
                    break;
            }
        }
    });
}

function getReasonNotIncluded() {
    if(_screening.participationQuestions.alreadyTreated === true) {
        return "ALREADY_TREATED";
    }
    if(_screening.participationQuestions.suitableForRandomization === false) {
        return "NOT_SUITABLE";
    }
    if(_screening.participationQuestions.bothTreatmentsAvailable === false) {
        return "LACK_OF_CLINICAL_RESOURCES";
    }
    if(_screening.participationQuestions.consent === false) {
        return "NO_INFORMED_CONSENT";
    }

    return "";
}

function getReasonNotIncludedDetail() {
    if(_screening.participationQuestions.consent === false) {
        return _screening.participationQuestions.noConsentReason;
    }

    return "";
}
