"use strict";

const Promise = require("bluebird");
module.exports = Promise.promisify(require("request")).defaults({
    method: "GET",
    baseUrl: "https://staging.ignitenet.com/pub/v1/",
    json: true,
    headers: {
        "x-api-key": "insert-your-api-key"
    }
});
