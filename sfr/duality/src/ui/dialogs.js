import { log } from "../services/logger";
import * as userTexts from "../models/user-texts";
import * as screeningDialog from "./screening-dialog";

export function openScreeningQuestionDialog(current, subject, subjectManagement) {
    Ext.MessageBox.show ({
        title: userTexts.CONTINUE_WITH_SCREENING_QUESTION_TITLE,
        msg: userTexts.CONTINUE_WITH_SCREENING_QUESTION,
        buttons: Ext.MessageBox.YESNO,
        cls: "screening-dialog",
        icon: Ext.MessageBox.QUESTION,
        fn: function(b) {
            switch (b) {
                case 'yes':
                    log("Will open screening dialog.");
                    screeningDialog.init(current, subject, subjectManagement);
                break;
                case 'no':
                    log("No participation in study.");
                break;
            }
        }
    });
}
