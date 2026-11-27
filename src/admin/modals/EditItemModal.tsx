import React from 'react';
import { AKHLAK_VALUES, DEFAULT_AKHLAK_VALUE } from '../../utils/akhlak';
import { AlertCircle, ArrowDown, ArrowUp, Building2, Calendar, Edit2, GripVertical, Image as ImageIcon, Layers, Link2, Plus, Trash2, Upload, X } from 'lucide-react';
import { LEVEL_OPTIONS, formatLevelOptionLabel, getCategoryFromLevel, getTenureRoles, validateMemberQuota } from '../../utils/memberQuotaUtils';
import { buildFlexibleDate, formatDeadlineWib, formatToIndonesianDate, formatWibDateTime, formatWibEventRange, parseFlexibleDate, toDatetimeLocalSecondsValue, toDatetimeLocalValue } from '../../utils/dateUtils';
import { soundFx } from '../../utils/audio';
import { uploadMediaToCloud } from '../../lib/supabase';
import { editItemError } from '../validation/schemas';
import { useAdminPortal } from '../AdminPortalContext';
import MemberFields from './edit/MemberFields';
import DivisionFields from './edit/DivisionFields';
import GalleryFields from './edit/GalleryFields';
import TenureFields from './edit/TenureFields';
import KudosFields from './edit/KudosFields';
import FormFields from './edit/FormFields';
import EventFields from './edit/EventFields';
import BrandAssetFields from './edit/BrandAssetFields';
import FaqFields from './edit/FaqFields';
import RoleFields from './edit/RoleFields';
import DepartmentFields from './edit/DepartmentFields';

