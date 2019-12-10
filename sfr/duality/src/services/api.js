import * as webClient from "./web-client";
import * as server from "../models/server";

export function getUnit() {
    return new Ext.Promise(function(resolve) {
        webClient.get("").then(function(data) {
            return resolve({
                isActive: data.Enabled
            });
        }, function() {
            return resolve({
                isActive: false
            });
        });
    });
}

export function getCandidate(current) {
    return new Ext.Promise(function(resolve) {
        webClient.get("/candidates/" + current.EventID).then(function() {
            return resolve({
                isScreened: true
            });
        }, function(response) {
            if(response.code === 404) {
                return resolve({
                    isScreened: false
                });
            }
            throw "Candidate response was not in a correct format.";
        });
    });
}

export function getSubject(subject) {
    return new Ext.Promise(function(resolve) {
        webClient.get("/subjects/" + subject.SubjectKey).then(response => {
            return resolve({
                activeInStudy: true,
                eventId: response.Screening.EventId,
                withdrawn: response.Withdrawn
            });
        }, function(response) {
            if(response.code === 404) {
                return resolve({
                    activeInStudy: false
                });
            }
            throw "Subject response was not in a correct format.";
        });
    });
}

export function writeInitialStudyData(current, subject) {
    var BASE_URL = server.getBaseUrl();
    return new Ext.Promise(function (resolve, reject) {
        var injuryDate = Ext.Date.parse(current.Parent.Inj_Dat, "Y-m-dTH:i:s");
        var jsonData = [
            {id: "SE_SCREENING::1::F_SCREENING_1::1::IG_SCREE_SCREENING::1::I_SCREE_INJ_CAUSE", value: current.Parent.Inj_Cause},
            {id: "SE_SCREENING::1::F_SCREENING_1::1::IG_SCREE_SCREENING::1::I_SCREE_INJ_DAT", value: injuryDate}, 
            {id: "SE_SCREENING::1::F_SCREENING_1::1::IG_SCREE_SCREENING::1::I_SCREE_INJ_AGE", value: Repository.Global.Methods.CalculateAge(subject.SubjectKey, injuryDate)},
            {id: "SE_SCREENING::1::F_SCREENING_1::1::IG_SCREE_SCREENING::1::I_SCREE_FX_XRAYDAT", value: current.Fx_XrayDat ? current.Fx_XrayDat.substring(0, 10) : null},
            {id: "SE_SCREENING::1::F_SCREENING_1::1::IG_SCREE_SCREENING::1::I_SCREE_FX_XRAYTIME", value: current.Fx_XrayTime},
            {id: "SE_SCREENING::1::F_SCREENING_1::1::IG_SCREE_SCREENING::1::I_SCREE_FX_SIDE", value: current.Fx_Side},
            {id: "SE_SCREENING::1::F_SCREENING_1::1::IG_SCREE_SCREENING::1::I_SCREE_FX_CLASS", value: current.Fx_Class}
        ];
        Ext.Ajax.request({
            url: BASE_URL + "/subjects/data/" + subject.SubjectKey,
            method: "POST",
            jsonData: jsonData,
            success: function(response) {
                resolve(response);
            },
            failure: function(response) {
                reject(response);
            }
        });			
    });
}

export function writeTreatmentStudyData(current, subject) {
    var BASE_URL = server.getBaseUrl();
    return new Ext.Promise(function (resolve, reject) {
        var jsonData = [
            { id: "SE_TREATMENT::" + current.EventID + "::F_TREATMENT_1::1::IG_TREAT_TREATMENT::1::I_TREAT_TRT_UNIT", value: "{UNIT_ID}" },
            { id: "SE_TREATMENT::" + current.EventID + "::F_TREATMENT_1::1::IG_TREAT_TREATMENT::1::I_TREAT_TRT_DAT", value: current.Trt_Dat ? current.Trt_Dat.substring(0, 10) : "" },
            { id: "SE_TREATMENT::" + current.EventID + "::F_TREATMENT_1::1::IG_TREAT_TREATMENT::1::I_TREAT_TRT_KNIFESTARTTIME", value: current.Trt_KnifeStartTime },
            { id: "SE_TREATMENT::" + current.EventID + "::F_TREATMENT_1::1::IG_TREAT_TREATMENT::1::I_TREAT_TRT_TYPE", value: current.Trt_Type },
            { id: "SE_TREATMENT::" + current.EventID + "::F_TREATMENT_1::1::IG_TREAT_TREATMENT::1::I_TREAT_TRT_CODE", value: current.Trt_Code },
            { id: "SE_TREATMENT::" + current.EventID + "::F_TREATMENT_1::1::IG_TREAT_TREATMENT::1::I_TREAT_TRT_MAINSURGEON", value: current.Trt_MainSurgeon }
        ];
        Ext.Ajax.request({
            url: BASE_URL + "/subjects/data/" + subject.SubjectKey,
            method: "POST",
            jsonData: jsonData,
            success: function(response) {
                resolve(response);
            },
            failure: function(response) {
                reject(response);
            }
        });			
    });
}
