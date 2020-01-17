
// Container: DOM container to render to
// BaseUrl: Base URL to get data from

if(typeof RrctProgressWidgetConfig !== "object") {
    throw "No configuration was found for RRCT Progress Widget!";
}

if(!RrctProgressWidgetConfig.Container) {
    throw "No DOM container was specified!";
}

if(!RrctProgressWidgetConfig.BaseUrl) {
    throw "RRCT base url was not set!";
}

