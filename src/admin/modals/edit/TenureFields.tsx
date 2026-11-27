import React from 'react';
import { useAdminPortal } from '../../AdminPortalContext';

export default function TenureFields({ editingItem, setEditingItem }: { editingItem: any; setEditingItem: any }) {

  return (
    <>
      {editingItem.type === 'tenure' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nama Kepengurusan <span style={{ color: '#f43f5e' }}>*</span></label>
                    <input
                      type="text"
                      value={editingItem.item.title || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, title: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tagline Budaya</label>
                    <input
                      type="text"
                      value={editingItem.item.themeTagline || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, themeTagline: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Headline Hero</label>
                    <input
                      type="text"
                      value={editingItem.item.heroHeadline || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, heroHeadline: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Highlight Hero</label>
                    <input
                      type="text"
                      value={editingItem.item.heroHighlight || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, heroHighlight: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Visi CNT IT (Dinamis)</label>
                  <textarea
                    rows={3}
                    value={editingItem.item.visi || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, visi: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Misi CNT IT (1 baris per misi)</label>
                  <textarea
                    rows={4}
                    placeholder="Tulis poin misi (satu baris per misi)..."
                    value={editingItem.item.rawMisi !== undefined ? editingItem.item.rawMisi : (Array.isArray(editingItem.item.misi) ? editingItem.item.misi.join('\n') : (editingItem.item.misi || ''))}
                    onChange={(e) => {
                      const textVal = e.target.value;
                      setEditingItem({
                        ...editingItem,
                        item: {
                          ...editingItem.item,
                          rawMisi: textVal,
                          misi: textVal.split('\n').map(s => s.trim()).filter(Boolean)
                        }
                      });
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem', resize: 'vertical' }}
                  />
                </div>
              </div>
            )}
    </>
  );
}
