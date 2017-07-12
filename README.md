# ignitenet-api
Provides access to IgniteNet public api.

See REST definitions here: https://staging.ignitenet.com/swagger-ui/?v1

# Disclaimer
This is development preview of IgniteNet api access.
Please consider this an alpha version.
Samples are provided in ECMAScript.
We provide absolutely no guarantees that these specs will be supported.

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

## Configuration Update

The configuration update process is split across different events:
1. Config change is POSTed via API
2. Config task is created within several minutes
3. Config task is sent to device
4. Config task is executed by device

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
|defined      |undefined   |undefined    |undefined    |

Origin is defined as:

* device: setting is defined in device config only
* site-device: device override values from site config
* site: setting is originating from site configuration

This is it for now. Please see examples/