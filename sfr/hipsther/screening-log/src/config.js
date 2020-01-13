export function getBaseUrl() {
    var env = "-" + Repository.DeploymentMode.toLowerCase();
    if(Repository.DeploymentMode === "PROD") {
        env = "";
    }
    return "/stratum/api/rrct/clinicaltrial-hipsther" + env + "-nationellariktlinjer.1.0.0";
}
