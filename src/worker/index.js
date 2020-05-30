const axios = require("axios");
const createConsumer = require('../rabbitmq/consumer');
const createPublisher = require('../rabbitmq/publisher');
const createMongoRepository = require('../mongodb');

function dataFromMessage({content}) {
    return JSON.parse(content);
}

function getPage(url) {
    return axios.get(url, {responseType: 'arraybuffer', reponseEncoding: 'binary'})
        .then(function(response) {
            return response.data.toString('utf8');
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

const linksRegex = flatRegexpGroups(/<a.+?href=["']([^>"']+)["']/g);
const titleRegex = flatRegexpGroups(/<title.*?>(.+)<\/title>/g);

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
        mongoRepository.savePage({links, title, mainPage: data.mainPage, url:data.url, level: data.level});
        onceAck();
        if (data.level < 1) {
            const nextLevel = data.level + 1;
            links.forEach(function (link) {
                publish(JSON.stringify({"mainPage": data.mainPage, "url": link, "level": nextLevel}));
            });
        }
    })
    .catch(function(error) {
        onceAck();
        console.error('error while consuming a message from RabbitMQ', error.message);
    })
}

Promise.all([
    createConsumer,
    createPublisher,
    createMongoRepository
]).then(function(promises) {
    const subscribeConsumer = promises[0];
    const publish = promises[1];
    const mongoRepository = promises[2];

    subscribeConsumer(consumerFn(mongoRepository, publish));
});
