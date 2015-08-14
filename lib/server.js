var express = require('express'),
    http    = require('http'),
    request = require('request'),
    cheerio = require('cheerio')

var app = express()
var router = express.Router()

module.exports = function(options) {
    console.log('Starting SiT Washing API')

    router.get('/available', function(req, res) {
        console.log('Request for /available')
        if (options.username === '' || options.password === '') {
            return res.json({error: 'Missing username and/or password'})
        }

        request
            .get('http://129.241.161.227:80/LaundryState', {
                'auth': {
                    'user': options.username,
                    'pass': options.password,
                    'sendImmediately': true
                }
            }, function(err, response, body) {
                if (!err && response.statusCode == 200) {
                    console.log('Parsing result')
                    var $ = cheerio.load(body)
                    var parsedResult = {
                        'availableWashers': 0,
                        'availableDryer': 0,
                        'availableLargeWasher': 0
                    }
                    $('td.p').each(function(i, elem) {
                        if ($(this).prev().attr('bgcolor') == 'Green') {
                            if ($(this).text().substring(0, 6) == 'Maskin') {
                                parsedResult['availableWashers']++
                            } else if ($(this).text().substring(0, 6) == 'Stor v') {
                                parsedResult['availableLargeWasher']++
                            } else if ($(this).text().substring(0, 6) == 'Stor t') {
                                parsedResult['availableDryer']++
                            }
                        }
                    }) // Remove dryer and large wash
                    res.header("Content-Type", "application/json; charset=utf-8");
                    res.json(parsedResult)
                } else {
                    res.json({error: 'Something went wrong while parsing'})
                }
            })

    })
    
    app.use('/sit/api/v1', router)

    return app
}
