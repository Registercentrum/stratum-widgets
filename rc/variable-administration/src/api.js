var BASE_URL = "/stratum/api/";


export function getRegisters() {
    return getResource(BASE_URL + "metadata/registers");
}

export function getForms(registerId) {
    return getResource(BASE_URL + "metadata/forms/register/" + registerId);
}

export function getVariables(formId) {
    return getResource(BASE_URL + "metadata/questions/form/" + formId);
}

function getResource(resource) {
    var deferred = new Ext.Deferred();
    Ext.Ajax.request({
        url: resource,
        success: function (response) {
            if(response.status !== 200){
                deferred.reject();
            }
            var responseJson = Ext.util.JSON.decode(response.responseText);
            if(responseJson.success === false || responseJson.code !== 0) {
                deferred.reject();
            }
            deferred.resolve(responseJson.data);
        },
        failure: function (response) {
            if(response.responseText) {
                var responseJson = Ext.util.JSON.decode(response.responseText);
                deferred.reject(responseJson);
            }
            else {
                deferred.reject("An unknown error occurred while getting resource: " + resource);
            }
        }
    });

    return deferred.promise;
}
