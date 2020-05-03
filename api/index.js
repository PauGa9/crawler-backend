const express = require("express");

const app = express();
const port = process.env.PORT;

const createPublisher = require('./publisher.js')

createPublisher.then(function(publish) {
    app.get('/crawl', function (request, response) {
        const url = request.query.url;
        
        if (!url) {
            return response.status(400).send();
        }
        
        const message = JSON.stringify({"main": true, "url": url});
        const published = publish(message)
        if (!published) {
            return response.status(500).send('error')
        }
        response.status(204).send();
    })

    app.listen(port, () => console.log(`API escuchando peticiones en el puerto ${port}!`))
})