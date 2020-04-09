import { getResource, putResource } from "./web-client";
import config from "./config";

const RRCT_BASE_URL = config.baseUrl;

export function getStudyDetails() {
    return getResource(RRCT_BASE_URL + "details");
}

export function activateUnit(unitId) {
    ensureParameter("unitId", unitId);
    return putResource(RRCT_BASE_URL + `sites/${unitId}/enabled/true`);
}

export function deactivateUnit(unitId) {
    ensureParameter("unitId", unitId);
    return putResource(RRCT_BASE_URL + `sites/${unitId}/enabled/false`);
}

function ensureParameter(paramName, value) {
    if(!value) {
        throw `Parameter ${paramName} was not set! Value was: ${value}`;
    }
}