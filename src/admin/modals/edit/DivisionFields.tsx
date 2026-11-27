import React from 'react';
import { useAdminPortal } from '../../AdminPortalContext';

export default function DivisionFields({ activeTenure, divisions, editingItem, setEditingItem, tenures }: { activeTenure: any; divisions: any; editingItem: any; setEditingItem: any; tenures: any }) {

  return (
    <>
      {editingItem.type === 'division' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nama Divisi</label>
                    <input
                      type="text"
                      value={editingItem.item.name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, name: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Periode Kepengurusan</label>
                    <select
                      value={editingItem.item.tenureId || activeTenure?.id || ''}
                      onChange={(e) => {
                        const newTenure = e.target.value;
                        const validDivs = divisions.filter((d: any) => d.tenureId === newTenure);
                        const keepDiv = validDivs.some((d: any) => d.id === editingItem.item.divisionId);
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            tenureId: newTenure,
                            divisionId: keepDiv ? editingItem.item.divisionId : undefined
                          }
                        });
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      {tenures.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Status Rekrutmen Divisi (Publik)</label>
                    <select
                      value={Boolean(editingItem.item.isRecruiting) ? 'open' : 'closed'}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, isRecruiting: e.target.value === 'open' } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      <option value="open">● Membuka Rekrutmen (Rekrutmen Buka)</option>
                      <option value="closed">○ Ditutup (Badge Hilang di Web)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Warna Identitas Divisi</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={editingItem.item.color || '#0284c7'}
                        onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, color: e.target.value } })}
                        style={{ width: '40px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={editingItem.item.color || '#0284c7'}
                        onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, color: e.target.value } })}
                        style={{ flex: 1, padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.84rem' }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Motto Divisi</label>
                  <input
                    type="text"
                    value={editingItem.item.motto || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, motto: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Deskripsi Peran</label>
                  <textarea
                    rows={3}
                    value={editingItem.item.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, description: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Fokus Area (Pisahkan dengan koma)</label>
                  <input
                    type="text"
                    value={editingItem.item.rawFocusAreas !== undefined ? editingItem.item.rawFocusAreas : (Array.isArray(editingItem.item.focusAreas) ? editingItem.item.focusAreas.join(', ') : '')}
                    onChange={(e) => {
                      const textVal = e.target.value;
                      const parsed = textVal.split(',').map(s => s.trim()).filter(Boolean);
                      setEditingItem({
                        ...editingItem,
                        item: {
                          ...editingItem.item,
                          rawFocusAreas: textVal,
                          focusAreas: parsed
                        }
                      });
                    }}
                    placeholder="Contoh: Internal Engagement, Wellness, Learning"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.84rem' }}
                  />
                  <div style={{ marginTop: '5px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {Array.isArray(editingItem.item.focusAreas) && editingItem.item.focusAreas.length > 0 ? (
                      <span>Fokus aktif ({editingItem.item.focusAreas.length}): <strong style={{ color: 'var(--neon-cyan)' }}>{editingItem.item.focusAreas.join(' • ')}</strong></span>
                    ) : (
                      <span>Ketik fokus area dipisahkan koma (contoh: <code>Internal Engagement, Wellness, Learning</code>)</span>
                    )}
                  </div>
                </div>
              </div>
            )}
    </>
  );
}
