import React from 'react';
import { useAdminPortal } from '../../AdminPortalContext';

export default function FaqFields({ editingItem, setEditingItem }: { editingItem: any; setEditingItem: any }) {

  return (
    <>
      {editingItem.type === 'faq' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kategori Topik</label>
                  <select
                    value={editingItem.item.category || 'Umum'}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, category: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  >
                    <option value="Tentang CNT">Tentang CNT</option>
                    <option value="Kegiatan & Event">Kegiatan & Event</option>
                    <option value="Operasional & Sekben">Operasional & Sekben</option>
                    <option value="Aspirasi & Usulan">Aspirasi & Usulan</option>
                    <option value="Pendaftaran & Oprec">Pendaftaran & Oprec</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Pertanyaan (Question)</label>
                  <input
                    type="text"
                    value={editingItem.item.question || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, question: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Jawaban Lengkap (Answer)</label>
                  <textarea
                    rows={4}
                    value={editingItem.item.answer || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, answer: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
              </div>
            )}
    </>
  );
}
