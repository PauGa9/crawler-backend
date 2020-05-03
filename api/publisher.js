const queue = 'pending-pages';
    
var openRabbitConnection = require('amqplib').connect(
    {
        protocol: 'amqp',
        hostname: process.env.RABBIT_HOST,
        port: process.env.RABBIT_PORT,
        username: process.env.RABBIT_USER,
        password: process.env.RABBIT_PASSWORD,
    }
)

module.exports =openRabbitConnection
.then(function(connection) {
    return connection.createChannel();
}).then(function(channel) {
    return channel.assertQueue(queue).then(function(ok) {
        function publishFunction(message) {
            return channel.sendToQueue(queue, Buffer.from(message));
        }
        return publishFunction;
    });
}).catch(console.warn);