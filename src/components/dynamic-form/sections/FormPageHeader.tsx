import { Chip, Container, SectionHeader, Segmented } from '../../../ui';
import { useDynamicFormContext } from '../DynamicFormContext';

export default function FormPageHeader() {
  const { activeForms, activeTenure, forms, setTenureFilter, tenureFilter } = useDynamicFormContext();
  const openAcrossYears = forms.filter((f: any) => f.isOpen !== false).length;

  return (
    <Container className="flex flex-col gap-4">
      <SectionHeader as="h1" eyebrow="Registrasi & formulir" title="Formulir Culture Network Team" />
      <p className="m-0 max-w-[64ch] text-[1rem] leading-relaxed text-muted">
        Pendaftaran kepengurusan, kegiatan, dan survei Culture Network Team. Pilih formulir, lengkapi isiannya, lalu simpan ID pendaftaran untuk memantau statusnya.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {activeTenure && (
          <Segmented
            label="Periode formulir"
            options={[
              { key: 'active', label: `Periode ${activeTenure?.code || activeTenure?.title || ''}`, active: tenureFilter === 'active', onClick: () => setTenureFilter('active') },
              { key: 'all', label: `Lintas tahun (${openAcrossYears})`, active: tenureFilter === 'all', onClick: () => setTenureFilter('all') }
            ]}
          />
        )}
        <Chip tone="navy">{activeForms.length} formulir tersedia</Chip>
      </div>
    </Container>
  );
}
