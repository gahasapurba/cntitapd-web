import { describe, expect, it } from 'vitest';
import { buildTabUrl, parseLocationRoute } from './appNavigation';

const loc = (url: string) => {
  const u = new URL(url, 'https://cntitapd.netlify.app');
  return { pathname: u.pathname, search: u.search, hash: u.hash };
};

describe('URL scheme (shared links, QR posters and bookmarks keep working)', () => {
  it.each([
    ['/#home', { tab: 'home', formId: null, eventId: null, galleryId: null }],
    ['/#kudos', { tab: 'kudos', formId: null, eventId: null, galleryId: null }],
    ['/?event=evt-1#event', { tab: 'event', formId: null, eventId: 'evt-1', galleryId: null }],
    ['/?form=form-oprec-2027#form', { tab: 'form', formId: 'form-oprec-2027', eventId: null, galleryId: null }],
    ['/?gallery=gal-1#galeri', { tab: 'galeri', formId: null, eventId: null, galleryId: 'gal-1' }],
    ['/?galeri=gal-1#galeri', { tab: 'galeri', formId: null, eventId: null, galleryId: 'gal-1' }],
    ['/?stats=evt-1#event-stats', { tab: 'event-stats', formId: null, eventId: 'evt-1', galleryId: null }],
    ['/admin', { tab: 'admin', formId: null, eventId: null, galleryId: null }],
    ['/#admin', { tab: 'admin', formId: null, eventId: null, galleryId: null }],
    ['/#program', { tab: 'event', formId: null, eventId: null, galleryId: null }],
    ['/#oprec', { tab: 'form', formId: null, eventId: null, galleryId: null }],
    ['/#tidak-ada', { tab: 'home', formId: null, eventId: null, galleryId: null }]
  ])('parses %s', (url, expected) => {
    expect(parseLocationRoute(loc(url))).toEqual(expected);
  });

  it('builds the same URLs back', () => {
    expect(buildTabUrl({ tab: 'form', formId: 'f 1' }, '/')).toBe('/?form=f%201#form');
    expect(buildTabUrl({ tab: 'event-stats', eventId: 'evt-1' }, '/')).toBe('/?stats=evt-1#event-stats');
    expect(buildTabUrl({ tab: 'event', eventId: 'evt-1' }, '/')).toBe('/?event=evt-1#event');
    expect(buildTabUrl({ tab: 'galeri', galleryId: 'g' }, '/')).toBe('/?gallery=g#galeri');
    expect(buildTabUrl({ tab: 'admin' }, '/admin')).toBe('/admin');
    expect(buildTabUrl({ tab: 'admin' }, '/')).toBe('/#admin');
    expect(buildTabUrl({ tab: 'program' }, '/')).toBe('/#event');
    expect(buildTabUrl({ tab: 'oprec' }, '/')).toBe('/#form');
    expect(buildTabUrl({ tab: 'nope' }, '/')).toBe('/#home');
  });
});
