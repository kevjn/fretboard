### Installation & Usage

build the wasm pkg
```
wasm-pack build wasm-audio --target web
```

install and build the bundled library
```
npm install
npm run build
```

serve the dist folder
```
cd dist/
http-server --port 8888 --cors -c-1
```

let a downstream consumer import the library and run the index.js file which exports a default function
```
curl localhost:8888/index.js
```