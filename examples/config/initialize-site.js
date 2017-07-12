"use strict";

const request = require("../request-config");

request("site/12/config-changes").then(res => {
    let body = {
        // Site is initialized only once.
        // Whether it requires initialization
        // can be determined by looking at
        // body.initial property
        changes: res.body.initial,

        // return the same timestamp as we received
        // this is required for resolving conflicts
        // when config is changed by someone else
        timestamp: res.body.timestamp,
    };

    // Set 2 letter country code for device radio settings
    body.changes["locale/code"].value = "LT";

    // TODO: this looks too complicated and will have to be abstracted

    // Important: site IDs start at 1000000001
    const WIRELESS_ID = "1000000001";

    // Add root node
    body.changes[`wireless/${WIRELESS_ID}/`] = {
        value: WIRELESS_ID,
        origin: "site",
    };

    // Copy over default values
    for (let key in res.body.defaults.ssid) {
        body.changes[`wireless/${WIRELESS_ID}/${key}`] = {
            // Set default value
            value: res.body.defaults.ssid[key],

            // since we're editing site config
            // origin is always site
            origin: "site",
        }
    }

    // Now change only settings that we care about. Set SSID name
    body.changes[`wireless/${WIRELESS_ID}/ssid`].value = "created via api";

    // Set SSID active on both radios
    body.changes[`wireless/${WIRELESS_ID}/preferredRadio`].value = "r5,r24";

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
