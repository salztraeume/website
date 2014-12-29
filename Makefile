# Docpad starten
run: node_modules
	docpad run

# Nur Website generieren, ohne Starten von Docpad (localhost:9778 geht dann nicht mehr!)
build: node_modules
	docpad generates

# npm module installieren (docpad, less plugin, livereload, ...)
node_modules: package.json
	npm install

