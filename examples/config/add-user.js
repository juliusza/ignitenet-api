"use strict";

const request = require("../request-config");
const crc32 = require("../../lib/crc32");

request("site/12/config-changes").then(res => {
    let body = {
        // Editing existing config
        // Start with blank changes
        changes: {},

        // return the same timestamp as we received
        // this is required for resolving conflicts
        // when config is changed by someone else
        timestamp: res.body.timestamp,
    };

    let userName = "api_user";

    // User are indexed by hashing their names
    let userId = crc32(userName);

    // Add root node
    body.changes[`users/${userId}/`] = {
        // all values are strings, otherwise validation will fail
        value: userId.toString(),
        origin: "site",
    };

    // Copy over default values
    for (let key in res.body.defaults.user) {
        body.changes[`users/${userId}/${key}`] = {
            // Set default value
            value: res.body.defaults.user[key],

            // since we're editing site config
            // origin is always site
            origin: "site",
        }
    }

    // Now change only settings that we care about.
    body.changes[`users/${userId}/name`].value = userName;

    // Generate your password here, refer to crypto lib for obtaining random numbers
    body.changes[`users/${userId}/passwd`].value = Date.now().toString();

    return request({
        uri: "site/12/config-changes",
        method: "POST",
        json: true,
        body: body,
    });
}).then(res => {
    if (res.body.configSuspended) {
        console.error("Config is suspended, please resolve the issue by resetting device");

    } else if (res.body.serverSideChanged) {
        console.error("Config was changed by someone else, please retry");

    } else if (res.statusCode === 200) {
        console.log("Config was saved!");

    } else if (res.statusCode === 400) {
        console.error("Validation error");
        console.error(res.body);

    } else {
        console.error(res.body);
    }
});
