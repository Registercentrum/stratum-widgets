
export function log(message) {
    if(window.localStorage.getItem("LOG_DUALITY")) {
        if(typeof message === "object") {
            console.log(message);
        }
        else {
            console.log("DUALITY: " + message);
        }
    }
}
