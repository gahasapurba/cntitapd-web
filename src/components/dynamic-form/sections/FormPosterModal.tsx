import { Download } from 'lucide-react';
import { Button, ButtonLink, Dialog } from '../../../ui';
import { useDynamicFormContext } from '../DynamicFormContext';

export default function FormPosterModal() {
  const { posterPreview, setPosterPreview } = useDynamicFormContext();
  const close = () => setPosterPreview(null);

  return (
    <Dialog
      open={Boolean(posterPreview)}
      onClose={close}
      size="sm"
      eyebrow="Bagikan formulir"
      title="Poster QR formulir"
      footer={
        <>
          <Button variant="secondary" onClick={close}>Tutup</Button>
          <ButtonLink variant="gold" href={posterPreview?.url} download={posterPreview?.filename} icon={<Download size={16} aria-hidden="true" />}>
            Simpan PNG
          </ButtonLink>
        </>
      }
    >
      {posterPreview && (
        <div className="flex flex-col gap-4">
          <img src={posterPreview.url} alt={`Poster QR ${posterPreview.title}`} className="max-h-[52vh] w-full rounded-xl border border-line object-contain" />
          <p className="m-0 rounded-xl bg-subtle px-4 py-3 text-[0.86rem] leading-relaxed text-muted">
            Di ponsel: tekan dan tahan gambar, lalu pilih <strong className="text-ink">Simpan ke Foto</strong>, atau pakai tombol Simpan PNG.
          </p>
        </div>
      )}
    </Dialog>
  );
}
