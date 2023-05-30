const STATUS_SUCCESS = 'success';
const STATUS_ERROR = 'error';
const STATUS_NOTFOUND = 'not_found';
const STATUS_UNAUTHORIZED = 'unauthorized';
const STATUS_UNAVAILABLE = 'unavailable';

function ok(res, data, status) {
    if (typeof status === "undefined") status = STATUS_SUCCESS;

    let message = null;
    let error = false;
    let status_code = 200;

    // Status
    if (status === STATUS_ERROR) { error = true; status_code = 500; }
    else if (status === STATUS_NOTFOUND) { error = true; status_code = 404; }
    else if (status === STATUS_UNAUTHORIZED) { error = true; status_code = 401; }
    else if (status === STATUS_UNAVAILABLE) { error = true; status_code = 503; }

    // Handling message, if data is string
    if (typeof data === 'string') message = data;

    let ret = {status: status, data: data, error: error, message: message};

    res.writeHead(status_code, {'content-type': 'application/json'});
    res.end(JSON.stringify(ret));
}

module.exports = {
    ok: ok,
    error: function(res, errorMessage) {
        return ok(res, errorMessage, STATUS_ERROR);
    }
};