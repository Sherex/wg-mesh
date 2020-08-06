# WG-Mesh
WG-Mesh is a distributed administration service for setting up peers and clients in a Wireguard network.

## Development
Run the development compiler `ts-node-dev`
```sh
# Start the dev server and set log-level to silly
# Note: sudo is required as iproute2 and Wireguard commands are root only
sudo npm run dev src/ -- --log-level silly
```

## Building
Build using `tsc`
```sh
npm run build
```

## TODO
- [ ] Deployment by ssh
- [ ] Deployment by wget/curl

## Resources
- [linux-release-info](https://www.npmjs.com/package/linux-release-info) - Check OS info for future potential limitations.
- [rqlite-js](https://www.npmjs.com/package/rqlite-js) - Client library for interacting with rqlite.
- [node-linux](https://github.com/coreybutler/node-linux) - Library for installing script as a service.
- [node-windows](https://github.com/coreybutler/node-windows) - Library for installing script as a service.
- [node-mac](https://github.com/coreybutler/node-mac) - Library for installing script as a service.
- [obfsproxy](https://gitweb.torproject.org/pluggable-transports/obfsproxy.git) - SOCKS 5 proxy for obfuscating traffic

# LICENSE
[MIT](LICENSE)