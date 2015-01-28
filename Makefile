# Docpad starten
run: node_modules
	docpad watch --env static

# Nur Website generieren, ohne Starten von Docpad (localhost:9778 geht dann nicht mehr!)
build:
	docpad generate --env static

# npm module installieren (docpad, less plugin, livereload, ...)
node_modules: package.json
	npm install

deploy:
	mkdir -p ftp
	git log --pretty=format:"%h" -1 > ftp/_git_version.txt
	cp -r build/* ftp
	rm -rf ftp/WIP
	rm -rf ftp/video
	rm -rf ftp/partials
	cd ftp && find . -name "*.less" -type f -delete
	cd ftp && find . -name "*.md" -type f -delete
	cd ftp && find . -name "*.jade" -type f -delete

.PHONY: build
