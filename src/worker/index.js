const axios = require("axios");
const createConsumer = require('../rabbitmq/consumer');
const createMongoRepository = require('../mongodb');

Promise.all([createConsumer, createMongoRepository]).then(function(promises) {
    const consumer = promises[0];
    const mongoRepository = promises[1];

    consumer(consumerFn);
});

    // mongo.save(title, links)
    // links.forEach(rabbit.publish(mainPage, url:link))

function dataFromMessage({content}) {
    return JSON.parse(content);
}

function getPage(url) {
    return axios.get(url)
        .then(function(response) {
            return response.data;
        })
}

const flatRegexpGroups = (regexp) => (string) => {
    const groupsArray = [];
    const iterator = string.matchAll(regexp);
    while (true) {
        const next = iterator.next();
        if (next.done) {
            break;
        }
        groupsArray.push(next.value[1]);
    }
    return groupsArray;
}

const isUrlAbsolute = (url) => (url.indexOf('://') > 0 || url.indexOf('//') === 0);

const absoluteUrl = (domain) => (link) => {
    if (!isUrlAbsolute(link)) return domain + link;

    return link;
}

const linksRegex = flatRegexpGroups(/<a.+?href=["']([^>]+)["']/g);
const titleRegex = flatRegexpGroups(/<title>(.+)<\/title>/g);

function consumerFn(message) {
    const data = dataFromMessage(message);
    const forceAbsoluteUrl = absoluteUrl(data.url)

    getPage(data.url)
    .then(function(html) {
        const links = linksRegex(html).map(forceAbsoluteUrl);
        const title = titleRegex(html)[0];
        const document = {links, title}
        console.log(document)
    })
}