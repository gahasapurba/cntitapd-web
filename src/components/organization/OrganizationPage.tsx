import { Download, Search, Users, X } from 'lucide-react';
import { Button, Card, Chip, Container, EmptyState, SectionHeader, cn } from '../../ui';
import { useOrganization } from './useOrganization';
import { MemberCard } from './MemberCard';
import MemberDialog from './MemberDialog';
import OrgChart from './OrgChart';

const selectClass = 'min-h-11 w-full cursor-pointer rounded-xl border border-field-line bg-field px-3.5 text-[0.92rem] font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy';

export default function OrganizationPage(props: Record<string, any>) {
  const org = useOrganization(props as any) as Record<string, any>;
  const {
    activeDivisions, activeMembers, currentTenure, divisionFilter, filteredDirectoryMembers, handleExportPdf, handleMemberClick,
    isExporting, isFiltering, resetFilters, roleCounts, roleFilter, searchQuery, selectTenure, selectedTenureId, setDivisionFilter,
    setRoleFilter, setSearchQuery, tenures
  } = org;
  const tenureLabel = currentTenure?.title || currentTenure?.code || '';

  return (
    <div className="flex flex-col gap-8 pb-20 pt-8">
      <Container className="flex flex-col gap-4">
        <SectionHeader
          as="h1"
          eyebrow={`Struktur organisasi${currentTenure?.code ? ` · periode ${currentTenure.code}` : ''}`}
          title="Pengurus Culture Network Team"
          action={activeMembers.length > 0 && (
            <Button variant="secondary" loading={isExporting} onClick={handleExportPdf} icon={<Download size={16} aria-hidden="true" />}
              title="Unduh bagan struktur organisasi sebagai PDF">
              {isExporting ? 'Menyiapkan PDF…' : 'Unduh bagan (PDF)'}
            </Button>
          )}
        />
        <p className="m-0 max-w-[64ch] text-[1rem] leading-relaxed text-muted">
          Pembina, pimpinan, dan empat divisi penggerak budaya Group IT APD. Pilih nama untuk melihat profil, tanggung jawab, dan kontak.
        </p>
      </Container>

      {(activeMembers.length > 0 || tenures.length > 0) && (
        <Container>
          <Card padding="sm" className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <label htmlFor="org-search" className="sr-only">Cari pengurus</label>
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" aria-hidden="true" />
              <input
                id="org-search"
                type="search"
                placeholder="Cari nama, jabatan, atau tanggung jawab"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-field-line bg-field pl-10 pr-3.5 text-[0.95rem] text-ink placeholder:text-dim focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:flex lg:w-auto">
              {tenures.length > 0 && (
                <div className="lg:w-56">
                  <label htmlFor="org-tenure" className="sr-only">Periode</label>
                  <select id="org-tenure" value={selectedTenureId} onChange={(e) => selectTenure(e.target.value)} className={selectClass}>
                    {tenures.map((t: any) => <option key={t.id} value={t.id}>Periode {t.code || t.title}{t.isActive ? ' (aktif)' : ''}</option>)}
                  </select>
                </div>
              )}
              {roleCounts.length > 0 && (
                <div className="lg:w-52">
                  <label htmlFor="org-role" className="sr-only">Jabatan</label>
                  <select id="org-role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={selectClass}>
                    <option value="all">Semua jabatan ({activeMembers.length})</option>
                    {roleCounts.map(({ role, count }: any) => <option key={role.id} value={role.id}>{role.name} ({count})</option>)}
                  </select>
                </div>
              )}
              {activeDivisions.length > 0 && (
                <div className="lg:w-52">
                  <label htmlFor="org-division" className="sr-only">Divisi</label>
                  <select id="org-division" value={divisionFilter} onChange={(e) => setDivisionFilter(e.target.value)} className={selectClass}>
                    <option value="all">Semua divisi</option>
                    {activeDivisions.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            {isFiltering && (
              <Button variant="ghost" onClick={resetFilters} icon={<X size={16} aria-hidden="true" />}>Hapus filter</Button>
            )}
          </Card>
        </Container>
      )}

      {isFiltering && (
        <Container className="flex flex-col gap-4" aria-live="polite">
          <div><Chip tone="navy">{filteredDirectoryMembers.length} pengurus ditemukan</Chip></div>
          {filteredDirectoryMembers.length === 0 ? (
            <EmptyState icon={<Search size={22} aria-hidden="true" />} title="Tidak ada yang cocok"
              action={<Button variant="secondary" onClick={resetFilters}>Hapus filter</Button>}>
              Tidak ada pengurus yang cocok dengan kata kunci atau filter yang dipilih.
            </EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDirectoryMembers.map((m: any) => <MemberCard key={m.id} member={m} onOpen={() => handleMemberClick(m)} />)}
            </div>
          )}
        </Container>
      )}

      <Container className={cn(isFiltering && 'hidden')}>
        {activeMembers.length === 0 ? (
          <EmptyState icon={<Users size={22} aria-hidden="true" />} title="Struktur organisasi belum tersedia">
            Belum ada pengurus yang terdaftar untuk periode {tenureLabel || 'ini'}. Pengurus bisa ditambahkan lewat Admin Portal.
          </EmptyState>
        ) : (
          <OrgChart org={org} />
        )}
      </Container>

      <MemberDialog org={org} />
    </div>
  );
}
