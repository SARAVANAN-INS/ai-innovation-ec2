const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const app = express();

// body parser configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = 80;

app.get('/', (req, res) => {
    res.send('AI Innovation ec2 instance runung on port 8081');
});

app.post('/web-crawl', async (req, res) => {
    let url;

    if (req.body?.url) {
        url = req.body.url;
    }

    if (!url) {
        return res.status(422).send({ message: "url is required" });
    }

    console.log('url: ', url, req.body?.url);

    const browser = await puppeteer.launch({
        userDataDir: '/tmp',
    }).catch((error) => {
        console.error('Failed to launch browser: ', error);
    });

    if (browser) {
        const page = await browser.newPage();
        await page.goto(url);

        // Extract links, images and data from the page
        const _promises = [
            page.$$eval('a', links => links.map(link => link.href)),
            page.$$eval('img', imgs => imgs.map(img => img.src)),
            page.title(),
            page.evaluate(() => document.body.textContent),
        ];
        const _promisesResponses = await Promise.all(_promises);
        await browser.close();
        const _response = {
            urls: _promisesResponses[0],
            imgs: _promisesResponses[1],
            title: _promisesResponses[2],
            content: _promisesResponses[3],
        };
        return res.status(200).send(_response);
    }
    res.status(200).send({});
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})