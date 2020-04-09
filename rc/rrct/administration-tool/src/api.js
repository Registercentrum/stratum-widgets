import { getResource, putResource } from "./web-client";
import config from "./config";

const RRCT_BASE_URL = config.baseUrl;

export function getStudyDetails() {
    return getResource(RRCT_BASE_URL + "details");
}

export function activateUnit(unitId) {
    return putResource(RRCT_BASE_URL + `sites/${unitId}/enabled/true`);
}

export function deactivateUnit(unitId) {
    return putResource(RRCT_BASE_URL + `sites/${unitId}/enabled/false`);
}
