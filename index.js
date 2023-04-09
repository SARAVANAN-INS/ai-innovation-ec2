const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const cheerio = require('cheerio');
const app = express();

// body parser configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = 80;

app.get('/', (req, res) => {
    res.send('AI Innovation ec2 instance runung on port 8081');
});

app.post('/web-crawl', async (req, res) => {
    try {
        let url;

        if (req.body?.url) {
            url = req.body.url;
        }

        console.log('url: ', url, req.body?.url);

        if (url?.includes('http://') === false && url?.includes('https://') === false) {
            url = 'http://' + url;
        }

        if (!url) {
            return res.status(422).send({ message: "url is required" });
        }

        console.log('url: ', url, req.body?.url);

        const browser = await puppeteer.launch({
            args: ['--no-sandbox'],
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

            const htmlContent = await page.content();
            const $ = cheerio.load(htmlContent);
            // console.log('htmlContent', $('body').contents());
            let text = '';
            $('body').contents()
                .not('script, style, noscript, iframe')
                .each((i, el) => {
                    let html = $(el).html();
                    text = html?.replace(/<[^>]*>/g, ' ').trim().replace(/\s+/g, ' ');
                });


            console.log("text");
            console.log(text);
            text = text?.replace(/\s+/g, " ").trim();

            const _promisesResponses = await Promise.all(_promises);
            await browser.close();
            const _response = {
                urls: _promisesResponses[0],
                imgs: _promisesResponses[1],
                title: _promisesResponses[2],
                content: _promisesResponses[3],
                text: text,
            };
            return res.status(200).send(_response);
        }
    } catch (error) {
        console.log('web crawl on ec instance failed:', error);
        return res.status(500).send({ message: "Internal server error" });
    }
    return res.status(200).send({ message: "Internal server error" });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})