export default function EditItemModal() {
  const {
    activeTenure,
    departments,
    divisions,
    dragOverFieldIndex,
    draggedFieldIndex,
    editModalError,
    editingItem,
    events,
    forms,
    handleAddPhotoLinkToEditModal,
    handleBrandAssetUpload,
    handleMemberPhotoUpload,
    handleMoveField,
    handlePhotoUpload,
    isDark,
    isUploadingMedia,
    members,
    onUpdateBrandAsset,
    onUpdateDepartment,
    onUpdateDivision,
    onUpdateEvent,
    onUpdateFaq,
    onUpdateForm,
    onUpdateGallery,
    onUpdateKudos,
    onUpdateMember,
    onUpdateTenure,
    onUpdateTenureRole,
    roleQuotas,
    setDeleteConfirm,
    setDragOverFieldIndex,
    setDraggedFieldIndex,
    setEditModalError,
    setEditingItem,
    setIsUploadingMedia,
    showToast,
    submissions,
    tenureRoles,
    tenures,
    verifyImageUrl
  } = useAdminPortal();

  return (
    <>
      {editingItem && (
        <div 
          onClick={() => setEditingItem(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel modal-container modal-structured" 
            style={{
              maxWidth: editingItem.type === 'form' ? '680px' : '580px',
              width: '100%',
              maxHeight: 'min(90vh, 780px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              padding: 0,
              border: '1.5px solid var(--mandiri-gold)',
              boxShadow: '0 25px 65px rgba(0, 0, 0, 0.75)',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            {/* Pinned Sticky Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 22px',
              borderBottom: '1px solid var(--border-card)',
              background: 'var(--bg-card)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={18} color="var(--mandiri-gold)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Edit {
                    editingItem.type === 'member' ? 'Data Personel' :
                    editingItem.type === 'role' ? 'Data Role & Struktur' :
                    editingItem.type === 'division' ? 'Data Divisi' :
                    editingItem.type === 'department' ? 'Data Departemen' :
                    editingItem.type === 'gallery' ? 'Dokumentasi Galeri' :
                    editingItem.type === 'kudos' ? 'Apresiasi / Kudos' :
                    editingItem.type === 'form' ? 'Formulir Pendaftaran' :
                    editingItem.type === 'event' ? 'Event' :
                    editingItem.type === 'brand_asset' ? 'Asset & Template' :
                    editingItem.type === 'faq' ? 'Pertanyaan FAQ' :
                    'Periode Kepengurusan'
                  }
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setEditModalError('');
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                title="Tutup (ESC)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Inline Error Alert if Required Validation Fails */}
            {editModalError && (
              <div style={{
                margin: '14px 22px 0 22px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid #f43f5e',
                color: '#f43f5e',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{editModalError}</span>
              </div>
            )}

            {/* Scrollable Modal Content */}
            <div style={{
              padding: '20px 22px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>

            {/* Edit Member Form (Complete Fields) */}
            <MemberFields activeTenure={activeTenure} divisions={divisions} editModalError={editModalError} editingItem={editingItem} handleMemberPhotoUpload={handleMemberPhotoUpload} roleQuotas={roleQuotas} setEditModalError={setEditModalError} setEditingItem={setEditingItem} tenureRoles={tenureRoles} tenures={tenures} />

            {/* Edit Division Form (Complete Fields) */}
            <DivisionFields activeTenure={activeTenure} divisions={divisions} editingItem={editingItem} setEditingItem={setEditingItem} tenures={tenures} />

            {/* Edit Gallery Form (Complete with Photos & DocLinks management) */}
            <GalleryFields activeTenure={activeTenure} divisions={divisions} editingItem={editingItem} events={events} handleAddPhotoLinkToEditModal={handleAddPhotoLinkToEditModal} handlePhotoUpload={handlePhotoUpload} isDark={isDark} isUploadingMedia={isUploadingMedia} setDeleteConfirm={setDeleteConfirm} setEditingItem={setEditingItem} showToast={showToast} tenures={tenures} />

            {/* Edit Tenure Form */}
            <TenureFields editingItem={editingItem} setEditingItem={setEditingItem} />

            {/* Edit Kudos Form */}
            <KudosFields editingItem={editingItem} setEditingItem={setEditingItem} />

            {/* Edit Form Fields (With Custom Field Builder) */}
            <FormFields activeTenure={activeTenure} departments={departments} divisions={divisions} dragOverFieldIndex={dragOverFieldIndex} draggedFieldIndex={draggedFieldIndex} editingItem={editingItem} events={events} forms={forms} handleMoveField={handleMoveField} setDragOverFieldIndex={setDragOverFieldIndex} setDraggedFieldIndex={setDraggedFieldIndex} setEditingItem={setEditingItem} showToast={showToast} submissions={submissions} tenures={tenures} />

            {/* Edit Event Form */}
            <EventFields activeTenure={activeTenure} divisions={divisions} editingItem={editingItem} setEditModalError={setEditModalError} setEditingItem={setEditingItem} tenures={tenures} />

            {/* Edit Brand Asset Form */}
            <BrandAssetFields editingItem={editingItem} handleBrandAssetUpload={handleBrandAssetUpload} setEditingItem={setEditingItem} />

            {/* Edit FAQ Form */}
            <FaqFields editingItem={editingItem} setEditingItem={setEditingItem} />

            {/* Edit Role Form */}
            <RoleFields activeTenure={activeTenure} editingItem={editingItem} setEditingItem={setEditingItem} tenureRoles={tenureRoles} tenures={tenures} />

            {/* Edit Department Form */}
            <DepartmentFields editingItem={editingItem} setEditingItem={setEditingItem} />

            </div>

            {/* Pinned Sticky Footer Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 22px',
              borderTop: '1px solid var(--border-card)',
              background: 'var(--bg-card)',
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setEditModalError('');
                }}
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--radius-full)',
                  background: 'transparent',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isUploadingMedia}
                onClick={async () => {
                  setEditModalError('');
                  const it = editingItem.item || {};
                  // Field checks of every item type (src/admin/validation/schemas.ts), before any upload
                  const fieldError = editItemError(editingItem.type, it);
                  if (fieldError) {
                    setEditModalError(fieldError);
                    showToast(fieldError, 'error');
                    return;
                  }
                  if (editingItem.type === 'form') {
                    // Validasi Integritas Unik: Periksa apakah ada field isUnique yang memiliki data duplikat di riwayat pengisian responden
                    const formFields = it.fields || [];
                    const uniqueFields = formFields.filter((f: any) => f.isUnique);
                    if (uniqueFields.length > 0) {
                      const formSubs = submissions.filter((s: any) => s.formId === it.id);
                      for (const uf of uniqueFields) {
                        const valCounts: Record<string, any> = {};
                        formSubs.forEach((s: any) => {
                          const rawVal = s.data?.[uf.id] ?? s[uf.id] ?? s.answers?.[uf.id];
                          if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '') {
                            const normVal = String(rawVal).trim().toLowerCase();
                            valCounts[normVal] = (valCounts[normVal] || 0) + 1;
                          }
                        });
                        const duplicates = Object.entries(valCounts).filter(([_, count]) => count > 1);
                        if (duplicates.length > 0) {
                          const dupDetails = duplicates.map(([val, count]) => `"${val}" (${count}x)`).join(', ');
                          const errMsg = `Field "${uf.label}" tidak dapat dijadikan Unik karena memiliki ${duplicates.length} data duplikat pada respon responden: ${dupDetails}. Hapus data duplikat di tab Responden terlebih dahulu.`;
                          setEditModalError(errMsg);
                          showToast(errMsg, 'error');
                          return;
                        }
                      }
                    }
                  }

                  if (editingItem.type === 'member' && onUpdateMember) {
                    const targetTenureId = editingItem.item.tenureId || activeTenure?.id || '';
                    const availableRoles = getTenureRoles(targetTenureId, roleQuotas, tenureRoles);
                    if (availableRoles.length === 0) {
                      setEditModalError('Role kepengurusan masih kosong pada periode ini. Silakan buat role baru terlebih dahulu di menu Kelola Role & Jabatan.');
                      showToast('Role kepengurusan masih kosong pada periode ini.', 'error');
                      return;
                    }
                    const selectedRole = availableRoles.find(r => r.id === editingItem.item.roleId) ||
                      availableRoles.find(r => r.name.toLowerCase() === (editingItem.item.role || '').toLowerCase()) ||
                      null;

                    if (!selectedRole) {
                      setEditModalError('Jabatan / Role wajib dipilih');
                      showToast('Jabatan / Role wajib dipilih', 'error');
                      return;
                    }

                    if (selectedRole?.requiresDivision && !editingItem.item.divisionId) {
                      setEditModalError(`Divisi wajib dipilih untuk jabatan "${selectedRole.name}"`);
                      showToast(`Divisi wajib dipilih untuk jabatan "${selectedRole.name}"`, 'error');
                      return;
                    }

                    // Validasi Ketat Kuota Kepengurusan saat edit
                    const quotaCheck = validateMemberQuota(
                      {
                        tenureId: targetTenureId,
                        roleId: selectedRole?.id,
                        role: selectedRole?.name || editingItem.item.role,
                        divisionId: selectedRole?.requiresDivision ? editingItem.item.divisionId : undefined,
                        excludeMemberId: editingItem.item.id
                      },
                      members,
                      divisions,
                      roleQuotas,
                      tenureRoles
                    );

                    if (!quotaCheck.isValid) {
                      setEditModalError(quotaCheck.error);
                      showToast(quotaCheck.error, 'error');
                      return;
                    }
                    let finalImage = (editingItem.item.image || '').trim();

                    // Validasi URL foto jika diinput dalam bentuk tautan web
                    if (finalImage && !editingItem.pendingPhoto && !finalImage.startsWith('blob:')) {
                      setIsUploadingMedia(true);
                      showToast('Memverifikasi tautan foto profil...');
                      const check = await verifyImageUrl(finalImage, { requireHttps: true, allowRelative: false });
                      if (!check.valid) {
                        setIsUploadingMedia(false);
                        setEditModalError(`Tautan foto tidak valid: ${check.error}`);
                        showToast(`Tautan foto tidak valid: ${check.error}`, 'error');
                        return;
                      }
                      setIsUploadingMedia(false);
                    }

                    if (editingItem.pendingPhoto) {
                      setIsUploadingMedia(true);
                      showToast(`Mengunggah foto "${editingItem.pendingPhoto.name}" ke Cloud Storage...`);
                      try {
                        const cloudUrl = await uploadMediaToCloud(editingItem.pendingPhoto, 'members');
                        if (cloudUrl) finalImage = cloudUrl;
                      } catch (err: any) {
                        setIsUploadingMedia(false);
                        showToast('Gagal mengunggah foto: ' + (err.message || 'Error jaringan'), 'error');
                        return;
                      }
                      setIsUploadingMedia(false);
                    }
                    const finalResp = editingItem.item.rawResponsibilities !== undefined
                      ? editingItem.item.rawResponsibilities.split('\n').map((s: any) => s.trim()).filter(Boolean)
                      : (Array.isArray(editingItem.item.responsibilities) ? editingItem.item.responsibilities : []);
                    const { rawResponsibilities, ...cleanItem } = editingItem.item;
                    const finalCat = getCategoryFromLevel(selectedRole?.level ?? 5);
                    const divObj = selectedRole?.requiresDivision ? divisions.find((d: any) => d.id === cleanItem.divisionId) : null;
                    const finalRoleName = selectedRole?.requiresDivision && selectedRole?.name.toLowerCase() === 'pimpro' && divObj
                      ? `Pimpro ${divObj.name}`
                      : (selectedRole?.name || cleanItem.role || '');

                    onUpdateMember({
                      ...cleanItem,
                      roleId: selectedRole?.id,
                      role: finalRoleName,
                      title: divObj?.name || '',
                      category: finalCat,
                      divisionId: selectedRole?.requiresDivision ? cleanItem.divisionId : undefined,
                      image: finalImage,
                      responsibilities: finalResp
                    });
                  }
                  if (editingItem.type === 'division' && onUpdateDivision) {
                    const finalFocus = editingItem.item.rawFocusAreas !== undefined
                      ? editingItem.item.rawFocusAreas.split(',').map((s: any) => s.trim()).filter(Boolean)
                      : (Array.isArray(editingItem.item.focusAreas) ? editingItem.item.focusAreas : []);
                    const { rawFocusAreas, ...cleanItem } = editingItem.item;
                    const selMem = members.find((m: any) => m.id === cleanItem.memberId);
                    const finalLeadName = selMem ? selMem.name : (cleanItem.leadName || '');
                    onUpdateDivision({ ...cleanItem, leadName: finalLeadName, focusAreas: finalFocus });
                  }
                  if (editingItem.type === 'gallery' && onUpdateGallery) {
                    let finalPhotos = Array.isArray(editingItem.item.photos) ? [...editingItem.item.photos] : [];
                    if (editingItem.pendingPhotos && editingItem.pendingPhotos.length > 0) {
                      setIsUploadingMedia(true);
                      showToast(`Mengunggah ${editingItem.pendingPhotos.length} foto ke Cloud Storage...`);
                      try {
                        for (const pFile of editingItem.pendingPhotos) {
                          const cloudUrl = await uploadMediaToCloud(pFile, 'gallery');
                          if (cloudUrl) {
                            const blobIdx = finalPhotos.findIndex(u => typeof u === 'string' && u.startsWith('blob:'));
                            if (blobIdx !== -1) {
                              finalPhotos[blobIdx] = cloudUrl;
                            } else {
                              finalPhotos.push(cloudUrl);
                            }
                          }
                        }
                      } catch (err: any) {
                        setIsUploadingMedia(false);
                        showToast('Gagal mengunggah foto galeri: ' + (err.message || 'Error'), 'error');
                        return;
                      }
                      setIsUploadingMedia(false);
                    }
                    finalPhotos = finalPhotos.filter(u => typeof u === 'string' && !u.startsWith('blob:'));

                    // Auto-include any pending photo links entered in the textarea
                    const pendingRawUrls = (editingItem.photoUrlInput || '').trim();
                    if (pendingRawUrls) {
                      const urls = pendingRawUrls.split(/[\n,]+/).map((s: any) => s.trim()).filter(Boolean);
                      for (const u of urls) {
                        const check = await verifyImageUrl(u);
                        if (!check.valid) {
                          setEditModalError(`Tautan foto "${u}" tidak valid: ${check.error}`);
                          showToast(`Tautan foto tidak valid: ${check.error}`, 'error');
                          return;
                        }
                        if (!finalPhotos.includes(u)) {
                          finalPhotos.push(u);
                        }
                      }
                    }

                    if (finalPhotos.length === 0) {
                      setEditModalError('Dokumentasi kegiatan wajib memiliki minimal 1 foto!');
                      showToast('Dokumentasi kegiatan wajib memiliki minimal 1 foto!', 'error');
                      return;
                    }
                    const {
                      _dateMode,
                      _dateVal,
                      _startDate,
                      _endDate,
                      _month,
                      _year,
                      ...cleanGalItem
                    } = editingItem.item;
                    onUpdateGallery({ ...cleanGalItem, photos: finalPhotos });
                  }
                  if (editingItem.type === 'tenure' && onUpdateTenure) {
                    const finalMisi = editingItem.item.rawMisi !== undefined
                      ? editingItem.item.rawMisi.split('\n').map((s: any) => s.trim()).filter(Boolean)
                      : (Array.isArray(editingItem.item.misi) ? editingItem.item.misi : []);
                    const { rawMisi, ...cleanItem } = editingItem.item;
                    onUpdateTenure({ ...cleanItem, misi: finalMisi });
                  }
                  if (editingItem.type === 'kudos' && onUpdateKudos) onUpdateKudos(editingItem.item);
                  if (editingItem.type === 'form') {
                    const fields = editingItem.item.fields || [];
                    if (onUpdateForm) {
                      const cleanFields = fields.map(({ rawOptions, ...rest }: any) => rest);
                      const cleanDeadline = editingItem.item.deadline ? toDatetimeLocalSecondsValue(editingItem.item.deadline) : '';
                      const isLimitedVal = editingItem.item.isLimited === true;
                      const maxQuotaVal = isLimitedVal ? (parseInt(editingItem.item.maxQuota, 10) || 0) : 0;
                      const isEventConnectedVal = editingItem.item.isEventConnected === true;
                      const eventIdVal = isEventConnectedVal ? (editingItem.item.eventId || '') : '';
                      const isLuckyDrawVal = isEventConnectedVal && editingItem.item.isLuckyDraw === true;
                      onUpdateForm({
                        ...editingItem.item,
                        deadline: cleanDeadline,
                        fields: cleanFields,
                        isLimited: isLimitedVal,
                        maxQuota: maxQuotaVal,
                        isEventConnected: isEventConnectedVal,
                        eventId: eventIdVal,
                        isLuckyDraw: isLuckyDrawVal
                      });
                    }
                  }
                  if (editingItem.type === 'event' && onUpdateEvent) {
                    const catVal = (editingItem.item.kategori || editingItem.item.category || editingItem.item.badge || '').trim();
                    const pesertaVal = (editingItem.item.peserta || editingItem.item.kpi || '').trim();
                    const calculatedDate = formatWibEventRange(editingItem.item.startDate, editingItem.item.endDate);
                    onUpdateEvent({
                      ...editingItem.item,
                      kategori: catVal,
                      category: catVal,
                      badge: catVal,
                      peserta: pesertaVal,
                      kpi: pesertaVal,
                      totalRab: Number(editingItem.item.totalRab),
                      isPublic: Boolean(editingItem.item.isPublic),
                      isLimited: Boolean(editingItem.item.isLimited),
                      maxQuota: editingItem.item.isLimited ? Number(editingItem.item.maxQuota || 0) : 0,
                      date: calculatedDate || (editingItem.item.date || '').trim() || ''
                    });
                  }
                  if (editingItem.type === 'brand_asset' && onUpdateBrandAsset) {
                    let finalFileUrl = editingItem.item.fileUrl || '';
                    let finalPreviewUrl = editingItem.item.previewUrl || '';
                    if (editingItem.pendingFile) {
                      setIsUploadingMedia(true);
                      showToast(`Mengunggah file "${editingItem.pendingFile.name}" ke Cloud Storage...`);
                      try {
                        const cloudUrl = await uploadMediaToCloud(editingItem.pendingFile, 'assets');
                        if (cloudUrl) finalFileUrl = cloudUrl;
                      } catch (err: any) {
                        setIsUploadingMedia(false);
                        showToast('Gagal mengunggah file asset: ' + (err.message || 'Error'), 'error');
                        return;
                      }
                      setIsUploadingMedia(false);
                    }
                    if (editingItem.pendingPreviewFile) {
                      setIsUploadingMedia(true);
                      showToast(`Mengunggah preview "${editingItem.pendingPreviewFile.name}"...`);
                      try {
                        if (editingItem.pendingPreviewFile === editingItem.pendingFile) {
                          finalPreviewUrl = finalFileUrl;
                        } else {
                          const previewCloudUrl = await uploadMediaToCloud(editingItem.pendingPreviewFile, 'assets');
                          if (previewCloudUrl) finalPreviewUrl = previewCloudUrl;
                        }
                      } catch (err: any) {
                        setIsUploadingMedia(false);
                        showToast('Gagal mengunggah gambar preview: ' + (err.message || 'Error'), 'error');
                        return;
                      }
                      setIsUploadingMedia(false);
                    }
                    const isValidUrl = (url: any) => /^https?:\/\/.+/i.test(url.trim()) || url.trim().startsWith('/');
                    if (finalFileUrl && !editingItem.pendingFile && !isValidUrl(finalFileUrl)) {
                      setEditModalError('URL file harus berupa tautan web yang valid (diawali http:// atau https://)');
                      showToast('URL file harus berupa tautan web yang valid', 'error');
                      return;
                    }
                    if (finalPreviewUrl && !editingItem.pendingPreviewFile && !isValidUrl(finalPreviewUrl)) {
                      setEditModalError('URL preview harus berupa tautan web yang valid (diawali http:// atau https://)');
                      showToast('URL preview harus berupa tautan web yang valid', 'error');
                      return;
                    }
                    const isImageFile = (url: any) => /\.(png|jpe?g|svg|webp|gif|avif)($|\?)/i.test(url) || (url || '').startsWith('data:image/');
                    const effectiveFileUrl = finalFileUrl || (isImageFile(finalPreviewUrl) ? finalPreviewUrl : '');
                    const effectivePreviewUrl = finalPreviewUrl || (isImageFile(finalFileUrl) ? finalFileUrl : '');
                    if (!effectiveFileUrl) {
                      setEditModalError('File asset wajib diunggah atau memiliki tautan file aktif');
                      showToast('File asset wajib diunggah', 'error');
                      return;
                    }
                    onUpdateBrandAsset({
                      ...editingItem.item,
                      fileUrl: effectiveFileUrl,
                      previewUrl: effectivePreviewUrl
                    });
                  }
                  if (editingItem.type === 'role' && onUpdateTenureRole) onUpdateTenureRole(editingItem.item);
                  if (editingItem.type === 'department' && onUpdateDepartment) onUpdateDepartment(editingItem.item);
                  if (editingItem.type === 'faq' && onUpdateFaq) onUpdateFaq(editingItem.item);
                  setEditingItem(null);
                  setEditModalError('');
                  showToast('Perubahan data berhasil disimpan & disinkronkan ke Cloud!');
                }}
                style={{
                  padding: '9px 24px',
                  borderRadius: 'var(--radius-full)',
                  background: isUploadingMedia ? 'var(--input-bg)' : 'var(--mandiri-gold)',
                  border: 'none',
                  color: isUploadingMedia ? 'var(--text-muted)' : '#040914',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: isUploadingMedia ? 'not-allowed' : 'pointer',
                  boxShadow: isUploadingMedia ? 'none' : '0 4px 14px rgba(255, 184, 0, 0.35)'
                }}
              >
                {isUploadingMedia ? 'Mengunggah & Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
