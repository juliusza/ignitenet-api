"use strict";

const request = require("../request-config");
const crc32 = require("../../lib/crc32");

request("device/281474976712360/config-changes").then(res => {
    let body = {
        // Editing existing config
        // Start with blank changes
        changes: {},

        // return the same timestamp as we received
        // this is required for resolving conflicts
        // when config is changed by someone else
        timestamp: res.body.timestamp,
    };

    let userName = "root";

    // User are indexed by hashing their names
    let userId = crc32(userName);

    for (let key in res.body.device) {
        if (key.indexOf(`users/${userId}/`) === 0) {
            body.changes[key] = {
                // Set default value
                value: res.body.device[key].value,

                // Device will override this user
                origin: "site-device",
            }
        }
    }

    // This particular device will have a different password than configured in site
    body.changes[`users/${userId}/passwd`].value = "device_passwd";

    // Check what changes we have
    console.log(body);

    return request({
        uri: "device/281474976712360/config-changes",
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
