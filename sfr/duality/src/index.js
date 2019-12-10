import * as api from "./services/api";
import * as logger from "./services/logger";
import * as ui from "./ui/dialogs";
import * as screeningDialog from "./ui/screening-dialog";
import * as userTexts from "./models/user-texts";

export function evaluateForScreening(current, subject, subjectManagement) {

    logger.log("Will evaluate subject for screening...");
    api.getUnit().then(unit => {
        if(unit.isActive) {
            logger.log("Unit was active. Getting subject...");
            api.getSubject(subject).then(subjectResponse => {
                if(!subjectResponse.activeInStudy) {
                    logger.log("Subject is not active in study. Checking if screened...");
                    api.getCandidate(current).then(candidate => {
                        if(!candidate.isScreened) {
                            logger.log("Subject has not been screened. Showing dialog to offer screening...");
                            ui.openScreeningQuestionDialog(current, subject, subjectManagement);
                        }
                        else {
                            logger.log("Subject is already screened. Quitting...");
                        }
                    });
                }
                else {
                    logger.log("Subject is active in study. Checking if this is the same injury...");
                    if(subjectResponse.eventId == current.EventID) {
                        logger.log("Same injury found. Will re-save initial study data...");
                        api.writeInitialStudyData(current, subject).then(() => { }, () => {
                            Ext.Msg.alert(
                                userTexts.STUDY_ERROR_TITLE, 
                                userTexts.UPDATE_STUDY_DATA_FAILURE, 
                                Ext.emptyFn
                            );
                        });
                    }
                    else {
                        logger.log("Different injury found. Quitting...");
                    }
                }
            });
        }
        else {
            logger.log("Unit not active. Quitting...");
        }
    })
    .catch(error => {
        logger.log("Catched error:");
        logger.log(error);
    });
}

export function validateIfMattersHaveChanged(current, subject) {
    logger.log("Checking if subject is active in study...");
    api.getSubject(subject).then(subjectResponse => {
        if(subjectResponse.activeInStudy) {
            logger.log("Subject is active in study. Checking if this is the same injury...");
            if(subjectResponse.eventId == current.EventID) {
                logger.log("Same injury found. Will re-save initial study data and let user know that matters have changed...");
                api.writeInitialStudyData(current, subject).then(() => { 
                    Ext.Msg.alert(
                        userTexts.STUDY_TITLE, 
                        userTexts.UPDATE_STUDY_DATE_INCONSISTENCY, 
                        Ext.emptyFn
                    );
                }, () => {
                    Ext.Msg.alert(
                        userTexts.STUDY_ERROR_TITLE, 
                        userTexts.UPDATE_STUDY_DATA_FAILURE, 
                        Ext.emptyFn
                    );
                });
            }
            else {
                logger.log("Different injury found. Quitting...");
            }
        }
        else {
            logger.log("Subject not in study. Quitting.");
        }
    });
}

export function openScreeningDialog(current, subject, subjectManagement) {
    api.getUnit().then(unit => {
        if(unit.isActive) {
            screeningDialog.init(current, subject, subjectManagement);
        }
        else {
            Ext.Msg.alert(
                userTexts.STUDY_TITLE, 
                userTexts.UNIT_NOT_ACTIVE,
                Ext.emptyFn
            );
        }
    });
}

export function evaluateIfTreatmentStudyDataShouldBeWritten(current, subject) {
    logger.log("Evaluating if treatment study data should be written. Checking if unit is active...");
    api.getUnit().then(unit => {
        if(unit.isActive) {
            logger.log("Unit is active. Checking if subject is active in study...");
            api.getSubject(subject).then(subjectResponse => {
                if(subjectResponse.activeInStudy && 
                   !subjectResponse.withdrawn && 
                   subjectResponse.eventId == current.Parent.EventID) {
                    logger.log("Found study participant. Will save study data for treatment...");
                    api.writeTreatmentStudyData(current, subject).then(() => {
                        logger.log("Treatment study data written to database.");
                    }, () => {
                        logger.log("Could not write study data to database.");
                    });
                }
                else {
                    logger.log("Found subject but some criteria were not fulfilled in order to write study data for treatment. Subject response:");
                    logger.log(subjectResponse);
                    logger.log("Current");
                    logger.log(current);
                }
            });
        }
        else {
            logger.log("Unit not active. Quitting...");
        }
    });
}
