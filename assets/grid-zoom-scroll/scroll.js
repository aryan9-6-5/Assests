gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const IMG = 'img/';

/* Rects are {l, t, w, h} in vw (l, w) and vh (t, h) of the pinned stage.
   Deliberately uneven: sizes, positions and the side the text lands on all change. */
const chapters = [
	{ n: '01', h: 'Masses', img: 8,
	  p: 'The instruments by which public opinion is organized and focused may be misused. But such organization and focusing are necessary to orderly life.',
	  d: { rest: [3, 41, 42, 59],  open: [44, 10, 50, 80], text: [6, 24, 32] },
	  m: { rest: [4, 56, 64, 32],  open: [6, 7, 88, 46],   text: [6, 58, 88] } },
	{ n: '02', h: 'Invisible', img: 7,
	  p: 'As civilization has become more complex, and as the need for invisible government has been increasingly demonstrated, the technical means have been invented and developed by which opinion may be regimented.',
	  d: { rest: [14, 0, 27, 38],  open: [4, 6, 54, 62],   text: [64, 44, 30] },
	  m: { rest: [4, 2, 52, 20],  open: [6, 7, 88, 46],   text: [6, 58, 88] } },
	{ n: '03', h: 'Mechanism', img: 3,
	  p: 'No matter how sophisticated, how cynical the public may become about publicity methods, it must respond to the basic appeals, because it will always need food, crave amusement, long for beauty, respond to leadership.',
	  d: { rest: [46, 27, 19, 73], open: [30, 12, 34, 78], text: [68, 18, 28] },
	  m: { rest: [14, 26, 30, 26], open: [14, 7, 72, 50],  text: [6, 62, 88] } },
	{ n: '04', h: 'Millions', img: 15,
	  p: 'This practice of creating circumstances and of creating pictures in the minds of millions of persons is very common.',
	  d: { rest: [67, 3, 30, 94],  open: [52, 4, 44, 58],  text: [5, 54, 40] },
	  m: { rest: [60, 12, 36, 44],  open: [6, 7, 88, 40],   text: [6, 52, 88] } }
];

const stage = document.getElementById('stage');

// build cards + copy
chapters.forEach((c, i) => {
	const card = document.createElement('div');
	card.className = 'card';
	card.innerHTML = `<div class="card__img" style="background-image:url(${IMG}${c.img}.jpg)"></div>`;
	stage.appendChild(card);

	const copy = document.createElement('div');
	copy.className = 'copy';
	copy.innerHTML = `<span class="copy__num">${c.n}</span><h2 class="copy__h"><span>${c.h}</span></h2><p class="copy__p">${c.p}</p>`;
	stage.appendChild(copy);

	c.card = card;
	c.copy = copy;
});

// Keep a clear band top and bottom (header / footer room): vertical values live in the middle 80% of the stage.
const SAFE_T = 10, SAFE_K = 0.8;
const vy = (t) => SAFE_T + t * SAFE_K;
const rect = ([l, t, w, h]) => ({ left: l + 'vw', top: vy(t) + 'vh', width: w + 'vw', height: h * SAFE_K + 'vh' });

function buildStage() {
const mm = gsap.matchMedia();

mm.add({ desk: '(min-width: 53em)', mob: '(max-width: 52.99em)' }, (ctx) => {
	const key = ctx.conditions.desk ? 'd' : 'm';
	const ease = 'power3.inOut';

	chapters.forEach((c) => {
		const s = c[key];
		gsap.set(c.card, { ...rect(s.rest), opacity: 0, scale: 0.6, zIndex: 1 });
		gsap.set(c.copy, { left: s.text[0] + 'vw', top: vy(s.text[1]) + 'vh', width: s.text[2] + 'vw' });
		// fit the heading to its column so long words never clip
		const fit = Math.min(ctx.conditions.desk ? 9 : 14, (s.text[2] * 0.92) / (c.h.length * 0.62));
		gsap.set(c.copy.querySelector('.copy__h'), { fontSize: fit + 'vw' });
		gsap.set(c.copy.querySelector('.copy__num'), { opacity: 0, y: 14 });
		gsap.set(c.copy.querySelector('.copy__h span'), { yPercent: 110 });
		gsap.set(c.copy.querySelector('.copy__p'), { opacity: 0, y: 24 });
	});

	const tl = gsap.timeline({
		defaults: { ease },
		scrollTrigger: {
			trigger: stage,
			start: 'top top',
			end: '+=' + chapters.length * 140 + '%',
			pin: true,
			refreshPriority: 1,
			scrub: reduce ? true : 0.8,
			invalidateOnRefresh: true
		}
	});

	chapters.forEach((c, i) => {
		const s = c[key];
		const num = c.copy.querySelector('.copy__num');
		const h = c.copy.querySelector('.copy__h span');
		const p = c.copy.querySelector('.copy__p');
		const inner = c.card.querySelector('.card__img');
		const others = chapters.filter((o, j) => j < i).map((o) => o.card);

		tl.addLabel('c' + i)
		  // card appears where it will live
		  .to(c.card, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' })
		  .set(c.card, { zIndex: 10 })
		  // then opens
		  .to(c.card, { ...rect(s.open), duration: 1.2 })
		  .fromTo(inner, { scale: 1.4 }, { scale: 1, duration: 1.2 }, '<')
		  .to(others, { opacity: 0.16, duration: 0.8 }, '<')
		  // copy reads in
		  .to(num, { opacity: 0.7, y: 0, duration: 0.4 }, '-=0.5')
		  .to(h, { yPercent: 0, duration: 0.7, ease: 'power4.out' }, '<0.05')
		  .to(p, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '<0.2')
		  // hold so it can be read
		  .to({}, { duration: 1 })
		  // copy leaves, card returns to its rest spot
		  .to([num, p], { opacity: 0, y: -16, duration: 0.4, ease: 'power2.in' })
		  .to(h, { yPercent: -110, duration: 0.45, ease: 'power3.in' }, '<')
		  .to(c.card, { ...rect(s.rest), duration: 1 }, '<0.1')
		  .fromTo(inner, { scale: 1 }, { scale: 1, duration: 1 }, '<')
		  .to(others, { opacity: 0.85, duration: 0.8 }, '<')
		  .set(c.card, { zIndex: 1 });
	});

	tl.to({}, { duration: 0.6 });

	return () => {};
});
}

/* ---------- plain statement: words light up as you scroll ---------- */
const heroWords = gsap.utils.toArray('.hero .w');
gsap.set(heroWords, { opacity: 0.1 });

gsap.timeline({
	scrollTrigger: {
		trigger: '#hero',
		start: 'top top',
		end: '+=130%',
		pin: true,
		refreshPriority: 2, // hero is first on the page, so it must refresh (and add pin spacing) before the stage
		scrub: reduce ? true : 0.6
	}
})
	.to(heroWords, { opacity: 1, stagger: 0.5, ease: 'none', duration: 0.5 })
	.to({}, { duration: 1 });

// created after the hero so pin spacing is measured top to bottom
buildStage();

/* ---------- closing ---------- */
gsap.from('.ow', {
	yPercent: 110,
	duration: 1.1,
	stagger: 0.14,
	ease: 'power4.out',
	scrollTrigger: { trigger: '.outro', start: 'top 55%', toggleActions: 'play none none reverse' }
});

// pin spacers shift positions; make sure everything is measured after images/fonts settle
ScrollTrigger.sort();
ScrollTrigger.refresh();
window.addEventListener('load', () => ScrollTrigger.refresh());
