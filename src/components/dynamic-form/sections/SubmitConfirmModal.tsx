import { Send, Upload } from 'lucide-react';
import { Button, Dialog, Eyebrow } from '../../../ui';
import { useDynamicFormContext } from '../DynamicFormContext';

export default function SubmitConfirmModal() {
  const { currentForm, fileData, formData, handleConfirmSubmit, isConfirmOpen, isSubmitting, setIsConfirmOpen } = useDynamicFormContext();
  if (!currentForm) return null;
  const filled = (currentForm.fields || []).filter((field: any) => formData[field.id] || fileData[field.id]);

  return (
    <Dialog
      open={Boolean(isConfirmOpen)}
      onClose={() => setIsConfirmOpen(false)}
      eyebrow="Konfirmasi"
      title="Periksa isian sebelum mengirim"
      description="Pastikan semua data sudah benar. Setelah dikirim, isian tidak bisa diubah sendiri."
      footer={
        <>
          <Button variant="secondary" onClick={() => setIsConfirmOpen(false)}>Periksa lagi</Button>
          <Button variant="gold" loading={isSubmitting} onClick={handleConfirmSubmit} icon={<Send size={16} aria-hidden="true" />}>
            {isSubmitting ? 'Mengirim…' : 'Ya, kirim sekarang'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <Eyebrow>Formulir</Eyebrow>
          <p className="m-0 mt-1 text-[1.02rem] font-extrabold text-ink">{currentForm.title}</p>
        </div>
        <dl className="m-0 flex flex-col gap-3 rounded-2xl border border-line bg-subtle p-4">
          {filled.map((field: any) => {
            const file = fileData[field.id];
            return (
              <div key={field.id} className="flex flex-col gap-0.5">
                <dt className="text-[0.82rem] font-semibold text-muted">{field.label}</dt>
                <dd className="m-0 whitespace-pre-line break-words text-[0.95rem] font-semibold text-ink">
                  {field.type === 'file' && file ? (
                    <span className="inline-flex items-center gap-1.5"><Upload size={14} aria-hidden="true" />{file.name} ({file.size})</span>
                  ) : String(formData[field.id])}
                </dd>
              </div>
            );
          })}
        </dl>
        <p className="m-0 text-[0.86rem] leading-relaxed text-muted">
          Data pendaftaran diteruskan ke panitia penyelenggara dan disimpan di sistem Culture Network Team.
        </p>
      </div>
    </Dialog>
  );
}
