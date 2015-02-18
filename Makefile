# Docpad starten
run: node_modules
	npm run gulp

# npm module installieren (docpad, less plugin, livereload, ...)
install: package.json
	npm install

.PHONY: build run
