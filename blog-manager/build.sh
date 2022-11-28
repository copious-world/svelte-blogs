srcdir=$1
cp ./sites/${srcdir}/index.html ./public/index.html
cp ./sites/${srcdir}/App.svelte ./src/App.svelte
npm run build
cp -r public/* /var/www/html/blog/${srcdir}/
