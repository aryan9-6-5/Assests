// To add an asset: put its folder in /assets/<slug>/ (with an index.html) and add an entry to assets.json.
fetch('assets.json')
	.then((r) => r.json())
	.then((items) => {
		document.getElementById('list').innerHTML = items.map((a) => `
			<a class="card" href="assets/${a.slug}/">
				<div class="card__img"><img src="${a.cover}" alt="" loading="lazy"></div>
				<div class="card__meta"><span class="card__title">${a.title}</span><span class="card__kind">${a.kind}<br>${a.tech}</span></div>
			</a>`).join('');
	});
