
export function getResource(resource) {
    return createRequest(resource);
}

export function putResource(resource) {
    return createRequest(resource, 'PUT');
}

function createRequest(resource, method) {
    var deferred = new Ext.Deferred();
    method = method || 'GET';
    Ext.Ajax.request({
        url: resource,
        method: method,
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
