/* Injected SEO helpers — TravelAgency schema for S S N I ASIA (PVT) LTD, plus
   FAQPage schema built from the FAQ markup on pages that have it. */
(function () {
  var SITE = 'https://www.ssniasia.com/';

  var org = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': SITE + '#organization',
    name: 'SSNI Asia',
    legalName: 'S S N I ASIA (PVT) LTD',
    alternateName: ['SSNI Asia (Pvt) Ltd', 'S S N I Asia', 'SSNI Asia Sri Lanka'],
    slogan: 'Discover Sri Lanka. Experience More.',
    url: SITE,
    logo: SITE + 'assets/img/logo-stacked.png',
    image: SITE + 'assets/img/logo-stacked.png',
    description: 'SSNI Asia is a Colombo-based travel and tourism company specialising in inbound holidays to Sri Lanka — tailor-made private and group tours, hotel reservations, airport transfers, cultural tours, wildlife safaris, honeymoon, family and beach holidays — and outbound travel arrangements.',
    foundingDate: '2020-02-17',
    identifier: {
      '@type': 'PropertyValue',
      propertyID: 'Company Registration No.',
      value: 'PV 00220462'
    },
    founder: [
      { '@type': 'Person', name: 'Mohamed Nilam Mohamed Nifraz', jobTitle: 'Director' },
      { '@type': 'Person', name: 'Folystas Nalaka Sahabandu', jobTitle: 'Managing Director' },
      { '@type': 'Person', name: 'Grero Shiral Nirmal', jobTitle: 'Managing Director' },
      { '@type': 'Person', name: 'Mohamed Ismail Irshan', jobTitle: 'Director' }
    ],
    telephone: '+94114789644',
    email: 'info@ssniasia.com',
    contactPoint: [{
      '@type': 'ContactPoint',
      telephone: '+94114789644',
      email: 'reservations@ssniasia.com',
      contactType: 'reservations',
      areaServed: 'Worldwide',
      availableLanguage: ['en', 'si', 'ta']
    }],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'No. 4/3/1, 3rd Floor, Geethanjali Place',
      addressLocality: 'Colombo',
      postalCode: '00300',
      addressRegion: 'Western Province',
      addressCountry: 'LK'
    },
    location: {
      '@type': 'Place',
      name: 'S S N I ASIA (PVT) LTD — Registered Office',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'No. 229/16, Santhosh Plaza, Main Street',
        addressLocality: 'Colombo 11',
        addressRegion: 'Western Province',
        addressCountry: 'LK'
      }
    },
    areaServed: { '@type': 'Country', name: 'Sri Lanka' },
    knowsAbout: ['Sri Lanka tours', 'Inbound tourism', 'Wildlife safaris', 'Cultural tours', 'Beach holidays', 'Honeymoon holidays', 'Outbound travel'],
    sameAs: []
  };

  var add = function (data) {
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  };
  add(org);

  /* FAQPage — read straight from the accordion so the two never drift */
  var build = function () {
    var faq = document.querySelector('[data-faq]');
    if (!faq) return;
    var items = [];
    Array.prototype.forEach.call(faq.querySelectorAll('details'), function (d) {
      var q = d.querySelector('summary');
      var a = d.querySelector('.faq__answer');
      if (!q || !a) return;
      items.push({
        '@type': 'Question',
        name: q.textContent.trim(),
        acceptedAnswer: { '@type': 'Answer', text: a.textContent.trim() }
      });
    });
    if (items.length) add({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
