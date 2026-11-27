import React from 'react';
import { AKHLAK_VALUES, DEFAULT_AKHLAK_VALUE } from '../../../utils/akhlak';
import { useAdminPortal } from '../../AdminPortalContext';

export default function KudosFields({ editingItem, setEditingItem }: { editingItem: any; setEditingItem: any }) {

  return (
    <>
      {editingItem.type === 'kudos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nama Pengirim</label>
                  <input
                    type="text"
                    value={editingItem.item.sender || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, sender: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nama Penerima</label>
                  <input
                    type="text"
                    value={editingItem.item.recipient || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, recipient: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kategori Nilai Budaya</label>
                  <select
                    value={editingItem.item.category || DEFAULT_AKHLAK_VALUE}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, category: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  >
                    {AKHLAK_VALUES.map(v => (
                      <option key={v.value} value={v.value}>{v.value} ({v.description})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Pesan Apresiasi</label>
                  <textarea
                    rows={4}
                    value={editingItem.item.message || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, message: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem', resize: 'vertical' }}
                  />
                </div>
              </div>
            )}
    </>
  );
}
