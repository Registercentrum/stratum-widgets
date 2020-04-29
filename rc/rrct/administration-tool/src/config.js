if(typeof window.RRCTAdminConfig !== "object") {
    throw "No configuration was found for RRCT Administration (RRCTAdminConfig object was null or undefined)!";
}

var config = window.RRCTAdminConfig;

if(!config.baseUrl) {
    throw "RRCT base url was not set!";
}

if(!config.domContainer) {
    throw "No DOM container was specified!";
}

if(!config.studyName) {
    throw "RRCT study name was not set!";
}

export default config;
