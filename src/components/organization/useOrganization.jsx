import { useState, useEffect } from 'react';
import { soundFx } from '../../utils/audio';
import { exportPresentationToPdf } from '../../utils/exportPdf';
import { getTenureRoles, getMemberLevel, findMatchingRole, getDivisionLead, getDivisionStructure } from '../../utils/memberQuotaUtils';

/** "0812…" → "62812…" for wa.me links and vCards. */
export function formatWaNumber(raw = '') {
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  return digits;
}

const byRoleThenMemberOrder = (roles) => (a, b) => {
  const roleA = findMatchingRole(a, roles);
  const roleB = findMatchingRole(b, roles);
  const sortA = roleA ? Number(roleA.sortOrder ?? 0) : 0;
  const sortB = roleB ? Number(roleB.sortOrder ?? 0) : 0;
  if (sortA !== sortB) return sortA - sortB;
  return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
};

/** State and derived structure for the organisation page (logic moved unchanged from OrganizationSection). */
export function useOrganization({
  activeTenure,
  tenures = [],
  divisions = [],
  members = [],
  events = [],
  roleQuotas = {},
  tenureRoles = [],
  isEventPageVisible = true,
  onNavigateProgram,
  onSelectTenure
}) {
  const [selectedTenureId, setSelectedTenureId] = useState(activeTenure?.id || tenures[0]?.id || '');
  const [selectedMember, setSelectedMember] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  // Follow the tenure chosen elsewhere (header selector)
  useEffect(() => {
    if (activeTenure?.id) setSelectedTenureId(activeTenure.id);
  }, [activeTenure?.id]);

  // Reset search and filters whenever the tenure changes
  useEffect(() => {
    setSearchQuery('');
    setRoleFilter('all');
    setDivisionFilter('all');
  }, [selectedTenureId]);

  const currentTenure = tenures.find(t => t.id === selectedTenureId) || activeTenure || tenures[0] || null;
  const currentTenureId = currentTenure?.id || activeTenure?.id || '';

  const selectTenure = (newId) => {
    setSelectedTenureId(newId);
    const found = tenures.find(t => t.id === newId);
    if (found && onSelectTenure) onSelectTenure(found);
  };

  const handleExportPdf = async () => {
    soundFx.playClick();
    setIsExporting(true);
    try {
      await exportPresentationToPdf('org-tree-export-container', null, currentTenure || activeTenure);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadVCard = (member) => {
    if (!member) return;
    const phone = formatWaNumber(member.whatsapp || '');
    const vcardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${member.name || ''}`,
      'ORG:Bank Mandiri - Culture Network Team (CNT) IT Application Delivery',
      `TITLE:${member.role || ''}`,
      phone ? `TEL;TYPE=CELL,VOICE:+${phone}` : '',
      `NOTE:${member.motto || ''}`,
      'END:VCARD'
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([vcardLines], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = String(member.name || 'cnt-apd').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.href = url;
    a.download = `kontak-${safeName}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handleCopyPhone = (rawPhone) => {
    if (!rawPhone) return;
    try {
      navigator.clipboard.writeText(rawPhone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2200);
    } catch (e) { /* clipboard unavailable */ }
  };

  const activeDivisions = (divisions || []).filter(d => !currentTenureId || d.tenureId === currentTenureId);
  const activeMembers = (members || []).filter(m => !currentTenureId || m.tenureId === currentTenureId);
  const currentTenureRoles = getTenureRoles(currentTenureId, roleQuotas, tenureRoles);

  // Level 0 advisers, level 1 patrons, level 2 chair & vice, level 3 board members outside divisions
  const penasehats = activeMembers.filter(m => getMemberLevel(m, currentTenureRoles) === 0);
  const pembinas = activeMembers.filter(m => getMemberLevel(m, currentTenureRoles) === 1);
  const displayLevel2 = activeMembers.filter(m => getMemberLevel(m, currentTenureRoles) === 2).sort(byRoleThenMemberOrder(currentTenureRoles));
  const displayLevel3 = activeMembers.filter(m => {
    const isLevel3 = getMemberLevel(m, currentTenureRoles) === 3;
    const roleObj = findMatchingRole(m, currentTenureRoles);
    const belongsToDivision = Boolean(m.divisionId || roleObj?.requiresDivision);
    return isLevel3 && !belongsToDivision;
  }).sort(byRoleThenMemberOrder(currentTenureRoles));

  // Division columns: divisions of this tenure (or, if none, divisions that have members here)
  const displayDivs = activeDivisions.length > 0
    ? activeDivisions
    : divisions.filter(d => activeMembers.some(m => m.divisionId === d.id));
  const divisionColumns = displayDivs.map((div, idx) => {
    const { leaders: divLeaders, members: divisionMembers } = getDivisionStructure(div, activeMembers, currentTenureRoles);
    const leadObj = getDivisionLead(div, activeMembers, currentTenureRoles);
    const leaders = divLeaders.length > 0
      ? divLeaders
      : (leadObj.member ? [leadObj.member] : (div.leadName ? activeMembers.filter(m => m.name === div.leadName) : []));
    return { div, idx, leaders, members: divisionMembers };
  });

  const roleCounts = currentTenureRoles.map(r => ({
    role: r,
    count: activeMembers.filter(m => {
      const mr = findMatchingRole(m, currentTenureRoles);
      return m.roleId === r.id || mr?.id === r.id;
    }).length
  }));

  const isFiltering = searchQuery.trim() !== '' || roleFilter !== 'all' || divisionFilter !== 'all';
  const resetFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setDivisionFilter('all');
  };

  const filteredDirectoryMembers = activeMembers.filter(m => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      (m.name || '').toLowerCase().includes(q) ||
      (m.role || '').toLowerCase().includes(q) ||
      (m.title || '').toLowerCase().includes(q) ||
      (Array.isArray(m.responsibilities) && m.responsibilities.some(r => r.toLowerCase().includes(q)));
    const memberRole = findMatchingRole(m, currentTenureRoles);
    const matchesRole = roleFilter === 'all' ||
      m.roleId === roleFilter ||
      memberRole?.id === roleFilter ||
      (memberRole?.name && memberRole.name.toLowerCase() === roleFilter.toLowerCase());
    const matchesDiv = divisionFilter === 'all' || m.divisionId === divisionFilter;
    return matchesSearch && matchesRole && matchesDiv;
  });

  const handleMemberClick = (member) => {
    soundFx.playClick();
    setSelectedMember(member);
  };
  const handleCloseModal = () => {
    soundFx.playClick();
    setSelectedMember(null);
  };

  // Public events of the selected member's division (shown in the profile dialog)
  const relatedEventsFor = (member) => {
    if (!member || !isEventPageVisible) return { events: [], divisionName: '' };
    const memberRoleObj = findMatchingRole(member, currentTenureRoles);
    const roleRequiresDivision = memberRoleObj
      ? Boolean(memberRoleObj.requiresDivision)
      : (member.category === 'pimpro' || member.category === 'anggota');
    if (!roleRequiresDivision || !member.divisionId) return { events: [], divisionName: '' };
    const related = (events || []).filter(e => {
      if (e.isPublic !== true) return false;
      const matchTenure = !activeTenure?.id || e.tenureId === activeTenure.id;
      const matchDiv = e.divisionId === member.divisionId ||
        (member.division && (e.division === member.division || e.divisionName === member.division));
      return matchTenure && matchDiv;
    }).slice(0, 5);
    const divObj = (divisions || []).find(d => d.id === member.divisionId);
    return { events: related, divisionName: divObj?.name || member.division || '' };
  };

  return {
    activeDivisions, activeMembers, copiedPhone, currentTenure, currentTenureRoles, displayLevel2, displayLevel3,
    divisionColumns, divisionFilter, filteredDirectoryMembers, handleCloseModal, handleCopyPhone, handleDownloadVCard,
    handleExportPdf, handleMemberClick, isExporting, isFiltering, onNavigateProgram, pembinas, penasehats, relatedEventsFor,
    resetFilters, roleCounts, roleFilter, searchQuery, selectTenure, selectedMember, selectedTenureId, setDivisionFilter,
    setRoleFilter, setSearchQuery, setSelectedMember, tenures
  };
}
