import { Clock } from 'lucide-react';
import { Container, EmptyState } from '../../ui';
import { useDynamicForm } from './useDynamicForm';
import { DynamicFormContext } from './DynamicFormContext';
import FormPageHeader from './sections/FormPageHeader';
import FormUnavailableNotice from './sections/FormUnavailableNotice';
import FormPicker from './sections/FormPicker';
import FormEntry from './sections/FormEntry';
import SubmitConfirmModal from './sections/SubmitConfirmModal';
import StatusTracker from './sections/StatusTracker';
import AcceptedAnnouncement from './sections/AcceptedAnnouncement';
import FormPosterModal from './sections/FormPosterModal';

/** Public registration page: form catalogue, the selected form, status tracker and accepted list. */
export default function FormsPage(props: Record<string, any>) {
  const state = useDynamicForm(props as any) as Record<string, any>;
  const hasPicker = state.activeForms.length > 1;
  const main = (
    <>
      <FormEntry />
      <StatusTracker />
      <AcceptedAnnouncement />
    </>
  );

  return (
    <DynamicFormContext.Provider value={state}>
      <div className="flex flex-col gap-8 pb-20 pt-8">
        <FormPageHeader />
        <FormUnavailableNotice />
        {state.activeForms.length === 0 && (
          <Container>
            <EmptyState icon={<Clock size={22} aria-hidden="true" />} title="Belum ada formulir yang dibuka">
              Saat ini belum ada pendaftaran atau kegiatan yang dibuka untuk periode ini. Pantau kanal komunikasi Culture Network Team untuk informasi berikutnya.
            </EmptyState>
          </Container>
        )}
        {hasPicker ? (
          // Desktop: form + tracker in the main column, form list in a sticky side column.
          // Phones: the list comes first so people pick a form before scrolling to it.
          <Container className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="lg:order-2"><FormPicker /></div>
            <div className="flex min-w-0 flex-col gap-6 lg:order-1">{main}</div>
          </Container>
        ) : (
          <Container><div className="flex max-w-[860px] flex-col gap-6">{main}</div></Container>
        )}
      </div>
      <SubmitConfirmModal />
      <FormPosterModal />
    </DynamicFormContext.Provider>
  );
}
