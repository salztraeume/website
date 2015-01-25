# Docpad starten
run: node_modules
	docpad watch --env static

# Nur Website generieren, ohne Starten von Docpad (localhost:9778 geht dann nicht mehr!)
build:
	docpad generate

# npm module installieren (docpad, less plugin, livereload, ...)
node_modules: package.json
	npm install

.PHONY: build
