const axios = require("axios");
const createConsumer = require('../rabbitmq/consumer');
const createMongoRepository = require('../mongodb');

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

const consumerFn = (mongoRepository, publish) => (message, ack) => {
    const data = dataFromMessage(message);
    const forceAbsoluteUrl = absoluteUrl(data.url)
    const once = (fn) => {
        let called = false;
        return () => !called && (called = true) && fn();
    }
    const onceAck = once(ack)

    getPage(data.url)
    .then(function(html) {
        const links = linksRegex(html).map(forceAbsoluteUrl);
        const title = titleRegex(html)[0];
        mongoRepository.savePage({links, title, mainPage: data.mainPage, level: data.level});
        onceAck();
        if (data.level < 3) {
            const nextLevel = data.level + 1;
            console.log(`publish to RabbitMQ with level +1, from page ${data.url} with level ${data.level} to level ${nextLevel}`)
        }
    })
    .catch(function(error) {
        onceAck();
        console.error('error while consuming a message from RabbitMQ', error);
    })
}

Promise.all([createConsumer, createMongoRepository]).then(function(promises) {
    const subscribeConsumer = promises[0];
    const mongoRepository = promises[1];

    subscribeConsumer(consumerFn(mongoRepository));
});
