import axios from 'axios';
import * as React from 'react';
import jsyaml from 'js-yaml';


class pluginsApi {
    static async getAllPlugins() {
        let data = [];
        return await axios.get('https://che-plugin-registry.openshift.io/plugins/index.json').then(async response => {
            for (let i = 0; i < response.data.length; i++) {
                let url = 'https://che-plugin-registry.openshift.io' + response.data[i].links.self;
                await axios.get(url).then(res => {
                    data.push(jsyaml.load(res.data));
                }).catch(error => {
                    return error;
                });
            }
            return data;
        }).catch(error => {
            return error;
        });
    }
}

export default pluginsApi;