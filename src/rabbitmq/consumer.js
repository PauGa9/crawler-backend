const queue = 'pending-pages';
const openRabbitConnection = require('./openConnection');

const subscribeConsumer = (channel) => (consumerFn) => {
    channel.prefetch(10);
    channel.consume(
        queue,
        (message) => {
            const ack = () => channel.ack(message);
            consumerFn(message, ack);
        }
    )
    .then(() => console.log(`Subscribed to "${queue}" queue`));
}

module.exports = openRabbitConnection
.then(function(connection) {
    return connection.createChannel();
})
.then(function(channel) {
    return channel
        .assertQueue(queue)
        .then((ok) => subscribeConsumer(channel));
})
.catch(console.warn);
