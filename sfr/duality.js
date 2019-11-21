var RC = RC || {};
RC.RRCT = RC.RRCT || {};

RC.RRCT.Duality = (function(repository) {

    var env = "-" + repository.DeploymentMode.toLowerCase();
    if(repository.DeploymentMode === "PROD") { env = ""; }
    var BASE_URL = "/stratum/api/rrct/clinicaltrial-duality" + env + "-nationellariktlinjer.1.0.0";

    function init() {
        console.log("Initializing Duality widget.");
    }

    function getResource(resource) {
        return new Ext.Promise(function (resolve, reject) {
            Ext.Ajax.request({
                url: BASE_URL + resource,
                success: function (response) {
                    if(response.status > 399 || !response.responseText) {
                        reject();
                    }
                    var responseJson = Ext.util.JSON.decode(response.responseText);
                    if(responseJson.success === false || responseJson.code !== 0) {
                        reject();
                    }
                    resolve(responseJson.data);
                },
                failure: function (response) {
                    if(response.responseText) {
                        var responseJson = Ext.util.JSON.decode(response.responseText);
                        reject(responseJson);
                    }
                    else {
                        reject("An unknown error occurred while getting resource: " + resource);
                    }
                }
            });
        });
    }


    return {
        init: init
    };

})(Repository);
// SiteId: 206
// WidgetId: SFR/Duality
// WidgetName: Duality
//! Applikation för Duality-studien
