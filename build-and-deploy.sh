#!/bin/sh

rm -rf out && npx next build && npx next export && cp -R ./out/* /var/www/html/studioabsent.com/html/
