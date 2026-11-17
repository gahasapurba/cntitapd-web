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

  const rsvps = (eventRsvps || []).filter(r => String(r.eventId) === String(evt.id));
  const connForm = getConnectedFormForEvent(evt, forms);

  // If NOT connected to a form: strictly use original event limits & initial RSVPs
  if (!connForm) {
    const isLimited = Boolean(evt.isLimited);
    const maxQuota = Number(evt.maxQuota || 0);
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

  // If CONNECTED to a form:
  // 1. Quota & limit strictly follow the connected form (without wiping raw event limits in DB)
  // 2. Count strictly follows form submissions (old RSVPs are preserved in DB/state, but not counted)
  const isLimited = Boolean(connForm.isLimited);
  const maxQuota = Number(connForm.maxQuota || 0);
  const formSubs = (submissions || []).filter(s => String(s.formId) === String(connForm.id));
  const count = formSubs.length;
  const isFull = isLimited && maxQuota > 0 && count >= maxQuota;

  return {
    count,
    rsvpCount: rsvps.length, // preserved for reversion / auditing
    formSubCount: count,
    isConnected: true,
    connectedForm: connForm,
    isLimited,
    maxQuota,
    isFull,
    remaining: Math.max(0, maxQuota - count)
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
  const formSubs = (submissions || []).filter(s => String(s.formId) === String(form.id));
  const isLimited = Boolean(form.isLimited);
  const maxQuota = Number(form.maxQuota || 0);
  const count = formSubs.length;
  const isFull = isLimited && maxQuota > 0 && count >= maxQuota;

  if (connEvent) {
    const rsvps = (eventRsvps || []).filter(r => String(r.eventId) === String(connEvent.id));
    return {
      isConnected: true,
      connectedEvent: connEvent,
      isLimited,
      maxQuota,
      count,
      formSubCount: count,
      initialRsvpCount: rsvps.length,
      isFull,
      remaining: Math.max(0, maxQuota - count),
      label: `Acara: ${connEvent.title}`
    };
  }

  // Standalone form
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

