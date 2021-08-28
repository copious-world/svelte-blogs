pushd blog
npm run build
cp -r public/* /usr/local/var/www/html/blog/
popd
pushd streams
npm run build
# pay attention ::: streams -> stream ; not plural
cp -r public/* /usr/local/var/www/html/stream/
popd
pushd demos
npm run build
cp -r public/* /usr/local/var/www/html/demos/
popd
