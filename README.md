##Web Crawler

##Run

```bash
node .bin/crawle.js \
    --start-point="http://dom.ria.ua/ru/search?period=per_day&limit=100&category=0&with_photo=1&page=0" \
    --rule-config=rules.js \
    --rule-group=dom.ria.ua \
    --rule-index=index
```