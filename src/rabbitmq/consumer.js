const amqp = require("amqplib");
const queue = 'pending-pages';
const rabbitConfig = {
    protocol: 'amqp',
    hostname: process.env.RABBIT_HOST,
    port: process.env.RABBIT_PORT,
    username: process.env.RABBIT_USER,
    password: process.env.RABBIT_PASSWORD,
}
    
function openRabbitConnection() {
    // wait for few seconds so rabbit instance will be ready
    return new Promise((resolve, reject) => {
        setTimeout(function() {
            amqp.connect(rabbitConfig)
            .then(resolve)
            .catch(reject)
        }, 10000)
    });
}

const subscribeConsumer = (channel) => (consumerFn) => {
    channel.prefetch(10);
    channel.consume(
        queue,
        (message) => {
            const ack = () => channel.ack(message);
            consumerFn(message, ack);
        }
    )
    .then(console.log(`Subscribed to "${queue}" queue`));
}

module.exports = openRabbitConnection()
.then(function(connection) {
    return connection.createChannel();
})
.then(function(channel) {
    return channel
        .assertQueue(queue)
        .then((ok) => subscribeConsumer(channel));
})
.catch(console.warn);
