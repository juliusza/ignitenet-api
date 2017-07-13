# ignitenet-api
Provides access to IgniteNet public api.

See REST definitions here: https://staging.ignitenet.com/swagger-ui/?v1

# Disclaimer
This is development preview of IgniteNet api access.
Please consider this an alpha version.
Samples are provided in ECMAScript.
We provide absolutely no guarantees that these specs will be supported.
It's easy to destroy your site/device configuration by providing incorrect config, please use this at your own risk.

# Installation
1. Fetch this repository from github. You may download ZIP file if not sure how.
2. Install node.js. https://nodejs.org/en/download/
3. 
```
npm install
```


# How to run examples

1. Insert your API key into request-config.js
2. 
```
nodejs examples/sites/sites-get.js
```

# Configuration

## Introduction

Please start by reading this article: 

https://ignitenet.uservoice.com/knowledgebase/articles/622257-what-do-the-configuration-policies-enterprise-an 

In the IgniteNet Cloud front end, we use the idea of “configuration policies” to 
determine which keys take priority when merging a site’s configuration settings 
with the device’s configuration settings.

For example, “enterprise” type devices will inherit all SSID entities from the 
site-level settings by default and  “individually configured” type devices will 
not inherit any SSID entities from the site-level settings by default (but can 
still inherit other settings such as local logins).

These policies are nothing more than a predefined set of rules that we call 
config value ORIGIN. When the config is initialized, the policy rule set is 
applied initially. However, nothing prevents to change the ORIGIN to a completely 
custom rules to suit your needs, different from existing these configuration policies.

Both the site’s configuration settings and the device’s configuration settings 
are stored as JSON objects on our database, and after they’re merged together, 
the final result is translated to the local configuration format used on the 
device (UCI), and pushed down in a configuration task.

The configuration update process is split across different events:
1. Config change is POSTed via API
2. Config task is created within several minutes
3. Config task is sent to device
4. Config task is executed by device

## Configuration Structure

The configuration object is a very simple JSON object with a key/value pair for 
each configuration key/value in the device or site level configuration:

```json
{
  "locale/deviceLang":{"value":"auto","origin":"site-device"},
  "radio/r5/enable":{"value":"1","origin":"device"},
  "network/lan/enable":{"value":"1","origin":"site"}
}
```

Additionally, each device value has origin option that indicates whether it takes 
precedence over site setting.

The key is made up of one or more root nodes, zero or more additional nodes, 
and zero or one properties:

radio/: is the root node  
r5/ : is a node  
enable : is the property name  

You’ll also notice that some node have numeric ids, where others don’t:

```json
{"wireless/1000000584/broadcastSSID":{}}
```
vs  
```json
{"radio/global/bandSteering":{}}
```

The first key, the one with the id after the root node, is a numeric nodes, and what we refer to as entities.

Entities include such keys as SSIDs/VAPs, local logins, LANs, and other type of config settings 
where the user is allowed to created an indeterminate number of items. All entities are assigned a numeric id.
   
IDs < 1000000000 are reserved for device level entities, and IDs > 1000000000 are used for site level entities. 
These translate into UCI property "__uid" in the configuration that ends up on the device..

Some UIDs are generated with crc32 algorithm. See users/ for example. This boils down to preventing duplicate 
user names and overriding them by name.

You **should not** override the subnodes of an entity - only override the whole thing.  For example, once you 
change the network name of an inherited SSID/VAP from the device-level configuration, you’ll want to create an override 
for that whole SSID. You could change the WPA passkey at the site level for the same SSID object, and it would not 
apply to the the device level SSID due to the override.

## Configuration Merging
We provide two levels of configuration: site and device. When config change occurs, 
site and device configurations are combined and translated into a format that device
can understand. To determine which setting will take precedence, please refer to this 
table:

|Site Key     |Device Key  |ORIGIN       |RESULT       |
|-------------|------------|-------------|-------------|
|undefined    |defined     |device       |device_value |
|defined      |defined     |site-device  |device_value |
|defined      |defined     |site         |site_value   |
|defined      |undefined   |site         |site_value   |

Origin is defined as:

* device: setting is defined in device config only
* site-device: device overrides values from site config
* site: setting is originating from site configuration

The important thing to note here is that when changing a device’s configuration 
from the API, you will be responsible in setting the proper merge behavior for 
a key. This not not true for sites, however. Site configuration keys will always
have ORIGIN set to "site".

The merger module knows nothing about the device’s configuration policy - it 
only cares about the merge behavior you’ve specified for each key.

That being said, the configuration policy must still be properly set for a 
device for the case where you login to the IgniteNet Cloud front end to 
view/edit a device’s configuration.

## Examples

"OK, but what does this even mean, I just want to change config"

IgniteNet config format follows complex rules that are abstracted 
away by cloud UI. Consider this a low level access to the raw configuration.
Because there are 100’s of possible configuration keys (each with their own set 
of dependencies), the easiest way to figure out the resulting config you want 
will be to make the change you want in the Cloud UI, then fetch the device’s 
config object from the API via the /devices/{deviceId}/config call and figure 
out what changed.

On a similar note, when setting a device or site’s configuration from the API, 
it’s best to fetch the current config object and apply whatever changes to you 
want to it, then pass the object back, instead of trying to rebuild the full 
config from scratch each time.

Please note that we continuously add and remove options from the config structure. 
Because of this we must put this in bold: **Do not update configuration with predefined set of keys**
Always use existing values, or provided defaults to form new entities in config.

You have a couple of different options to proceed from here:
* Fire up your browser and go to config page. See what changes are POSTed via XHR. You can replicate them in your code.
* See examples/ in this repository

If you have any doubt about the allowed values of a config key, you can view a device’s configuration from the IgniteNet 
Cloud UI via the console in the developer tools:

![DevTools](https://raw.githubusercontent.com/juliusza/ignitenet-api/master/docs/cloud-ui-dev-tools.png)