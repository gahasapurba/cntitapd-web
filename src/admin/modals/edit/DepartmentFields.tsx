import React from 'react';
import { useAdminPortal } from '../../AdminPortalContext';

export default function DepartmentFields({ editingItem, setEditingItem }: { editingItem: any; setEditingItem: any }) {

  return (
    <>
      {editingItem.type === 'department' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Nama Departemen <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={editingItem.item.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, name: e.target.value } })}
                    placeholder="Contoh: Digital Banking Delivery"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Kode / Singkatan
                  </label>
                  <input
                    type="text"
                    value={editingItem.item.code || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, code: e.target.value.toUpperCase() } })}
                    placeholder="Contoh: DBD"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Deskripsi / Keterangan Fungsi (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    value={editingItem.item.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, description: e.target.value } })}
                    placeholder="Deskripsi tugas atau ruang lingkup delivery departemen..."
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
              </div>
            )}
    </>
  );
}
