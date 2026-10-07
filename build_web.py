import pathlib
w=pathlib.Path('web')
html=(w/'shell.html').read_text().replace('/*__CSS__*/',(w/'styles.css').read_text()).replace('/*__JS__*/',(w/'app.js').read_text())
assert '</script>' not in (w/'app.js').read_text()
pathlib.Path('app/src/main/assets/index.html').write_text(html)
print(len(html))
