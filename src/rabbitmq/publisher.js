const queue = 'pending-pages';
const openRabbitConnection = require('./openConnection');

module.exports = openRabbitConnection
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