import { AlertCircle } from 'lucide-react';
import { Button, Container, EmptyState } from '../../../ui';
import { useDynamicFormContext } from '../DynamicFormContext';

export default function FormUnavailableNotice() {
  const { activeForms, isInitialFormDisabled, isInitialFormMissing, navigateTo, onSelectFormUrl, requestedForm, setSelectedFormId } = useDynamicFormContext();
  if (!isInitialFormMissing && !isInitialFormDisabled) return null;

  return (
    <Container>
      <EmptyState
        icon={<AlertCircle size={22} aria-hidden="true" />}
        title={isInitialFormDisabled ? 'Formulir sudah dinonaktifkan' : 'Formulir tidak ditemukan'}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="primary" onClick={() => { if (onSelectFormUrl) onSelectFormUrl(null); navigateTo('/#home'); }}>
              Kembali ke Beranda
            </Button>
            {activeForms.length > 0 && (
              <Button variant="secondary" onClick={() => { if (onSelectFormUrl) onSelectFormUrl(activeForms[0].id); setSelectedFormId(activeForms[0].id); }}>
                Lihat formulir yang tersedia ({activeForms.length})
              </Button>
            )}
          </div>
        }
      >
        {isInitialFormDisabled
          ? `Formulir "${requestedForm?.title || 'ini'}" sedang dinonaktifkan atau ditutup oleh pengurus.`
          : 'Tautan formulir yang Anda buka tidak ditemukan atau sudah dihapus oleh pengurus.'}
      </EmptyState>
    </Container>
  );
}
