/**
 * Utility functions for Unified Quota Calculation
 * Synchronizes attendance and quota limits between Events and connected Registration Forms.
 */

export function getConnectedFormForEvent(evt, forms = []) {
  if (!evt || !forms) return null;
  return forms.find(f => {
    const isConn = f.isEventConnected || f.fields?.[0]?._isEventConnected;
    const evtId = f.eventId || f.fields?.[0]?._eventId;
    return Boolean(isConn) && String(evtId) === String(evt.id);
  }) || null;
}

export function getConnectedEventForForm(form, events = []) {
  if (!form || !events) return null;
  const isConn = form.isEventConnected || form.fields?.[0]?._isEventConnected;
  const evtId = form.eventId || form.fields?.[0]?._eventId;
  if (!isConn || !evtId) return null;
  return events.find(e => String(e.id) === String(evtId)) || null;
}

export function getUnifiedEventAttendees(evt, forms = [], eventRsvps = [], submissions = []) {
  if (!evt) {
    return {
      count: 0,
      rsvpCount: 0,
      formSubCount: 0,
      isConnected: false,
      connectedForm: null,
      isLimited: false,
      maxQuota: 0,
      isFull: false,
      remaining: 0
    };
  }

  const isLimited = Boolean(evt.isLimited);
  const maxQuota = Number(evt.maxQuota || 0);
  const rsvps = (eventRsvps || []).filter(r => String(r.eventId) === String(evt.id));
  const connForm = getConnectedFormForEvent(evt, forms);

  if (!connForm) {
    const count = rsvps.length;
    const isFull = isLimited && maxQuota > 0 && count >= maxQuota;
    return {
      count,
      rsvpCount: count,
      formSubCount: 0,
      isConnected: false,
      connectedForm: null,
      isLimited,
      maxQuota,
      isFull,
      remaining: Math.max(0, maxQuota - count)
    };
  }

  const formSubs = (submissions || []).filter(s => String(s.formId) === String(connForm.id));

  // Deduplicate participants who might be present in both initial RSVPs and form submissions
  const seen = new Set();
  let uniqueCount = 0;

  // Add form submissions
  formSubs.forEach(s => {
    const d = s.data || {};
    const name = (d['f-fullName'] || d['f-teamName'] || d['f-name'] || d.fullName || s.fullName || '').trim().toLowerCase();
    const ident = (d['f-nip'] || d['f-whatsapp'] || d['f-email'] || d.nip || d.whatsapp || s.id || '').trim().toLowerCase();
    const key = name && ident ? `${name}|${ident}` : s.id;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueCount++;
    }
  });

  // Add initial RSVPs
  rsvps.forEach(r => {
    const name = (r.name || '').trim().toLowerCase();
    const ident = (r.phone || r.email || r.department || r.id || '').trim().toLowerCase();
    const key = name && ident ? `${name}|${ident}` : r.id;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueCount++;
    }
  });

  const isFull = isLimited && maxQuota > 0 && uniqueCount >= maxQuota;

  return {
    count: uniqueCount,
    rsvpCount: rsvps.length,
    formSubCount: formSubs.length,
    isConnected: true,
    connectedForm: connForm,
    isLimited,
    maxQuota,
    isFull,
    remaining: Math.max(0, maxQuota - uniqueCount)
  };
}

export function getUnifiedFormQuota(form, events = [], forms = [], eventRsvps = [], submissions = []) {
  if (!form) {
    return {
      isConnected: false,
      connectedEvent: null,
      isLimited: false,
      maxQuota: 0,
      count: 0,
      formSubCount: 0,
      initialRsvpCount: 0,
      isFull: false,
      remaining: 0,
      label: ''
    };
  }

  const connEvent = getConnectedEventForForm(form, events);

  if (connEvent) {
    // Event is connected: event's quota is the authoritative quota
    const eventStats = getUnifiedEventAttendees(connEvent, forms, eventRsvps, submissions);
    const isLimited = eventStats.isLimited || Boolean(form.isLimited);
    const maxQuota = eventStats.maxQuota > 0 
      ? eventStats.maxQuota 
      : Number(form.maxQuota || 0);

    const isFull = isLimited && maxQuota > 0 && eventStats.count >= maxQuota;

    return {
      isConnected: true,
      connectedEvent: connEvent,
      isLimited,
      maxQuota,
      count: eventStats.count,
      formSubCount: eventStats.formSubCount,
      initialRsvpCount: eventStats.rsvpCount,
      isFull,
      remaining: Math.max(0, maxQuota - eventStats.count),
      label: `Acara: ${connEvent.title}`
    };
  }

  // Standalone form
  const formSubs = (submissions || []).filter(s => String(s.formId) === String(form.id));
  const isLimited = Boolean(form.isLimited);
  const maxQuota = Number(form.maxQuota || 0);
  const count = formSubs.length;
  const isFull = isLimited && maxQuota > 0 && count >= maxQuota;

  return {
    isConnected: false,
    connectedEvent: null,
    isLimited,
    maxQuota,
    count,
    formSubCount: count,
    initialRsvpCount: 0,
    isFull,
    remaining: Math.max(0, maxQuota - count),
    label: 'Formulir Mandiri'
  };
}

