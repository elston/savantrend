
function setCookie(key, value) {
    var expires = new Date();
    expires.setTime(expires.getTime() + (1 * 2 * 60 * 60 * 1000));
    document.cookie = key + '=' + JSON.stringify(value) + ';expires=' + expires.toUTCString();
}

function deleteCookie(name) {
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}
function getCookie(key) {
    var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
    return keyValue ? keyValue[2] : null;
}

