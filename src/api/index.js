const express = require("express");

const app = express();
const port = process.env.PORT;

const createPublisher = require('../rabbitmq/publisher');
const createMongoRepository = require('../mongodb');

Promise.all([createPublisher, createMongoRepository]).then(function(promises) {
    const publish = promises[0];
    const mongoRepository = promises[1];

    app.get('/crawl', function (request, response) {
        const url = request.query.url;
        
        if (!url) {
            return response.status(400).send();
        }
        
        const message = JSON.stringify({"mainPage": url, "url": url, "level": 0});
        const published = publish(message)
        if (!published) {
            return response.status(500).send('error')
        }
        response.status(204).send();
    })

    app.get('/review', function (request, response) {
        const url = request.query.url;
        
        if (!url) {
            return response.status(400).send();
        }
        
        // get data from MongoDB
        mongoRepository.findPagesByMainPage(url)
        .then(function(docs) {
            response.send({results: docs});
        })
        .catch(function(error) {
            response.status(500).send(`error retrieving pages from mongo repository: ${error}`);
        });
    });

    app.listen(port, () => console.log(`API escuchando peticiones en el puerto ${port}!`))
})
.catch(function (error) {
    console.error('Error connecting to Rabbit/MongoDB repository', error);
});